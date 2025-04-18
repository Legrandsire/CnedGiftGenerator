/**
 * previewMode.js
 * Gestion du mode prévisualisation du générateur de code GIFT
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le mode prévisualisation
    initPreviewMode();
});

/**
 * Initialise le mode prévisualisation
 */
function initPreviewMode() {
    // Créer le bouton flottant pour le mode prévisualisation
    // Nous le créons une seule fois, en nous assurant qu'il n'existe pas déjà
    if (!document.querySelector('.floating-toggle-container')) {
        createFloatingPreviewToggle();
    }
    
    const toggleSwitch = document.getElementById('preview-mode-toggle');
    
    if (!toggleSwitch) return;
    
    // Événement pour basculer entre les modes
    toggleSwitch.addEventListener('change', function() {
        if (this.checked) {
            // Activer le mode prévisualisation
            activatePreviewMode();
        } else {
            // Désactiver le mode prévisualisation
            deactivatePreviewMode();
        }
    });
}

/**
 * Crée le bouton flottant pour activer/désactiver le mode prévisualisation
 */
function createFloatingPreviewToggle() {
    // Supprimer l'ancien toggle s'il existe dans le header
    const oldHeaderToggle = document.querySelector('.mode-toggle-container');
    if (oldHeaderToggle) {
        oldHeaderToggle.remove();
    }
    
    // Supprimer l'ancien toggle flottant s'il existe
    const oldFloatingToggle = document.querySelector('.floating-toggle-container');
    if (oldFloatingToggle) {
        oldFloatingToggle.remove();
    }
    
    // Créer le nouveau bouton flottant
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'floating-toggle-container';
    toggleContainer.innerHTML = `
        <label class="switch">
            <input type="checkbox" id="preview-mode-toggle">
            <span class="slider round"></span>
        </label>
        <span class="mode-label">Mode édition</span>
    `;
    
    document.body.appendChild(toggleContainer);
}

/**
 * Active le mode prévisualisation
 */
function activatePreviewMode() {
    document.body.classList.add('preview-mode');
    
    // Mettre à jour le label du mode
    const modeLabel = document.querySelector('.mode-label');
    if (modeLabel) {
        modeLabel.textContent = 'Mode prévisualisation';
    }
    
    // Supprimer les éléments de prévisualisation précédents pour éviter les doublons
    document.querySelectorAll('.preview-text, .preview-auto-id, .preview-question-type, .preview-feedback, .preview-option-feedback, .preview-icon, .preview-weight-badge, .preview-tf-answer, .preview-sa-answer-container').forEach(el => {
        el.remove();
    });
    
    // Supprimer les classes ajoutées précédemment
    document.querySelectorAll('.preview-correct-option, .preview-incorrect-option').forEach(el => {
        el.classList.remove('preview-correct-option', 'preview-incorrect-option');
    });
    
    // Convertir tous les champs de saisie en texte statique
    convertInputsToStaticText();
    
    // Afficher le type de question sélectionné
    displaySelectedQuestionTypes();
    
    // Masquer les éléments d'édition
    hideEditElements();
    
    // Formater les feedbacks
    formatFeedbacks();
    
    // Afficher les réponses Vrai/Faux
    displayTrueFalseAnswers();
    
    // Gérer l'affichage des QRC (sensibilité à la casse)
    formatShortAnswers();
    
    // Appliquer les styles globaux pour l'alignement
    applyGlobalStyles();
}

/**
 * Désactive le mode prévisualisation
 */
function deactivatePreviewMode() {
    document.body.classList.remove('preview-mode');
    
    // Mettre à jour le label du mode
    const modeLabel = document.querySelector('.mode-label');
    if (modeLabel) {
        modeLabel.textContent = 'Mode édition';
    }
    
    // Restaurer tous les éléments originaux
    restoreOriginalElements();
}

/**
 * Convertit tous les champs de saisie en texte statique
 */
