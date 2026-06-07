// ── Export Moodle XML ────────────────────────────────────────────────────────
//
// Second format de sortie, EN PLUS de l'export GIFT (qui reste inchangé).
// Raison d'être : le format Moodle XML permet le **feedback combiné** (message
// distinct selon que la réponse est correcte / partiellement correcte /
// incorrecte), impossible à exprimer en GIFT. Cf. ROADMAP chantier n°5.
//
// Périmètre V1 (validé) :
//   • Les 5 types sont exportés (QCM, QCU, Vrai/Faux, QRC, Numérique).
//   • Feedback combiné sur QCM + QCU (tous deux « multichoice » côté Moodle).
//   • HTML enrichi encodé en CDATA (comme l'export natif de Moodle).
//   • Médias différés : non embarqués en V1 → avertissement si présents.
//   • Import XML : hors périmètre (export seul).
//
// Réutilise les briques partagées globales (getRichTextValue, addNonBreakingSpaces,
// addHtmlTags, IDS, l'attribut data-full-value des poids, buildExportFilename)
// sans modifier la chaîne GIFT (giftGenerator.js).
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers d'encodage XML ───────────────────────────────────────────────────

/**
 * Échappe les caractères réservés XML d'un contenu **hors CDATA** (texte simple,
 * valeurs d'attribut, identifiants). Le HTML enrichi, lui, passe par wrapCdata().
 *
 * @param {string} str
 * @returns {string}
 */
function xmlEscapeText(str) {
    if (str === undefined || str === null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Emballe du HTML enrichi dans une section CDATA, en neutralisant le seul motif
 * interdit à l'intérieur d'un CDATA : la séquence de fermeture « ]]> ».
 *
 * @param {string} html
 * @returns {string} ex. "<![CDATA[<p>2&nbsp;&lt;&nbsp;3</p>]]>"
 */
function wrapCdata(html) {
    const safe = String(html === undefined || html === null ? '' : html)
        .replace(/]]>/g, ']]]]><![CDATA[>');
    return `<![CDATA[${safe}]]>`;
}

/**
 * Élément <text> contenant du HTML enrichi (encodé CDATA).
 * @param {string} html
 * @returns {string}
 */
function xmlHtmlText(html) {
    return `<text>${wrapCdata(html)}</text>`;
}

/**
 * Élément <text> contenant du texte simple (échappé par entités).
 * @param {string} text
 * @returns {string}
 */
function xmlPlainText(text) {
    return `<text>${xmlEscapeText(text)}</text>`;
}

/**
 * Champ HTML Moodle de la forme `<tag format="html"><text><![CDATA[…]]></text></tag>`.
 * @param {string} tag  — nom de balise (ex. "questiontext", "generalfeedback")
 * @param {string} html — contenu HTML enrichi
 * @returns {string}
 */
function xmlHtmlField(tag, html) {
    return `<${tag} format="html">${xmlHtmlText(html)}</${tag}>`;
}

/**
 * Applique la typographie CNED (espaces insécables) puis enveloppe le texte de
 * balises de bloc — même traitement que la chaîne GIFT, pour un rendu cohérent.
 * @param {string} raw
 * @returns {string}
 */
function formatXmlHtml(raw) {
    return addHtmlTags(addNonBreakingSpaces(raw));
}

// ── Lecture du DOM (réutilise les helpers partagés, sans dupliquer la logique
//    métier de giftGenerator.js) ──────────────────────────────────────────────

/**
 * Calcule l'identifiant GIFT final d'une question — même règle que
 * generateGIFTCode() (CODE-QNN). Réimplémenté ici pour ne pas dépendre d'une
 * génération GIFT préalable.
 *
 * @param {string} questionIdValue — valeur saisie du champ identifiant
 * @param {number} index           — position (0-based)
 * @param {string} courseCodeValue — code matière
 * @returns {string}
 */
function computeFinalQuestionId(questionIdValue, index, courseCodeValue) {
    const questionNumber = (index + 1).toString().padStart(2, '0');
    if (!questionIdValue) {
        const prefix = courseCodeValue ? courseCodeValue : 'Q';
        return `${prefix}-Q${questionNumber}`;
    }
    if (!/-Q\d+$/.test(questionIdValue)) {
        return `${questionIdValue}-Q${questionNumber}`;
    }
    return questionIdValue;
}

