// Variables globales partagées entre les fichiers
const APP_VERSION = '0.20.0';
let questionCounter = 0;

// ── Orchestrateur d'initialisation centralisé ([A2]) ────────────────────────
// Chaque module empile sa fonction d'init via APP_INIT.push(...) plutôt que
// d'écouter son propre DOMContentLoaded. core.js exécute la file ci-dessous,
// dans l'ordre de chargement des <script>, après son propre setup. Un module
// non chargé (ex. en contexte de test) n'enregistre simplement rien — d'où
// l'absence de vérifications défensives d'ordre.
window.APP_INIT = window.APP_INIT || [];

document.addEventListener('DOMContentLoaded', function() {
    // Injection de la version dans le pied de page
    const versionEl = document.getElementById('app-version');
    if (versionEl) versionEl.textContent = 'Version ' + APP_VERSION;
    // Éléments DOM principaux
    const questionsContainer = document.getElementById('questions-container');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    const giftOutput = document.getElementById('gift-output');
    
    // Champs d'information pour les métadonnées
    const authorLastname = document.getElementById('author-lastname');
    const authorFirstname = document.getElementById('author-firstname');
    const courseCode = document.getElementById('course-code');
    
    // Exposer les éléments importants en tant que variables globales
    window.questionsContainer = questionsContainer;
    window.questionCounter = questionCounter;
    window.giftOutput = giftOutput;
    window.authorLastname = authorLastname;
    window.authorFirstname = authorFirstname;
    window.courseCode = courseCode;
    
    // Initialiser les écouteurs d'événements principaux
    addQuestionBtn.addEventListener('click', function() {
        // Utilise la fonction de questionManager.js
        addNewQuestion();
    });
    
    generateBtn.addEventListener('click', function() {
        // Utilise la fonction de giftGenerator.js
        generateGIFTCode();
    });
    
    copyBtn.addEventListener('click', function() {
        // [M2] API Clipboard moderne, avec repli sur execCommand('copy') si
        // l'API est indisponible (ex. contexte non sécurisé / file://).
        const success = () => notify.success('Code GIFT copié dans le presse-papier !');
        const fallback = () => { giftOutput.select(); document.execCommand('copy'); success(); };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(giftOutput.value).then(success).catch(fallback);
        } else {
            fallback();
        }
    });
    
    clearBtn.addEventListener('click', function() {
        confirmDialog({
            title: 'Tout effacer',
            message: 'Êtes-vous sûr de vouloir effacer toutes les questions ?',
            confirmLabel: 'Tout effacer',
            cancelLabel: 'Annuler',
            danger: true
        }).then(function (confirmed) {
            if (!confirmed) return;
            questionsContainer.innerHTML = '';
            giftOutput.value = '';
            window.questionCounter = 0;

            // Effacer également les champs d'auteur et code matière
            authorLastname.value = '';
            authorFirstname.value = '';
            courseCode.value = '';
        });
    });
    
    // Ajouter une première question par défaut
    addNewQuestion();

    // ── Lancer l'initialisation des modules enregistrés ([A2]) ──────────────
    // Exécutés dans l'ordre de chargement des <script>. Une erreur dans un
    // module n'interrompt pas les suivants (isolée + journalisée).
    window.APP_INIT.forEach(function (initFn) {
        try {
            initFn();
        } catch (err) {
            console.error('[APP_INIT] Échec de l\'initialisation d\'un module :', err);
        }
    });
});