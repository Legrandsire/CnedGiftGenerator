/**
 * previewMode.js
 * Gestion du mode prévisualisation du générateur de code GIFT
 * 
 * Ce fichier permet de basculer entre le mode d'édition et le mode de prévisualisation,
 * permettant aux utilisateurs de voir leur questionnaire sans les éléments d'édition.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le mode prévisualisation
    initPreviewMode();
});

/**
 * Initialise le mode prévisualisation
 */
function initPreviewMode() {
    // Ajouter le bouton de prévisualisation à la page
    createPreviewButton();
    
    // Initialiser l'état du mode (par défaut: mode édition)
    window.isPreviewMode = false;
}

/**
 * Crée et ajoute le bouton de prévisualisation à la page
 */
function createPreviewButton() {
    // Créer le bouton de prévisualisation
    const previewButton = document.createElement('button');
    previewButton.id = 'preview-toggle-btn';
    previewButton.className = 'preview-btn';
    previewButton.innerHTML = '<span class="preview-icon">👁️</span> <span class="preview-text">Prévisualiser</span>';
    previewButton.title = "Activer/désactiver le mode prévisualisation";
    
    // Ajouter le bouton au body pour qu'il soit positionné de manière fixe
    document.body.appendChild(previewButton);
    
    // Événement de clic pour basculer entre les modes
    previewButton.addEventListener('click', function() {
        togglePreviewMode();
    });
}

/**
 * Bascule entre le mode édition et le mode prévisualisation avec un meilleur maintien de la position
 */
function togglePreviewMode() {
    // Inverser l'état actuel
    window.isPreviewMode = !window.isPreviewMode;
    
    // Trouver la question visible actuellement au centre de l'écran
    const visibleQuestion = findVisibleQuestion();
    
    // Mettre à jour l'apparence du bouton
    updatePreviewButtonAppearance();
    
    // Appliquer les transformations en fonction du mode
    if (window.isPreviewMode) {
        applyPreviewMode();
    } else {
        restoreEditMode();
    }
    
    // Restaurer la vue sur la même question après transformation
    if (visibleQuestion) {
        setTimeout(() => {
            scrollQuestionToView(visibleQuestion);
        }, 50);
    }
}

/**
 * Met à jour l'apparence du bouton de prévisualisation selon le mode actif
 */
function updatePreviewButtonAppearance() {
    const previewButton = document.getElementById('preview-toggle-btn');
    
    if (previewButton) {
        if (window.isPreviewMode) {
            previewButton.innerHTML = '<span class="preview-icon">✏️</span> <span class="preview-text">Éditer</span>';
            previewButton.classList.add('active-preview');
        } else {
            previewButton.innerHTML = '<span class="preview-icon">👁️</span> <span class="preview-text">Prévisualiser</span>';
            previewButton.classList.remove('active-preview');
        }
    }
}

/**
 * Applique les transformations pour le mode prévisualisation
 */
function applyPreviewMode() {
    // Ajouter une classe au body pour faciliter le styling CSS
    document.body.classList.add('preview-mode');
    
    // Transformations générales
    hideEditingElements();
    transformQuestionsForPreview();
}

/**
 * Restaure les transformations pour revenir au mode édition
 */
function restoreEditMode() {
    // Retirer la classe du body
    document.body.classList.remove('preview-mode');
    
    // Restaurer les éléments d'édition
    showEditingElements();
    restoreQuestionsForEditing();
}

/**
 * Cache les éléments d'interface liés à l'édition, y compris les sélecteurs de type de question
 */
