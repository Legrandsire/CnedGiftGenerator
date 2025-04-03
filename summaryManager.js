/**
 * summaryManager.js
 * Gestion du résumé des questions du générateur de code GIFT
 * 
 * Ce fichier permet de créer et gérer une section de résumé qui affiche
 * un aperçu condensé de toutes les questions du quiz avec leur numéro,
 * identifiant, type et texte.
 */

document.addEventListener('DOMContentLoaded', function() {
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
 * Crée la section de résumé dans le DOM
 */
function createSummarySection() {
    // Créer le conteneur principal du résumé
    const summarySection = document.createElement('div');
    summarySection.id = 'summary-section';
    summarySection.className = 'summary-section collapsed';
    
    // Créer le header du résumé avec le bouton de toggle
    const summaryHeader = document.createElement('div');
    summaryHeader.className = 'summary-header';
    summaryHeader.innerHTML = `
        <h3 class="section-title">Résumé des questions</h3>
        <button id="toggle-summary-btn" class="control-btn">
            <span class="summary-toggle-icon">▼</span> Afficher le résumé
        </button>
    `;
    
    // Créer le conteneur pour le contenu du résumé
    const summaryContent = document.createElement('div');
    summaryContent.id = 'summary-content';
    summaryContent.className = 'summary-content hidden';
    
    // Créer la table de résumé
    const summaryTable = document.createElement('table');
    summaryTable.id = 'summary-table';
    summaryTable.className = 'summary-table';
    summaryTable.innerHTML = `
        <thead>
            <tr>
                <th>N°</th>
                <th>Identifiant</th>
                <th>Type</th>
                <th>Texte de la question</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="summary-table-body">
            <!-- Les lignes du résumé seront générées dynamiquement -->
        </tbody>
    `;
    
    // Assembler les éléments
    summaryContent.appendChild(summaryTable);
    summarySection.appendChild(summaryHeader);
    summarySection.appendChild(summaryContent);
    
    // Insérer la section de résumé avant la section des questions
    const questionsSection = document.querySelector('h3.section-title + #questions-container');
    if (questionsSection) {
        questionsSection.parentNode.insertBefore(summarySection, questionsSection.previousElementSibling);
    }
}

/**
 * Initialise les écouteurs d'événements pour la section de résumé
 */
function initSummaryEvents() {
    // Écouteur pour le bouton de toggle du résumé
    const toggleBtn = document.getElementById('toggle-summary-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const summarySection = document.getElementById('summary-section');
            const summaryContent = document.getElementById('summary-content');
            const toggleIcon = this.querySelector('.summary-toggle-icon');
            
            if (summarySection && summaryContent && toggleIcon) {
                if (summarySection.classList.contains('collapsed')) {
                    // Ouvrir le résumé
                    summarySection.classList.remove('collapsed');
                    summaryContent.classList.remove('hidden');
                    toggleIcon.textContent = '▲';
                    this.innerHTML = this.innerHTML.replace('Afficher le résumé', 'Masquer le résumé');
                    
                    // Mettre à jour le résumé
                    updateQuestionsSummary();
                } else {
                    // Fermer le résumé
                    summarySection.classList.add('collapsed');
                    summaryContent.classList.add('hidden');
                    toggleIcon.textContent = '▼';
                    this.innerHTML = this.innerHTML.replace('Masquer le résumé', 'Afficher le résumé');
                }
            }
        });
    }
    
    // Délégation d'événements pour les boutons d'actions dans le résumé
    document.addEventListener('click', function(event) {
        // Utiliser closest pour une meilleure fiabilité
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
}

/**
 * Met à jour le résumé des questions
 */
function updateQuestionsSummary() {
    const summaryTableBody = document.getElementById('summary-table-body');
    const questionsContainer = document.getElementById('questions-container');
    
    // Vérifications de sécurité
    if (!summaryTableBody || !questionsContainer) return;
    
    // Vider le tableau de résumé
    summaryTableBody.innerHTML = '';
    
    // Si le résumé est masqué, ne pas le mettre à jour
    const summaryContent = document.getElementById('summary-content');
    if (summaryContent && summaryContent.classList.contains('hidden')) {
        return;
    }
    
    // Récupérer toutes les questions
    const questions = questionsContainer.querySelectorAll('.question-container');
    
    // Message si aucune question n'est présente
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
        
        // Ajouter un écouteur pour le bouton d'ajout de question
        const addFirstQuestionBtn = document.getElementById('add-first-question-btn');
        if (addFirstQuestionBtn) {
            addFirstQuestionBtn.addEventListener('click', function() {
                const addQuestionBtn = document.getElementById('add-question-btn');
                if (addQuestionBtn) {
                    addQuestionBtn.click();
                }
            });
        }
        
        return;
    }
    
    // Parcourir toutes les questions et créer une ligne pour chacune
    questions.forEach((question, index) => {
        if (!question) return;
        
        const questionId = question.dataset.id;
        if (!questionId) return;
        
        const questionIdField = document.getElementById(`question-id-${questionId}`);
        const questionIdValue = questionIdField ? questionIdField.value : '';
        
        // Détecter le type de question sélectionné
        const questionTypeRadio = question.querySelector('input[name^="question-type-"]:checked');
        let questionType = 'QCM'; // Par défaut
        
        if (questionTypeRadio) {
            switch (questionTypeRadio.value) {
                case 'mc':
                    questionType = 'QCM';
                    break;
                case 'sc':
                    questionType = 'QCU';
                    break;
                case 'tf':
                    questionType = 'Vrai/Faux';
                    break;
                case 'sa':
                    questionType = 'QRC';
                    break;
                case 'num':
                    questionType = 'Numérique';
                    break;
            }
        }
        
        // Récupérer le texte de la question
        const questionTextField = document.getElementById(`question-text-${questionId}`);
        const questionText = questionTextField ? questionTextField.value : '';
        
        // Créer la ligne du tableau
        const row = document.createElement('tr');
        row.className = 'summary-row';
        row.dataset.qid = questionId;
        
        row.innerHTML = `
            <td class="summary-number">${index + 1}</td>
            <td class="summary-id">${questionIdValue || `<span class="auto-id">Auto</span>`}</td>
            <td class="summary-type">${questionType}</td>
            <td class="summary-text">${questionText}</td>
            <td class="summary-actions">
                <button class="summary-btn goto-question-btn" data-qid="${questionId}" title="Aller à cette question">
                    <span class="goto-icon">⮞</span>
                </button>
            </td>
        `;
        
        summaryTableBody.appendChild(row);
    });
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