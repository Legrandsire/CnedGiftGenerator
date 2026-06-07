// ── Export lisible : PDF (impression) + RTF + HTML autonome ──────────────────
//
// Troisième famille de sorties, EN PLUS du GIFT et du Moodle XML (tous deux
// inchangés). Objectif : produire un document SOIGNÉ destiné à la lecture/
// relecture humaine (charte CNED), pas à Moodle. Cf. ROADMAP chantier n°4.
//
// Trois sorties, une même source :
//   • PDF  : window.open() d'un document HTML mis en forme → window.print()
//            (l'auteur choisit « Enregistrer au format PDF »). Images embarquées
//            en base64 inline pour survivre au document d'impression séparé.
//   • HTML : le MÊME document, téléchargé en .html autonome (self-contained :
//            CSS et images inlinées).
//   • RTF  : chaîne .rtf téléchargeable, ouvrable/éditable dans Word/LibreOffice.
//            Images PNG/JPEG embarquées directement (\pict\pngblip/\jpegblip en
//            hexadécimal) → fichier .rtf autonome avec ses images.
//
// Contrainte ferme (CLAUDE.md §2) : aucune dépendance nouvelle (pas de jsPDF).
// Réutilise les briques globales : getRichTextValue, addNonBreakingSpaces, IDS,
// computeFinalQuestionId (exportMoodleXml.js), getMediaFilename/getMediaCategory
// (mediaManager.js), buildExportFilename (downloadManager.js).
//
// Choix d'architecture (validés) :
//   • Fonction partagée readQuestionState() NOUVELLE, consommée par ce module
//     SEULEMENT. giftGenerator.js et exportMoodleXml.js restent intacts (zéro
//     risque sur la suite de tests). L'unification des trois lecteurs de DOM est
//     une amélioration future signalée au ROADMAP.
//   • CSS dans printStyles.css (source unique), inlinée à la génération via
//     document.styleSheets ; fallback FALLBACK_PRINT_CSS si la lecture des
//     cssRules est bloquée (cas Chrome en file://).
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers d'encodage ───────────────────────────────────────────────────────

/**
 * Échappe les caractères réservés HTML d'un texte simple (énoncés plats,
 * valeurs d'attribut). Le HTML enrichi du RTE n'est PAS échappé (déjà assaini
 * à la saisie par sanitizeRichHtml).
 * @param {string} str
 * @returns {string}
 */
