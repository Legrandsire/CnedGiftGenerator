/**
 * summaryManager.js
 * Gestion du résumé des questions du générateur de code GIFT
 * 
 * Ce fichier permet de créer et gérer une section de résumé qui affiche
 * un aperçu condensé de toutes les questions du quiz avec leur numéro,
 * identifiant, type et texte.
 */

APP_INIT.push(function initSummary() {
    // Créer la section de résumé dans le DOM
    createSummarySection();
    
    // Initialiser les écouteurs d'événements pour le résumé
    initSummaryEvents();
    
    // Observer les changements dans le conteneur de questions
    observeQuestionsChanges();
    
    // Ajouter les boutons de navigation persistants
    addNavigationButtons();
    
    // Initialiser les fonctionnalités de navigation
    initNavigationFeatures();
});

/**
 * Vérifie que la section de résumé est présente dans le DOM.
 * Le HTML est défini statiquement dans index.html.
 */
function createSummarySection() {
    const summarySection = document.getElementById('summary-section');
    if (!summarySection) {
        console.error('[summaryManager] Erreur : #summary-section est introuvable dans index.html.');
    }
}

/**
 * Initialise les écouteurs d'événements pour la section de résumé
 */
function initSummaryEvents() {
    const toggleBtn = document.getElementById('toggle-summary-btn');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', function () {
        const summarySection = document.getElementById('summary-section');
        const summaryContent = document.getElementById('summary-content');
        const toggleIcon     = this.querySelector('.summary-toggle-icon');
        const toggleLabel    = this.querySelector('.summary-toggle-label');

        if (!summarySection || !summaryContent || !toggleIcon || !toggleLabel) return;

        if (summarySection.classList.contains('collapsed')) {
            // ── Ouvrir ──
            summarySection.classList.remove('collapsed');
            summaryContent.classList.remove('hidden');
            toggleIcon.textContent  = '▲';
            toggleLabel.textContent = 'Masquer le résumé';
            updateQuestionsSummary();
        } else {
            // ── Fermer ──
            summarySection.classList.add('collapsed');
            summaryContent.classList.add('hidden');
            toggleIcon.textContent  = '▼';
            toggleLabel.textContent = 'Afficher le résumé';
        }
    });

    // Délégation d'événements pour les boutons ⮞ dans le tableau
    document.addEventListener('click', function (event) {
        const gotoButton = event.target.closest('.goto-question-btn');
        if (gotoButton) {
            const questionId = gotoButton.getAttribute('data-qid');
            if (questionId) {
                scrollToQuestion(questionId);
                event.preventDefault();
                event.stopPropagation();
            }
        }
    });

    // Délégation d'événements pour les flèches ▲/▼ de déplacement du sommaire.
    document.addEventListener('click', function (event) {
        const moveButton = event.target.closest('.summary-move-btn');
        if (!moveButton || moveButton.disabled) return;

        const questionId = moveButton.getAttribute('data-qid');
        if (!questionId || typeof window.moveQuestion !== 'function') return;

        const direction = moveButton.classList.contains('summary-move-up-btn') ? 'up' : 'down';
        window.moveQuestion(questionId, direction);
        // moveQuestion rappelle updateQuestionsSummary : la table est reconstruite.
        event.preventDefault();
        event.stopPropagation();
    });

    // Repli/dépli d'un groupe (banque ou « Sans banque ») en cliquant son en-tête.
    document.addEventListener('click', function (event) {
        const groupHeader = event.target.closest('.summary-group-row');
        if (!groupHeader) return;
        const key = groupHeader.dataset.groupKey;
        if (!key) return;
        if (summaryCollapsedGroups.has(key)) {
            summaryCollapsedGroups.delete(key);
        } else {
            summaryCollapsedGroups.add(key);
        }
        updateQuestionsSummary(); // reconstruit en appliquant le nouvel état
        event.preventDefault();
        event.stopPropagation();
    });
}

