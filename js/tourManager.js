/**
 * tourManager.js
 * Visite guidée de l'application — parcours explicatif (lecture seule).
 *
 * Remplace l'ancien double dispositif (`startGuidedTour` dans helpManager.js +
 * `enhancedGuidedTour` orphelin dans advancedTourFeatures.js). Module unique
 * dédié à la visite, conformément à la règle d'or CLAUDE.md §3.
 *
 * Principes :
 *   • Parcours COMPLET couvrant tout le flux (métadonnées → import → banques →
 *     question : type, énoncé, média, feedback combiné → sommaire → génération →
 *     menus GIFT/Moodle/Document + onglets de sortie → prévisualisation → contact
 *     → aide).
 *   • Tour purement EXPLICATIF : surbrillance + infobulle, sans saisie auto ni
 *     faux clics (pas d'effet de bord sur le travail de l'utilisateur).
 *   • Positionnement FIABILISÉ : coordonnées viewport (position: fixed), clamp
 *     sur X ET Y, bascule de côté près des bords, infobulle au-dessus de la pile
 *     de boutons fixes.
 *   • Certaines cibles sont DANS des menus repliés : la propriété `openMenu`
 *     déclenche l'ouverture automatique du menu concerné le temps de l'étape ;
 *     les menus sont refermés au changement d'étape et en fin de visite.
 *
 * Vanilla JS, portée globale via window (cf. CLAUDE.md §2). Aucun framework.
 */

APP_INIT.push(function initTour() {
    // Proposer discrètement la visite à la première venue (relocalisé ici depuis
    // helpManager.js : la « première visite » est une affaire de visite guidée).
    checkFirstVisit();
});

