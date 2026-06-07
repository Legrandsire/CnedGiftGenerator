// ── Banques de questions (catégories Moodle $CATEGORY) ───────────────────────
//
// Permet de regrouper les questions en « banques » reproduisant les catégories
// de la banque de questions Moodle. Cf. ROADMAP chantier n°2.
//
// Modèle de données : le DOM EST la source de vérité (comme pour les questions,
// il n'y a pas de tableau JS parallèle qui risquerait de se désynchroniser).
//
//   #questions-container
//     ├─ .no-bank-zone                 ← toujours en premier (questions sans banque)
//     │    └─ .bank-questions.no-bank-questions
//     │         └─ .question-container …
//     ├─ <details.bank-section data-bank-id="bank-1">
//     │    ├─ <summary.bank-summary>  badge B01 · nom · compteur · actions
//     │    └─ .bank-questions
//     │         └─ .question-container …
//     └─ <details.bank-section data-bank-id="bank-2"> …
//
// Toute question vit dans un conteneur `.bank-questions` (la zone « Sans banque »
// en est un, traité comme groupe par défaut). `querySelectorAll('.question-container')`
// renvoie donc toujours les questions dans l'ordre du document : sans-banque
// d'abord, puis chaque banque dans l'ordre — c'est l'ordre de génération GIFT/XML.
//
// Identifiant : règle UNIFIÉE (auparavant dupliquée dans giftGenerator.js et
// exportMoodleXml.js, consommée aussi par exportPrintable.js). Format :
//   <CODE>[-B<NN>]-Q<NN>   — le segment -B<NN> n'apparaît que pour une banque ;
//   la numérotation Q<NN> repart à 01 dans chaque groupe (zone sans-banque incluse).
//
// Le numéro B<NN> reflète l'ORDRE des banques (recalculé à l'ajout/suppression/
// déplacement) ; il est stable au renommage (renommer ne réordonne pas).
// ─────────────────────────────────────────────────────────────────────────────

// Identifiant interne stable d'une banque (pour les <select>), indépendant du
// numéro d'affichage B<NN> qui, lui, suit l'ordre. Jamais réinitialisé : seule
// l'unicité compte.
let bankCounter = 0;

// ── Accès au DOM ─────────────────────────────────────────────────────────────

/** @returns {HTMLElement|null} le conteneur principal des questions. */
function getQuestionsContainer() {
    return window.questionsContainer || document.getElementById('questions-container');
}

/**
 * Garantit l'existence de la zone « Sans banque » (toujours premier enfant du
 * conteneur) et la renvoie. Créée à la volée → robuste après un innerHTML = ''.
 * @returns {HTMLElement|null}
 */
function getNoBankZone() {
    const container = getQuestionsContainer();
    if (!container) return null;
    let zone = container.querySelector(':scope > .no-bank-zone');
    if (!zone) {
        zone = document.createElement('div');
        zone.className = 'no-bank-zone';
        zone.innerHTML =
            '<div class="no-bank-header">' +
            '<span class="no-bank-title">Sans banque</span> ' +
            '<span class="no-bank-count">0 question</span>' +
            '</div>' +
            '<div class="bank-questions no-bank-questions"></div>';
        container.insertBefore(zone, container.firstChild);
    }
    return zone;
}

/**
 * Conteneur d'accueil par défaut d'une nouvelle question (zone « Sans banque »).
 * Appelé par questionManager.addNewQuestion().
 * @returns {HTMLElement|null}
 */
function getDefaultQuestionParent() {
    const zone = getNoBankZone();
    return zone ? zone.querySelector('.no-bank-questions') : null;
}

/**
 * Tous les groupes de questions, dans l'ordre du document (zone sans-banque en
 * premier, puis chaque banque).
 * @returns {HTMLElement[]}
 */
function getQuestionGroups() {
    const container = getQuestionsContainer();
    if (!container) return [];
    return Array.from(container.querySelectorAll('.bank-questions'));
}

/** @returns {HTMLElement[]} les sections de banque, dans l'ordre du document. */
function getBankSections() {
    const container = getQuestionsContainer();
    if (!container) return [];
    return Array.from(container.querySelectorAll('.bank-section'));
}

// ── Lecture de l'appartenance d'une question ─────────────────────────────────

