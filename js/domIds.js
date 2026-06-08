// ── Identifiants DOM centralisés ([A1]) ─────────────────────────────────────
//
// Source unique des chaînes d'identifiant utilisées avec getElementById /
// getRichTextValue. Renommer un préfixe ici le propage partout, au lieu de
// casser silencieusement plusieurs fichiers.
//
// Migration progressive, fichier par fichier (cf. AUDIT [A1]) : un fichier est
// considéré migré quand toutes ses constructions d'identifiant passent par IDS.
// ───────────────────────────────────────────────────────────────────────────

window.IDS = {
    // ── Question ─────────────────────────────────────────────────────────────
    questionId:      (qid) => `question-id-${qid}`,
    questionText:    (qid) => `question-text-${qid}`,
    generalFeedback: (qid) => `general-feedback-${qid}`,

    // ── Banque (catégorie Moodle) — cf. categoryManager.js ───────────────────
    bankSelect:      (qid) => `bank-select-${qid}`,

    // ── Feedback combiné (QCM/QCU) — export Moodle XML uniquement ─────────────
    // Trois messages distincts selon le résultat. Sans équivalent GIFT, donc
    // ignorés à l'export GIFT (cf. exportMoodleXml.js, ROADMAP chantier n°5).
    combinedFeedbackBlock:     (qid) => `combined-feedback-block-${qid}`,
    correctFeedback:           (qid) => `correct-feedback-${qid}`,
    partiallyCorrectFeedback:  (qid) => `partially-correct-feedback-${qid}`,
    incorrectFeedback:         (qid) => `incorrect-feedback-${qid}`,

    // ── Vrai / Faux ──────────────────────────────────────────────────────────
    trueOption:  (qid) => `true-option-${qid}`,
    falseOption: (qid) => `false-option-${qid}`,

    // ── Numérique ────────────────────────────────────────────────────────────
    numAnswer:       (qid) => `num-answer-${qid}`,
    numRange:        (qid) => `num-range-${qid}`,
    numMargin:       (qid) => `num-margin-${qid}`,
    numRangeOptions: (qid) => `num-range-options-${qid}`,

    // ── Options QCM ──────────────────────────────────────────────────────────
    optionText:     (qid, oid) => `option-text-${qid}-${oid}`,
    optionFeedback: (qid, oid) => `option-feedback-${qid}-${oid}`,
    optionWeight:   (qid, oid) => `option-weight-${qid}-${oid}`,
    correctOption:  (qid, oid) => `correct-option-${qid}-${oid}`,

    // ── Options QCU ──────────────────────────────────────────────────────────
    scOptionText:     (qid, oid) => `sc-option-text-${qid}-${oid}`,
    scOptionFeedback: (qid, oid) => `sc-option-feedback-${qid}-${oid}`,
    scCorrect:        (qid, oid) => `sc-correct-${qid}-${oid}`,

    // ── Réponses QRC ─────────────────────────────────────────────────────────
    saCase:           (qid, oid) => `sa-case-${qid}-${oid}`,
    saOptionText:     (qid, oid) => `sa-option-text-${qid}-${oid}`,
    saOptionWeight:   (qid, oid) => `sa-option-weight-${qid}-${oid}`,
    saOptionFeedback: (qid, oid) => `sa-option-feedback-${qid}-${oid}`,

    // ── Panneaux, listes, divers ─────────────────────────────────────────────
    typeRadio:         (type, qid) => `${type}-type-${qid}`,
    typeOptions:       (type, qid) => `${type}-options-${qid}`,
    optionsList:       (qid) => `options-list-${qid}`,
    scOptionsList:     (qid) => `sc-options-list-${qid}`,
    saOptionsList:     (qid) => `sa-options-list-${qid}`,
    mcOptionsReminder: (qid) => `mc-options-reminder-${qid}`
};
