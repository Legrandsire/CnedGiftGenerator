/**
 * helpManager.js
 * Gestion des fonctionnalités d'aide du générateur de code GIFT
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation des composants d'aide
    initHelpPanel();
    initTooltips();
    
    // Vérifier si c'est la première visite pour proposer le tour guidé
    checkFirstVisit();
});

/**
 * Initialise le panneau d'aide latéral
 */
function initHelpPanel() {
    // Créer le bouton d'aide dans l'en-tête
    const headerContainer = document.querySelector('.header-container');
    const helpButton = document.createElement('button');
    helpButton.id = 'help-toggle-btn';
    helpButton.className = 'help-btn';
    helpButton.innerHTML = '<span class="help-icon">?</span>';
    helpButton.title = "Afficher l'aide";
    headerContainer.appendChild(helpButton);
    
    // Créer le panneau d'aide (initialement caché)
    const helpPanel = document.createElement('div');
    helpPanel.id = 'help-panel';
    helpPanel.className = 'help-panel hidden';
    
    // Structure du panneau d'aide
    helpPanel.innerHTML = `
        <div class="help-header">
            <h2>Guide d'utilisation</h2>
            <button class="help-close-btn">×</button>
        </div>
        <div class="help-tabs">
            <button class="help-tab-btn active" data-tab="general">Général</button>
            <button class="help-tab-btn" data-tab="questions">Questions</button>
            <button class="help-tab-btn" data-tab="import">Import/Export</button>
        </div>
        <div class="help-content">
            <div class="help-tab-content active" id="general-tab">
                <h3>Utilisation générale</h3>
                <p>Le générateur de code GIFT vous permet de créer facilement des questions au format GIFT pour Moodle.</p>
                <h4>Pour commencer</h4>
                <ol>
                    <li>Renseignez les informations sur l'auteur et le code article (facultatif)</li>
                    <li>Ajoutez des questions en utilisant le bouton "Ajouter une question"</li>
                    <li>Remplissez les champs pour chaque question</li>
                    <li>Cliquez sur "Générer le code GIFT" pour obtenir le code</li>
                    <li>Utilisez "Copier le code" ou "Télécharger" pour récupérer votre travail</li>
                </ol>
                <p><strong>Astuce:</strong> Vous pouvez importer un fichier GIFT existant pour le modifier.</p>
            </div>
            <div class="help-tab-content" id="questions-tab">
                <h3>Types de questions</h3>
                <h4>QCM (Question à Choix Multiple)</h4>
                <p>Permet plusieurs réponses correctes avec des pondérations différentes.</p>
                <ul>
                    <li>La somme des pondérations des bonnes réponses doit être de 100%</li>
                    <li>Les pondérations négatives pénalisent les mauvaises réponses</li>
                </ul>
                
                <h4>QCU (Question à Choix Unique)</h4>
                <p>Une seule réponse est correcte.</p>
                
                <h4>Vrai/Faux</h4>
                <p>Question simple où la réponse est soit Vrai soit Faux.</p>
                
                <h4>QRC (Question à Réponse Courte)</h4>
                <p>L'étudiant doit taper une réponse courte. Vous pouvez définir plusieurs réponses acceptables.</p>
                
                <h4>Numérique</h4>
                <p>L'étudiant doit fournir une valeur numérique. Vous pouvez définir une marge d'erreur.</p>
            </div>
            <div class="help-tab-content" id="import-tab">
                <h3>Importation et Exportation</h3>
                <h4>Importer un fichier GIFT</h4>
                <ol>
                    <li>Cliquez sur "Choisir un fichier" dans la section d'importation</li>
                    <li>Sélectionnez votre fichier GIFT (.txt)</li>
                    <li>Cliquez sur "Importer"</li>
                </ol>
                <p>Les questions seront chargées dans l'interface pour modification.</p>
                
                <h4>Exporter votre travail</h4>
                <p>Deux options s'offrent à vous :</p>
                <ul>
                    <li><strong>Copier le code</strong> : Copie le code GIFT dans le presse-papier</li>
                    <li><strong>Télécharger</strong> : Enregistre le code dans un fichier texte</li>
                </ul>
                <p>Le fichier généré inclura automatiquement les métadonnées (auteur, code article) si renseignées.</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(helpPanel);
    
    // Gérer l'affichage/masquage du panneau
    helpButton.addEventListener('click', function() {
        helpPanel.classList.toggle('hidden');
        // Adapter la position du panneau en fonction du scroll
        helpPanel.style.top = window.scrollY + 'px';
    });
    
    // Fermer le panneau
    const closeBtn = helpPanel.querySelector('.help-close-btn');
    closeBtn.addEventListener('click', function() {
        helpPanel.classList.add('hidden');
    });
    
    // Gestion des onglets
    const tabButtons = helpPanel.querySelectorAll('.help-tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Désactiver tous les onglets
            tabButtons.forEach(btn => btn.classList.remove('active'));
            const tabContents = helpPanel.querySelectorAll('.help-tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activer l'onglet cliqué
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Fermer le panneau si on clique en dehors
    document.addEventListener('click', function(event) {
        if (!helpPanel.contains(event.target) && event.target !== helpButton) {
            helpPanel.classList.add('hidden');
        }
    });
}

/**
 * Initialise les tooltips d'aide contextuels
 */
function initTooltips() {
    // Définir les éléments qui nécessitent des tooltips et leur contenu
    const tooltipsConfig = [
        {
            selector: '.add-option-btn',
            text: 'Ajouter une option de réponse à la question'
        },
        {
            selector: '.weight-input',
            text: 'Pourcentage de points pour cette réponse. Le total des réponses correctes doit être 100%'
        },
        {
            selector: '#generate-btn',
            text: 'Générer le code GIFT à partir des questions créées'
        },
        {
            selector: '#copy-btn',
            text: 'Copier le code généré dans le presse-papier'
        },
        {
            selector: '#download-btn',
            text: 'Télécharger le code généré sous forme de fichier texte'
        },
        {
            selector: '#clear-btn',
            text: 'Attention ! Cette action effacera toutes les questions'
        },
        {
            selector: '#import-btn',
            text: "Importer un fichier GIFT existant pour le modifier"
        },
        {
            selector: '#add-question-btn',
            text: 'Ajouter une nouvelle question au formulaire'
        }
    ];
    
    // Créer les tooltips
    tooltipsConfig.forEach(config => {
        const elements = document.querySelectorAll(config.selector);
        elements.forEach(element => {
            // Créer l'icône d'aide
            if (!element.classList.contains('weight-input')) {  // Exclure certains éléments spécifiques
                const helpIcon = document.createElement('span');
                helpIcon.className = 'tooltip-icon';
                helpIcon.innerHTML = 'i';
                helpIcon.setAttribute('data-tooltip', config.text);
                
                // Pour les boutons, ajouter après le texte
                if (element.tagName === 'BUTTON') {
                    element.appendChild(document.createTextNode(' '));
                    element.appendChild(helpIcon);
                } else {
                    // Pour les autres éléments, placer à côté
                    const parent = element.parentNode;
                    parent.insertBefore(helpIcon, element.nextSibling);
                }
            } else {
                // Pour les éléments spécifiques comme les sélecteurs de poids, ajouter directement le tooltip
                element.setAttribute('data-tooltip', config.text);
            }
        });
    });
    
    // Pour les tooltips ajoutés dynamiquement (lorsqu'on ajoute des questions)
    document.addEventListener('click', function(event) {
        if (event.target.matches('.add-question-btn')) {
            // Temporisation pour laisser le DOM se mettre à jour
            setTimeout(function() {
                initDynamicTooltips();
            }, 100);
        }
    });
}

/**
 * Ajoute des tooltips aux éléments créés dynamiquement
 */
function initDynamicTooltips() {
    // Ajouter des tooltips aux nouveaux éléments (réponses, options, etc.)
    const newElements = {
        '.correct-option': 'Cochez cette case pour les réponses correctes',
        '.correct-sc-option': 'Sélectionnez la réponse correcte',
        '.remove-option-btn': 'Supprimer cette option',
        '.sa-option-text': 'Entrez une réponse acceptée pour cette question'
    };
    
    for (const selector in newElements) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (!element.hasAttribute('data-tooltip')) {
                element.setAttribute('data-tooltip', newElements[selector]);
            }
        });
    }
}

/**
 * Vérifie si c'est la première visite pour proposer le tour guidé
 */
function checkFirstVisit() {
    const hasVisitedBefore = localStorage.getItem('gift_generator_visited');
    
    if (!hasVisitedBefore) {
        // Marquer comme visité
        localStorage.setItem('gift_generator_visited', 'true');
        
        // Proposer le tour guidé
        const tourPrompt = document.createElement('div');
        tourPrompt.className = 'tour-prompt';
        tourPrompt.innerHTML = `
            <div class="tour-prompt-content">
                <h3>Bienvenue dans le générateur de code GIFT !</h3>
                <p>Souhaitez-vous suivre un tour guidé pour découvrir les fonctionnalités ?</p>
                <div class="tour-prompt-buttons">
                    <button id="start-tour-btn" class="control-btn">Démarrer le tour</button>
                    <button id="skip-tour-btn">Pas maintenant</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(tourPrompt);
        
        // Gérer les interactions
        document.getElementById('start-tour-btn').addEventListener('click', function() {
            tourPrompt.remove();
            startGuidedTour();
        });
        
        document.getElementById('skip-tour-btn').addEventListener('click', function() {
            tourPrompt.remove();
        });
    }
}