/**
 * Décrit la banque d'une question et sa position dans son groupe.
 * @param {HTMLElement} questionEl — conteneur .question-container
 * @returns {{bankNum: number|null, bankName: string|null, bankId: string|null, groupSeq: number}}
 *          bankNum/bankName/bankId = null si la question est hors banque ;
 *          bankId = identifiant interne STABLE de la banque (clé de regroupement) ;
 *          groupSeq = rang (1-based) dans son groupe (sans-banque ou banque).
 */
function getQuestionBankInfo(questionEl) {
    let bankNum = null;
    let bankName = null;
    let bankId = null;

    const section = questionEl.closest('.bank-section');
    if (section) {
        bankNum = getBankSections().indexOf(section) + 1;
        bankId = section.dataset.bankId || null;
        const nameEl = section.querySelector('.bank-name');
        bankName = nameEl ? nameEl.value.trim() : '';
    }

    const group = questionEl.closest('.bank-questions') || questionEl.parentElement;
    let groupSeq = 1;
    if (group) {
        const qs = Array.from(group.children).filter(c => c.classList.contains('question-container'));
        const idx = qs.indexOf(questionEl);
        if (idx >= 0) groupSeq = idx + 1;
    }

    return { bankNum, bankName, bankId, groupSeq };
}

// ── Identifiant final unifié ─────────────────────────────────────────────────

/**
 * Construit l'identifiant GIFT final (règle unique, sensible à la banque).
 *
 * Fonction PURE (sans DOM) → directement testable.
 *   • Aucune valeur saisie  → `<CODE|Q>[-B<NN>]-Q<NN>`
 *   • Valeur sans suffixe Q → `<valeur>[-B<NN>]-Q<NN>`
 *   • Valeur finissant déjà par `-Q\d+` → conservée telle quelle (choix auteur).
 *
 * @param {string}       questionIdValue — valeur saisie du champ identifiant
 * @param {string}       courseCode      — code article (préfixe par défaut)
 * @param {number|null}  bankNum         — numéro de banque (null = hors banque)
 * @param {number}       groupSeq        — rang de la question dans son groupe
 * @returns {string}
 */
function buildFinalQuestionId(questionIdValue, courseCode, bankNum, groupSeq) {
    const qNum = String(groupSeq).padStart(2, '0');
    const bankSeg = bankNum ? `-B${String(bankNum).padStart(2, '0')}` : '';

    if (!questionIdValue) {
        const prefix = courseCode ? courseCode : 'Q';
        return `${prefix}${bankSeg}-Q${qNum}`;
    }
    if (!/-Q\d+$/.test(questionIdValue)) {
        return `${questionIdValue}${bankSeg}-Q${qNum}`;
    }
    return questionIdValue;
}

/**
 * Identifiant GIFT final d'une question du DOM (résout sa banque puis applique
 * buildFinalQuestionId). Remplace l'ancien `computeFinalQuestionId(value, index,
 * code)` : le 2ᵉ argument est désormais l'ÉLÉMENT (la banque/le rang en découlent).
 *
 * @param {string}      questionIdValue — valeur saisie du champ identifiant
 * @param {HTMLElement} questionEl      — conteneur .question-container
 * @param {string}      courseCode      — code article
 * @returns {string}
 */
function computeFinalQuestionId(questionIdValue, questionEl, courseCode) {
    const info = getQuestionBankInfo(questionEl);
    return buildFinalQuestionId(questionIdValue, courseCode, info.bankNum, info.groupSeq);
}

// ── Cycle de vie d'une banque ────────────────────────────────────────────────

/**
 * Crée une banque (section repliable) à la fin du conteneur et la renvoie.
 * @param {string} [name] — nom initial (défaut : « Nouvelle banque »)
 * @returns {HTMLElement|null} la section <details> créée
 */
function createBank(name) {
    const container = getQuestionsContainer();
    if (!container) return null;
    getNoBankZone(); // garantit la zone « Sans banque » en tête

    bankCounter++;
    const section = document.createElement('details');
    section.className = 'bank-section';
    section.open = true;
    section.dataset.bankId = 'bank-' + bankCounter;
    section.innerHTML =
        '<summary class="bank-summary">' +
        '<span class="bank-badge">B00</span>' +
        '<input class="bank-name" type="text" placeholder="Nom de la banque" ' +
        'title="Nom de la banque (sert de catégorie Moodle et à l\'affichage)">' +
        '<span class="bank-count">0 question</span>' +
        '<span class="bank-actions">' +
        '<button type="button" class="bank-add-question-btn" title="Ajouter une question dans cette banque">+ question</button>' +
        '<button type="button" class="bank-delete-btn" title="Supprimer la banque (ses questions repassent en « Sans banque »)">Supprimer</button>' +
        '</span>' +
        '</summary>' +
        '<div class="bank-questions"></div>';
    // Valeur du nom posée en propriété (jamais par interpolation → pas d'injection).
    section.querySelector('.bank-name').value = name || 'Nouvelle banque';

    container.appendChild(section);
    wireBankSection(section);
    renumberQuestions();
    refreshSummary();
    return section;
}