function convertInputsToStaticText() {
    // Traiter les identifiants de question
    document.querySelectorAll('[id^="question-id-"]').forEach(input => {
        const questionId = input.id.replace('question-id-', '');
        const questionContainer = document.querySelector(`.question-container[data-id="${questionId}"]`);
        
        // Créer l'élément de prévisualisation pour l'ID
        const previewElement = document.createElement('div');
        previewElement.className = 'preview-text';
        
        if (input.value.trim()) {
            // ID manuel
            previewElement.textContent = input.value.trim();
        } else {
            // ID automatique
            previewElement.className = 'preview-auto-id';
            const courseCode = document.getElementById('course-code').value.trim();
            const questions = document.querySelectorAll('.question-container');
            let questionNumber = 0;
            
            // Trouver l'index de la question actuelle
            for (let i = 0; i < questions.length; i++) {
                if (questions[i] === questionContainer) {
                    questionNumber = i + 1;
                    break;
                }
            }
            
            const autoId = courseCode ? 
                `${courseCode}-Q${questionNumber.toString().padStart(2, '0')}` : 
                `Q${questionNumber.toString().padStart(2, '0')}`;
            
            previewElement.textContent = autoId;
        }
        
        // Ajouter l'élément de prévisualisation après le label
        const label = input.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.textContent = 'Identifiant:';
            label.after(previewElement);
        }
        
        // Masquer l'input original
        input.style.display = 'none';
    });
    
    // Traiter les textes de question
    document.querySelectorAll('[id^="question-text-"]').forEach(input => {
        if (input.value.trim()) {
            const previewElement = document.createElement('div');
            previewElement.className = 'preview-text';
            previewElement.textContent = input.value.trim();
            
            const label = input.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                label.after(previewElement);
            }
            
            input.style.display = 'none';
        } else {
            // Masquer complètement le groupe si le texte de la question est vide
            const parentGroup = input.closest('.form-group');
            if (parentGroup) {
                parentGroup.style.display = 'none';
            }
        }
    });
    
    // Traiter les options QCM et QCU avec icônes visuelles
    document.querySelectorAll('.option-container').forEach(option => {
        // Vérifier si l'option est vide
        const textInputs = option.querySelectorAll('input[type="text"]');
        let hasContent = false;
        
        textInputs.forEach(input => {
            // Ne traiter que les champs de texte d'option (pas les feedbacks)
            if (input.id && (
                input.id.includes('option-text-') || 
                input.id.includes('sc-option-text-') || 
                input.id.includes('sa-option-text-')
            ) && input.value.trim()) {
                hasContent = true;
                const previewElement = document.createElement('div');
                previewElement.className = 'preview-text';
                previewElement.textContent = input.value.trim();
                
                // Traitement différent selon le type d'input
                const radioOrCheckbox = option.querySelector('input[type="radio"], input[type="checkbox"]');
                
                // Créer une icône visuelle pour remplacer la case à cocher/bouton radio
                if (radioOrCheckbox) {
                    // Masquer l'élément original
                    radioOrCheckbox.style.display = 'none';
                    
                    // Créer l'icône
                    const isChecked = radioOrCheckbox.checked;
                    const iconElement = document.createElement('span');
                    iconElement.className = isChecked ? 'preview-icon correct' : 'preview-icon incorrect';
                    iconElement.innerHTML = isChecked ? '✓' : '✗';
                    
                    // Ajouter l'icône avant le texte
                    option.insertBefore(iconElement, radioOrCheckbox.nextSibling);
                    
                    // Ajouter aussi la classe au conteneur pour le styliser
                    option.classList.add(isChecked ? 'preview-correct-option' : 'preview-incorrect-option');
                    
                    // Pour QCM seulement - afficher la pondération
                    if (input.id.includes('option-text-')) { // QCM
                        const weightSelect = option.querySelector('.weight-input');
                        if (weightSelect) {
                            const weightValue = parseFloat(weightSelect.value);
                            
                            // Créer un badge pour la pondération
                            const weightBadge = document.createElement('span');
                            weightBadge.className = 'preview-weight-badge';
                            
                            // Ajouter des classes supplémentaires en fonction de la valeur
                            if (weightValue > 0) {
                                weightBadge.classList.add('positive');
                            } else if (weightValue < 0) {
                                weightBadge.classList.add('negative');
                            } else {
                                weightBadge.classList.add('neutral');
                            }
                            
                            // Formater la valeur pour l'affichage
                            weightBadge.textContent = weightValue > 0 ? `+${weightValue}%` : `${weightValue}%`;
                            
                            // Ajouter le badge après l'icône
                            iconElement.after(weightBadge);
                            
                            // Masquer le sélecteur original
                            weightSelect.style.display = 'none';
                            
                            // Masquer aussi le conteneur de poids
                            const weightContainer = option.querySelector('.weight-container');
                            if (weightContainer) {
                                weightContainer.style.display = 'none';
                            }
                        }
                    }
                }
                
                // Ajouter le texte de l'option
                const anchor = option.querySelector('.preview-weight-badge') || option.querySelector('.preview-icon');
                if (anchor) {
                    anchor.after(previewElement);
                } else if (radioOrCheckbox) {
                    radioOrCheckbox.after(previewElement);
                } else {
                    input.parentNode.insertBefore(previewElement, input.nextSibling);
                }
                
                input.style.display = 'none';
            }
        });
        
        // Masquer les feedbacks (ils seront formatés séparément)
        option.querySelectorAll('[id^="option-feedback-"], [id^="sc-option-feedback-"], [id^="sa-option-feedback-"]').forEach(feedback => {
            feedback.style.display = 'none';
        });
        
        // Masquer le sélecteur de sensibilité à la casse pour QRC
        const caseSelect = option.querySelector('[id^="sa-case-"]');
        if (caseSelect) {
            caseSelect.style.display = 'none';
        }
        
        // Masquer l'option si elle n'a pas de contenu
        if (!hasContent) {
            option.style.display = 'none';
        }
    });
}