/**
 * Indique si au moins une question porte un média attaché. Sert à avertir
 * l'auteur : les médias ne sont pas embarqués dans le XML en V1.
 * @returns {boolean}
 */
function questionsHaveMedia() {
    if (!window.questionMediaFiles) return false;
    const questions = document.querySelectorAll('.question-container');
    for (const question of questions) {
        if (window.questionMediaFiles[question.dataset.id]) return true;
    }
    return false;
}

// ── Générateurs de réponses par type ─────────────────────────────────────────

/**
 * Construit le bloc <answer> d'une réponse.
 * @param {string|number} fraction — pondération Moodle (ex. "100", "33.33333", "-50")
 * @param {string} innerText       — élément <text>…</text> déjà construit
 * @param {string} [feedbackHtml]  — feedback spécifique (HTML), facultatif
 * @returns {string}
 */
function xmlAnswer(fraction, innerText, feedbackHtml) {
    let answer = `\n      <answer fraction="${xmlEscapeText(fraction)}" format="html">${innerText}`;
    if (feedbackHtml) {
        answer += `<feedback format="html">${xmlHtmlText(feedbackHtml)}</feedback>`;
    }
    answer += `</answer>`;
    return answer;
}

/**
 * Réponses d'un QCM (multichoice, single=false). La pondération reprend le
 * data-full-value de chaque option (déjà au format attendu par Moodle), avec la
 * même logique que la chaîne GIFT : cochée → poids (défaut 100) ; non cochée →
 * poids éventuel (malus) sinon 0.
 * @param {string|number} questionId
 * @returns {string}
 */
function buildMcAnswers(questionId) {
    const options = document.querySelectorAll('#options-list-' + questionId + ' .option-container');
    let xml = '';

    options.forEach(option => {
        const optionId = option.querySelector('.remove-option-btn').getAttribute('data-oid');
        const optionText = getRichTextValue(IDS.optionText(questionId, optionId));
        if (!optionText) return;

        const isCorrect = option.querySelector('.correct-option').checked;
        const weightSelect = document.getElementById(IDS.optionWeight(questionId, optionId));
        const weightRaw = weightSelect
            ? (weightSelect.getAttribute('data-full-value') || weightSelect.value)
            : (isCorrect ? '100' : '0');
        const fraction = parseFloat(weightRaw) || 0;

        const feedbackText = getRichTextValue(IDS.optionFeedback(questionId, optionId));
        xml += xmlAnswer(fraction, xmlHtmlText(formatXmlHtml(optionText)), feedbackText ? formatXmlHtml(feedbackText) : '');
    });

    return xml;
}

/**
 * Réponses d'un QCU (multichoice, single=true) : la bonne option vaut 100, les
 * autres 0 (pas de pondération partielle côté UI pour le QCU).
 * @param {string|number} questionId
 * @returns {string}
 */
function buildScAnswers(questionId) {
    const options = document.querySelectorAll('#sc-options-list-' + questionId + ' .option-container');
    let xml = '';

    options.forEach(option => {
        const optionId = option.querySelector('.remove-sc-option-btn').getAttribute('data-oid');
        const optionText = getRichTextValue(IDS.scOptionText(questionId, optionId));
        if (!optionText) return;

        const isCorrect = option.querySelector('.correct-sc-option').checked;
        const fraction = isCorrect ? 100 : 0;

        const feedbackText = getRichTextValue(IDS.scOptionFeedback(questionId, optionId));
        xml += xmlAnswer(fraction, xmlHtmlText(formatXmlHtml(optionText)), feedbackText ? formatXmlHtml(feedbackText) : '');
    });

    return xml;
}

/**
 * Réponses d'une QRC (shortanswer). Bonus par rapport au GIFT : la sensibilité à
 * la casse est honorée via <usecase> (impossible à exprimer en GIFT — cf. [B3]).
 * Renvoie { answers, usecase }.
 * @param {string|number} questionId
 * @returns {{answers: string, usecase: number}}
 */