function hideEditingElements() {
    // Cacher les boutons d'ajout/suppression de questions
    const addQuestionBtn = document.getElementById('add-question-btn');
    if (addQuestionBtn) {
        addQuestionBtn.classList.add('preview-hidden');
    }
    
    // Cacher la section d'ajout de question
    const addQuestionSection = document.querySelector('.add-question-section');
    if (addQuestionSection) {
        addQuestionSection.classList.add('preview-hidden');
    }
    
    // Cacher les sélecteurs de type de question
    document.querySelectorAll('.radio-group').forEach(group => {
        group.classList.add('preview-hidden');
    });
    
    // Cacher les boutons de suppression de question
    document.querySelectorAll('.remove-question-btn').forEach(btn => {
        btn.classList.add('preview-hidden');
    });
    
    // Cacher les boutons d'ajout d'options
    document.querySelectorAll('.add-option-btn, .add-sc-option-btn, .add-sa-option-btn').forEach(btn => {
        btn.classList.add('preview-hidden');
    });
    
    // Cacher les boutons de suppression d'options
    document.querySelectorAll('.remove-option-btn, .remove-sc-option-btn, .remove-sa-option-btn').forEach(btn => {
        btn.classList.add('preview-hidden');
    });
    
    // Cacher les textes d'aide et informations
    document.querySelectorAll('.info-text').forEach(infoText => {
        infoText.classList.add('preview-hidden');
    });
    
    // Cacher les labels "facultatif"
    document.querySelectorAll('.optional-field').forEach(field => {
        field.classList.add('preview-hidden');
    });
}


/**
 * Réaffiche les éléments d'interface liés à l'édition
 */
function showEditingElements() {
    // Réafficher tous les éléments avec la classe preview-hidden
    document.querySelectorAll('.preview-hidden').forEach(element => {
        element.classList.remove('preview-hidden');
    });
    
    // Supprimer tous les éléments créés spécifiquement pour la prévisualisation
    document.querySelectorAll('.preview-element').forEach(element => {
        element.remove();
    });
}

/**
 * Transforme les questions pour le mode prévisualisation
 */
function transformQuestionsForPreview() {
    // Traiter chaque question
    const questions = document.querySelectorAll('.question-container');
    
    questions.forEach((question, index) => {
        const questionId = question.dataset.id;
        if (!questionId) return;
        
        // Transformer les en-têtes de question pour inclure le type
        transformQuestionHeader(question, questionId);
        
        // Transformer l'identifiant de question
        transformQuestionId(question, questionId);
        
        // Transformer le texte de la question
        transformQuestionText(question, questionId);
        
        // Transformer les options de réponse selon le type de question
        const questionType = getSelectedQuestionType(questionId);
        transformQuestionOptions(question, questionId, questionType);
        
        // Transformer le feedback général
        transformGeneralFeedback(question, questionId);
    });
}

/**
 * Restaure les questions pour le mode édition
 */
function restoreQuestionsForEditing() {
    // Supprimer les éléments de prévisualisation
    document.querySelectorAll('.preview-display').forEach(element => {
        element.remove();
    });
    
    // Réafficher les éléments originaux
    document.querySelectorAll('.preview-hidden-field').forEach(element => {
        element.classList.remove('preview-hidden-field');
    });
    
    // Rendre à nouveau éditables les champs qui ont été rendus en lecture seule
    document.querySelectorAll('input[data-original-readonly="false"], textarea[data-original-readonly="false"]').forEach(field => {
        field.readOnly = false;
        field.removeAttribute('data-original-readonly');
    });
    
    // Remettre les sélecteurs de question visibles
    document.querySelectorAll('.radio-group').forEach(group => {
        group.classList.remove('preview-hidden-field');
    });
}

/**
 * Transforme l'en-tête de question pour inclure le type de question
 */
function transformQuestionHeader(question, questionId) {
    const headerElement = question.querySelector('h2');
    if (!headerElement) return;
    
    // Récupérer le texte actuel (numéro de question)
    const questionNumber = headerElement.textContent.trim();
    
    // Récupérer le type de question et son libellé
    const questionType = getSelectedQuestionType(questionId);
    const typeLabel = getQuestionTypeLabel(questionType);
    
    // Créer un nouvel en-tête combinant le numéro et le type de question
    const previewHeader = document.createElement('div');
    previewHeader.className = 'preview-display preview-header-container';
    previewHeader.innerHTML = `
        <h2 class="preview-question-number">${questionNumber}</h2>
        <div class="preview-question-type">${typeLabel}</div>
    `;
    
    // Remplacer l'en-tête original
    headerElement.parentNode.insertBefore(previewHeader, headerElement);
    headerElement.classList.add('preview-hidden-field');
    
    // Masquer le label "Type de question" s'il existe
    const typeLabels = question.querySelectorAll('label[for^="question-type-"]');
    typeLabels.forEach(label => {
        label.classList.add('preview-hidden-field');
    });
}
/**
 * Transforme l'identifiant de question
 */