/**
 * Masque les éléments d'édition
 */
function hideEditElements() {
    // Masquer les boutons d'ajout et de suppression
    document.querySelectorAll('.add-btn, .remove-btn, .add-question-section').forEach(el => {
        el.style.display = 'none';
    });
    
    // Masquer les textes d'information
    document.querySelectorAll('.info-text').forEach(el => {
        el.style.display = 'none';
    });
    
    // Masquer les groupes de boutons radio
    document.querySelectorAll('.radio-group').forEach(el => {
        el.style.display = 'none';
    });
    
    // Masquer les champs vides
    document.querySelectorAll('.form-group').forEach(group => {
        // Ne pas masquer les groupes qui contiennent des éléments de prévisualisation
        if (group.querySelector('.preview-text, .preview-auto-id, .preview-question-type, .preview-feedback, .preview-tf-answer')) {
            return;
        }
        
        // Vérifier si le groupe contient un champ avec une valeur
        const inputs = group.querySelectorAll('input[type="text"], textarea');
        let allEmpty = true;
        
        inputs.forEach(input => {
            if (input.value.trim()) {
                allEmpty = false;
            }
        });
        
        // Si tous les champs sont vides et ce n'est pas un champ d'ID, masquer le groupe
        if (allEmpty && !group.querySelector('[id^="question-id-"]')) {
            group.style.display = 'none';
        }
    });
    
    // Masquer les conteneurs d'options vides
    document.querySelectorAll('.options-list, .options-list-radio, .sa-options-list').forEach(list => {
        // Vérifier si toutes les options sont masquées
        const options = list.querySelectorAll('.option-container');
        let allHidden = true;
        
        options.forEach(option => {
            if (option.style.display !== 'none') {
                allHidden = false;
            }
        });
        
        // Si toutes les options sont masquées, masquer aussi le conteneur
        if (allHidden) {
            const parentGroup = list.closest('.form-group');
            if (parentGroup) {
                parentGroup.style.display = 'none';
            }
        }
    });
    
    // Masquer les feedbacks vides
    document.querySelectorAll('input[id^="option-feedback-"], input[id^="sc-option-feedback-"], input[id^="sa-option-feedback-"]').forEach(input => {
        if (!input.value.trim()) {
            input.style.display = 'none';
        }
    });
    
    // Masquer les feedbacks généraux vides
    document.querySelectorAll('[id^="general-feedback-"]').forEach(textarea => {
        if (!textarea.value.trim()) {
            const parentGroup = textarea.closest('.form-group');
            if (parentGroup) {
                parentGroup.style.display = 'none';
            }
        }
    });
}

