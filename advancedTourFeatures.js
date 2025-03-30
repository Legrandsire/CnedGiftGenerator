/**
 * advancedTourFeatures.js
 * Fonctionnalités avancées pour le tour guidé
 * Ce fichier est optionnel et peut être intégré ultérieurement
 */

/**
 * Améliore le tour guidé avec des démonstrations interactives
 * Cette fonction peut être appelée depuis helpManager.js
 */
function enhancedGuidedTour() {
    // Personnaliser le comportement du tour pour inclure des démonstrations interactives
    
    // Étapes du tour avancé avec démonstrations
    const enhancedTourSteps = [
        {
            element: '.metadata-container',
            title: 'Informations du document',
            content: 'Commencez par renseigner ici les informations sur l\'auteur et le code article.',
            position: 'bottom',
            action: function() {
                // Simuler une saisie dans les champs de métadonnées
                animateTyping('#author-lastname', 'Dubois');
                setTimeout(() => {
                    animateTyping('#author-firstname', 'Jean');
                }, 1000);
                setTimeout(() => {
                    animateTyping('#course-code', 'INFO101');
                }, 2000);
            }
        },
        {
            element: '#add-question-btn',
            title: 'Ajout de questions',
            content: 'Cliquez ici pour ajouter une nouvelle question.',
            position: 'top',
            action: function() {
                // Simuler un clic sur le bouton d'ajout de question
                highlightClick('#add-question-btn');
            }
        },
        {
            element: '.question-container',
            title: 'Configuration des questions',
            content: 'Choisissez le type de question et configurez les options de réponse.',
            position: 'right',
            action: function() {
                // Simuler la sélection d'un type de question
                setTimeout(() => {
                    document.querySelector('input[value="sc"]').click();
                    highlightElement('input[value="sc"]');
                }, 1000);
                
                // Puis simuler l'ajout d'une option
                setTimeout(() => {
                    highlightClick('.add-sc-option-btn');
                }, 2500);
            }
        },
        {
            element: '#generate-btn',
            title: 'Génération du code',
            content: 'Une fois vos questions configurées, cliquez ici pour générer le code GIFT.',
            position: 'top',
            action: function() {
                // Simuler un clic sur le bouton de génération
                highlightClick('#generate-btn');
            }
        },
        {
            element: '#gift-output',
            title: 'Code généré',
            content: 'Le code GIFT apparaîtra ici, prêt à être copié ou téléchargé.',
            position: 'top'
        }
    ];
    
    // Lancer le tour avancé avec les étapes personnalisées
    startCustomGuidedTour(enhancedTourSteps);
}

/**
 * Fonction pour démarrer un tour guidé personnalisé
 * @param {Array} steps - Les étapes du tour guidé
 */