function escHtmlText(str) {
    return String(str === undefined || str === null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Applique la typographie CNED (espaces insécables) à un fragment HTML, comme
 * les exports GIFT/XML, pour un rendu cohérent.
 * @param {string} html
 * @returns {string}
 */
function nbspHtml(html) {
    return (typeof addNonBreakingSpaces === 'function')
        ? addNonBreakingSpaces(html || '')
        : (html || '');
}

/**
 * Met en forme un fragment riche pour l'affichage : typographie CNED + enveloppe
 * de bloc (`<p>…</p>` si nécessaire), exactement comme les exports GIFT/XML
 * (`addHtmlTags(addNonBreakingSpaces(...))`). Garantit un HTML bien formé et un
 * rendu cohérent (paragraphes, marges maîtrisées).
 * @param {string} raw
 * @returns {string}
 */
function formatBlock(raw) {
    if (!raw || !String(raw).trim()) return '';
    const withNbsp = nbspHtml(raw);
    return (typeof addHtmlTags === 'function') ? addHtmlTags(withNbsp) : withNbsp;
}

/**
 * Lit la pondération d'un <select>/<input> de poids : préfère data-full-value
 * (valeur exacte non arrondie), retombe sur value, puis sur fallback.
 * @param {HTMLElement|null} el
 * @param {number} fallback
 * @returns {number}
 */
function readWeight(el, fallback) {
    if (!el) return fallback;
    const raw = el.getAttribute('data-full-value') || el.value;
    const n = parseFloat(raw);
    return isNaN(n) ? fallback : n;
}

// ── Lecture normalisée de l'état d'une question (source unique) ───────────────

/**
 * Lit les réponses d'un QCM (single=false) ou d'un QCU (single=true).
 * @param {string|number} qid
 * @param {boolean} single
 * @returns {Array<{textHtml,isCorrect,weight,feedbackHtml}>}
 */
function readChoiceAnswers(qid, single) {
    const listSel    = single ? `#sc-options-list-${qid} .option-container`
                              : `#options-list-${qid} .option-container`;
    const removeSel  = single ? '.remove-sc-option-btn' : '.remove-option-btn';
    const correctSel = single ? '.correct-sc-option'    : '.correct-option';

    const out = [];
    document.querySelectorAll(listSel).forEach(opt => {
        const btn = opt.querySelector(removeSel);
        if (!btn) return;
        const oid = btn.getAttribute('data-oid');

        const text = single ? getRichTextValue(IDS.scOptionText(qid, oid))
                            : getRichTextValue(IDS.optionText(qid, oid));
        if (!text || !text.trim()) return;

        const correctEl = opt.querySelector(correctSel);
        const isCorrect = correctEl ? correctEl.checked : false;

        const weight = single
            ? (isCorrect ? 100 : 0)
            : readWeight(document.getElementById(IDS.optionWeight(qid, oid)), isCorrect ? 100 : 0);

        const feedback = single ? getRichTextValue(IDS.scOptionFeedback(qid, oid))
                                : getRichTextValue(IDS.optionFeedback(qid, oid));

        out.push({ textHtml: text, isCorrect: !!isCorrect, weight, feedbackHtml: feedback || '' });
    });
    return out;
}

/**
 * Lit les réponses acceptées d'une QRC (shortanswer). Toutes sont « correctes »
 * (réponses acceptées) ; on conserve le poids et la sensibilité à la casse.
 * @param {string|number} qid
 * @returns {Array<{textHtml,isCorrect,weight,feedbackHtml,caseLabel}>}
 */
function readShortAnswers(qid) {
    const out = [];
    document.querySelectorAll(`#sa-options-list-${qid} .option-container`).forEach(opt => {
        const btn = opt.querySelector('.remove-sa-option-btn');
        if (!btn) return;
        const oid = btn.getAttribute('data-oid');

        const textEl = document.getElementById(IDS.saOptionText(qid, oid));
        const text = textEl ? textEl.value.trim() : '';
        if (!text) return;

        const weight = readWeight(document.getElementById(IDS.saOptionWeight(qid, oid)), 100);
        const caseEl = document.getElementById(IDS.saCase(qid, oid));
        const caseLabel = (caseEl && caseEl.value === 'case_sensitive')
            ? 'sensible à la casse' : 'insensible à la casse';

        const fbEl = document.getElementById(IDS.saOptionFeedback(qid, oid));
        const feedback = fbEl ? fbEl.value.trim() : '';

        out.push({
            textHtml: escHtmlText(text),
            isCorrect: true,
            weight,
            feedbackHtml: feedback ? escHtmlText(feedback) : '',
            caseLabel
        });
    });
    return out;
}

/**
 * Lit l'état complet et normalisé d'une question depuis le DOM. Renvoie un objet
 * neutre vis-à-vis du format de sortie (consommé identiquement par HTML/PDF et
 * RTF), ou null si la question est inexploitable (texte manquant → notify).
 *
 * @param {HTMLElement} questionEl   — conteneur .question-container
 * @param {number}      index        — position 0-based
 * @param {string}      courseCode   — code matière (pour l'identifiant)
 * @returns {Object|null}
 */
function readQuestionState(questionEl, index, courseCode) {
    const qid = questionEl.dataset.id;
    const typeRadio = document.querySelector(`input[name="question-type-${qid}"]:checked`);
    if (!typeRadio) return null;
    const type = typeRadio.value;

    const statement = getRichTextValue(IDS.questionText(qid));
    if (!statement || !statement.trim()) {
        notify.error(`La question ${index + 1} n'a pas de texte. Elle est ignorée dans l'export lisible.`);
        return null;
    }

    const idField = document.getElementById(IDS.questionId(qid));
    const finalId = computeFinalQuestionId(idField ? idField.value.trim() : '', index, courseCode);

    const labels = { mc: 'QCM', sc: 'QCU', tf: 'Vrai / Faux', sa: 'Réponse courte', num: 'Numérique' };

    const state = {
        index,
        finalId,
        typeCode: type,
        typeLabel: labels[type] || type,
        statementHtml: statement,
        generalFeedbackHtml: getRichTextValue(IDS.generalFeedback(qid)) || '',
        combined: {
            correct:   getRichTextValue(IDS.correctFeedback(qid)) || '',
            partial:   getRichTextValue(IDS.partiallyCorrectFeedback(qid)) || '',
            incorrect: getRichTextValue(IDS.incorrectFeedback(qid)) || ''
        },
        media: null,
        answers: [],
        numeric: null
    };

    // Média associé (image affichée dans le PDF/HTML ; mention sinon)
    if (window.questionMediaFiles && window.questionMediaFiles[qid]) {
        const file = window.questionMediaFiles[qid];
        const filename = (typeof getMediaFilename === 'function')
            ? (getMediaFilename(qid, finalId) || file.name) : file.name;
        const category = (typeof getMediaCategory === 'function')
            ? getMediaCategory(filename) : 'other';
        state.media = { filename, category, file, dataUrl: null };
    }

    switch (type) {
        case 'mc':
            state.answers = readChoiceAnswers(qid, false);
            break;
        case 'sc':
            state.answers = readChoiceAnswers(qid, true);
            break;
        case 'tf': {
            const trueEl = document.getElementById(IDS.trueOption(qid));
            const isTrue = !!(trueEl && trueEl.checked);
            state.answers = [
                { textHtml: 'Vrai', isCorrect: isTrue,  weight: isTrue ? 100 : 0, feedbackHtml: '' },
                { textHtml: 'Faux', isCorrect: !isTrue, weight: isTrue ? 0 : 100, feedbackHtml: '' }
            ];
            break;
        }
        case 'sa':
            state.answers = readShortAnswers(qid);
            break;
        case 'num': {
            const ansEl = document.getElementById(IDS.numAnswer(qid));
            const value = ansEl ? ansEl.value.trim() : '';
            if (!value) {
                notify.error(`La question ${index + 1} (numérique) n'a pas de réponse. Elle est ignorée dans l'export lisible.`);
                return null;
            }
            const rangeEl = document.getElementById(IDS.numRange(qid));
            const margin = (rangeEl && rangeEl.checked)
                ? ((document.getElementById(IDS.numMargin(qid)) || {}).value || '').trim()
                : '';
            state.numeric = { value, margin };
            break;
        }
        default:
            return null;
    }

    return state;
}

/**
 * Collecte les états de toutes les questions du DOM. Renvoie null (+ notify) s'il
 * n'y a rien d'exploitable.
 * @returns {Array<Object>|null}
 */
function buildPrintableStates() {
    const questions = document.querySelectorAll('.question-container');
    if (questions.length === 0) {
        notify.error('Aucune question à exporter. Veuillez d\'abord ajouter des questions.');
        return null;
    }
    const ccEl = document.getElementById('course-code');
    const courseCode = ccEl ? ccEl.value.trim() : '';

    const states = [];
    questions.forEach((q, i) => {
        const st = readQuestionState(q, i, courseCode);
        if (st) states.push(st);
    });

    if (states.length === 0) {
        notify.error('Aucune question exploitable à exporter.');
        return null;
    }
    return states;
}

/**
 * Métadonnées du document (auteur, code article, date, titre).
 * @returns {{author,courseCode,date,title}}
 */
function getPrintableMeta() {
    const v = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const author = (v('author-firstname') + ' ' + v('author-lastname')).trim();
    const courseCode = v('course-code');
    return {
        author,
        courseCode,
        date: new Date().toLocaleString('fr-FR'),
        title: 'Questions' + (courseCode ? (' — ' + courseCode) : '')
    };
}

// ── Médias en base64 (pour survivre au document d'impression séparé) ──────────

/**
 * Lit un fichier et renvoie une data-URL complète (avec préfixe « data:…;base64, »).
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('Lecture du média impossible'));
        reader.readAsDataURL(file);
    });
}

/**
 * Lit les dimensions naturelles d'une image (à partir d'une data-URL).
 * @param {string} dataUrl
 * @returns {Promise<{w:number,h:number}|null>}
 */
function imageNaturalSize(dataUrl) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve(null);
        img.src = dataUrl;
    });
}