function transformQuestionId(question, questionId) {
    const idField = document.getElementById(`question-id-${questionId}`);
    if (!idField) return;
    
    // Récupérer la valeur de l'identifiant
    let idValue = idField.value.trim();
    
    // Si vide, afficher l'identifiant auto-généré
    if (!idValue) {
        const courseCode = document.getElementById('course-code').value.trim();
        const prefix = courseCode ? courseCode : "Q";
        const questionNumber = questionId.toString().padStart(2, '0');
        idValue = `${prefix}-Q${questionNumber}`;
    }
    
    // Créer l'élément d'affichage de l'ID
    const idDisplay = document.createElement('div');
    idDisplay.className = 'preview-display preview-id';
    idDisplay.textContent = idValue;
    
    // Ajouter l'élément à la question
    question.insertBefore(idDisplay, question.firstChild);
    
    // Cacher le champ original et son label
    const idFormGroup = idField.closest('.form-group');
    if (idFormGroup) {
        idFormGroup.classList.add('preview-hidden-field');
    }
}

/**
 * Transforme le texte de la question
 */
function transformQuestionText(question, questionId) {
    const textField = document.getElementById(`question-text-${questionId}`);
    if (!textField) return;
 
    // CORRECTION : getRichTextValue au lieu de .value.trim()
    const questionText = getRichTextValue(`question-text-${questionId}`);
 
    const textDisplay = document.createElement('div');
    textDisplay.className = 'preview-display preview-question-text';
 
    if (!questionText) {
        textDisplay.innerHTML = '<em class="preview-missing">Texte de la question manquant</em>';
    } else {
        // CORRECTION : innerHTML pour conserver la mise en forme HTML
        textDisplay.innerHTML = questionText;
    }
 
    const formGroup = textField.closest('.form-group');
    if (formGroup) {
        formGroup.parentNode.insertBefore(textDisplay, formGroup);
        formGroup.classList.add('preview-hidden-field');
    }
}

/**
 * Transforme les options de réponse selon le type de question
 */
function transformQuestionOptions(question, questionId, questionType) {
    // Cacher tous les conteneurs d'options
    const allOptionsContainers = question.querySelectorAll('[id^="mc-options-"], [id^="sc-options-"], [id^="tf-options-"], [id^="sa-options-"], [id^="num-options-"]');
    allOptionsContainers.forEach(container => {
        container.classList.add('preview-hidden-field');
    });
    
    // Créer le conteneur pour les options en prévisualisation
    const optionsDisplay = document.createElement('div');
    optionsDisplay.className = 'preview-display preview-options';
    
    // Ajouter le titre "Réponses"
    const optionsTitle = document.createElement('h3');
    optionsTitle.className = 'preview-options-title';
    optionsTitle.textContent = 'Réponses';
    optionsDisplay.appendChild(optionsTitle);
    
    // Transformer les options selon le type de question
    switch (questionType) {
        case 'mc':
            transformMCOptions(optionsDisplay, questionId);
            break;
        case 'sc':
            transformSCOptions(optionsDisplay, questionId);
            break;
        case 'tf':
            transformTFOptions(optionsDisplay, questionId);
            break;
        case 'sa':
            transformSAOptions(optionsDisplay, questionId);
            break;
        case 'num':
            transformNumOptions(optionsDisplay, questionId);
            break;
    }
    
    // Ajouter le conteneur d'options transformées à la question
    question.appendChild(optionsDisplay);
}

/**
 * Transforme les options QCM
 */
