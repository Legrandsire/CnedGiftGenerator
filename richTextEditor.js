/**
 * richTextEditor.js
 * Éditeur de texte enrichi pour les champs de question et de réponse
 * Compatible avec le générateur de code GIFT — Version beta 6
 *
 * Fonctions exportées (globales) :
 *   createRichTextEditor(id, placeholder, compact)  → string HTML
 *   initRichTextEditors(container)                  → void
 *   getRichTextValue(id)                            → string HTML nettoyé
 *   setRichTextValue(id, content)                   → void
 */

// ─────────────────────────────────────────────────────────────────────────────
// CRÉATION DU COMPOSANT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère le HTML d'un éditeur de texte enrichi.
 * Le div résultant porte l'ID fourni — il remplace les anciens <input> ou <textarea>.
 *
 * @param {string}  id          - ID du champ (même convention que les anciens inputs)
 * @param {string}  placeholder - Texte affiché quand le champ est vide
 * @param {boolean} [compact]   - Réduire la hauteur minimale (pour les champs de réponse)
 * @returns {string} HTML complet du composant
 */
function createRichTextEditor(id, placeholder, compact = false) {
    const editorClass = compact ? 'rte-editor rte-compact' : 'rte-editor';
    return `
        <div class="rte-container">
            <div class="rte-toolbar">
                <button type="button" class="rte-btn" data-cmd="bold"        title="Gras (Ctrl+B)"><b>G</b></button>
                <button type="button" class="rte-btn" data-cmd="italic"      title="Italique (Ctrl+I)"><em>I</em></button>
                <button type="button" class="rte-btn" data-cmd="underline"   title="Souligné (Ctrl+U)"><u>S</u></button>
                <span class="rte-sep"></span>
                <button type="button" class="rte-btn" data-cmd="superscript" title="Exposant">x<sup>2</sup></button>
                <button type="button" class="rte-btn" data-cmd="subscript"   title="Indice">x<sub>2</sub></button>
                <span class="rte-sep"></span>
                <button type="button" class="rte-btn rte-remove-fmt"         title="Effacer la mise en forme">✕ fmt</button>
            </div>
            <div
                class="${editorClass}"
                id="${id}"
                contenteditable="true"
                data-placeholder="${placeholder}"
                spellcheck="true"
                role="textbox"
                aria-multiline="true"
                aria-label="${placeholder}"
            ></div>
        </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIALISATION DES ÉVÉNEMENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialise les interactions de tous les éditeurs RTE présents dans un conteneur.
 * À appeler APRÈS l'injection du HTML dans le DOM.
 *
 * @param {HTMLElement|Document} [container=document]
 */
function initRichTextEditors(container = document) {

    // Boutons de formatage (bold, italic, underline, super/sub-script)
    container.querySelectorAll('.rte-toolbar .rte-btn:not(.rte-remove-fmt)').forEach(btn => {
        btn.addEventListener('mousedown', function (e) {
            e.preventDefault(); // Préserver le focus sur l'éditeur
            const cmd = this.dataset.cmd;
            if (cmd) {
                document.execCommand(cmd, false, null);
                _refreshToolbar(_getToolbar(this));
            }
        });
    });

    // Bouton "Effacer la mise en forme"
    container.querySelectorAll('.rte-remove-fmt').forEach(btn => {
        btn.addEventListener('mousedown', function (e) {
            e.preventDefault();
            const editor = _getEditor(this);
            if (editor) {
                editor.focus();
                document.execCommand('selectAll', false, null);
                document.execCommand('removeFormat', false, null);
                const sel = window.getSelection();
                if (sel) sel.collapseToEnd();
                _refreshToolbar(_getToolbar(this));
            }
        });
    });

    // Éditeurs : état de la barre d'outils + gestion du placeholder
    container.querySelectorAll('.rte-editor').forEach(editor => {
        const toolbar = _getToolbar(editor);

        ['keyup', 'mouseup', 'focus'].forEach(evt =>
            editor.addEventListener(evt, () => _refreshToolbar(toolbar))
        );

        ['input', 'blur', 'focus'].forEach(evt =>
            editor.addEventListener(evt, () => _updatePlaceholder(editor))
        );

        _updatePlaceholder(editor); // État initial
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTURE / ÉCRITURE DE LA VALEUR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récupère le contenu HTML d'un éditeur RTE.
 * Fonctionne également sur les <input> et <textarea> classiques (compatibilité).
 *
 * @param {string} id
 * @returns {string} HTML nettoyé, ou chaîne vide si le champ est vide
 */
function getRichTextValue(id) {
    const el = document.getElementById(id);
    if (!el) return '';

    if (el.getAttribute('contenteditable') === 'true') {
        const html = el.innerHTML.trim();
        // États "vide" produits par différents navigateurs
        if (html === '' || html === '<br>' || html === '<div><br></div>') return '';
        return html;
    }
    // Fallback input / textarea
    return (el.value || '').trim();
}

/**
 * Injecte un contenu dans un éditeur RTE.
 * Utilisé notamment lors de l'importation d'un fichier GIFT existant.
 *
 * @param {string} id
 * @param {string} content - HTML ou texte brut
 */
function setRichTextValue(id, content) {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.getAttribute('contenteditable') === 'true') {
        el.innerHTML = content || '';
        _updatePlaceholder(el);
    } else {
        el.value = content || '';
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES INTERNES (préfixe _ = privé)
// ─────────────────────────────────────────────────────────────────────────────

/** Retourne la barre d'outils du conteneur parent d'un élément RTE */
function _getToolbar(el) {
    const c = el.closest('.rte-container');
    return c ? c.querySelector('.rte-toolbar') : null;
}

/** Retourne l'éditeur du conteneur parent d'un bouton de la barre d'outils */
function _getEditor(btn) {
    const c = btn.closest('.rte-container');
    return c ? c.querySelector('.rte-editor') : null;
}

/**
 * Met à jour l'apparence active/inactive des boutons de la barre d'outils
 * selon l'état courant de la sélection.
 */
function _refreshToolbar(toolbar) {
    if (!toolbar) return;
    toolbar.querySelectorAll('.rte-btn[data-cmd]').forEach(btn => {
        try {
            btn.classList.toggle('rte-active', !!document.queryCommandState(btn.dataset.cmd));
        } catch (_) { /* commande non supportée */ }
    });
}

/**
 * Ajoute / retire la classe CSS qui affiche le placeholder.
 * Le placeholder est géré via CSS (::before) plutôt que par JS pour éviter
 * les conflits avec la saisie.
 */
function _updatePlaceholder(editor) {
    const empty = editor.innerHTML.trim() === ''
               || editor.innerHTML.trim() === '<br>'
               || editor.innerHTML.trim() === '<div><br></div>';
 
    // CORRECTION : `empty` (et non `isEmpty`)
    editor.classList.toggle('rte-is-empty', empty);
 
    // Nettoyer le <br> fantôme laissé par certains navigateurs
    if (empty && editor.innerHTML !== '') editor.innerHTML = '';
}