/**
 * Convertit un fichier en chaîne hexadécimale (pour l'embarquement RTF \pict).
 * @param {File} file
 * @returns {Promise<string>}
 */
async function fileToHex(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let hex = '';
    for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
    return hex;
}

/**
 * Prépare les médias des questions pour TOUTES les sorties :
 *   • dataUrl (base64 inline) pour le PDF et le HTML autonome ;
 *   • rtfPict { blip, hex, W, H } pour l'embarquement dans le RTF — uniquement
 *     PNG/JPEG (seuls formats que RTF \pict embarque de façon fiable, ouvrables
 *     par Word/LibreOffice). Les autres formats restent une mention textuelle.
 * Dimensions RTF en twips (1 px ≈ 15 twips à 96 dpi), largeur plafonnée.
 * @param {Array<Object>} states
 * @returns {Promise<void>}
 */
async function attachPrintableMedia(states) {
    const MAX_W_TWIPS = 6000; // ~10,5 cm : évite qu'une grande image déborde la page
    for (const s of states) {
        if (!s.media || s.media.category !== 'image' || !s.media.file) continue;
        try {
            s.media.dataUrl = await fileToDataUrl(s.media.file);

            const ext  = (s.media.filename.split('.').pop() || '').toLowerCase();
            const blip = (ext === 'png') ? 'pngblip'
                       : (ext === 'jpg' || ext === 'jpeg') ? 'jpegblip' : null;
            if (!blip) continue; // gif/webp/svg : pas d'embarquement RTF fiable → mention

            const size = await imageNaturalSize(s.media.dataUrl);
            const hex  = await fileToHex(s.media.file);
            let W = 0, H = 0;
            if (size && size.w && size.h) {
                let w = size.w * 15, h = size.h * 15;
                if (w > MAX_W_TWIPS) { h = h * (MAX_W_TWIPS / w); w = MAX_W_TWIPS; }
                W = Math.round(w); H = Math.round(h);
            }
            s.media.rtfPict = { blip, hex, W, H };
        } catch (err) {
            console.error('[exportPrintable] Média non préparé :', err);
        }
    }
}