function transformMCOptions(container, questionId) {
    const optionsList = document.getElementById(`options-list-${questionId}`);
    if (!optionsList) return;
 
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'preview-options-list';
 
    const options = optionsList.querySelectorAll('.option-container');
    options.forEach((option) => {
        const optionId   = option.querySelector('.remove-option-btn').getAttribute('data-oid');
        const isCorrect  = option.querySelector('.correct-option').checked;
 
        // CORRECTION : getRichTextValue au lieu de .value.trim()
        const optionText   = getRichTextValue(`option-text-${questionId}-${optionId}`);
        const feedbackText = getRichTextValue(`option-feedback-${questionId}-${optionId}`);
 
        const weightSelect    = document.getElementById(`option-weight-${questionId}-${optionId}`);
        const weight          = weightSelect ? weightSelect.value : '0';
        const formattedWeight = formatWeight(weight);
 
        const optionElement = document.createElement('div');
        optionElement.className = `preview-option ${isCorrect ? 'preview-option-correct' : 'preview-option-incorrect'}`;
 
        // Icône de validité
        const validityIcon = document.createElement('span');
        validityIcon.className = 'preview-validity-icon';
        validityIcon.textContent = isCorrect ? '✓' : '✗';
        optionElement.appendChild(validityIcon);
 
        // CORRECTION : innerHTML pour conserver la mise en forme HTML
        const textElement = document.createElement('span');
        textElement.className = 'preview-option-text';
        if (optionText) {
            textElement.innerHTML = optionText;
        } else {
            textElement.innerHTML = '<em class="preview-missing">Texte de l\'option manquant</em>';
        }
        optionElement.appendChild(textElement);
 
        // Pondération
        if (isCorrect || parseFloat(weight) < 0) {
            const weightElement = document.createElement('span');
            weightElement.className = 'preview-option-weight';
            weightElement.textContent = `${formattedWeight}%`;
            optionElement.appendChild(weightElement);
        }
 
        // CORRECTION : innerHTML pour le feedback
        if (feedbackText) {
            const feedbackElement = document.createElement('div');
            feedbackElement.className = 'preview-option-feedback';
            feedbackElement.innerHTML = feedbackText;
            optionElement.appendChild(feedbackElement);
        }
 
        optionsContainer.appendChild(optionElement);
    });
 
    container.appendChild(optionsContainer);
}

/**
 * Transforme les options QCU
 */
function transformSCOptions(container, questionId) {
    const optionsList = document.getElementById(`sc-options-list-${questionId}`);
    if (!optionsList) return;
 
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'preview-options-list';
 
    const options = optionsList.querySelectorAll('.option-container');
    options.forEach((option) => {
        const optionId   = option.querySelector('.remove-sc-option-btn').getAttribute('data-oid');
        const isCorrect  = option.querySelector('.correct-sc-option').checked;
 
        // CORRECTION : getRichTextValue au lieu de .value.trim()
        const optionText   = getRichTextValue(`sc-option-text-${questionId}-${optionId}`);
        const feedbackText = getRichTextValue(`sc-option-feedback-${questionId}-${optionId}`);
 
        const optionElement = document.createElement('div');
        optionElement.className = `preview-option ${isCorrect ? 'preview-option-correct' : 'preview-option-incorrect'}`;
 
        // Icône de validité
        const validityIcon = document.createElement('span');
        validityIcon.className = 'preview-validity-icon';
        validityIcon.textContent = isCorrect ? '✓' : '✗';
        optionElement.appendChild(validityIcon);
 
        // CORRECTION : innerHTML pour conserver la mise en forme HTML
        const textElement = document.createElement('span');
        textElement.className = 'preview-option-text';
        if (optionText) {
            textElement.innerHTML = optionText;
        } else {
            textElement.innerHTML = '<em class="preview-missing">Texte de l\'option manquant</em>';
        }
        optionElement.appendChild(textElement);
 
        // CORRECTION : innerHTML pour le feedback
        if (feedbackText) {
            const feedbackElement = document.createElement('div');
            feedbackElement.className = 'preview-option-feedback';
            feedbackElement.innerHTML = feedbackText;
            optionElement.appendChild(feedbackElement);
        }
 
        optionsContainer.appendChild(optionElement);
    });
 
    container.appendChild(optionsContainer);
}

/**
 * Transforme les options Vrai/Faux
 */
function transformTFOptions(container, questionId) {
    const isTrueCorrect = document.getElementById(`true-option-${questionId}`).checked;
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'preview-options-list preview-tf-options';
    
    // Option Vrai
    const trueOption = document.createElement('div');
    trueOption.className = `preview-option ${isTrueCorrect ? 'preview-option-correct' : 'preview-option-incorrect'}`;
    trueOption.innerHTML = `
        <span class="preview-validity-icon">${isTrueCorrect ? '✓' : '✗'}</span>
        <span class="preview-option-text">Vrai</span>
    `;
    optionsContainer.appendChild(trueOption);
    
    // Option Faux
    const falseOption = document.createElement('div');
    falseOption.className = `preview-option ${!isTrueCorrect ? 'preview-option-correct' : 'preview-option-incorrect'}`;
    falseOption.innerHTML = `
        <span class="preview-validity-icon">${!isTrueCorrect ? '✓' : '✗'}</span>
        <span class="preview-option-text">Faux</span>
    `;
    optionsContainer.appendChild(falseOption);
    
    container.appendChild(optionsContainer);
}