// ── Définition du parcours ──────────────────────────────────────────────────
//
// Chaque étape : { selector, title, content, position, openMenu? }
//   • selector : sélecteur CSS de la cible (string). Si plusieurs éléments
//     correspondent, le PREMIER visible est retenu. Étape ignorée si introuvable.
//   • position : côté préféré de l'infobulle ('top' | 'bottom' | 'left' | 'right').
//   • openMenu  : sélecteur du déclencheur de menu déroulant à ouvrir pour
//     l'étape (les items ciblés y deviennent visibles). Optionnel.
const TOUR_STEPS = [
    {
        selector: '.metadata-container',
        title: '1. Informations du document',
        content: 'Renseignez l\'auteur et le <strong>code article</strong>. Le code article sert à construire l\'identifiant de chaque question.',
        position: 'bottom'
    },
    {
        selector: '.import-container',
        title: '2. Importer un fichier existant',
        content: 'Vous pouvez repartir d\'un fichier existant : <strong>GIFT</strong> (.txt / .zip) ou <strong>Moodle XML</strong> (.xml). L\'import XML permet de retrouver le feedback combiné.',
        position: 'bottom'
    },
    {
        selector: '#summary-section',
        title: '3. Sommaire des questions',
        content: 'Dépliez le sommaire pour avoir une vue d\'ensemble, naviguer d\'un clic vers une question et la <strong>déplacer</strong> (flèches ↑/↓).',
        position: 'bottom'
    },
    {
        selector: '#add-bank-btn',
        title: '4. Banques de questions',
        content: 'Regroupez vos questions en <strong>banques</strong> (catégories Moodle). Chaque banque devient une section repliable ; l\'identifiant des questions en tient compte.',
        position: 'bottom'
    },
    {
        selector: '#add-question-btn',
        title: '5. Ajouter une question',
        content: 'Ajoutez autant de questions que nécessaire. Une première question est déjà présente ci-dessus pour démarrer.',
        position: 'top'
    },
    {
        selector: '.question-container .radio-group',
        title: '6. Type de question',
        content: 'Choisissez le type : <strong>QCM</strong>, <strong>QCU</strong>, <strong>Vrai/Faux</strong>, <strong>QRC</strong> (réponse courte) ou <strong>Numérique</strong>. Les champs de réponse s\'adaptent automatiquement.',
        position: 'bottom'
    },
    {
        selector: '.question-container .rte-toolbar',
        title: '7. Éditeur de texte enrichi',
        content: 'Mettez l\'énoncé en forme : <strong>gras</strong>, <em>italique</em>, souligné, exposant et indice. La typographie CNED (espaces insécables, guillemets) est appliquée à la génération.',
        position: 'bottom'
    },
    {
        selector: '.question-container .media-toggle-btn',
        title: '8. Ajouter un média',
        content: 'Joignez une <strong>image, un son ou une vidéo</strong> à la question. Le média est embarqué à l\'export (ZIP GIFT ou XML autonome).',
        position: 'left'
    },
    {
        selector: '.question-container .combined-feedback-block',
        title: '9. Feedback combiné',
        content: 'Pour les QCM/QCU, proposez un retour <strong>différencié</strong> (réponse correcte / partielle / incorrecte). À l\'export <strong>Moodle XML</strong> uniquement — impossible en GIFT.',
        position: 'top'
    },
    {
        selector: '#generate-btn',
        title: '10. Générer le code',
        content: 'Une fois vos questions prêtes, cliquez sur <strong>Générer</strong> : le code GIFT s\'affiche dans la zone de sortie ci-dessous.',
        position: 'bottom'
    },
    {
        selector: '.output-tabs',
        title: '11. Code GIFT / Moodle XML',
        content: 'La zone de sortie a deux onglets : <strong>Code GIFT</strong> et <strong>Code Moodle XML</strong>. Basculez de l\'un à l\'autre pour comparer les deux formats.',
        position: 'top'
    },
    {
        selector: '#gift-menu-toggle',
        title: '12. Menu GIFT',
        content: 'Récupérez le GIFT : <strong>copier</strong> le code, télécharger en <strong>.txt</strong>, ou en <strong>.zip</strong> (avec les médias).',
        position: 'top',
        openMenu: '#gift-menu-toggle'
    },
    {
        selector: '.btn-menu-xml',
        title: '13. Menu Moodle XML',
        content: 'Format <strong>Moodle XML</strong> : visualiser le code, ou télécharger le <strong>.xml</strong> autonome (feedback combiné et médias inclus).',
        position: 'top',
        openMenu: '.btn-menu-xml'
    },
    {
        selector: '.btn-menu-doc',
        title: '14. Menu Document lisible',
        content: 'Documents pour la relecture humaine : <strong>PDF</strong> (impression), <strong>RTF</strong> (éditable Word/LibreOffice) et <strong>HTML</strong> autonome.',
        position: 'top',
        openMenu: '.btn-menu-doc'
    },
    {
        selector: '#preview-toggle-btn',
        title: '15. Prévisualiser',
        content: 'Basculez en <strong>prévisualisation</strong> pour voir vos questions en lecture seule, bonnes réponses mises en évidence, sans les champs d\'édition.',
        position: 'left'
    },
    {
        selector: '#bug-report-btn',
        title: '16. Contact',
        content: 'Une question, un souci ? Le bouton <strong>Contact</strong> ouvre un formulaire qui prépare un e-mail (aucune donnée n\'est transmise à un tiers).',
        position: 'left'
    },
    {
        selector: '#help-toggle-btn',
        title: '17. Aide',
        content: 'L\'<strong>aide complète</strong> reste disponible à tout moment via ce bouton. Bonne création ! L\'outil fonctionne aussi <strong>sans connexion</strong>.',
        position: 'left'
    }
];

// ── Lancement de la visite ──────────────────────────────────────────────────

/**
 * Démarre la visite guidée : crée les éléments, affiche la première étape.
 * @returns {void}
 */