function buildSaAnswers(questionId) {
    const options = document.querySelectorAll('#sa-options-list-' + questionId + ' .option-container');
    let answers = '';
    let usecase = 0; // 0 = insensible à la casse (défaut Moodle)

    options.forEach(option => {
        const optionId = option.querySelector('.remove-sa-option-btn').getAttribute('data-oid');
        const optionTextEl = document.getElementById(IDS.saOptionText(questionId, optionId));
        const weightInput = document.getElementById(IDS.saOptionWeight(questionId, optionId));
        if (!optionTextEl) return;

        const optionText = optionTextEl.value.trim();
        if (!optionText) return;

        const weightRaw = weightInput
            ? (weightInput.getAttribute('data-full-value') || weightInput.value.trim())
            : '100';
        const fraction = parseFloat(weightRaw) || 0;

        // Si AU MOINS une réponse est déclarée sensible à la casse, la question
        // l'est (Moodle applique <usecase> au niveau de la question, pas de la
        // réponse).
        const caseEl = document.getElementById(IDS.saCase(questionId, optionId));
        if (caseEl && caseEl.value === 'case_sensitive') usecase = 1;

        const feedbackEl = document.getElementById(IDS.saOptionFeedback(questionId, optionId));
        const feedbackText = feedbackEl ? feedbackEl.value.trim() : '';

        answers += xmlAnswer(
            fraction,
            xmlPlainText(addNonBreakingSpaces(optionText)),
            feedbackText ? formatXmlHtml(feedbackText) : ''
        );
    });

    return { answers, usecase };
}

// ── Construction d'une question complète ──────────────────────────────────────

/**
 * Bloc des 3 feedbacks combinés (QCM/QCU) : chaque balise n'est émise que si
 * l'auteur a renseigné le champ correspondant (tous facultatifs).
 * @param {string|number} questionId
 * @returns {string}
 */
function buildCombinedFeedback(questionId) {
    let xml = '';
    const correct = getRichTextValue(IDS.correctFeedback(questionId));
    const partial = getRichTextValue(IDS.partiallyCorrectFeedback(questionId));
    const incorrect = getRichTextValue(IDS.incorrectFeedback(questionId));

    if (correct)   xml += `\n    ${xmlHtmlField('correctfeedback', formatXmlHtml(correct))}`;
    if (partial)   xml += `\n    ${xmlHtmlField('partiallycorrectfeedback', formatXmlHtml(partial))}`;
    if (incorrect) xml += `\n    ${xmlHtmlField('incorrectfeedback', formatXmlHtml(incorrect))}`;
    return xml;
}

/**
 * Construit le bloc <question type="…"> d'une question, ou null si la question
 * est inexploitable (texte manquant). Les erreurs sont signalées via notify.
 *
 * @param {HTMLElement} question        — conteneur .question-container
 * @param {number}      index           — position 0-based
 * @param {string}      courseCodeValue — code matière (pour l'identifiant)
 * @returns {string|null}
 */
