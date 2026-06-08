/**
 * actionMenu.js
 * Deux composants d'interface introduits par le chantier UI/UX n°10 :
 *
 *   1. Menus déroulants de la barre d'action — la barre du bas regroupait
 *      8 boutons sur une ligne. Ils sont désormais classés par format dans des
 *      menus « GIFT ▾ », « Moodle ▾ », « Document ▾ ». Les boutons d'action
 *      conservent leurs identifiants : le câblage existant (core.js,
 *      downloadManager.js, exportMoodleXml.js, exportPrintable.js) est intact ;
 *      ce module ne gère QUE l'ouverture/fermeture des menus.
 *
 *   2. Onglets de sortie « Code GIFT » / « Code Moodle XML » sur une zone de
 *      sortie unique : on bascule l'affichage entre les deux <textarea>.
 *
 * Vanilla JS, portée globale via window (cf. CLAUDE.md §2). Aucun framework.
 */

APP_INIT.push(function initActionMenu() {
    initDropdownMenus();
    initOutputTabs();
});

// ── 1. Menus déroulants ───────────────────────────────────────────────────────

/**
 * Initialise tous les menus déroulants (`.dropdown[data-dropdown]`) : bascule au
 * clic sur le déclencheur, fermeture au clic extérieur, à la touche Échap, et
 * après le choix d'un élément du menu.
 */
function initDropdownMenus() {
    const dropdowns = document.querySelectorAll('.dropdown[data-dropdown]');
    if (!dropdowns.length) return;

    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        if (!toggle || !menu) return;

        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            const willOpen = !dropdown.classList.contains('open');
            closeAllDropdowns();
            if (willOpen) openDropdown(dropdown);
        });

        // Choisir un élément exécute son action (câblée ailleurs par id) PUIS
        // referme le menu.
        menu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', function () {
                closeAllDropdowns();
            });
        });
    });

    // Clic en dehors d'un menu ouvert → fermeture.
    document.addEventListener('click', function () {
        closeAllDropdowns();
    });

    // Échap → fermeture.
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeAllDropdowns();
    });
}

/**
 * Ouvre un menu déroulant.
 * @param {HTMLElement} dropdown
 */
function openDropdown(dropdown) {
    dropdown.classList.add('open');
    const toggle = dropdown.querySelector('.dropdown-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
}

/**
 * Ferme tous les menus déroulants ouverts.
 */
function closeAllDropdowns() {
    document.querySelectorAll('.dropdown[data-dropdown].open').forEach(dropdown => {
        dropdown.classList.remove('open');
        const toggle = dropdown.querySelector('.dropdown-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
}

// ── 2. Onglets de sortie GIFT / Moodle XML ────────────────────────────────────

/**
 * Initialise les onglets de la zone de sortie et câble :
 *   • le clic sur chaque onglet → bascule de l'affichage ;
 *   • le bouton « Générer » → bascule sur l'onglet GIFT (le code y est écrit) ;
 *   • le bouton « Générer & visualiser le code » Moodle → génère le XML, l'affiche
 *     et bascule sur l'onglet XML.
 */
function initOutputTabs() {
    const tabs = document.querySelectorAll('.output-tab[data-output-tab]');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            switchOutputTab(this.getAttribute('data-output-tab'));
        });
    });

    // Bouton « Générer » : produit les DEUX formats d'un coup (retour
    // utilisateur — il ne générait que le GIFT). Le GIFT est écrit par le
    // gestionnaire de core.js (generateGIFTCode) ; on remplit ici aussi la zone
    // Moodle XML pour que l'onglet correspondant soit prêt, puis on affiche
    // l'onglet GIFT par défaut.
    const generateBtn = document.getElementById('generate-btn');
    const xmlOutputForGen = document.getElementById('xml-output');
    if (generateBtn) {
        generateBtn.addEventListener('click', function () {
            if (xmlOutputForGen && typeof generateMoodleXmlCode === 'function' &&
                document.querySelectorAll('.question-container').length > 0) {
                // Sans embarquement base64 (lisibilité de la zone ; le
                // téléchargement .xml embarque les médias, lui).
                const xml = generateMoodleXmlCode();
                if (xml && xml.trim()) xmlOutputForGen.value = xml;
            }
            switchOutputTab('gift');
        });
    }

    // Générer & visualiser le code Moodle XML dans la zone de sortie.
    const generateXmlBtn = document.getElementById('generate-xml-btn');
    const xmlOutput = document.getElementById('xml-output');
    if (generateXmlBtn && xmlOutput && typeof generateMoodleXmlCode === 'function') {
        generateXmlBtn.addEventListener('click', function () {
            // Affichage lisible : on ne ré-encode pas les médias en base64 ici
            // (le téléchargement .xml les embarque ; un blob base64 rendrait le
            // code illisible dans la zone de sortie).
            const xml = generateMoodleXmlCode();
            if (!xml || !xml.trim()) return; // generateMoodleXmlCode a déjà notifié
            xmlOutput.value = xml;
            switchOutputTab('xml');
        });
    }
}

/**
 * Bascule la zone de sortie sur l'onglet demandé.
 * @param {'gift'|'xml'} name
 */
function switchOutputTab(name) {
    const giftOutput = document.getElementById('gift-output');
    const xmlOutput = document.getElementById('xml-output');
    const label = document.getElementById('output-label');
    if (!giftOutput || !xmlOutput) return;

    const showXml = (name === 'xml');

    giftOutput.classList.toggle('hidden', showXml);
    xmlOutput.classList.toggle('hidden', !showXml);

    if (label) {
        label.textContent = showXml ? 'Code Moodle XML généré :' : 'Code GIFT généré :';
        label.setAttribute('for', showXml ? 'xml-output' : 'gift-output');
    }

    document.querySelectorAll('.output-tab[data-output-tab]').forEach(tab => {
        const active = tab.getAttribute('data-output-tab') === name;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
}

// Exposition globale (utilisée par d'autres modules / le clavier / la visite guidée).
window.switchOutputTab = switchOutputTab;
window.closeAllDropdowns = closeAllDropdowns;
window.openDropdown = openDropdown;