function startGuidedTour() {
    let currentStep = 0;
    let overlay, tooltip, highlight;
    const VIEWPORT_PAD = 12;   // marge de sécurité avec les bords du viewport
    const GAP = 16;            // espace entre la cible et l'infobulle

    // ── Création / suppression des éléments ────────────────────────────────
    function createElements() {
        overlay = document.createElement('div');
        overlay.className = 'tour-overlay';
        document.body.appendChild(overlay);

        highlight = document.createElement('div');
        highlight.className = 'tour-target-highlight';
        document.body.appendChild(highlight);

        tooltip = document.createElement('div');
        tooltip.className = 'tour-tooltip';
        document.body.appendChild(tooltip);

        document.body.classList.add('tour-active');
    }

    function removeElements() {
        if (overlay) overlay.remove();
        if (tooltip) tooltip.remove();
        if (highlight) highlight.remove();
        document.body.classList.remove('tour-active');
        closeMenus();
    }

    // ── Pilotage des menus déroulants ──────────────────────────────────────
    function closeMenus() {
        if (typeof window.closeAllDropdowns === 'function') window.closeAllDropdowns();
    }

    /**
     * Ouvre le menu déroulant associé à l'étape (le cas échéant) pour rendre la
     * cible visible.
     * @param {Object} step
     */
    function openMenuForStep(step) {
        closeMenus();
        if (!step.openMenu) return;
        const toggle = document.querySelector(step.openMenu);
        const dropdown = toggle ? toggle.closest('.dropdown[data-dropdown]') : null;
        if (dropdown && typeof window.openDropdown === 'function') {
            window.openDropdown(dropdown);
        }
    }

    // ── Sélection de la cible ──────────────────────────────────────────────
    /**
     * Renvoie le premier élément visible correspondant au sélecteur, ou null.
     * @param {string} selector
     * @returns {HTMLElement|null}
     */
    function findTarget(selector) {
        const candidates = document.querySelectorAll(selector);
        for (const el of candidates) {
            const rect = el.getBoundingClientRect();
            const visible = rect.width > 0 && rect.height > 0 &&
                getComputedStyle(el).visibility !== 'hidden';
            if (visible) return el;
        }
        return null;
    }

    // ── Affichage d'une étape ──────────────────────────────────────────────
    function showStep(index) {
        if (index < 0) index = 0;
        if (index >= TOUR_STEPS.length) {
            removeElements();
            showCompleteMessage();
            return;
        }
        currentStep = index;
        const step = TOUR_STEPS[index];

        // Ouvrir le menu requis AVANT de mesurer la cible (sinon elle est cachée).
        openMenuForStep(step);

        const target = findTarget(step.selector);
        if (!target) {
            // Cible absente (fonctionnalité non encore affichée) → étape suivante.
            showStep(index + 1);
            return;
        }

        // Contenu rendu d'abord (pour mesurer l'infobulle), puis défilement
        // instantané et positionnement précis.
        renderTooltip(step);
        scrollIntoViewIfNeeded(target, () => position(target, step));
    }

    /**
     * Amène la cible dans la zone visible si nécessaire, PUIS exécute le rappel.
     * Le défilement est INSTANTANÉ (`behavior: 'auto'`) : `getBoundingClientRect()`
     * est alors fiable dès la frame suivante. Un défilement « smooth » faussait la
     * mesure et décalait l'encadré (retour utilisateur). Mesure via double rAF,
     * après application du défilement et de la mise en page.
     * @param {HTMLElement} target
     * @param {Function} done
     */
    function scrollIntoViewIfNeeded(target, done) {
        const rect = target.getBoundingClientRect();
        const margin = 90;
        const needsScroll = rect.top < margin || rect.bottom > window.innerHeight - margin;
        if (needsScroll) {
            target.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
        requestAnimationFrame(() => requestAnimationFrame(done));
    }

    /**
     * Rend le CONTENU de l'infobulle pour une étape. Séparé du positionnement
     * pour ne PAS reconstruire le DOM (ni recâbler les boutons) à chaque
     * défilement / redimensionnement.
     * @param {Object} step
     */
    function renderTooltip(step) {
        tooltip.innerHTML = `
            <h3>${step.title}</h3>
            <p>${step.content}</p>
            <div class="tour-nav">
                <span>${currentStep + 1}/${TOUR_STEPS.length}</span>
                <div class="tour-nav-buttons">
                    <button type="button" class="tour-finish-early">Quitter</button>
                    ${currentStep > 0 ? '<button type="button" class="tour-prev">Précédent</button>' : ''}
                    ${currentStep < TOUR_STEPS.length - 1
                        ? '<button type="button" class="tour-next">Suivant</button>'
                        : '<button type="button" class="tour-finish">Terminer</button>'}
                </div>
            </div>`;
        wireButtons();
    }

    /**
     * Positionne la surbrillance et l'infobulle autour de la cible : clamp sur
     * les DEUX axes et bascule de côté si l'infobulle déborde. Rappelable à
     * volonté (défilement, redimensionnement) sans reconstruire le contenu.
     * @param {HTMLElement} target
     * @param {Object} step
     */
    function position(target, step) {
        const rect = target.getBoundingClientRect();
        const margin = 6;

        // Surbrillance (coordonnées viewport — position: fixed).
        highlight.style.top = `${rect.top - margin}px`;
        highlight.style.left = `${rect.left - margin}px`;
        highlight.style.width = `${rect.width + margin * 2}px`;
        highlight.style.height = `${rect.height + margin * 2}px`;

        const tipW = tooltip.offsetWidth;
        const tipH = tooltip.offsetHeight;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Côté qui laisse assez de place, sinon bascule.
        const side = chooseSide(rect, step.position, tipW, tipH, vw, vh);
        let { x, y } = anchorFor(side, rect, tipW, tipH);

        // Clamp final sur les deux axes pour ne jamais sortir du viewport.
        x = clamp(x, VIEWPORT_PAD, vw - tipW - VIEWPORT_PAD);
        y = clamp(y, VIEWPORT_PAD, vh - tipH - VIEWPORT_PAD);

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        tooltip.setAttribute('data-position', side);
    }

    /**
     * Détermine le côté final de l'infobulle : conserve le côté préféré s'il y a
     * la place, sinon bascule vers le côté opposé (ou vertical ↔ horizontal).
     */
    function chooseSide(rect, preferred, tipW, tipH, vw, vh) {
        const space = {
            top: rect.top,
            bottom: vh - rect.bottom,
            left: rect.left,
            right: vw - rect.right
        };
        const fits = {
            top: space.top >= tipH + GAP,
            bottom: space.bottom >= tipH + GAP,
            left: space.left >= tipW + GAP,
            right: space.right >= tipW + GAP
        };
        if (fits[preferred]) return preferred;

        // Ordre de repli : opposé du préféré, puis les autres par espace décroissant.
        const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
        const order = [opposite[preferred], 'bottom', 'top', 'right', 'left'];
        for (const side of order) {
            if (fits[side]) return side;
        }
        // Aucun côté ne convient pleinement : prendre celui qui a le plus d'espace.
        return Object.keys(space).reduce((a, b) => (space[a] >= space[b] ? a : b));
    }

    /**
     * Coordonnées (coin haut-gauche) de l'infobulle pour un côté donné.
     */
    function anchorFor(side, rect, tipW, tipH) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        switch (side) {
            case 'top':    return { x: cx - tipW / 2, y: rect.top - tipH - GAP };
            case 'bottom': return { x: cx - tipW / 2, y: rect.bottom + GAP };
            case 'left':   return { x: rect.left - tipW - GAP, y: cy - tipH / 2 };
            case 'right':  return { x: rect.right + GAP, y: cy - tipH / 2 };
            default:       return { x: cx - tipW / 2, y: rect.bottom + GAP };
        }
    }

    function clamp(value, min, max) {
        if (max < min) return min; // infobulle plus large que le viewport
        return Math.max(min, Math.min(max, value));
    }

    // ── Câblage des boutons de navigation ──────────────────────────────────
    function wireButtons() {
        const prev = tooltip.querySelector('.tour-prev');
        if (prev) prev.addEventListener('click', (e) => { e.stopPropagation(); showStep(currentStep - 1); });

        const next = tooltip.querySelector('.tour-next');
        if (next) next.addEventListener('click', (e) => { e.stopPropagation(); showStep(currentStep + 1); });

        const finish = tooltip.querySelector('.tour-finish');
        if (finish) finish.addEventListener('click', (e) => { e.stopPropagation(); removeElements(); showCompleteMessage(); });

        const quit = tooltip.querySelector('.tour-finish-early');
        if (quit) quit.addEventListener('click', (e) => { e.stopPropagation(); removeElements(); });

        tooltip.addEventListener('click', (e) => e.stopPropagation());
    }

    // ── Message de fin ─────────────────────────────────────────────────────
    function showCompleteMessage() {
        const message = document.createElement('div');
        message.className = 'tour-complete';
        message.innerHTML = `
            <div class="tour-complete-content">
                <h3>Visite terminée !</h3>
                <p>Vous connaissez maintenant les principales fonctionnalités de l'outil.</p>
                <p>L'aide reste disponible via le bouton <span class="help-btn-mini">? Aide</span>, et l'outil fonctionne <strong>sans connexion</strong>.</p>
                <button type="button" class="control-btn close-tour-btn">Commencer à utiliser l'outil</button>
            </div>`;
        document.body.appendChild(message);
        message.querySelector('.close-tour-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            message.remove();
        });
        message.addEventListener('click', (e) => e.stopPropagation());
    }

    // ── Démarrage ──────────────────────────────────────────────────────────
    // Robustesse : la visite décrit l'interface d'ÉDITION. Si la prévisualisation
    // est active, on y met fin d'abord — sinon de nombreuses cibles sont masquées
    // ou transformées et le parcours « fonctionne moins bien » (retour utilisateur).
    if (typeof window.isPreviewModeActive === 'function' && window.isPreviewModeActive() &&
        typeof window.togglePreviewMode === 'function') {
        window.togglePreviewMode();
    }

    createElements();

    // Repositionner l'étape courante au défilement / redimensionnement, sans
    // reconstruire le contenu (throttle via rAF pour rester fluide).
    let repositionScheduled = false;
    const reposition = () => {
        const step = TOUR_STEPS[currentStep];
        if (!step || !tooltip) return;
        const target = findTarget(step.selector);
        if (target) position(target, step);
    };
    const scheduleReposition = () => {
        if (repositionScheduled) return;
        repositionScheduled = true;
        requestAnimationFrame(() => { repositionScheduled = false; reposition(); });
    };
    window.addEventListener('resize', scheduleReposition);
    window.addEventListener('scroll', scheduleReposition, { passive: true });
    // Nettoyage des écouteurs à la suppression des éléments.
    const originalRemove = removeElements;
    removeElements = function () {
        window.removeEventListener('resize', scheduleReposition);
        window.removeEventListener('scroll', scheduleReposition);
        originalRemove();
    };

    showStep(0);
}