function startCustomGuidedTour(steps) {
    // Variables pour le tour
    let currentStep = 0;
    let tourOverlay, tourTooltip;
    
    // Créer les éléments du tour
    createTourElements();
    showStep(currentStep);
    
    // Créer l'overlay et le tooltip
    function createTourElements() {
        tourOverlay = document.createElement('div');
        tourOverlay.className = 'tour-overlay enhanced-tour';
        document.body.appendChild(tourOverlay);
        
        tourTooltip = document.createElement('div');
        tourTooltip.className = 'tour-tooltip enhanced-tooltip';
        document.body.appendChild(tourTooltip);
    }
    
    // Afficher une étape
    function showStep(stepIndex) {
        if (stepIndex >= steps.length) {
            removeTourElements();
            showCompletionMessage();
            return;
        }
        
        const step = steps[stepIndex];
        const targetElement = document.querySelector(step.element);
        
        if (!targetElement) {
            showStep(stepIndex + 1);
            return;
        }
        
        // Scroll vers l'élément si nécessaire
        if (targetElement.getBoundingClientRect().top < 0 || 
            targetElement.getBoundingClientRect().bottom > window.innerHeight) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            // Attendre la fin du scroll
            setTimeout(() => {
                positionElements(targetElement, step);
            }, 500);
        } else {
            positionElements(targetElement, step);
        }
    }
    
    // Positionner les éléments pour l'étape actuelle
    function positionElements(targetElement, step) {
        const rect = targetElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Ajouter une marge autour de l'élément pour le cadrage
        const margin = 10;
        
        // Couper l'overlay pour laisser apparaître l'élément avec une marge
        tourOverlay.style.clipPath = `
            polygon(
                0% 0%, 
                100% 0%, 
                100% 100%, 
                0% 100%, 
                0% ${rect.top + scrollTop - margin}px, 
                ${rect.left - margin}px ${rect.top + scrollTop - margin}px, 
                ${rect.left - margin}px ${rect.bottom + scrollTop + margin}px, 
                ${rect.right + margin}px ${rect.bottom + scrollTop + margin}px, 
                ${rect.right + margin}px ${rect.top + scrollTop - margin}px, 
                0% ${rect.top + scrollTop - margin}px
            )
        `;
        
        // Positionner le tooltip
        let tooltipX, tooltipY;
        switch (step.position) {
            case 'top':
                tooltipX = rect.left + rect.width / 2;
                tooltipY = rect.top + scrollTop - 20;
                break;
            case 'bottom':
                tooltipX = rect.left + rect.width / 2;
                tooltipY = rect.bottom + scrollTop + 20;
                break;
            case 'left':
                tooltipX = rect.left - 20;
                tooltipY = rect.top + scrollTop + rect.height / 2;
                break;
            case 'right':
                tooltipX = rect.right + 20;
                tooltipY = rect.top + scrollTop + rect.height / 2;
                break;
            default:
                tooltipX = rect.left + rect.width / 2;
                tooltipY = rect.bottom + scrollTop + 20;
        }
        
        // Mettre à jour le contenu du tooltip avec bouton Terminer à chaque étape
        tourTooltip.innerHTML = `
            <h3>${step.title}</h3>
            <p>${step.content}</p>
            <div class="tour-nav">
                <span>${currentStep + 1}/${steps.length}</span>
                <div>
                    <button class="tour-finish-early">Terminer</button>
                    ${currentStep > 0 ? '<button class="tour-prev">Précédent</button>' : ''}
                    ${currentStep < steps.length - 1 ? 
                        '<button class="tour-next">Suivant</button>' : 
                        '<button class="tour-finish">Terminer</button>'}
                </div>
            </div>
        `;
        
        // Positionner le tooltip
        tourTooltip.style.left = `${tooltipX}px`;
        tourTooltip.style.top = `${tooltipY}px`;
        tourTooltip.setAttribute('data-position', step.position);
        
        // Ajouter les événements aux boutons
        const prevBtn = tourTooltip.querySelector('.tour-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentStep--;
                showStep(currentStep);
            });
        }
        
        const nextBtn = tourTooltip.querySelector('.tour-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentStep++;
                showStep(currentStep);
            });
        }
        
        const finishBtn = tourTooltip.querySelector('.tour-finish');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                removeTourElements();
                showCompletionMessage();
            });
        }
        
        // Bouton pour terminer le tour prématurément
        const finishEarlyBtn = tourTooltip.querySelector('.tour-finish-early');
        if (finishEarlyBtn) {
            finishEarlyBtn.addEventListener('click', () => {
                removeTourElements();
            });
        }
        
        // Exécuter l'action de démonstration si définie
        if (step.action && typeof step.action === 'function') {
            step.action();
        }
    }
    
    // Nettoyer les éléments du tour
    function removeTourElements() {
        tourOverlay.remove();
        tourTooltip.remove();
    }
    
    // Afficher un message de fin
    function showCompletionMessage() {
        const message = document.createElement('div');
        message.className = 'tour-complete enhanced-complete';
        message.innerHTML = `
            <div class="tour-complete-content">
                <h3>Démonstration terminée !</h3>
                <p>Vous avez vu comment créer et configurer des questions dans le générateur GIFT.</p>
                <p>N'oubliez pas que l'aide reste disponible via le bouton <span class="help-btn-mini">? Aide</span> en haut de la page.</p>
                <button class="control-btn close-tour-btn">Commencer à utiliser l'outil</button>
            </div>
        `;
        
        document.body.appendChild(message);
        
        message.querySelector('.close-tour-btn').addEventListener('click', function() {
            message.remove();
        });
    }
}

/**
 * Anime la saisie de texte dans un champ input
 * @param {string} selector - Sélecteur CSS du champ
 * @param {string} text - Texte à saisir
 */
function animateTyping(selector, text) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    element.focus();
    
    let i = 0;
    const interval = setInterval(() => {
        if (i < text.length) {
            element.value += text[i];
            i++;
        } else {
            clearInterval(interval);
            element.blur();
        }
    }, 100);
}

/**
 * Met en évidence un élément avec un effet de pulse
 * @param {string} selector - Sélecteur CSS de l'élément
 */
function highlightElement(selector) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    // Ajouter une classe pour l'animation
    element.classList.add('tour-highlight');
    
    // Retirer la classe après l'animation
    setTimeout(() => {
        element.classList.remove('tour-highlight');
    }, 1500);
}

/**
 * Simule un clic sur un élément
 * @param {string} selector - Sélecteur CSS de l'élément
 */
function highlightClick(selector) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    // D'abord mettre en évidence
    highlightElement(selector);
    
    // Puis simuler un clic après un court délai
    setTimeout(() => {
        element.click();
    }, 800);
}

// Exporter la fonction pour l'utiliser depuis helpManager.js
window.enhancedGuidedTour = enhancedGuidedTour;