// État de repli des groupes (banques) dans le sommaire, par bankId stable
// (+ « none » pour la zone sans-banque). Persiste entre les reconstructions de
// la table — celle-ci est recréée à chaque mutation. cf. categoryManager.js.
const summaryCollapsedGroups = new Set();

/**
 * Met à jour le résumé des questions
 */
function updateQuestionsSummary() {
    const summaryTableBody   = document.getElementById('summary-table-body');
    const questionsContainer = document.getElementById('questions-container');

    if (!summaryTableBody || !questionsContainer) return;

    summaryTableBody.innerHTML = '';

    const summaryContent = document.getElementById('summary-content');
    if (summaryContent && summaryContent.classList.contains('hidden')) return;

    const questions = questionsContainer.querySelectorAll('.question-container');

    if (questions.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" class="summary-empty-message">
                Aucune question n'a été ajoutée.
                <button id="add-first-question-btn" class="control-btn small-btn">
                    Ajouter une question
                </button>
            </td>
        `;
        summaryTableBody.appendChild(emptyRow);

        const addFirstQuestionBtn = document.getElementById('add-first-question-btn');
        if (addFirstQuestionBtn) {
            addFirstQuestionBtn.addEventListener('click', function () {
                const addQuestionBtn = document.getElementById('add-question-btn');
                if (addQuestionBtn) addQuestionBtn.click();
            });
        }
        return;
    }

    // ── Pré-calcul du regroupement par banque ────────────────────────────────
    // Les questions sont déjà dans l'ordre du document (zone « Sans banque »
    // d'abord, puis chaque banque). On n'affiche les en-têtes de groupe que si au
    // moins une banque existe ; sinon la table reste plate (rétrocompatible).
    const questionList = Array.from(questions);
    const hasBanks = (typeof getBankSections === 'function') && getBankSections().length > 0;
    const infos = questionList.map(q =>
        (typeof getQuestionBankInfo === 'function')
            ? getQuestionBankInfo(q)
            : { bankNum: null, bankName: null, bankId: null, groupSeq: 1 }
    );
    const groupSizes = {};
    infos.forEach(info => {
        const key = info.bankId || 'none';
        groupSizes[key] = (groupSizes[key] || 0) + 1;
    });

    let prevKey = null;

    questionList.forEach((question, index) => {
        if (!question) return;

        const questionId = question.dataset.id;
        if (!questionId) return;

        const info = infos[index];
        const groupKey = info.bankId || 'none';

        // ── En-tête de groupe (banque ou « Sans banque »), repliable ──────────
        if (hasBanks && groupKey !== prevKey) {
            prevKey = groupKey;
            summaryTableBody.appendChild(
                buildSummaryGroupHeader(info, groupSizes[groupKey])
            );
        }

        const collapsed = hasBanks && summaryCollapsedGroups.has(groupKey);

        const questionIdField = document.getElementById(IDS.questionId(questionId));
        const questionIdValue = questionIdField ? questionIdField.value : '';

        const questionTypeRadio = question.querySelector(
            `input[name^="question-type-"]:checked`
        );

        // ── CORRECTION BUG 1 : la variable s'appelle questionType (pas questionTypeLabel) ──
        let questionType = 'QCM';
        if (questionTypeRadio) {
            switch (questionTypeRadio.value) {
                case 'mc':  questionType = 'QCM';       break;
                case 'sc':  questionType = 'QCU';       break;
                case 'tf':  questionType = 'Vrai/Faux'; break;
                case 'sa':  questionType = 'QRC';       break;
                case 'num': questionType = 'Numérique'; break;
            }
        }

        const rawText    = getRichTextValue(IDS.questionText(questionId));
        const plainText  = rawText.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        const questionText = truncateText(plainText, 80);

        // ── CORRECTION BUG 2 : sécuriser l'appel à getMediaIcon ──
        const mediaFile     = window.questionMediaFiles && window.questionMediaFiles[questionId];
        const mediaIconHtml = (mediaFile && typeof window.getMediaIcon === 'function')
            ? `<span class="summary-media-icon" title="Contient un média : ${mediaFile.name}">${window.getMediaIcon(mediaFile.name)}</span>`
            : '';

        const row = document.createElement('tr');
        row.className  = 'summary-row';
        row.dataset.qid = questionId;
        row.dataset.groupKey = groupKey;
        if (collapsed) row.classList.add('summary-row-hidden');

        // [S2] Construction en DOM-API : l'identifiant et le texte (saisis par
        // l'utilisateur) sont injectés via textContent et ne peuvent donc pas
        // exécuter de HTML/JS. Les fragments de confiance (icône média, bouton)
        // restent en HTML.
        const numTd = document.createElement('td');
        numTd.className = 'summary-number';
        numTd.textContent = index + 1;

        const idTd = document.createElement('td');
        idTd.className = 'summary-id';
        if (questionIdValue) {
            idTd.textContent = questionIdValue;
        } else {
            const autoSpan = document.createElement('span');
            autoSpan.className = 'auto-id';
            autoSpan.textContent = 'Auto';
            idTd.appendChild(autoSpan);
        }

        const typeTd = document.createElement('td');
        typeTd.className = 'summary-type';
        typeTd.textContent = questionType; // libellé interne (QCM, QCU…), sûr
        if (mediaIconHtml) {
            typeTd.insertAdjacentHTML('beforeend', mediaIconHtml);
        }

        const textTd = document.createElement('td');
        textTd.className = 'summary-text';
        textTd.textContent = questionText; // déjà détaggé + tronqué en amont

        // Flèches désactivées aux extrémités DU GROUPE (cohérent avec le
        // formulaire : on ne déplace qu'à l'intérieur d'un groupe).
        const isFirst = info.groupSeq === 1;
        const isLast  = info.groupSeq === groupSizes[groupKey];

        const actionsTd = document.createElement('td');
        actionsTd.className = 'summary-actions';
        actionsTd.innerHTML = `
            <button class="summary-btn summary-move-btn summary-move-up-btn" data-qid="${questionId}" title="Monter cette question" ${isFirst ? 'disabled' : ''}>
                <span class="move-icon">▲</span>
            </button>
            <button class="summary-btn summary-move-btn summary-move-down-btn" data-qid="${questionId}" title="Descendre cette question" ${isLast ? 'disabled' : ''}>
                <span class="move-icon">▼</span>
            </button>
            <button class="summary-btn goto-question-btn" data-qid="${questionId}" title="Aller à cette question">
                <span class="goto-icon">⮞</span>
            </button>
        `;

        row.append(numTd, idTd, typeTd, textTd, actionsTd);
        summaryTableBody.appendChild(row);
    });
}

/**
 * Construit la ligne d'en-tête repliable d'un groupe (banque ou « Sans banque »).
 * @param {{bankNum:number|null, bankName:string|null, bankId:string|null}} info
 * @param {number} count — nombre de questions du groupe
 * @returns {HTMLTableRowElement}
 */
function buildSummaryGroupHeader(info, count) {
    const groupKey = info.bankId || 'none';
    const collapsed = summaryCollapsedGroups.has(groupKey);

    const headerRow = document.createElement('tr');
    headerRow.className = 'summary-group-row' + (collapsed ? ' collapsed' : '');
    headerRow.dataset.groupKey = groupKey;

    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = 'summary-group-cell';

    const toggle = document.createElement('span');
    toggle.className = 'summary-group-toggle';
    toggle.textContent = collapsed ? '▸' : '▾';

    const badge = document.createElement('span');
    badge.className = 'summary-group-badge' + (info.bankNum ? '' : ' none');
    badge.textContent = info.bankNum ? ('B' + String(info.bankNum).padStart(2, '0')) : 'Sans banque';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'summary-group-name';
    nameSpan.textContent = info.bankNum ? (info.bankName || '') : ''; // nom utilisateur : textContent (sûr)

    const countSpan = document.createElement('span');
    countSpan.className = 'summary-group-count';
    countSpan.textContent = count + (count > 1 ? ' questions' : ' question');

    cell.append(toggle, badge, nameSpan, countSpan);
    headerRow.appendChild(cell);
    return headerRow;
}

/**
 * Tronque un texte à une longueur spécifiée
 * @param {string} text - Le texte à tronquer
 * @param {number} maxLength - La longueur maximale
 * @returns {string} - Le texte tronqué
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Fait défiler la page jusqu'à une question spécifique avec une meilleure fiabilité
 * @param {string} questionId - L'identifiant de la question
 */
function scrollToQuestion(questionId) {
    if (!questionId) return;
    
    // Chercher l'élément de la question
    const questionElement = document.querySelector(`.question-container[data-id="${questionId}"]`);
    if (!questionElement) return;
    
    // Ajouter un ID unique à la question si nécessaire
    const uniqueId = `question-${questionId}-${Date.now()}`;
    questionElement.id = uniqueId;
    
    // Calculer la position de l'élément par rapport au haut de la page
    const rect = questionElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const offsetPosition = rect.top + scrollTop - 80; // 80px de marge pour la visibilité
    
    // Faire défiler avec une animation fluide
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
    
    // Ajouter un effet de surbrillance temporaire
    questionElement.classList.add('highlight-question');
    
    // Supprimer la classe de surbrillance après un délai
    setTimeout(() => {
        questionElement.classList.remove('highlight-question');
        // Enlever l'ID unique après l'animation pour éviter les conflits
        questionElement.removeAttribute('id');
    }, 2000);
}

/**
 * Ajoute les boutons de navigation persistants
 */
function addNavigationButtons() {
    // Créer le conteneur pour les boutons de navigation
    const navContainer = document.createElement('div');
    navContainer.id = 'navigation-buttons';
    navContainer.className = 'navigation-buttons';
    
    // Bouton "Retour sommaire"
    const backToSummaryBtn = document.createElement('button');
    backToSummaryBtn.id = 'back-to-summary-btn';
    backToSummaryBtn.className = 'nav-btn hidden';
    backToSummaryBtn.title = 'Retour au sommaire';
    backToSummaryBtn.innerHTML = '<span class="nav-icon">▲</span> Sommaire';
    
    // Bouton "Bas de page"
    const goToBottomBtn = document.createElement('button');
    goToBottomBtn.id = 'go-to-bottom-btn';
    goToBottomBtn.className = 'nav-btn';
    goToBottomBtn.title = 'Aller en bas de page';
    goToBottomBtn.innerHTML = '<span class="nav-icon">▼</span> Bas de page';
    
    // Ajouter les boutons au conteneur
    navContainer.appendChild(backToSummaryBtn);
    navContainer.appendChild(goToBottomBtn);
    
    // Ajouter le conteneur au corps du document
    document.body.appendChild(navContainer);
}

/**
 * Initialise les fonctionnalités de navigation
 */
function initNavigationFeatures() {
    // Récupérer les éléments
    const summarySection = document.getElementById('summary-section');
    const backToSummaryBtn = document.getElementById('back-to-summary-btn');
    const goToBottomBtn = document.getElementById('go-to-bottom-btn');
    const footer = document.querySelector('.footer');
    
    // Vérifier que tous les éléments sont présents
    if (!summarySection || !backToSummaryBtn || !goToBottomBtn || !footer) {
        console.error('Éléments manquants pour l\'initialisation des fonctionnalités de navigation');
        return;
    }
    
    // Fonction pour gérer la visibilité des boutons de navigation
    function handleButtonsVisibility() {
        // Récupérer les positions
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;
        const summaryRect = summarySection.getBoundingClientRect();
        const footerRect = footer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Gérer le bouton "Retour sommaire"
        // Il est visible si le sommaire n'est pas visible à l'écran
        if (summaryRect.bottom < 0 || summaryRect.top > windowHeight) {
            backToSummaryBtn.classList.remove('hidden');
        } else {
            backToSummaryBtn.classList.add('hidden');
        }
        
        // Gérer le bouton "Bas de page"
        // Il est visible si le bas de page n'est pas visible à l'écran
        if (footerRect.top > windowHeight) {
            goToBottomBtn.classList.remove('hidden');
        } else {
            goToBottomBtn.classList.add('hidden');
        }
    }
    
    // Écouteur d'événement pour le défilement
    window.addEventListener('scroll', handleButtonsVisibility);
    window.addEventListener('resize', handleButtonsVisibility);
    
    // Appel initial pour définir l'état des boutons
    handleButtonsVisibility();
    
    // Écouteur pour le bouton "Retour sommaire"
    backToSummaryBtn.addEventListener('click', function() {
        if (summarySection) {
            const rect = summarySection.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const offsetPosition = rect.top + scrollTop - 20; // 20px de marge
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            
            // Ouvrir le sommaire s'il est fermé
            const toggleBtn = document.getElementById('toggle-summary-btn');
            const summaryContent = document.getElementById('summary-content');
            
            if (toggleBtn && summaryContent && summaryContent.classList.contains('hidden')) {
                toggleBtn.click(); // Simuler un clic pour ouvrir le sommaire
            }
        }
    });
    
    // Écouteur pour le bouton "Bas de page"
    goToBottomBtn.addEventListener('click', function() {
        if (footer) {
            const rect = footer.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const offsetPosition = rect.top + scrollTop - 20; // 20px de marge
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
}

/**
 * Observe les changements dans le conteneur de questions
 */
function observeQuestionsChanges() {
    // Configuration de l'observateur de mutations
    const config = { childList: true, subtree: true };
    
    // Créer un observateur pour détecter les changements dans le conteneur de questions
    const observer = new MutationObserver((mutations) => {
        let shouldUpdateSummary = false;
        
        mutations.forEach((mutation) => {
            // Vérifier si des nœuds ont été ajoutés ou supprimés
            if (mutation.type === 'childList' && 
                (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                shouldUpdateSummary = true;
            }
        });
        
        if (shouldUpdateSummary) {
            // Différer la mise à jour pour éviter des mises à jour trop fréquentes
            clearTimeout(window.summaryUpdateTimeout);
            window.summaryUpdateTimeout = setTimeout(updateQuestionsSummary, 100);
        }
    });
    
    // Observer le conteneur de questions
    const questionsContainer = document.getElementById('questions-container');
    if (questionsContainer) {
        observer.observe(questionsContainer, config);
    }
    
    // Observer également les événements de changement
    document.addEventListener('change', function(event) {
        // Si un bouton radio de type de question a changé
        if (event.target.name && event.target.name.startsWith('question-type-')) {
            clearTimeout(window.summaryTypeUpdateTimeout);
            window.summaryTypeUpdateTimeout = setTimeout(updateQuestionsSummary, 100);
        }
        
        // Si un champ d'identifiant ou de texte de question a changé
        if ((event.target.id && event.target.id.startsWith('question-id-')) || 
            (event.target.id && event.target.id.startsWith('question-text-'))) {
            // Ajouter un délai pour permettre la saisie avant de mettre à jour
            clearTimeout(window.summaryContentUpdateTimeout);
            window.summaryContentUpdateTimeout = setTimeout(updateQuestionsSummary, 500);
        }
    });
    
    // Observer les événements d'input pour les champs de texte
    document.addEventListener('input', function(event) {
        // Si un champ d'identifiant ou de texte de question a changé
        if ((event.target.id && event.target.id.startsWith('question-id-')) || 
            (event.target.id && event.target.id.startsWith('question-text-'))) {
            // Ajouter un délai pour permettre la saisie avant de mettre à jour
            clearTimeout(window.summaryContentUpdateTimeout);
            window.summaryContentUpdateTimeout = setTimeout(updateQuestionsSummary, 500);
        }
    });
}

// Exposer la fonction de mise à jour pour l'utiliser depuis d'autres fichiers
window.updateQuestionsSummary = updateQuestionsSummary;
window.scrollToQuestion = scrollToQuestion;