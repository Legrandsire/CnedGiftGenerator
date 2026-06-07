// ── Import Moodle XML ─────────────────────────────────────────────────────────
//
// Pendant des chantiers n°7 (import XML) et n°8 (médias base64). Inverse de
// exportMoodleXml.js : relit un fichier `.xml` Moodle (produit par l'outil ou
// par Moodle) et reconstruit les questions dans l'interface, AFIN de pouvoir les
// rééditer — y compris le **feedback combiné** et l'**<usecase>** que le GIFT ne
// sait pas transporter.
//
// Périmètre :
//   • 5 types gérés : multichoice (→ QCM/QCU), truefalse, shortanswer, numerical.
//   • Types non gérés (essay, matching, cloze, description…) : ignorés + toast
//     récapitulatif (import partiel non bloquant). Les marqueurs <question
//     type="category"> sont simplement sautés.
//   • Médias : <file … encoding="base64"> décodés et réattachés via mediaManager.
//   • Sécurité : tout HTML passe par setRichTextValue → sanitizeRichHtml (XSS).
//
// Réemploi : mêmes briques que l'import GIFT (addNewQuestion global, IDS,
// setRichTextValue, clics sur les boutons « + option », attachMediaFromZip).
// N'altère NI l'export GIFT NI l'import GIFT.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
    'use strict';

    // ── Détection d'aiguillage ────────────────────────────────────────────────

    /**
     * Indique si un contenu texte ressemble à un fichier Moodle XML (présence de
     * la racine <quiz>). Sert à aiguiller l'import, en complément de l'extension.
     * @param {string} text
     * @returns {boolean}
     */
    function looksLikeMoodleXml(text) {
        return typeof text === 'string' && /<\s*quiz[\s>]/i.test(text);
    }

    // ── Helpers de lecture du DOM XML ─────────────────────────────────────────

    /**
     * Premier enfant DIRECT portant le nom de balise indiqué (insensible à la
     * casse). On évite querySelector qui descendrait dans les <answer>.
     * @param {Element} parent
     * @param {string}  tagName
     * @returns {Element|null}
     */
    function directChild(parent, tagName) {
        if (!parent) return null;
        const wanted = tagName.toLowerCase();
        for (const child of parent.children) {
            if (child.tagName.toLowerCase() === wanted) return child;
        }
        return null;
    }

    /** Tous les enfants directs portant le nom de balise indiqué. */
    function directChildren(parent, tagName) {
        if (!parent) return [];
        const wanted = tagName.toLowerCase();
        return Array.from(parent.children).filter(c => c.tagName.toLowerCase() === wanted);
    }

    /**
     * Contenu d'un champ Moodle de la forme `<tag><text>…</text></tag>`. Avec
     * DOMParser, le CDATA est déjà déballé : textContent renvoie le HTML brut.
     * @param {Element} parent  — élément <question> ou <answer>
     * @param {string}  tagName — ex. "questiontext", "generalfeedback"
     * @returns {string}
     */
    function fieldText(parent, tagName) {
        const field = directChild(parent, tagName);
        if (!field) return '';
        const textEl = directChild(field, 'text');
        return (textEl ? textEl.textContent : field.textContent) || '';
    }

    /** Texte d'une <answer> (son <text> direct). */
    function answerText(answerEl) {
        const textEl = directChild(answerEl, 'text');
        return textEl ? textEl.textContent : '';
    }

    /** Feedback d'une <answer> (<feedback><text>…</text></feedback>). */
    function answerFeedback(answerEl) {
        const fb = directChild(answerEl, 'feedback');
        if (!fb) return '';
        const textEl = directChild(fb, 'text');
        return (textEl ? textEl.textContent : fb.textContent) || '';
    }

    /** Normalise un texte simple importé : nbsp → espace, trim. */
    function normalizePlain(text) {
        return String(text || '').replace(/ /g, ' ').trim();
    }

    /**
     * Retire les balises média @@PLUGINFILE@@ d'un texte importé (elles sont
     * réinjectées à la génération par mediaManager). Copie locale du nettoyage de
     * l'import GIFT, pour ne pas dépendre de sa closure.
     * @param {string} content
     * @returns {string}
     */
    function stripPluginfileTags(content) {
        return String(content || '')
            .replace(/<img\s[^>]*@@PLUGINFILE@@[^>]*>/gi, '')
            .replace(/<audio[\s\S]*?@@PLUGINFILE@@[\s\S]*?<\/audio>/gi, '')
            .replace(/<video[\s\S]*?@@PLUGINFILE@@[\s\S]*?<\/video>/gi, '')
            .replace(/<a[^>]*@@PLUGINFILE@@[^>]*>[\s\S]*?<\/a>/gi, '')
            .trim();
    }

    /** Décode une chaîne base64 (sans blancs parasites) en Uint8Array. */
    function base64ToBytes(b64) {
        const clean = String(b64 || '').replace(/\s+/g, '');
        const binary = atob(clean);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    // ── Reconstruction d'une question dans le DOM ─────────────────────────────

    /**
     * Crée une question vierge via la fonction globale, renseigne identifiant,
     * énoncé et type (avec dispatch 'change' pour afficher les bons champs).
     * Mécanique identique à l'import GIFT.
     * @param {string} idValue       — valeur du champ identifiant (ex. "ECO-Q01")
     * @param {string} htmlText      — énoncé HTML (assaini par setRichTextValue)
     * @param {string} internalType  — 'mc' | 'sc' | 'tf' | 'sa' | 'num'
     * @returns {string|null} id interne de la question créée
     */
    function addImportedQuestion(idValue, htmlText, internalType) {
        const container = document.getElementById('questions-container');
        if (!container) return null;

        // addNewQuestion() renvoie l'élément créé (lastElementChild n'est plus
        // fiable depuis l'introduction des zones/banques).
        const questionEl = addNewQuestion();
        if (!questionEl) return null;
        const qid = questionEl.dataset.id;

        // Nettoyer l'identifiant comme à l'import GIFT : un identifiant
        // auto-généré (« <code>[-B<NN>]-Q<NN> ») est laissé VIDE pour rester
        // dynamique ; un identifiant manuel est conservé (suffixe -B/-Q retiré).
        const idField = document.getElementById(IDS.questionId(qid));
        if (idField) {
            const courseEl = document.getElementById('course-code');
            const courseCode = courseEl ? courseEl.value.trim() : '';
            const cleaned = (typeof window.cleanQuestionId === 'function')
                ? window.cleanQuestionId(idValue, courseCode)
                : { id: idValue };
            idField.value = cleaned.id;
        }

        setRichTextValue(IDS.questionText(qid), stripPluginfileTags(htmlText));

        const radio = document.getElementById(IDS.typeRadio(internalType, qid));
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
        }
        return qid;
    }

    /** Sélectionne dans un <select> de poids l'option la plus proche de `value`. */
    function selectClosestWeight(weightSelect, value, isCorrect) {
        if (!weightSelect) return;
        let closest = null;
        let minDiff = Infinity;
        for (let i = 0; i < weightSelect.options.length; i++) {
            const diff = Math.abs(parseFloat(weightSelect.options[i].value) - value);
            if (diff < minDiff) { minDiff = diff; closest = weightSelect.options[i]; }
        }
        if (closest) {
            closest.selected = true;
            weightSelect.classList.toggle('active-weight', !!isCorrect);
            if (typeof updateWeightColor === 'function') updateWeightColor(weightSelect);
        }
    }

    // ── Remplissage par type ──────────────────────────────────────────────────

    /** QCM (multichoice single=false). */
    function fillMc(qid, answers) {
        const list = document.getElementById(IDS.optionsList(qid));
        if (!list) return;
        while (list.firstChild) list.removeChild(list.firstChild);

        answers.forEach(ans => {
            const addBtn = document.querySelector(`.add-option-btn[data-qid="${qid}"]`);
            if (!addBtn) return;
            addBtn.click();
            const last = list.querySelector('.option-container:last-child');
            if (!last) return;

            const oid = last.querySelector('.remove-option-btn').getAttribute('data-oid');
            const fraction = parseFloat(ans.fraction) || 0;
            const isCorrect = fraction > 0;

            const checkbox = last.querySelector('.correct-option');
            if (checkbox) checkbox.checked = isCorrect;
            setRichTextValue(IDS.optionText(qid, oid), ans.text);
            selectClosestWeight(document.getElementById(IDS.optionWeight(qid, oid)), fraction, isCorrect);
            if (ans.feedback) setRichTextValue(IDS.optionFeedback(qid, oid), ans.feedback);
        });
    }

    /** QCU (multichoice single=true). */
    function fillSc(qid, answers) {
        const list = document.getElementById(IDS.scOptionsList(qid));
        if (!list) return;
        while (list.firstChild) list.removeChild(list.firstChild);

        answers.forEach(ans => {
            const addBtn = document.querySelector(`.add-sc-option-btn[data-qid="${qid}"]`);
            if (!addBtn) return;
            addBtn.click();
            const last = list.querySelector('.option-container:last-child');
            if (!last) return;

            const oid = last.querySelector('.remove-sc-option-btn').getAttribute('data-oid');
            const isCorrect = (parseFloat(ans.fraction) || 0) > 0;

            const radio = last.querySelector('.correct-sc-option');
            if (radio) radio.checked = isCorrect;
            setRichTextValue(IDS.scOptionText(qid, oid), ans.text);
            if (ans.feedback) setRichTextValue(IDS.scOptionFeedback(qid, oid), ans.feedback);
        });
    }

    /** QRC (shortanswer) + sensibilité à la casse (<usecase>). */
    function fillSa(qid, answers, caseSensitive) {
        const list = document.getElementById(IDS.saOptionsList(qid));
        if (!list) return;
        while (list.firstChild) list.removeChild(list.firstChild);

        answers.forEach(ans => {
            const addBtn = document.querySelector(`.add-sa-option-btn[data-qid="${qid}"]`);
            if (!addBtn) return;
            addBtn.click();
            const last = list.querySelector('.option-container:last-child');
            if (!last) return;

            const oid = last.querySelector('.remove-sa-option-btn').getAttribute('data-oid');
            const textInput = document.getElementById(IDS.saOptionText(qid, oid));
            const weightInput = document.getElementById(IDS.saOptionWeight(qid, oid));
            const feedbackInput = document.getElementById(IDS.saOptionFeedback(qid, oid));
            const caseSelect = document.getElementById(IDS.saCase(qid, oid));

            const weight = (parseFloat(ans.fraction) || 0).toString();
            if (textInput) textInput.value = normalizePlain(ans.text);
            if (weightInput) {
                weightInput.value = weight;
                weightInput.setAttribute('data-full-value', weight);
                if (typeof updateWeightColor === 'function') updateWeightColor(weightInput);
            }
            if (feedbackInput && ans.feedback) feedbackInput.value = normalizePlain(ans.feedback);
            if (caseSelect) caseSelect.value = caseSensitive ? 'case_sensitive' : 'case_insensitive';
        });
    }

    /** Vrai/Faux (truefalse). */
    function fillTf(qid, answers) {
        // La réponse « true » est correcte si sa fraction est > 0.
        let isTrueCorrect = false;
        const trueAns = answers.find(a => normalizePlain(a.text).toLowerCase() === 'true');
        if (trueAns) {
            isTrueCorrect = (parseFloat(trueAns.fraction) || 0) > 0;
        } else {
            // Repli : la réponse à fraction maximale gagne.
            const best = answers.reduce((b, a) => (parseFloat(a.fraction) || 0) > (parseFloat(b.fraction) || -1) ? a : b, { fraction: -1 });
            isTrueCorrect = normalizePlain(best.text).toLowerCase() === 'true';
        }
        const trueEl = document.getElementById(IDS.trueOption(qid));
        const falseEl = document.getElementById(IDS.falseOption(qid));
        if (trueEl) trueEl.checked = isTrueCorrect;
        if (falseEl) falseEl.checked = !isTrueCorrect;
    }

    /** Numérique (numerical) + tolérance. */
    function fillNum(qid, questionEl) {
        const answerEl = directChild(questionEl, 'answer');
        if (!answerEl) return;
        const value = normalizePlain(answerText(answerEl));
        const toleranceEl = directChild(answerEl, 'tolerance');
        const tolerance = toleranceEl ? normalizePlain(toleranceEl.textContent) : '0';

        const numAnswer = document.getElementById(IDS.numAnswer(qid));
        if (numAnswer) numAnswer.value = value;

        if (tolerance && parseFloat(tolerance) > 0) {
            const range = document.getElementById(IDS.numRange(qid));
            const margin = document.getElementById(IDS.numMargin(qid));
            const rangeOptions = document.getElementById(IDS.numRangeOptions(qid));
            if (range) range.checked = true;
            if (margin) margin.value = tolerance;
            if (rangeOptions) rangeOptions.classList.remove('hidden');
        }
    }

    /** Restitue les 3 feedbacks combinés (QCM/QCU) s'ils sont présents. */
    function fillCombinedFeedback(qid, questionEl) {
        const correct = fieldText(questionEl, 'correctfeedback');
        const partial = fieldText(questionEl, 'partiallycorrectfeedback');
        const incorrect = fieldText(questionEl, 'incorrectfeedback');
        if (correct.trim())   setRichTextValue(IDS.correctFeedback(qid), correct);
        if (partial.trim())   setRichTextValue(IDS.partiallyCorrectFeedback(qid), partial);
        if (incorrect.trim()) setRichTextValue(IDS.incorrectFeedback(qid), incorrect);
    }

    /** Réattache le premier média <file base64> trouvé dans la question. */
    function attachQuestionMedia(qid, questionEl) {
        if (typeof attachMediaFromZip !== 'function') return;
        const fileEl = questionEl.querySelector('file');
        if (!fileEl) return;
        const name = fileEl.getAttribute('name') || `${qid}_media`;
        try {
            const bytes = base64ToBytes(fileEl.textContent);
            const file = new File([bytes], name);
            attachMediaFromZip(qid, file);
        } catch (err) {
            console.error('[importMoodleXml] Décodage base64 du média échoué :', err);
        }
    }

    // ── Traitement d'une question complète ────────────────────────────────────

    /**
     * Construit une question dans l'UI à partir d'un élément <question>.
     * @param {Element} questionEl
     * @returns {boolean} true si traitée, false si type non géré
     */
    function processQuestion(questionEl) {
        const moodleType = (questionEl.getAttribute('type') || '').toLowerCase();
        const name = fieldText(questionEl, 'name').trim();
        const questionHtml = fieldText(questionEl, 'questiontext');
        const generalFeedback = fieldText(questionEl, 'generalfeedback');

        const answers = directChildren(questionEl, 'answer').map(a => ({
            fraction: a.getAttribute('fraction'),
            text: answerText(a),
            feedback: answerFeedback(a)
        }));

        let qid = null;

        switch (moodleType) {
            case 'multichoice': {
                const single = fieldText(questionEl, 'single').trim().toLowerCase() === 'true';
                const internalType = single ? 'sc' : 'mc';
                qid = addImportedQuestion(name, questionHtml, internalType);
                if (!qid) return true;
                if (single) fillSc(qid, answers); else fillMc(qid, answers);
                fillCombinedFeedback(qid, questionEl);
                break;
            }
            case 'truefalse':
                qid = addImportedQuestion(name, questionHtml, 'tf');
                if (!qid) return true;
                fillTf(qid, answers);
                break;
            case 'shortanswer': {
                const caseSensitive = fieldText(questionEl, 'usecase').trim() === '1';
                qid = addImportedQuestion(name, questionHtml, 'sa');
                if (!qid) return true;
                fillSa(qid, answers, caseSensitive);
                break;
            }
            case 'numerical':
                qid = addImportedQuestion(name, questionHtml, 'num');
                if (!qid) return true;
                fillNum(qid, questionEl);
                break;
            default:
                return false; // type non géré
        }

        if (generalFeedback.trim()) setRichTextValue(IDS.generalFeedback(qid), generalFeedback);
        attachQuestionMedia(qid, questionEl);
        return qid; // id interne (chaîne, donc truthy) — utilisé pour la banque
    }

    /**
     * Rattache une question importée à sa banque, d'après l'entrée
     * `<question type="category">` qui la précédait. Sans catégorie, la question
     * reste dans la zone « Sans banque ». Recrée la banque si nécessaire.
     * @param {string} qid          — id interne de la question créée
     * @param {string|null} categoryPath — chemin Moodle (ex. « $course$/CODE/Algèbre »)
     */
    function assignXmlCategory(qid, categoryPath) {
        if (typeof qid !== 'string' || !categoryPath) return;
        if (typeof window.bankNameFromCategoryPath !== 'function'
            || typeof window.ensureBankByName !== 'function'
            || typeof window.moveQuestionToBank !== 'function') return;

        const name = window.bankNameFromCategoryPath(categoryPath);
        if (!name) return;

        const section = window.ensureBankByName(name);
        const el = document.querySelector(`.question-container[data-id="${qid}"]`);
        if (section && el) window.moveQuestionToBank(el, section);
    }

    /**
     * Déduit le « Code article » d'un document Moodle XML, dans l'ordre :
     *   1. commentaire explicite `<!-- course-code: … -->` (émis par notre export,
     *      seule source fiable et présente dès qu'un code est renseigné) ;
     *   2. segment <code> d'un chemin de catégorie « $course$/<code>/<nom> »
     *      (pour les fichiers tiers organisés en banques).
     * On NE déduit PAS depuis les identifiants de question : le préfixe peut être
     * le sentinel « Q » (code vide) ou une base manuelle → champ pollué à tort.
     * @param {string}    rawXml
     * @param {Element[]} qEls
     * @returns {string} code article, ou '' si indéterminable
     */
    function deriveCourseCode(rawXml, qEls) {
        const m = rawXml.match(/<!--\s*course-code\s*:\s*([^>]*?)\s*-->/i);
        if (m && m[1].trim()) return m[1].trim();

        for (const el of qEls) {
            if ((el.getAttribute('type') || '').toLowerCase() !== 'category') continue;
            const seg = fieldText(el, 'category').trim().split('/').map(s => s.trim()).filter(Boolean);
            if (seg.length >= 3 && seg[0] === '$course$') return seg[1];
        }

        return '';
    }

    // ── Point d'entrée ────────────────────────────────────────────────────────

    /**
     * Parse un document Moodle XML et reconstruit les questions dans l'interface.
     * Asynchrone (confirmation modale avant remplacement, comme l'import GIFT).
     * @param {string} xmlString
     */
    async function importMoodleXmlContent(xmlString) {
        let content = String(xmlString || '').replace(/^﻿/, '');

        const doc = new DOMParser().parseFromString(content, 'application/xml');
        if (doc.querySelector('parsererror')) {
            notify.error('Le fichier XML est mal formé et n\'a pas pu être lu.');
            return;
        }
        const quiz = doc.querySelector('quiz');
        if (!quiz) {
            notify.error('Aucune balise <quiz> trouvée : ce fichier n\'est pas un export Moodle XML.');
            return;
        }

        const questionEls = directChildren(quiz, 'question');
        if (questionEls.length === 0) {
            notify.error('Aucune question trouvée dans le fichier XML.');
            return;
        }

        const questionsContainer = document.getElementById('questions-container');
        const giftOutput = document.getElementById('gift-output');

        // Confirmation avant de remplacer les questions existantes (modale non bloquante).
        if (questionsContainer && questionsContainer.querySelectorAll('.question-container').length > 0) {
            const proceed = await confirmDialog({
                title: 'Remplacer les questions',
                message: 'Cet import remplacera toutes les questions actuelles. Voulez-vous continuer ?',
                confirmLabel: 'Importer',
                cancelLabel: 'Annuler',
                danger: true
            });
            if (!proceed) return;
            questionsContainer.innerHTML = '';
            if (giftOutput) giftOutput.value = '';
        }

        if (typeof window.questionCounter !== 'undefined') window.questionCounter = 0;

        // Charger le « Code article » : il préfixe les identifiants et permet de
        // reconnaître les identifiants auto-générés (à laisser vides pour rester
        // dynamiques). L'XML ne le porte pas nativement → on le déduit.
        const courseCode = deriveCourseCode(content, questionEls);
        if (courseCode) {
            const courseEl = document.getElementById('course-code');
            if (courseEl) courseEl.value = courseCode;
            if (window.courseCode) window.courseCode.value = courseCode;
        }

        let successCount = 0;
        let unsupportedCount = 0;
        let errorCount = 0;
        let mediaCount = 0;

        // Banque courante : mise à jour par chaque `<question type="category">`,
        // appliquée aux questions suivantes (sémantique Moodle native).
        let currentCategory = null;

        questionEls.forEach((questionEl, index) => {
            const moodleType = (questionEl.getAttribute('type') || '').toLowerCase();
            if (moodleType === 'category') {
                const path = fieldText(questionEl, 'category').trim();
                if (path) currentCategory = path;
                return;
            }

            try {
                const handled = processQuestion(questionEl);
                if (handled) {
                    successCount++;
                    if (questionEl.querySelector('file')) mediaCount++;
                    // Rattacher à sa banque (handled = id interne quand exploitable).
                    assignXmlCategory(handled, currentCategory);
                } else {
                    unsupportedCount++;
                }
            } catch (err) {
                console.error(`[importMoodleXml] Erreur sur la question ${index + 1} :`, err);
                errorCount++;
            }
        });

        // Rafraîchir la sortie GIFT et le sommaire.
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) generateBtn.click();

        // Compte rendu.
        if (successCount === 0) {
            notify.error('Aucune question exploitable n\'a pu être importée depuis ce fichier XML.');
            return;
        }
        let message = `${successCount} question(s) importée(s) depuis le fichier Moodle XML.`;
        if (mediaCount > 0)       message += `\n${mediaCount} média(s) réattaché(s).`;
        if (unsupportedCount > 0) message += `\n${unsupportedCount} question(s) ignorée(s) (type non géré par l'outil).`;
        if (errorCount > 0)       message += `\n${errorCount} question(s) en erreur (voir la console).`;

        if (unsupportedCount > 0 || errorCount > 0) {
            notify.warning(message);
        } else {
            notify.success(message);
        }
    }

    // ── Exposition globale ────────────────────────────────────────────────────
    window.importMoodleXmlContent = importMoodleXmlContent;
    window.looksLikeMoodleXml = looksLikeMoodleXml;
})();