// ── Rendu HTML (PDF + HTML autonome) ──────────────────────────────────────────

/**
 * Petit fallback CSS (utilisé seulement si la lecture de printStyles.css est
 * bloquée, ex. Chrome en file://). Volontairement compact : printStyles.css
 * reste la source riche. Couvre l'essentiel de la charte CNED pour rester lisible.
 */
const FALLBACK_PRINT_CSS = `
.printable-doc{max-width:820px;margin:0 auto;padding:1.2rem;font-family:"Segoe UI",system-ui,Arial,sans-serif;font-size:11.5pt;line-height:1.4;color:#1f2d2a}
.printable-doc p{margin:.25rem 0}
.printable-header{border-bottom:3px solid #2da288;padding-bottom:.6rem;margin-bottom:1rem}
.printable-header .ph-title{font-size:19pt;font-weight:700;color:#2da288;margin-bottom:.25rem}
.printable-header .ph-meta{font-size:9.5pt;color:#555}.printable-header .ph-meta span{margin-right:1.2rem}
.printable-question{border:1px solid #d6e9e4;border-left:4px solid #00bcb4;border-radius:6px;padding:.6rem .85rem;margin-bottom:.7rem;page-break-inside:avoid;break-inside:avoid}
.pq-head{border-bottom:1px solid #eef4f2;padding-bottom:.3rem;margin-bottom:.4rem}
.pq-num{font-weight:700;color:#ae2585;font-size:12pt}
.pq-id{font-family:monospace;font-size:9.5pt;color:#666;margin-left:.4rem}
.pq-type{display:inline-block;background:#e3f6f0;color:#1c6b58;font-size:8.5pt;font-weight:600;padding:.08rem .5rem;border-radius:10px;margin-left:.5rem}
.pq-statement{margin:.3rem 0 .5rem}
.pq-media img{max-width:100%;max-height:300px;border:1px solid #d6e9e4;border-radius:4px}
.pq-media-note{font-style:italic;color:#777;font-size:9.5pt;background:#f7f7f7;padding:.25rem .5rem;border-radius:4px}
.pq-answers{list-style:none;padding:0;margin:.3rem 0}
.pq-answer{display:flex;align-items:baseline;gap:.45rem;padding:.18rem .45rem;margin:.12rem 0;border-radius:4px}
.pq-mark{flex:0 0 1.1em;text-align:center;font-weight:700;color:#2da288}
.pq-answer:not(.correct) .pq-mark{color:#b7c4c0}
.pq-answer-body{flex:1 1 auto;min-width:0}.pq-answer-body p{margin:0}
.pq-answer.correct{background:#e3f6f0;font-weight:600;color:#1c6b58}
.pq-weight{font-size:8.5pt;color:#ae2585;font-weight:600}
.pq-case{font-size:8.5pt;color:#777;font-style:italic;font-weight:normal}
.pq-answer-fb{font-size:9.5pt;color:#555;font-style:italic;font-weight:normal;margin-top:.1rem}
.pq-numeric{display:flex;align-items:baseline;gap:.45rem;padding:.25rem .45rem;background:#e3f6f0;border-radius:4px;color:#1c6b58}
.pq-feedback{margin-top:.5rem;padding:.35rem .6rem;background:#fafafa;border-left:3px solid #00bcb4;border-radius:0 4px 4px 0;font-size:10.5pt}
.pq-feedback-label{font-weight:700;color:#2da288;font-size:8.5pt;text-transform:uppercase}
.pq-combined-item{padding:.3rem .6rem;margin:.2rem 0;border-radius:4px;background:#fafafa;font-size:10.5pt}
.pqc-label{display:inline-block;font-weight:700;font-size:8.5pt;text-transform:uppercase;margin-right:.4rem}
.pqc-ok{color:#2da288}.pqc-partial{color:#e6417a}.pqc-ko{color:#ae2585}
@page{margin:1.5cm}
@media print{.pq-answer.correct,.pq-type,.pq-numeric,.pq-combined-item,.pq-feedback{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
`;