/**
 * Transforme les options QRC
 */
function transformSAOptions(container, questionId) {
    const optionsList = document.getElementById(`sa-options-list-${questionId}`);
    if (!optionsList) return;
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'preview-options-list';
    
    // Traiter chaque réponse acceptable
    const options = optionsList.querySelectorAll('.option-container');
    options.forEach((option, index) => {
        const optionId = option.querySelector('.remove-sa-option-btn').getAttribute('data-oid');
        const caseType = document.getElementById(`sa-case-${questionId}-${optionId}`).value;
        const answerText = document.getElementById(`sa-option-text-${questionId}-${optionId}`).value.trim();
        const weight = document.getElementById(`sa-option-weight-${questionId}-${optionId}`).value.trim();
        const feedbackElement = document.getElementById(`sa-option-feedback-${questionId}-${optionId}`);
        const feedbackText = feedbackElement ? feedbackElement.value.trim() : '';
        
        // Créer l'élément de réponse
        const optionElement = document.createElement('div');
        optionElement.className = 'preview-option preview-option-correct';
        
        // Icône de validité
        const validityIcon = document.createElement('span');
        validityIcon.className = 'preview-validity-icon';
        validityIcon.textContent = '✓';
        optionElement.appendChild(validityIcon);
        
        // Texte de la réponse
        const textElement = document.createElement('span');
        textElement.className = 'preview-option-text';
        if (answerText) {
            textElement.textContent = answerText;
        } else {
            textElement.innerHTML = '<em class="preview-missing">Texte de la réponse manquant</em>';
        }
        optionElement.appendChild(textElement);
        
        // Sensibilité à la casse (si spécifiée)
        if (caseType) {
            const caseLabel = document.createElement('span');
            caseLabel.className = 'preview-option-case';
            caseLabel.textContent = caseType === 'case_sensitive' ? '(Sensible à la casse)' : '(Insensible à la casse)';
            optionElement.appendChild(caseLabel);
        }
        
        // Pondération
        if (weight) {
            const weightElement = document.createElement('span');
            weightElement.className = 'preview-option-weight';
            weightElement.textContent = `${formatWeight(weight)}%`;
            optionElement.appendChild(weightElement);
        }
        
        // Feedback (seulement s'il est présent)
        if (feedbackText) {
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'preview-option-feedback';
            feedbackDiv.textContent = `Feedback: ${feedbackText}`;
            optionElement.appendChild(feedbackDiv);
        }
        
        // Ajouter l'option au conteneur
        optionsContainer.appendChild(optionElement);
    });
    
    container.appendChild(optionsContainer);
}

/**
 * Transforme les options Numérique
 */
function transformNumOptions(container, questionId) {
    const answer = document.getElementById(`num-answer-${questionId}`).value.trim();
    const useRange = document.getElementById(`num-range-${questionId}`).checked;
    const margin = useRange ? document.getElementById(`num-margin-${questionId}`).value.trim() : '';
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'preview-options-list preview-num-options';
    
    // Élément de réponse
    const optionElement = document.createElement('div');
    optionElement.className = 'preview-option preview-option-correct';
    
    // Icône de validité
    const validityIcon = document.createElement('span');
    validityIcon.className = 'preview-validity-icon';
    validityIcon.textContent = '✓';
    optionElement.appendChild(validityIcon);
    
    // Texte de la réponse
    const textElement = document.createElement('span');
    textElement.className = 'preview-option-text';
    
    if (answer) {
        textElement.textContent = answer;
        
        // Ajouter la marge d'erreur si elle est utilisée
        if (useRange && margin) {
            const marginElement = document.createElement('span');
            marginElement.className = 'preview-option-margin';
            marginElement.textContent = ` ± ${margin}`;
            textElement.appendChild(marginElement);
        }
    } else {
        textElement.innerHTML = '<em class="preview-missing">Réponse numérique manquante</em>';
    }
    
    optionElement.appendChild(textElement);
    optionsContainer.appendChild(optionElement);
    container.appendChild(optionsContainer);
}