function buildXmlQuestion(question, index, courseCodeValue) {
    const questionId = question.dataset.id;
    const questionType = document.querySelector(
        `input[name="question-type-${questionId}"]:checked`
    ).value;

    const questionText = getRichTextValue(IDS.questionText(questionId));
    if (!questionText) {
        notify.error(`La question ${index + 1} n'a pas de texte. Elle est ignorée dans l'export XML.`);
        return null;
    }

    const questionIdField = document.getElementById(IDS.questionId(questionId));
    const questionIdValue = questionIdField ? questionIdField.value.trim() : '';
    const finalQuestionId = computeFinalQuestionId(questionIdValue, index, courseCodeValue);

    const generalFeedback = getRichTextValue(IDS.generalFeedback(questionId));

    // Type Moodle + corps spécifique
    let moodleType;
    let body = '';

    switch (questionType) {
        case 'mc':
            moodleType = 'multichoice';
            body += `\n    <single>false</single>`;
            body += `\n    <shuffleanswers>true</shuffleanswers>`;
            body += `\n    <answernumbering>abc</answernumbering>`;
            body += buildCombinedFeedback(questionId);
            body += buildMcAnswers(questionId);
            break;
        case 'sc':
            moodleType = 'multichoice';
            body += `\n    <single>true</single>`;
            body += `\n    <shuffleanswers>true</shuffleanswers>`;
            body += `\n    <answernumbering>abc</answernumbering>`;
            body += buildCombinedFeedback(questionId);
            body += buildScAnswers(questionId);
            break;
        case 'tf': {
            moodleType = 'truefalse';
            const isTrueCorrect = document.getElementById(IDS.trueOption(questionId)).checked;
            body += xmlAnswer(isTrueCorrect ? 100 : 0, xmlPlainText('true'));
            body += xmlAnswer(isTrueCorrect ? 0 : 100, xmlPlainText('false'));
            break;
        }
        case 'sa': {
            moodleType = 'shortanswer';
            const { answers, usecase } = buildSaAnswers(questionId);
            body += `\n    <usecase>${usecase}</usecase>`;
            body += answers;
            break;
        }
        case 'num': {
            moodleType = 'numerical';
            const numAnswerEl = document.getElementById(IDS.numAnswer(questionId));
            const numAnswer = numAnswerEl ? numAnswerEl.value.trim() : '';
            if (!numAnswer) {
                notify.error(`La question ${index + 1} (numérique) n'a pas de réponse. Elle est ignorée dans l'export XML.`);
                return null;
            }
            const useRange = document.getElementById(IDS.numRange(questionId)).checked;
            const margin = useRange
                ? (document.getElementById(IDS.numMargin(questionId)).value.trim() || '0')
                : '0';
            body += `\n      <answer fraction="100" format="moodle_auto_format">${xmlPlainText(numAnswer)}`;
            body += `<tolerance>${xmlEscapeText(margin)}</tolerance></answer>`;
            break;
        }
        default:
            return null;
    }

    let xml = `\n  <question type="${moodleType}">`;
    xml += `\n    <name>${xmlPlainText(finalQuestionId)}</name>`;
    xml += `\n    ${xmlHtmlField('questiontext', formatXmlHtml(questionText))}`;
    if (generalFeedback) {
        xml += `\n    ${xmlHtmlField('generalfeedback', formatXmlHtml(generalFeedback))}`;
    }
    xml += `\n    <defaultgrade>1.0000000</defaultgrade>`;
    xml += `\n    <penalty>0.3333333</penalty>`;
    xml += `\n    <hidden>0</hidden>`;
    xml += body;
    xml += `\n  </question>`;
    return xml;
}

// ── Point d'entrée : génération du document complet ───────────────────────────

/**
 * Génère le document Moodle XML à partir des questions présentes dans le DOM.
 * N'altère pas l'export GIFT. Renvoie la chaîne XML, ou '' si rien à exporter.
 * @returns {string}
 */
function generateMoodleXmlCode() {
    const questions = document.querySelectorAll('.question-container');
    if (questions.length === 0) {
        notify.error('Aucune question à exporter. Veuillez d\'abord ajouter des questions.');
        return '';
    }

    const courseCodeEl = document.getElementById('course-code');
    const courseCodeValue = courseCodeEl ? courseCodeEl.value.trim() : '';

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<quiz>';
    let count = 0;

    questions.forEach((question, index) => {
        const block = buildXmlQuestion(question, index, courseCodeValue);
        if (block) {
            xml += block;
            count++;
        }
    });

    xml += '\n</quiz>\n';

    if (count === 0) {
        notify.error('Aucune question exploitable à exporter en XML.');
        return '';
    }

    return xml;
}

/**
 * Génère et télécharge le fichier .xml Moodle. Avertit si des médias sont
 * présents (non embarqués en V1 — utiliser l'export ZIP/GIFT pour les médias).
 */
function downloadAsMoodleXml() {
    const xml = generateMoodleXmlCode();
    if (!xml.trim()) return; // generateMoodleXmlCode a déjà notifié

    if (questionsHaveMedia()) {
        notify.warning(
            'Les médias ne sont pas inclus dans l\'export Moodle XML (V1). ' +
            'Pour conserver les images, utilisez l\'export ZIP (GIFT).'
        );
    }

    // BOM UTF-8 en tête (cohérence avec l'export .txt — affichage Windows).
    const blob = new Blob(['﻿' + xml], { type: 'application/xml;charset=utf-8' });
    const fileName = (typeof buildExportFilename === 'function')
        ? buildExportFilename('xml', 'questions_moodle')
        : 'questions_moodle.xml';

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
}

// ── Câblage du bouton ─────────────────────────────────────────────────────────
APP_INIT.push(function initMoodleXmlExport() {
    const btn = document.getElementById('download-xml-btn');
    if (btn) {
        btn.addEventListener('click', downloadAsMoodleXml);
    }
});