/**
 * Affiche le type de question sélectionné dans l'en-tête de chaque question
 */
function displaySelectedQuestionTypes() {
    document.querySelectorAll('.question-container').forEach(questionContainer => {
        const questionId = questionContainer.dataset.id;
        if (!questionId) return;
        
        // Trouver le type de question sélectionné
        const selectedRadio = questionContainer.querySelector(`input[name="question-type-${questionId}"]:checked`);
        if (!selectedRadio) return;
        
        // Créer un élément d'affichage pour le type de question
        const typeDisplay = document.createElement('div');
        typeDisplay.className = 'preview-question-type';
        
        // Déterminer le libellé à afficher en fonction de la valeur
        let typeLabel = '';
        switch (selectedRadio.value) {
            case 'mc': typeLabel = 'Question à Choix Multiple'; break;
            case 'sc': typeLabel = 'Question à Choix Unique'; break;
            case 'tf': typeLabel = 'Vrai/Faux'; break;
            case 'sa': typeLabel = 'Question à Réponse Courte'; break;
            case 'num': typeLabel = 'Question Numérique'; break;
            default: typeLabel = 'Question'; break;
        }
        
        typeDisplay.textContent = typeLabel;
        
        // Ajouter l'élément d'affichage après le titre h2
        const titleElement = questionContainer.querySelector('h2');
        if (titleElement) {
            titleElement.appendChild(typeDisplay);
        }
    });
}

/**
 * Affiche les réponses pour les questions Vrai/Faux
 */
function displayTrueFalseAnswers() {
    document.querySelectorAll('[id^="tf-options-"]').forEach(tfOptions => {
        if (tfOptions.style.display === 'none') return;
        
        const questionId = tfOptions.id.replace('tf-options-', '');
        const trueRadio = document.getElementById(`true-option-${questionId}`);
        const falseRadio = document.getElementById(`false-option-${questionId}`);
        
        if (!trueRadio || !falseRadio) return;
        
        // Créer un élément pour afficher la réponse mise en valeur
        const answerElement = document.createElement('div');
        answerElement.className = 'preview-tf-answer';
        
        if (trueRadio.checked) {
            answerElement.innerHTML = `
                <div class="tf-answer-container">
                    <span class="preview-icon correct">✓</span>
                    <span class="tf-label">Vrai</span>
                </div>
                <div class="tf-answer-container disabled">
                    <span class="preview-icon incorrect">✗</span>
                    <span class="tf-label">Faux</span>
                </div>
            `;
        } else if (falseRadio.checked) {
            answerElement.innerHTML = `
                <div class="tf-answer-container disabled">
                    <span class="preview-icon incorrect">✗</span>
                    <span class="tf-label">Vrai</span>
                </div>
                <div class="tf-answer-container">
                    <span class="preview-icon correct">✓</span>
                    <span class="tf-label">Faux</span>
                </div>
            `;
        }
        
        // Masquer les boutons radio originaux
        trueRadio.style.display = 'none';
        falseRadio.style.display = 'none';
        
        // Masquer également les labels
        const radioGroup = tfOptions.querySelector('.radio-group');
        if (radioGroup) {
            radioGroup.style.display = 'none';
        }
        
        // Ajouter cet élément après le label de la section
        const sectionLabel = tfOptions.querySelector('label');
        if (sectionLabel) {
            sectionLabel.after(answerElement);
        } else {
            tfOptions.prepend(answerElement);
        }
    });
}