/**
 * Démarre le tour guidé interactif
 */
function startGuidedTour() {
    // Définir les étapes du tour
    const tourSteps = [
        {
            element: '.metadata-container',
            title: 'Informations du document',
            content: 'Commencez par renseigner ici les informations sur l\'auteur et le code article.',
            position: 'bottom'
        },
        {
            element: '#add-question-btn',
            title: 'Ajout de questions',
            content: 'Cliquez ici pour ajouter une nouvelle question.',
            position: 'top'
        },
        {
            element: '.question-container',
            title: 'Configuration des questions',
            content: 'Choisissez le type de question et configurez les options de réponse.',
            position: 'right'
        },
        {
            element: '#generate-btn',
            title: 'Génération du code',
            content: 'Une fois vos questions configurées, cliquez ici pour générer le code GIFT.',
            position: 'top'
        },
        {
            element: '#gift-output',
            title: 'Code généré',
            content: 'Le code GIFT apparaîtra ici, prêt à être copié ou téléchargé.',
            position: 'top'
        },
        {
            element: '.import-container',
            title: 'Importation',
            content: 'Vous pouvez aussi importer un fichier GIFT existant pour le modifier.',
            position: 'bottom'
        },
        {
            element: '#help-toggle-btn',
            title: 'Aide disponible',
            content: 'N\'oubliez pas que vous pouvez accéder à l\'aide à tout moment en cliquant ici.',
            position: 'right'
        }
    ];
    
    // Variables pour le tour
    let currentStep = 0;
    let tourOverlay, tourTooltip;
    
    // Créer l'overlay du tour
    function createTourElements() {
        // Overlay semi-transparent
        tourOverlay = document.createElement('div');
        tourOverlay.className = 'tour-overlay';
        document.body.appendChild(tourOverlay);
        
        // Tooltip
        tourTooltip = document.createElement('div');
        tourTooltip.className = 'tour-tooltip';
        document.body.appendChild(tourTooltip);
    }
    
    // Supprimer les éléments du tour
    function removeTourElements() {
        tourOverlay.remove();
        tourTooltip.remove();
    }
    
    // Afficher une étape du tour
    function showStep(stepIndex) {
        if (stepIndex >= tourSteps.length) {
            // Fin du tour
            removeTourElements();
            showTourCompleteMessage();
            return;
        }
        
        const step = tourSteps[stepIndex];
        const targetElement = document.querySelector(step.element);
        
        if (!targetElement) {
            // Si l'élément n'est pas trouvé, passer à l'étape suivante
            showStep(stepIndex + 1);
            return;
        }
        
        // Positionner le highlight sur l'élément cible
        const rect = targetElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Scroll vers l'élément si nécessaire
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
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
    
    // Positionner les éléments du tour
    function positionElements(targetElement, step) {
        const rect = targetElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Couper l'overlay pour laisser apparaître l'élément
        tourOverlay.style.clipPath = `
            polygon(
                0% 0%, 
                100% 0%, 
                100% 100%, 
                0% 100%, 
                0% ${rect.top + scrollTop}px, 
                ${rect.left}px ${rect.top + scrollTop}px, 
                ${rect.left}px ${rect.bottom + scrollTop}px, 
                ${rect.right}px ${rect.bottom + scrollTop}px, 
                ${rect.right}px ${rect.top + scrollTop}px, 
                0% ${rect.top + scrollTop}px
            )
        `;
        
        // Positionner le tooltip
        let tooltipX, tooltipY;
        switch (step.position) {
            case 'top':
                tooltipX = rect.left + rect.width / 2;
                tooltipY = rect.top + scrollTop - 10;
                break;
            case 'bottom':
                tooltipX = rect.left + rect.width / 2;
                tooltipY = rect.bottom + scrollTop + 10;
                break;
            case 'left':
                tooltipX = rect.left - 10;
                tooltipY = rect.top + scrollTop + rect.height / 2;
                break;
            case 'right':
                tooltipX = rect.right + 10;
                tooltipY = rect.top + scrollTop + rect.height / 2;
                break;
            default:
                tooltipX = rect.left + rect.width / 2;
                tooltipY = rect.bottom + scrollTop + 10;
        }
        
        // Mettre à jour le contenu du tooltip
        tourTooltip.innerHTML = `
            <h3>${step.title}</h3>
            <p>${step.content}</p>
            <div class="tour-nav">
                <span>${currentStep + 1}/${tourSteps.length}</span>
                <div>
                    ${currentStep > 0 ? '<button class="tour-prev">Précédent</button>' : ''}
                    ${currentStep < tourSteps.length - 1 ? 
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
                showTourCompleteMessage();
            });
        }
    }
    
    // Afficher un message de fin de tour
    function showTourCompleteMessage() {
        const message = document.createElement('div');
        message.className = 'tour-complete';
        message.innerHTML = `
            <div class="tour-complete-content">
                <h3>Tour terminé !</h3>
                <p>Vous pouvez maintenant utiliser le générateur de code GIFT en toute autonomie.</p>
                <p>N'oubliez pas que l'aide reste disponible via le bouton <span class="help-icon">?</span> en haut de la page.</p>
                <button class="control-btn close-tour-btn">Commencer à utiliser l'outil</button>
            </div>
        `;
        
        document.body.appendChild(message);
        
        message.querySelector('.close-tour-btn').addEventListener('click', function() {
            message.remove();
        });
    }
    
    // Démarrer le tour
    createTourElements();
    showStep(currentStep);
}

// Tour guidé disponible en appelant cette fonction
window.startGuidedTour = startGuidedTour;