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
 * Construit la balise HTML média à insérer dans le texte de la question, pointant
 * vers @@PLUGINFILE@@. Variante XML/HTML du tag GIFT (mediaManager) : ICI le « = »
 * n'est PAS échappé par « \ » (échappement propre au GIFT, invalide en HTML).
 * @param {string} filename — ex. "ECO-Q01_media.png"
 * @returns {string}
 */
function buildXmlMediaTag(filename) {
    const cat = (typeof getMediaCategory === 'function') ? getMediaCategory(filename) : 'other';
    if (cat === 'image') {
        return `<img src="@@PLUGINFILE@@/${filename}" alt="media">`;
    }
    if (cat === 'audio') {
        return `<audio controls="controls"><source src="@@PLUGINFILE@@/${filename}"></source></audio>`;
    }
    if (cat === 'video') {
        return `<video controls="controls"><source src="@@PLUGINFILE@@/${filename}"></source></video>`;
    }
    return `<a href="@@PLUGINFILE@@/${filename}">${filename}</a>`;
}

/**
 * Lit un fichier média et renvoie son contenu encodé en base64 (sans le préfixe
 * data: ni saut de ligne parasite). Utilisé pour embarquer les médias dans le XML.
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            const comma = result.indexOf(',');
            resolve(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.onerror = () => reject(reader.error || new Error('Lecture du média impossible'));
        reader.readAsDataURL(file);
    });
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
 * @param {Object}      [mediaBase64]   — { questionId: base64 } des médias à embarquer
 * @returns {string|null}
 */
function buildXmlQuestion(question, index, courseCodeValue, mediaBase64) {
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

    // Média embarqué (chantier n°8) : tag @@PLUGINFILE@@ dans le texte + élément
    // <file> base64 PLACÉ DANS <questiontext> (path="/"), pour que Moodle range le
    // fichier dans la filearea propre à la question — pas de répertoire à choisir.
    let mediaTag = '';
    let mediaFileXml = '';
    if (mediaBase64 && mediaBase64[questionId] && typeof getMediaFilename === 'function') {
        const filename = getMediaFilename(questionId, finalQuestionId);
        if (filename) {
            mediaTag = buildXmlMediaTag(filename);
            mediaFileXml = `\n      <file name="${xmlEscapeText(filename)}" path="/" encoding="base64">${mediaBase64[questionId]}</file>`;
        }
    }

    let xml = `\n  <question type="${moodleType}">`;
    xml += `\n    <name>${xmlPlainText(finalQuestionId)}</name>`;
    xml += `\n    <questiontext format="html"><text>${wrapCdata(formatXmlHtml(questionText) + mediaTag)}</text>${mediaFileXml}</questiontext>`;
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
 * @param {Object} [mediaBase64] — { questionId: base64 } des médias à embarquer.
 *                                 Omis → aucun média embarqué (rétrocompatible).
 * @returns {string}
 */
function generateMoodleXmlCode(mediaBase64) {
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
        const block = buildXmlQuestion(question, index, courseCodeValue, mediaBase64);
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

// Seuil indicatif d'avertissement de poids des médias embarqués (~10 Mo). Le
// base64 gonfle le binaire d'environ +33 % : au-delà, le .xml devient lourd.
const XML_MEDIA_SIZE_WARN = 10 * 1024 * 1024;

/**
 * Génère et télécharge le fichier .xml Moodle, médias embarqués en base64
 * (chantier n°8 — fichier autonome). Avertit si le total des médias est élevé.
 */
async function downloadAsMoodleXml() {
    // Pré-lecture des médias en base64 (asynchrone), indexés par id de question.
    const mediaBase64 = {};
    let totalBytes = 0;
    if (window.questionMediaFiles) {
        const questions = document.querySelectorAll('.question-container');
        for (const question of questions) {
            const qid  = question.dataset.id;
            const file = window.questionMediaFiles[qid];
            if (!file) continue;
            try {
                mediaBase64[qid] = await fileToBase64(file);
                totalBytes += file.size || 0;
            } catch (err) {
                console.error('[exportMoodleXml] Média non embarqué :', err);
                notify.warning('Un média n\'a pas pu être embarqué dans le XML (voir la console).');
            }
        }
    }

    const xml = generateMoodleXmlCode(mediaBase64);
    if (!xml.trim()) return; // generateMoodleXmlCode a déjà notifié

    if (totalBytes > XML_MEDIA_SIZE_WARN) {
        const mo = Math.round((totalBytes / (1024 * 1024)) * 10) / 10;
        notify.warning(
            `Médias embarqués : ~${mo} Mo (le base64 ajoute environ +33 %). ` +
            'Le fichier .xml est volumineux ; son import dans Moodle peut être plus lent.'
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