/**
 * Formate l'affichage des questions à réponse courte (QRC)
 */
function formatShortAnswers() {
    document.querySelectorAll('[id^="sa-options-list-"]').forEach(saList => {
        const options = saList.querySelectorAll('.option-container');
        
        options.forEach(option => {
            const questionId = saList.id.replace('sa-options-list-', '');
            const optionId = option.querySelector('.remove-sa-option-btn')?.getAttribute('data-oid');
            
            if (!questionId || !optionId) return;
            
            const caseSelect = document.getElementById(`sa-case-${questionId}-${optionId}`);
            const textInput = document.getElementById(`sa-option-text-${questionId}-${optionId}`);
            const weightInput = document.getElementById(`sa-option-weight-${questionId}-${optionId}`);
            
            if (!textInput || !textInput.value.trim()) return;
            
            // Récupérer l'élément de texte créé précédemment
            const textElement = option.querySelector('.preview-text');
            if (!textElement) return;
            
            // Créer un conteneur pour la réponse formatée
            const answerContainer = document.createElement('div');
            answerContainer.className = 'preview-sa-answer-container';
            
            // Créer l'icône de réponse acceptée
            const iconElement = document.createElement('span');
            iconElement.className = 'preview-icon correct';
            iconElement.innerHTML = '✓';
            
            // Créer le texte de la réponse
            const textSpan = document.createElement('span');
            textSpan.className = 'sa-text';
            textSpan.textContent = textInput.value.trim();
            
            // Ajouter l'info de sensibilité à la casse
            if (caseSelect && caseSelect.value) {
                const caseInfo = document.createElement('span');
                caseInfo.className = 'sa-case-info';
                
                if (caseSelect.value === 'case_sensitive') {
                    caseInfo.textContent = '(sensible à la casse)';
                } else if (caseSelect.value === 'case_insensitive') {
                    caseInfo.textContent = '(insensible à la casse)';
                }
                
                textSpan.appendChild(document.createTextNode(' '));
                textSpan.appendChild(caseInfo);
            }
            
            // Créer le badge de pondération
            const weightBadge = document.createElement('span');
            weightBadge.className = 'preview-weight-badge positive';
            weightBadge.textContent = `${weightInput ? weightInput.value : '100'}%`;
            
            // Assembler les éléments
            answerContainer.appendChild(iconElement);
            answerContainer.appendChild(textSpan);
            answerContainer.appendChild(weightBadge);
            
            // Remplacer l'élément de texte par le conteneur formaté
            textElement.replaceWith(answerContainer);
            
            // Masquer l'entrée de pondération
            if (weightInput) {
                weightInput.style.display = 'none';
                // Masquer aussi le conteneur de poids
                const weightContainer = option.querySelector('.sa-weight-container');
                if (weightContainer) {
                    weightContainer.style.display = 'none';
                }
            }
        });
    });
}

/**
 * Formate les feedbacks pour une meilleure lisibilité
 */