/**
 * Transforme le feedback général
 */
function transformGeneralFeedback(question, questionId) {
    // CORRECTION : getRichTextValue au lieu de .value.trim()
    const feedbackText = getRichTextValue(`general-feedback-${questionId}`);
    if (!feedbackText) return;
 
    const feedbackDisplay = document.createElement('div');
    feedbackDisplay.className = 'preview-display preview-general-feedback';
 
    const feedbackLabel = document.createElement('strong');
    feedbackLabel.textContent = 'Feedback général : ';
    feedbackDisplay.appendChild(feedbackLabel);
 
    const feedbackContent = document.createElement('span');
    // CORRECTION : innerHTML pour conserver la mise en forme HTML
    feedbackContent.innerHTML = feedbackText;
    feedbackDisplay.appendChild(feedbackContent);
 
    question.appendChild(feedbackDisplay);
 
    // Masquer le champ original
    const feedbackField = document.getElementById(`general-feedback-${questionId}`);
    if (feedbackField) {
        const formGroup = feedbackField.closest('.form-group') || feedbackField.closest('.rte-container');
        if (formGroup) formGroup.classList.add('preview-hidden-field');
    }
}

/**
 * Récupère le type de question sélectionné
 */
function getSelectedQuestionType(questionId) {
    const radioButtons = document.querySelectorAll(`input[name="question-type-${questionId}"]:checked`);
    if (radioButtons.length > 0) {
        return radioButtons[0].value;
    }
    return 'mc'; // Type par défaut
}

/**
 * Obtient le libellé du type de question
 */
function getQuestionTypeLabel(questionType) {
    switch (questionType) {
        case 'mc':
            return 'Question à Choix Multiple (QCM)';
        case 'sc':
            return 'Question à Choix Unique (QCU)';
        case 'tf':
            return 'Question Vrai/Faux';
        case 'sa':
            return 'Question à Réponse Courte (QRC)';
        case 'num':
            return 'Question Numérique';
        default:
            return 'Question à Choix Multiple (QCM)';
    }
}

// Exposer les fonctions principales dans l'espace global pour permettre leur utilisation depuis d'autres scripts
window.togglePreviewMode = togglePreviewMode;
window.isPreviewModeActive = function() {
    return window.isPreviewMode || false;
};

/**
 * Fait défiler la fenêtre pour centrer une question spécifique
 * @param {Element} questionElement - L'élément de question à centrer
 */
function scrollQuestionToView(questionElement) {
    if (!questionElement) return;
    
    const rect = questionElement.getBoundingClientRect();
    const questionHeight = rect.height;
    const windowHeight = window.innerHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // Calculer la position pour centrer la question
    const targetScrollTop = (rect.top + scrollTop) - (windowHeight / 2 - questionHeight / 2);
    
    window.scrollTo({
        top: targetScrollTop,
        behavior: 'auto'
    });
}

/**
 * Trouve la question actuellement visible dans la fenêtre
 * @returns {Element|null} - L'élément de question visible ou null
 */
function findVisibleQuestion() {
    const questions = document.querySelectorAll('.question-container');
    const windowHeight = window.innerHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const viewportCenter = scrollTop + windowHeight / 2;
    
    let closestQuestion = null;
    let closestDistance = Infinity;
    
    questions.forEach(question => {
        const rect = question.getBoundingClientRect();
        const questionTop = rect.top + scrollTop;
        const questionCenter = questionTop + rect.height / 2;
        const distance = Math.abs(questionCenter - viewportCenter);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestQuestion = question;
        }
    });
    
    return closestQuestion;
}

/**
 * Formate la valeur de pondération avec maximum 2 décimales
 * @param {string} weight - La valeur de pondération
 * @returns {string} - La valeur formatée
 */
function formatWeight(weight) {
    const numWeight = parseFloat(weight);
    
    // Si c'est un nombre entier, pas de décimales
    if (Number.isInteger(numWeight)) {
        return numWeight.toString();
    }
    
    // Sinon, limiter à 2 décimales maximum
    return numWeight.toFixed(2).replace(/\.00$/, '').replace(/0+$/, '0').replace(/\.$/, '');
}