/**
 * Récupère la CSS d'impression. Source unique : printStyles.css, liée dans
 * index.html. On sérialise ses cssRules pour l'inliner dans le document généré
 * (document séparé qui ne partage pas le <head>). Si la lecture est bloquée
 * (file:// sous Chrome), on retombe sur FALLBACK_PRINT_CSS.
 * @returns {string}
 */
function getPrintCss() {
    try {
        for (const sheet of document.styleSheets) {
            if (sheet.href && sheet.href.indexOf('printStyles.css') >= 0) {
                const rules = sheet.cssRules; // peut lever SecurityError en file://
                if (rules) {
                    let css = '';
                    for (const rule of rules) css += rule.cssText + '\n';
                    if (css.trim()) return css;
                }
            }
        }
    } catch (e) {
        // Lecture des cssRules bloquée (origine opaque file://) → fallback.
    }
    return FALLBACK_PRINT_CSS;
}

/**
 * Pourcentage formaté avec espace insécable (typographie CNED).
 * @param {number} w
 * @returns {string}
 */
function formatPercent(w) {
    return `${w} %`;
}

/**
 * Rend le bloc des réponses (HTML) selon le type.
 * @param {Object} s — état de question
 * @returns {string}
 */
function renderAnswersHtml(s) {
    if (s.numeric) {
        const m = (s.numeric.margin && parseFloat(s.numeric.margin) !== 0)
            ? ` ± ${escHtmlText(s.numeric.margin)}` : '';
        return `<div class="pq-numeric"><span class="pq-mark">✓</span>` +
               `<span class="pq-answer-body">Réponse&nbsp;: ` +
               `<strong>${escHtmlText(s.numeric.value)}${m}</strong></span></div>`;
    }
    let h = '<ul class="pq-answers">';
    s.answers.forEach(a => {
        const cls = a.isCorrect ? ' correct' : '';
        const mark = a.isCorrect ? '✓' : '○';
        let extra = '';
        if (typeof a.weight === 'number' && a.weight !== 100 && (a.isCorrect || a.weight !== 0)) {
            extra += ` <span class="pq-weight">(${formatPercent(a.weight)})</span>`;
        }
        if (a.caseLabel) extra += ` <span class="pq-case">— ${escHtmlText(a.caseLabel)}</span>`;
        // Structure flex : la coche reste alignée en tête, le corps (texte +
        // poids + feedback) occupe la colonne de droite même si le texte est un
        // bloc <p> (cf. retour utilisateur sur l'alignement des coches).
        h += `<li class="pq-answer${cls}"><span class="pq-mark">${mark}</span>` +
             `<div class="pq-answer-body">` +
             `<span class="pq-answer-text">${formatBlock(a.textHtml)}</span>${extra}`;
        if (a.feedbackHtml) h += `<div class="pq-answer-fb">${formatBlock(a.feedbackHtml)}</div>`;
        h += `</div></li>`;
    });
    h += '</ul>';
    return h;
}

/**
 * Rend une question complète en HTML.
 * @param {Object} s
 * @returns {string}
 */