function formatFeedbacks() {
    // Traiter les feedbacks généraux
    document.querySelectorAll('[id^="general-feedback-"]').forEach(textarea => {
        if (textarea.value.trim()) {
            // Créer un élément de prévisualisation pour le feedback
            const feedbackElement = document.createElement('div');
            feedbackElement.className = 'preview-feedback';
            feedbackElement.innerHTML = `<strong>Feedback:</strong> ${textarea.value.trim()}`;
            
            // Insérer après l'élément textarea
            textarea.after(feedbackElement);
            
            // Masquer le textarea original
            textarea.style.display = 'none';
            
            // Masquer aussi le label pour éviter la redondance
            const feedbackLabel = textarea.previousElementSibling;
            if (feedbackLabel && feedbackLabel.tagName === 'LABEL') {
                feedbackLabel.style.display = 'none';
            }
        }
    });
    
    // Traiter les feedbacks d'options (pour QCM, QCU et QRC)
    document.querySelectorAll('[id^="option-feedback-"], [id^="sc-option-feedback-"], [id^="sa-option-feedback-"]').forEach(input => {
        if (input.value.trim()) {
            // Vérifier que l'élément parent est visible
            const optionContainer = input.closest('.option-container');
            if (optionContainer && optionContainer.style.display !== 'none') {
                // Créer un élément de prévisualisation pour le feedback
                const feedbackElement = document.createElement('div');
                feedbackElement.className = 'preview-option-feedback';
                feedbackElement.innerHTML = `<em>Feedback: ${input.value.trim()}</em>`;
                
                // Trouver où insérer le feedback (après le conteneur de réponse ou après le texte)
                const insertAfter = optionContainer.querySelector('.preview-sa-answer-container') || 
                                   optionContainer.querySelector('.preview-text');
                
                if (insertAfter) {
                    insertAfter.after(feedbackElement);
                } else {
                    // Si pas de texte de prévisualisation, ajouter à la fin du conteneur
                    optionContainer.appendChild(feedbackElement);
                }
            }
        }
    });
}

/**
 * Applique des améliorations de style global pour l'alignement
 */
function applyGlobalStyles() {
    // Améliorer la mise en page des options
    document.querySelectorAll('.option-container').forEach(option => {
        if (option.style.display !== 'none') {
            option.style.display = 'flex';
            option.style.alignItems = 'flex-start';
            option.style.flexWrap = 'wrap';
            
            // Appliquer une marge pour les éléments de feedback
            const feedback = option.querySelector('.preview-option-feedback');
            if (feedback) {
                feedback.style.width = '100%';
                feedback.style.marginLeft = '30px';
                feedback.style.marginTop = '5px';
            }
        }
    });
    
    // Améliorer la mise en page des questions Vrai/Faux
    document.querySelectorAll('.preview-tf-answer').forEach(tfAnswer => {
        tfAnswer.style.display = 'flex';
        tfAnswer.style.gap = '20px';
        tfAnswer.style.marginTop = '10px';
    });
}

/**
 * Restaure les éléments originaux après désactivation du mode prévisualisation
 */
function restoreOriginalElements() {
    // Supprimer les éléments de prévisualisation
    document.querySelectorAll('.preview-text, .preview-auto-id, .preview-question-type, .preview-feedback, .preview-option-feedback, .preview-icon, .preview-weight-badge, .preview-tf-answer, .preview-sa-answer-container, .tf-answer-container').forEach(el => {
        el.remove();
    });
    
    // Supprimer les classes ajoutées
    document.querySelectorAll('.preview-correct-option, .preview-incorrect-option').forEach(el => {
        el.classList.remove('preview-correct-option', 'preview-incorrect-option');
    });
    
    // Restaurer l'affichage des champs originaux
    document.querySelectorAll('input, textarea, select, .form-group, .radio-group, .option-container, .options-list, .options-list-radio, .sa-options-list, .weight-container, .sa-weight-container').forEach(el => {
        el.style.display = '';
    });
    
    // Restaurer l'affichage des boutons et autres éléments
    document.querySelectorAll('.add-btn, .remove-btn, .add-question-section, .info-text').forEach(el => {
        el.style.display = '';
    });
    
    // Restaurer les styles des conteneurs d'options
    document.querySelectorAll('.option-container').forEach(option => {
        option.style.display = '';
        option.style.alignItems = '';
        option.style.flexWrap = '';
    });
    
    // Restaurer les libellés originaux
    document.querySelectorAll('[id^="question-id-"]').forEach(input => {
        const label = input.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.textContent = 'Identifiant/Numéro de question: (facultatif)';
        }
    });
    
    // Restaurer les libellés de feedback
    document.querySelectorAll('[id^="general-feedback-"]').forEach(textarea => {
        const label = textarea.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.style.display = '';
        }
    });
}