/**
 * Supprime une banque. Ses questions repassent en « Sans banque » (jamais
 * supprimées). Confirmation si la banque n'est pas vide.
 * @param {HTMLElement} section
 */
async function deleteBank(section) {
    const qs = Array.from(section.querySelectorAll('.bank-questions > .question-container'));
    if (qs.length > 0) {
        const ok = (typeof confirmDialog === 'function')
            ? await confirmDialog({
                title: 'Supprimer la banque',
                message: `Cette banque contient ${qs.length} question(s). Elles repasseront en « Sans banque ». Continuer ?`,
                confirmLabel: 'Supprimer la banque',
                cancelLabel: 'Annuler',
                danger: true
            })
            : true;
        if (!ok) return;
        const parent = getDefaultQuestionParent();
        qs.forEach(q => parent.appendChild(q));
    }
    section.remove();
    renumberQuestions();
    refreshSummary();
}

/**
 * Déplace une question vers une banque (ou vers « Sans banque » si null), puis
 * renumérote et rafraîchit le sommaire.
 * @param {HTMLElement}      questionEl
 * @param {HTMLElement|null} targetSection — section de banque cible, ou null
 */
function moveQuestionToBank(questionEl, targetSection) {
    if (!questionEl) return;
    const parent = targetSection
        ? targetSection.querySelector('.bank-questions')
        : getDefaultQuestionParent();
    if (!parent) return;
    parent.appendChild(questionEl); // déplace le nœud (médias/écouteurs conservés)
    renumberQuestions();
    refreshSummary();
}

/**
 * Câble les contrôles de l'en-tête d'une banque (nom, + question, supprimer).
 * Empêche que cliquer/taper dans ces contrôles ne (dé)plie la section.
 * @param {HTMLElement} section
 */
function wireBankSection(section) {
    const nameInput = section.querySelector('.bank-name');
    const addBtn = section.querySelector('.bank-add-question-btn');
    const delBtn = section.querySelector('.bank-delete-btn');

    [nameInput, addBtn, delBtn].forEach(el => {
        if (el) el.addEventListener('click', e => e.stopPropagation());
    });

    if (nameInput) {
        // Espace/Entrée sur un <summary> plient la section : on isole l'input.
        nameInput.addEventListener('keydown', e => e.stopPropagation());
        nameInput.addEventListener('input', () => {
            refreshBanks();   // libellés des <select> de banque
            refreshSummary();
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const q = addNewQuestion();
            moveQuestionToBank(q, section);
        });
    }

    if (delBtn) {
        delBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            deleteBank(section);
        });
    }
}

// ── Rafraîchissement (badges, compteurs, flèches, sélecteurs) ────────────────

/**
 * Recalcule les numéros B<NN>, les compteurs, l'état des flèches (par groupe) et
 * les sélecteurs de banque de chaque question. Idempotent : n'écrit dans le DOM
 * que si une valeur change réellement (même garde [P1] que renumberQuestions).
 */
function refreshBanks() {
    const container = getQuestionsContainer();
    if (!container) return;

    const sections = getBankSections();
    container.classList.toggle('has-banks', sections.length > 0);

    // Badges B<NN> + compteurs de chaque banque.
    sections.forEach((section, i) => {
        const label = 'B' + String(i + 1).padStart(2, '0');
        const badge = section.querySelector('.bank-badge');
        if (badge && badge.textContent !== label) badge.textContent = label;
        section.dataset.bankNum = String(i + 1);

        const n = section.querySelectorAll('.bank-questions > .question-container').length;
        setCountText(section.querySelector('.bank-count'), n);
    });

    // Zone « Sans banque » : compteur + état vide (masquée par CSS si vide ET
    // qu'au moins une banque existe).
    const noBank = container.querySelector(':scope > .no-bank-zone');
    if (noBank) {
        const n = noBank.querySelectorAll('.no-bank-questions > .question-container').length;
        noBank.classList.toggle('is-empty', n === 0);
        setCountText(noBank.querySelector('.no-bank-count'), n);
    }

    // Flèches (premier/dernier PAR GROUPE) + sélecteurs de banque.
    getQuestionGroups().forEach(group => {
        const qs = Array.from(group.children).filter(c => c.classList.contains('question-container'));
        const lastIndex = qs.length - 1;
        qs.forEach((q, i) => {
            const upBtn = q.querySelector('.move-up-btn');
            const downBtn = q.querySelector('.move-down-btn');
            if (upBtn && upBtn.disabled !== (i === 0)) upBtn.disabled = (i === 0);
            if (downBtn && downBtn.disabled !== (i === lastIndex)) downBtn.disabled = (i === lastIndex);

            const select = q.querySelector('.bank-select');
            if (select) populateBankSelect(select, q);

            updateQuestionIdPreview(q);
        });
    });
}

