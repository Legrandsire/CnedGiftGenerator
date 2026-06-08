// ── Boîte de dialogue de confirmation modale, non bloquante ─────────────────
//
// Remplace window.confirm() (bloquant) par une fenêtre modale aux couleurs CNED
// renvoyant une Promesse résolue à true (confirmé) ou false (annulé). Pendant
// universel des toasts de notify.js pour les actions qui exigent une réponse.
//
// Usage :
//   const ok = await confirmDialog({ message: '…', danger: true });
//   confirmDialog('Texte simple ?').then(ok => { … });
// ───────────────────────────────────────────────────────────────────────────

(function () {
    'use strict';

    let activeResolve = null; // résolveur de la promesse en cours
    let overlayEl = null;     // overlay actuellement affiché (un seul à la fois)

    /** Ferme la modale en cours et résout sa promesse avec `result`. */
    function close(result) {
        if (!overlayEl) return;
        document.removeEventListener('keydown', onKeydown, true);

        const el = overlayEl;
        const resolve = activeResolve;
        overlayEl = null;
        activeResolve = null;

        el.classList.remove('confirm-visible');
        // Filet : suppression même si aucune transition CSS n'est jouée.
        setTimeout(() => { if (el.parentNode) el.remove(); }, 250);

        if (resolve) resolve(result);
    }

    /** Échap = annuler, Entrée = confirmer. */
    function onKeydown(event) {
        if (event.key === 'Escape') { event.preventDefault(); close(false); }
        else if (event.key === 'Enter') { event.preventDefault(); close(true); }
    }

    /**
     * Affiche une confirmation modale non bloquante.
     * @param {Object|string} options - Message seul, ou objet de configuration.
     * @param {string}  options.message        - Question posée (obligatoire).
     * @param {string}  [options.title]         - Titre de la fenêtre.
     * @param {string}  [options.confirmLabel]  - Libellé du bouton de confirmation.
     * @param {string}  [options.cancelLabel]   - Libellé du bouton d'annulation.
     * @param {boolean} [options.danger]        - true → bouton de confirmation rouge.
     * @returns {Promise<boolean>} true si confirmé, false sinon.
     */
    function confirmDialog(options) {
        const opts = (typeof options === 'string') ? { message: options } : (options || {});
        const message      = opts.message || '';
        const title        = opts.title || 'Confirmation';
        const confirmLabel = opts.confirmLabel || 'Confirmer';
        const cancelLabel  = opts.cancelLabel || 'Annuler';
        const danger       = !!opts.danger;

        // Une confirmation déjà ouverte est annulée avant d'en ouvrir une autre.
        if (overlayEl) close(false);

        return new Promise(function (resolve) {
            activeResolve = resolve;

            overlayEl = document.createElement('div');
            overlayEl.className = 'confirm-overlay';
            overlayEl.setAttribute('role', 'dialog');
            overlayEl.setAttribute('aria-modal', 'true');

            const box = document.createElement('div');
            box.className = 'confirm-box';

            const titleEl = document.createElement('h3');
            titleEl.className = 'confirm-title';
            titleEl.textContent = title; // textContent → injection sûre

            const msgEl = document.createElement('p');
            msgEl.className = 'confirm-message';
            msgEl.textContent = message; // textContent → injection sûre

            const actions = document.createElement('div');
            actions.className = 'confirm-actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'confirm-btn confirm-btn-cancel';
            cancelBtn.textContent = cancelLabel;
            cancelBtn.addEventListener('click', () => close(false));

            const okBtn = document.createElement('button');
            okBtn.type = 'button';
            okBtn.className = 'confirm-btn ' + (danger ? 'confirm-btn-danger' : 'confirm-btn-confirm');
            okBtn.textContent = confirmLabel;
            okBtn.addEventListener('click', () => close(true));

            actions.append(cancelBtn, okBtn);
            box.append(titleEl, msgEl, actions);
            overlayEl.appendChild(box);

            // Clic sur le fond (hors de la boîte) = annulation.
            overlayEl.addEventListener('click', function (event) {
                if (event.target === overlayEl) close(false);
            });

            document.body.appendChild(overlayEl);
            document.addEventListener('keydown', onKeydown, true);

            requestAnimationFrame(() => {
                overlayEl.classList.add('confirm-visible');
                okBtn.focus();
            });
        });
    }

    window.confirmDialog = confirmDialog;
})();