function renderQuestionHtml(s) {
    let h = '<article class="printable-question">';
    h += `<div class="pq-head"><span class="pq-num">Question ${s.index + 1}</span>` +
         `<span class="pq-id">${escHtmlText(s.finalId)}</span>` +
         `<span class="pq-type">${escHtmlText(s.typeLabel)}</span></div>`;
    h += `<div class="pq-statement">${formatBlock(s.statementHtml)}</div>`;

    if (s.media) {
        if (s.media.category === 'image' && s.media.dataUrl) {
            h += `<figure class="pq-media"><img src="${s.media.dataUrl}" alt="${escHtmlText(s.media.filename)}"></figure>`;
        } else {
            h += `<p class="pq-media-note">📎 Média&nbsp;: ${escHtmlText(s.media.filename)} ` +
                 `(${escHtmlText(s.media.category)}) — voir l'export ZIP/XML.</p>`;
        }
    }

    h += renderAnswersHtml(s);

    if (s.generalFeedbackHtml) {
        h += `<div class="pq-feedback"><div class="pq-feedback-label">Rétroaction générale</div>` +
             `${formatBlock(s.generalFeedbackHtml)}</div>`;
    }

    const c = s.combined;
    if (c && (c.correct || c.partial || c.incorrect)) {
        h += '<div class="pq-combined">';
        if (c.correct) {
            h += `<div class="pq-combined-item"><span class="pqc-label pqc-ok">Si correct</span>${formatBlock(c.correct)}</div>`;
        }
        if (c.partial) {
            h += `<div class="pq-combined-item"><span class="pqc-label pqc-partial">Si partiellement correct</span>${formatBlock(c.partial)}</div>`;
        }
        if (c.incorrect) {
            h += `<div class="pq-combined-item"><span class="pqc-label pqc-ko">Si incorrect</span>${formatBlock(c.incorrect)}</div>`;
        }
        h += '</div>';
    }

    h += '</article>';
    return h;
}

/**
 * Construit le document HTML complet (self-contained : CSS + images inlinées).
 * @param {Array<Object>} states
 * @param {Object} meta
 * @param {{autoPrint?:boolean}} [opts]
 * @returns {string}
 */
function buildPrintableHtml(states, meta, opts) {
    opts = opts || {};
    const css = getPrintCss();

    let body = '<header class="printable-header">';
    body += `<div class="ph-title">${escHtmlText(meta.title)}</div><div class="ph-meta">`;
    if (meta.author)     body += `<span>Auteur : ${escHtmlText(meta.author)}</span>`;
    if (meta.courseCode) body += `<span>Code article : ${escHtmlText(meta.courseCode)}</span>`;
    body += `<span>Généré le ${escHtmlText(meta.date)}</span>`;
    body += `<span>${states.length} question(s)</span>`;
    body += '</div></header>';

    states.forEach(s => { body += renderQuestionHtml(s); });

    // Le script d'auto-impression n'est inclus que pour la fenêtre PDF (pas pour
    // le .html téléchargé, qu'on ne veut pas imprimer à l'ouverture).
    const autoPrint = opts.autoPrint
        ? '<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},200);};<\/script>'
        : '';

    return '<!DOCTYPE html>\n<html lang="fr"><head><meta charset="UTF-8">' +
           '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
           `<title>${escHtmlText(meta.title)}</title><style>\n${css}\n</style></head>` +
           `<body><div class="printable-doc">${body}</div>${autoPrint}</body></html>`;
}

// ── Rendu RTF ─────────────────────────────────────────────────────────────────

/**
 * Échappe un texte pour le RTF : caractères de contrôle « { } \ », sauts de
 * ligne, et caractères non-ASCII en \uN? (entier signé 16 bits — gère les
 * accents français). Point dur acté du format RTF.
 * @param {string} text
 * @returns {string}
 */
function rtfEscape(text) {
    let out = '';
    const str = String(text === undefined || text === null ? '' : text);
    for (const ch of str) {
        const code = ch.codePointAt(0);
        if (ch === '\\') out += '\\\\';
        else if (ch === '{') out += '\\{';
        else if (ch === '}') out += '\\}';
        else if (ch === '\n') out += '\\par ';
        else if (ch === '\t') out += '\\tab ';
        else if (code > 127) {
            let signed = code;
            if (signed > 32767) signed -= 65536; // RTF \u attend un entier signé 16 bits
            out += '\\u' + signed + '?';
        } else {
            out += ch;
        }
    }
    return out;
}

/**
 * Convertit un fragment HTML enrichi (RTE) en RTF, en s'appuyant sur DOMParser.
 * Sous-ensemble géré : b/strong, i/em, u, sup, sub, br, p/div/li/blockquote/h*.
 * @param {string} html
 * @returns {string}
 */
function richHtmlToRtf(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
    const root = doc.body.firstChild;
    if (!root) return rtfEscape(html);

    const BLOCKS = ['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'];
    let out = '';

    function walk(node) {
        node.childNodes.forEach(child => {
            if (child.nodeType === 3) { // texte
                out += rtfEscape(child.nodeValue);
                return;
            }
            if (child.nodeType !== 1) return; // commentaires, etc.
            const tag = child.tagName.toLowerCase();

            if (tag === 'br') { out += '\\line '; return; }

            let pre = '', post = '';
            if (tag === 'b' || tag === 'strong') { pre = '{\\b '; post = '}'; }
            else if (tag === 'i' || tag === 'em') { pre = '{\\i '; post = '}'; }
            else if (tag === 'u') { pre = '{\\ul '; post = '}'; }
            else if (tag === 'sup') { pre = '{\\super '; post = '}'; }
            else if (tag === 'sub') { pre = '{\\sub '; post = '}'; }

            if (tag === 'li') out += '\\bullet ';
            out += pre;
            walk(child);
            out += post;
            if (BLOCKS.includes(tag)) out += '\\par ';
        });
    }

    walk(root);
    return out;
}