/**
 * Met à jour l'aperçu (vivant) de l'identifiant GIFT final affiché sous le champ
 * identifiant d'une question. Reflète la banque courante : le segment `-B<NN>`
 * apparaît/disparaît selon que la question est dans une banque ou non.
 * @param {HTMLElement} questionEl
 */
function updateQuestionIdPreview(questionEl) {
    const preview = questionEl.querySelector('.id-preview');
    if (!preview) return;

    const qid = questionEl.dataset.id;
    const idField = document.getElementById('question-id-' + qid);
    const idValue = idField ? idField.value.trim() : '';
    const courseEl = document.getElementById('course-code');
    const courseCode = courseEl ? courseEl.value.trim() : '';

    const finalId = computeFinalQuestionId(idValue, questionEl, courseCode);
    const text = idValue
        ? 'Identifiant : ' + finalId
        : 'Identifiant généré automatiquement : ' + finalId;
    if (preview.textContent !== text) preview.textContent = text;
}

/**
 * (Re)remplit un sélecteur de banque avec « Sans banque » + une option par
 * banque, et sélectionne la banque courante de la question. Ne reconstruit les
 * options que si la liste (id + nom des banques) a changé.
 * @param {HTMLSelectElement} select
 * @param {HTMLElement}       questionEl
 */
function populateBankSelect(select, questionEl) {
    const sections = getBankSections();
    const sig = sections
        .map((s, i) => s.dataset.bankId + ':' + (i + 1) + ':' + (s.querySelector('.bank-name') ? s.querySelector('.bank-name').value : ''))
        .join('|');

    if (select.dataset.sig !== sig) {
        select.innerHTML = '';
        const none = document.createElement('option');
        none.value = '';
        none.textContent = 'Sans banque';
        select.appendChild(none);
        sections.forEach((s, i) => {
            const o = document.createElement('option');
            o.value = s.dataset.bankId;
            const name = (s.querySelector('.bank-name') ? s.querySelector('.bank-name').value : '').trim();
            o.textContent = 'B' + String(i + 1).padStart(2, '0') + (name ? ' — ' + name : '');
            select.appendChild(o);
        });
        select.dataset.sig = sig;
    }

    const currentSection = questionEl.closest('.bank-section');
    const currentId = currentSection ? currentSection.dataset.bankId : '';
    if (select.value !== currentId) select.value = currentId;
}

/** Plie/déplie toutes les banques d'un coup et met à jour le libellé du bouton. */
function toggleAllBanks() {
    const sections = getBankSections();
    if (sections.length === 0) return;
    const anyOpen = sections.some(s => s.open);
    sections.forEach(s => { s.open = !anyOpen; });
    const btn = document.getElementById('toggle-all-banks-btn');
    if (btn) btn.textContent = anyOpen ? 'Tout déplier' : 'Tout replier';
}

// ── Catégorie Moodle : chemin $CATEGORY et recherche/création par nom ────────
//
// Partagé par l'export GIFT (`$CATEGORY:`) et l'export Moodle XML
// (`<category><text>`), qui utilisent le MÊME chemin.

/**
 * Assainit un nom de banque pour servir de nom de catégorie Moodle :
 *   • « / » (séparateur de hiérarchie Moodle) → « - » pour rester sur un seul niveau ;
 *   • retours/tabulations et espaces multiples normalisés ;
 *   • repli sur `fallback` (ou « Banque ») si le nom est vide.
 * @param {string} name
 * @param {string} [fallback]
 * @returns {string}
 */