// ── Proposition à la première visite ────────────────────────────────────────

/**
 * Propose discrètement la visite guidée lors de la première venue (notification
 * non bloquante). L'état est mémorisé dans localStorage.
 * @returns {void}
 */
function checkFirstVisit() {
    const hasVisitedBefore = localStorage.getItem('gift_generator_visited');
    if (hasVisitedBefore) return;

    localStorage.setItem('gift_generator_visited', 'true');

    const tourNotification = document.createElement('div');
    tourNotification.className = 'tour-notification';
    tourNotification.innerHTML = `
        <div class="notification-content">
            <p>Première visite ? Une <strong>visite guidée</strong> vous présente toutes les fonctionnalités de l'outil.</p>
            <button type="button" id="start-tour-from-notification" class="control-btn">Démarrer la visite</button>
            <button type="button" class="close-notification" aria-label="Fermer">×</button>
        </div>`;
    document.body.appendChild(tourNotification);

    tourNotification.querySelector('#start-tour-from-notification')
        .addEventListener('click', function () {
            tourNotification.remove();
            startGuidedTour();
        });

    const closeBtn = tourNotification.querySelector('.close-notification');
    closeBtn.addEventListener('click', function () {
        tourNotification.classList.add('notification-hidden');
        setTimeout(() => tourNotification.remove(), 300);
    });

    // Masquer automatiquement après un délai.
    setTimeout(() => {
        if (!tourNotification.isConnected) return;
        tourNotification.classList.add('notification-hidden');
        setTimeout(() => tourNotification.remove(), 300);
    }, 15000);
}

// Exposition globale (bouton du panneau d'aide, notification première visite).
window.startGuidedTour = startGuidedTour;
window.checkFirstVisit = checkFirstVisit;