/**
 * Rend une question en RTF.
 * @param {Object} s
 * @returns {string}
 */
function rtfQuestion(s) {
    let r = '';

    // ── Titre de la question, souligné d'un filet (bordure de paragraphe) ──────
    r += '\\pard\\sb160\\sa40\\brdrb\\brdrs\\brdrw10\\brsp40\n';
    r += `{\\b\\fs28\\cf1 ` + rtfEscape(`Question ${s.index + 1} — ${s.finalId} (${s.typeLabel})`) + `\\par}\n`;

    // ── Énoncé ────────────────────────────────────────────────────────────────
    r += '\\pard\\sb60\\sa60\n' + richHtmlToRtf(s.statementHtml) + '\\par\n';

    // ── Média : image embarquée (PNG/JPEG) ou mention ─────────────────────────
    if (s.media) {
        if (s.media.rtfPict) {
            const p = s.media.rtfPict;
            const dim = (p.W && p.H) ? ('\\picwgoal' + p.W + '\\pichgoal' + p.H) : '';
            r += '\\pard\\sb60\\sa60\n{\\pict\\' + p.blip + dim + '\n' + p.hex + '}\\par\n';
        } else {
            r += '\\pard\\sb60\\sa60\n{\\i ' +
                 rtfEscape(`Média : ${s.media.filename} (${s.media.category}) — voir l'export ZIP/XML.`) +
                 '\\par}\n';
        }
    }

    // ── Réponses (indentées pour les délimiter de l'énoncé) ───────────────────
    r += '\\pard\\li360\\sb40\n';
    if (s.numeric) {
        const m = (s.numeric.margin && parseFloat(s.numeric.margin) !== 0) ? ' ± ' + s.numeric.margin : '';
        r += `{\\b\\cf1 ` + rtfEscape('✓ Réponse : ' + s.numeric.value + m) + `\\par}\n`;
    } else {
        s.answers.forEach(a => {
            const mark = a.isCorrect ? '✓ ' : '○ ';
            const open = a.isCorrect ? '{\\b\\cf1 ' : '{ ';
            let line = open + rtfEscape(mark) + richHtmlToRtf(a.textHtml);
            let extra = '';
            if (typeof a.weight === 'number' && a.weight !== 100 && (a.isCorrect || a.weight !== 0)) {
                extra += ' (' + a.weight + ' %)';
            }
            if (a.caseLabel) extra += ' [' + a.caseLabel + ']';
            if (extra) line += rtfEscape(extra);
            line += '\\par}';
            r += line + '\n';
            if (a.feedbackHtml) {
                r += `\\pard\\li720\n{\\i\\fs20 ` + rtfEscape('Rétroaction : ') +
                     richHtmlToRtf(a.feedbackHtml) + `\\par}\n\\pard\\li360\n`;
            }
        });
    }

    // ── Rétroactions ──────────────────────────────────────────────────────────
    if (s.generalFeedbackHtml) {
        r += '\\pard\\li360\\sb60\n{\\b ' + rtfEscape('Rétroaction générale : ') + '}' +
             richHtmlToRtf(s.generalFeedbackHtml) + '\\par\n';
    }

    const c = s.combined;
    if (c && (c.correct || c.partial || c.incorrect)) {
        r += '\\pard\\li360\\sb60\n';
        if (c.correct)   r += `{\\b\\cf1 ` + rtfEscape('Si correct : ') + `}` + richHtmlToRtf(c.correct) + '\\par\n';
        if (c.partial)   r += `{\\b ` + rtfEscape('Si partiellement correct : ') + `}` + richHtmlToRtf(c.partial) + '\\par\n';
        if (c.incorrect) r += `{\\b\\cf2 ` + rtfEscape('Si incorrect : ') + `}` + richHtmlToRtf(c.incorrect) + '\\par\n';
    }

    // Réinitialise le paragraphe et ajoute un espace avant la question suivante.
    r += '\\pard\\sa120\\par\n';
    return r;
}

