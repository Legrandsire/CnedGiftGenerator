// ── Notifications « toast » non bloquantes ([U1]) ───────────────────────────
//
// Remplace les alert() bloquants par des notifications discrètes en coin
// d'écran, à disparition automatique. API : notify.success / info / warning /
// error. Les confirmations (confirm) restent inchangées (réponse requise).
// ───────────────────────────────────────────────────────────────────────────

(function () {
    'use strict';

    /** Crée (ou récupère) le conteneur des toasts. */
    function ensureContainer() {
        let container = document.getElementById('notify-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notify-container';
            container.className = 'notify-container';
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }
        return container;
    }

    /** Retire un toast (avec transition de sortie). */
    function dismiss(toast) {
        toast.classList.remove('notify-visible');
        // Filet : suppression même si aucune transition CSS n'est jouée.
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
    }

    /**
     * Affiche un toast.
     * @param {string} message  - Texte (inséré via textContent, donc sûr).
     * @param {string} type     - 'success' | 'info' | 'warning' | 'error'.
     * @param {number} [duration] - Durée d'affichage en ms.
     */
    function show(message, type, duration) {
        const container = ensureContainer();

        const toast = document.createElement('div');
        toast.className = `notify notify-${type}`;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.textContent = message;

        container.appendChild(toast);
        // Forcer un reflow puis déclencher l'animation d'entrée.
        requestAnimationFrame(() => toast.classList.add('notify-visible'));

        const ttl = duration || (type === 'error' ? 6000 : 3500);
        const timer = setTimeout(() => dismiss(toast), ttl);

        // Clic = fermeture immédiate.
        toast.addEventListener('click', () => { clearTimeout(timer); dismiss(toast); });
    }

    window.notify = {
        success: (message, duration) => show(message, 'success', duration),
        info:    (message, duration) => show(message, 'info', duration),
        warning: (message, duration) => show(message, 'warning', duration),
        error:   (message, duration) => show(message, 'error', duration)
    };
})();
