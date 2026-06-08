/**
 * helpManager.js
 * Gestion des fonctionnalités d'aide du générateur de code GIFT
 */

APP_INIT.push(function initHelp() {
    // Initialisation des composants d'aide
    initHelpPanel();
    initTooltips();
    // La visite guidée et la proposition « première visite » sont gérées par
    // tourManager.js (module dédié) — voir checkFirstVisit() / startGuidedTour().
});

/**
 * Initialise le panneau d'aide latéral
 */
function initHelpPanel() {
    // Créer le bouton d'aide en haut de l'écran
    const helpButton = document.createElement('button');
    helpButton.id = 'help-toggle-btn';
    helpButton.className = 'help-btn';
    helpButton.innerHTML = '<span class="help-icon">?</span> <span class="help-text">Aide</span>';
    helpButton.title = "Afficher l'aide";
    document.body.appendChild(helpButton);
    
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
            <button class="help-tab-btn" data-tab="navigation">Navigation</button>
            <button class="help-tab-btn" data-tab="preview">Prévisualisation</button>
            <button class="help-tab-btn" data-tab="import">Import/Export</button>
        </div>
        <div class="help-content">
            <div class="help-tab-content active" id="general-tab">
                <h3>Utilisation générale</h3>
                <p>Le générateur de code GIFT vous permet de créer facilement des questions au format GIFT pour Moodle.</p>
                
                <div class="start-tour-container">
                    <p><strong>Nouveau sur l'outil ?</strong></p>
                    <button id="start-tour-from-panel" class="control-btn">Démarrer le tour guidé</button>
                    <button id="download-guide-from-panel" class="control-btn">📘 Télécharger le guide (PDF)</button>
                </div>
                
                <h4>Pour commencer</h4>
                <ol>
                    <li>Renseignez les informations sur l'auteur et le code article (facultatif)</li>
                    <li>Ajoutez des questions en utilisant le bouton "Ajouter une question"</li>
                    <li>Remplissez les champs pour chaque question</li>
                    <li>Cliquez sur "Générer le code GIFT" pour obtenir le code</li>
                    <li>Utilisez "Copier le code" ou "Télécharger" pour récupérer votre travail</li>
                </ol>
                <p><strong>Astuce:</strong> Vous pouvez importer un fichier GIFT existant pour le modifier.</p>
                <p><strong>✈️ Fonctionne sans connexion :</strong> l'outil est entièrement local — une fois la page ouverte, il reste utilisable sans Internet (création, import/export GIFT, XML, ZIP, PDF, RTF). L'état de la connexion est rappelé en bas de page.</p>
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
            <div class="help-tab-content" id="navigation-tab">
                <h3>Navigation et sommaire</h3>
                <h4>Sommaire des questions</h4>
                <p>Le sommaire vous offre une vue d'ensemble de toutes vos questions :</p>
                <ul>
                    <li>Cliquez sur <strong>Afficher le résumé</strong> pour voir la liste de toutes vos questions</li>
                    <li>Utilisez le bouton <strong>⮞</strong> pour naviguer directement vers une question spécifique</li>
                    <li>Le sommaire affiche le numéro, l'identifiant, le type et le texte de chaque question</li>
                </ul>
                
                <h4>Boutons de navigation</h4>
                <p>Pour faciliter la navigation dans les longs formulaires :</p>
                <ul>
                    <li><strong>Retour sommaire</strong> : Remonte au sommaire des questions</li>
                    <li><strong>Bas de page</strong> : Descend directement en bas de page</li>
                </ul>
                <p>Ces boutons apparaissent automatiquement lorsque vous faites défiler la page.</p>
            </div>
            <div class="help-tab-content" id="preview-tab">
                <h3>Mode prévisualisation</h3>
                <p>Le mode prévisualisation permet de voir vos questions telles qu'elles apparaîtront dans Moodle :</p>
                <ul>
                    <li>Cliquez sur le bouton <strong>👁️ Prévisualiser</strong> en haut à droite pour activer ce mode</li>
                    <li>Les champs d'édition sont masqués pour une lecture plus claire</li>
                    <li>Les réponses correctes sont mises en évidence</li>
                    <li>Pour revenir au mode édition, cliquez sur <strong>✏️ Éditer</strong></li>
                </ul>
                <p>Ce mode est particulièrement utile pour vérifier la cohérence de vos questions avant de générer le code GIFT.</p>
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
    
    // Gérer l'affichage/masquage du panneau avec correction
    helpButton.addEventListener('click', function(event) {
        event.stopPropagation(); // Empêcher la propagation vers le document
        helpPanel.classList.toggle('hidden');
        // Adapter la position du panneau en fonction du scroll
        helpPanel.style.top = '0px';
    });
    
    // Fermer le panneau
    const closeBtn = helpPanel.querySelector('.help-close-btn');
    closeBtn.addEventListener('click', function() {
        helpPanel.classList.add('hidden');
    });
    
    // Empêcher la fermeture quand on clique dans le panneau
    helpPanel.addEventListener('click', function(event) {
        event.stopPropagation();
    });
    
    // Fermer le panneau si on clique en dehors
    document.addEventListener('click', function() {
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
    
    // Démarrer le tour guidé depuis le panneau d'aide
    const startTourBtn = document.getElementById('start-tour-from-panel');
    if (startTourBtn) {
        startTourBtn.addEventListener('click', function() {
            helpPanel.classList.add('hidden');
            startGuidedTour();
        });
    }

    // Télécharger le guide d'utilisation (PDF imprimable) — module userGuide.js.
    const guideBtn = document.getElementById('download-guide-from-panel');
    if (guideBtn) {
        guideBtn.addEventListener('click', function() {
            helpPanel.classList.add('hidden');
            if (typeof openUserGuide === 'function') {
                openUserGuide();
            }
        });
    }
}

/**
 * Initialise les tooltips d'aide contextuels (sans icônes)
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
            selector: '#gift-menu-toggle',
            text: 'Menu GIFT : copier le code, le télécharger en .txt ou en ZIP (avec les médias). Les autres formats sont dans les menus « Moodle » et « Document ».'
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
    
    // Créer les tooltips (sans ajouter d'icônes)
    tooltipsConfig.forEach(config => {
        const elements = document.querySelectorAll(config.selector);
        elements.forEach(element => {
            // Ajouter simplement l'attribut data-tooltip sans ajouter d'icône
            element.setAttribute('data-tooltip', config.text);
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