/**
 * Construit le document RTF complet.
 * @param {Array<Object>} states
 * @param {Object} meta
 * @returns {string}
 */
function buildRtf(states, meta) {
    // En-tête RTF + table de polices + table de couleurs (cf1 turquoise CNED,
    // cf2 rose CNED).
    let r = '{\\rtf1\\ansi\\ansicpg1252\\deff0\n';
    r += '{\\fonttbl{\\f0\\fswiss Helvetica;}}\n';
    r += '{\\colortbl;\\red45\\green162\\blue136;\\red174\\green37\\blue133;}\n';
    r += '\\fs24\n';

    r += `{\\b\\fs40\\cf1 ` + rtfEscape(meta.title) + `\\par}\n`;
    if (meta.author)     r += `{\\cf2 ` + rtfEscape('Auteur : ' + meta.author) + `\\par}\n`;
    if (meta.courseCode) r += `{ ` + rtfEscape('Code article : ' + meta.courseCode) + `\\par}\n`;
    r += `{ ` + rtfEscape('Généré le ' + meta.date + ' — ' + states.length + ' question(s)') + `\\par}\n\\par\n`;

    states.forEach(s => { r += rtfQuestion(s); });

    r += '}';
    return r;
}

// ── Téléchargement ────────────────────────────────────────────────────────────

/**
 * Déclenche le téléchargement d'un Blob sous un nom donné.
 * @param {string} fileName
 * @param {Blob} blob
 */
function triggerBlobDownload(fileName, blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
}

// ── Points d'entrée ─────────────────────────────────────────────────────────

/**
 * Ouvre une fenêtre d'impression contenant le document mis en forme et déclenche
 * l'impression (l'utilisateur choisit « Enregistrer au format PDF »).
 */
async function openPrintableView() {
    const states = buildPrintableStates();
    if (!states) return;
    await attachPrintableMedia(states);

    const html = buildPrintableHtml(states, getPrintableMeta(), { autoPrint: true });

    const win = window.open('', '_blank');
    if (!win) {
        notify.error('La fenêtre d\'impression a été bloquée par le navigateur. Autorisez les pop-ups pour ce site.');
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
}

/**
 * Télécharge un fichier .html autonome (lisible/éditable, ouvrable partout).
 */
async function downloadAsHtml() {
    const states = buildPrintableStates();
    if (!states) return;
    await attachPrintableMedia(states);

    const html = buildPrintableHtml(states, getPrintableMeta(), { autoPrint: false });
    const blob = new Blob(['﻿' + html], { type: 'text/html;charset=utf-8' });
    const fileName = (typeof buildExportFilename === 'function')
        ? buildExportFilename('html', 'questions_lisible')
        : 'questions_lisible.html';
    triggerBlobDownload(fileName, blob);
}

/**
 * Télécharge un fichier .rtf (Word/LibreOffice). Les images PNG/JPEG sont
 * embarquées (\pict) ; les autres médias renvoient vers l'export ZIP/XML.
 */
async function downloadAsRtf() {
    const states = buildPrintableStates();
    if (!states) return;
    await attachPrintableMedia(states);

    const rtf = buildRtf(states, getPrintableMeta());
    // Pas de BOM : le RTF a son propre en-tête {\rtf1...}.
    const blob = new Blob([rtf], { type: 'application/rtf' });
    const fileName = (typeof buildExportFilename === 'function')
        ? buildExportFilename('rtf', 'questions_lisible')
        : 'questions_lisible.rtf';
    triggerBlobDownload(fileName, blob);
}

// ── Câblage des boutons ───────────────────────────────────────────────────────
APP_INIT.push(function initPrintableExport() {
    const pdfBtn  = document.getElementById('print-pdf-btn');
    const rtfBtn  = document.getElementById('download-rtf-btn');
    const htmlBtn = document.getElementById('download-html-btn');
    if (pdfBtn)  pdfBtn.addEventListener('click', openPrintableView);
    if (rtfBtn)  rtfBtn.addEventListener('click', downloadAsRtf);
    if (htmlBtn) htmlBtn.addEventListener('click', downloadAsHtml);
});

// ── Exposition globale (pour le harnais de tests, sans DEBUG) ─────────────────
window.readQuestionState   = readQuestionState;
window.buildPrintableStates = buildPrintableStates;
window.attachPrintableMedia = attachPrintableMedia;
window.buildPrintableHtml  = buildPrintableHtml;
window.buildRtf            = buildRtf;
window.rtfEscape           = rtfEscape;
window.richHtmlToRtf       = richHtmlToRtf;