function sanitizeCategoryName(name, fallback) {
    let n = (name || '').trim();
    if (!n) n = (fallback || 'Banque');
    return n.replace(/\//g, '-').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Construit le chemin de catégorie Moodle d'une banque :
 *   `$course$/<codeArticle>/<nomBanque>` (le segment code est omis s'il est vide).
 * @param {string} courseCode    — code article
 * @param {string} bankName      — nom de la banque
 * @param {string} [fallbackLabel] — repli si le nom est vide (ex. « B01 »)
 * @returns {string}
 */
function buildCategoryPath(courseCode, bankName, fallbackLabel) {
    const segments = ['$course$'];
    const code = (courseCode || '').trim();
    if (code) segments.push(code);
    segments.push(sanitizeCategoryName(bankName, fallbackLabel));
    return segments.join('/');
}

/**
 * Déduit un nom de banque (lisible) d'un chemin de catégorie Moodle : on retient
 * le dernier segment non vide (la feuille), en ignorant `$course$` et les
 * niveaux intermédiaires (`top`, « Default for… », code article…).
 * @param {string} path — ex. « $course$/17336/Algèbre » ou « Algèbre »
 * @returns {string}
 */
function bankNameFromCategoryPath(path) {
    if (!path) return '';
    const segments = String(path).split('/').map(s => s.trim()).filter(Boolean);
    if (segments.length === 0) return '';
    const leaf = segments[segments.length - 1];
    return (leaf === '$course$') ? '' : leaf;
}

/**
 * Recherche une banque existante par son nom (insensible à la casse/espaces).
 * @param {string} name
 * @returns {HTMLElement|null}
 */
function findBankByName(name) {
    const target = (name || '').trim().toLowerCase();
    if (!target) return null;
    return getBankSections().find(s => {
        const el = s.querySelector('.bank-name');
        return el && el.value.trim().toLowerCase() === target;
    }) || null;
}

/**
 * Renvoie la banque portant ce nom, en la créant si nécessaire. Utilisé à
 * l'import (GIFT/XML) pour recréer les banques.
 * @param {string} name
 * @returns {HTMLElement|null}
 */
function ensureBankByName(name) {
    return findBankByName(name) || createBank(name);
}

// ── Utilitaires internes ─────────────────────────────────────────────────────

/** Écrit « N question(s) » dans un élément, sans reflow inutile. */
function setCountText(el, n) {
    if (!el) return;
    const txt = n + (n > 1 ? ' questions' : ' question');
    if (el.textContent !== txt) el.textContent = txt;
}

/** Rafraîchit le sommaire s'il est chargé (module périphérique facultatif). */
function refreshSummary() {
    if (typeof window.updateQuestionsSummary === 'function') {
        window.updateQuestionsSummary();
    }
}

// ── Initialisation ([A2]) ────────────────────────────────────────────────────

function initCategoryManager() {
    getNoBankZone(); // structure prête avant toute première question

    const addBankBtn = document.getElementById('add-bank-btn');
    if (addBankBtn) {
        addBankBtn.addEventListener('click', () => {
            const section = createBank();
            const input = section && section.querySelector('.bank-name');
            if (input) { input.focus(); input.select(); }
        });
    }

    const toggleBtn = document.getElementById('toggle-all-banks-btn');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleAllBanks);

    // Le code article préfixe l'identifiant : rafraîchir les aperçus à sa saisie.
    const courseEl = document.getElementById('course-code');
    if (courseEl) courseEl.addEventListener('input', refreshBanks);

    refreshBanks();
}
if (window.APP_INIT) window.APP_INIT.push(initCategoryManager);

// ── Exposition globale (portée window — cf. CLAUDE.md §2) ─────────────────────
window.getDefaultQuestionParent = getDefaultQuestionParent;
window.getNoBankZone            = getNoBankZone;
window.getQuestionGroups        = getQuestionGroups;
window.getBankSections          = getBankSections;
window.getQuestionBankInfo      = getQuestionBankInfo;
window.buildFinalQuestionId     = buildFinalQuestionId;
window.computeFinalQuestionId   = computeFinalQuestionId;
window.createBank               = createBank;
window.deleteBank               = deleteBank;
window.moveQuestionToBank       = moveQuestionToBank;
window.refreshBanks             = refreshBanks;
window.populateBankSelect       = populateBankSelect;
window.updateQuestionIdPreview  = updateQuestionIdPreview;
window.toggleAllBanks           = toggleAllBanks;
window.sanitizeCategoryName     = sanitizeCategoryName;
window.buildCategoryPath        = buildCategoryPath;
window.bankNameFromCategoryPath = bankNameFromCategoryPath;
window.findBankByName           = findBankByName;
window.ensureBankByName         = ensureBankByName;
