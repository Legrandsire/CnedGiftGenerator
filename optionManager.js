// Fonction pour ajouter une option QCM
function addOption(questionId, optionsListElement) {
    const optionId = optionsListElement.children.length + 1;
    
    // Vérifier si c'est la première option ajoutée à cette question
    const isFirstOptionAddedToQuestion = document.getElementById(`mc-options-reminder-${questionId}`) === null;
    
    // Si c'est la première option et qu'on doit ajouter le rappel
    if (isFirstOptionAddedToQuestion) {
        const reminderDiv = document.createElement('div');
        reminderDiv.id = `mc-options-reminder-${questionId}`;
        reminderDiv.className = 'weight-reminder';
        reminderDiv.innerHTML = '<p class="info-text"><strong>Rappel :</strong> Le total des coefficients des bonnes réponses ne doit pas dépasser 100%.</p>';
        
        // Trouver l'élément parent où insérer le rappel
        const mcOptionsDiv = document.getElementById(`mc-options-${questionId}`);
        // Insérer le rappel au début du conteneur d'options
        mcOptionsDiv.insertBefore(reminderDiv, mcOptionsDiv.firstChild);
    }
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-container';
    
    // Créer le HTML pour le conteneur d'options avec le nouveau select personnalisé
    let selectHtml = `<select id="option-weight-${questionId}-${optionId}" class="weight-input" title="Pondération en pourcentage">`;
    
    // Liste des valeurs de pondération avec leur affichage avec 2 décimales pour les valeurs décimales
    // Sans arrondir (par exemple 66,66 au lieu de 66,67)
    const weightOptions = [
        { value: "0", display: "0%" },
        { value: "100", display: "100%" },
        { value: "90", display: "90%" },
        { value: "83.33333", display: "83,33%" },
        { value: "80", display: "80%" },
        { value: "75", display: "75%" },
        { value: "70", display: "70%" },
        { value: "66.66667", display: "66,66%" },
        { value: "60", display: "60%" },
        { value: "50", display: "50%" },
        { value: "40", display: "40%" },
        { value: "33.33333", display: "33,33%" },
        { value: "30", display: "30%" },
        { value: "25", display: "25%" },
        { value: "20", display: "20%" },
        { value: "16.66667", display: "16,66%" },
        { value: "14.28571", display: "14,28%" },
        { value: "12.5", display: "12,50%" },
        { value: "11.11111", display: "11,11%" },
        { value: "10", display: "10%" },
        { value: "5", display: "5%" },
        { value: "-5", display: "-5%" },
        { value: "-10", display: "-10%" },
        { value: "-11.11111", display: "-11,11%" },
        { value: "-12.5", display: "-12,50%" },
        { value: "-14.28571", display: "-14,28%" },
        { value: "-16.66667", display: "-16,66%" },
        { value: "-20", display: "-20%" },
        { value: "-25", display: "-25%" },
        { value: "-30", display: "-30%" },
        { value: "-33.33333", display: "-33,33%" },
        { value: "-40", display: "-40%" },
        { value: "-50", display: "-50%" },
        { value: "-60", display: "-60%" },
        { value: "-66.66667", display: "-66,66%" },
        { value: "-70", display: "-70%" },
        { value: "-75", display: "-75%" },
        { value: "-80", display: "-80%" },
        { value: "-83.33333", display: "-83,33%" },
        { value: "-90", display: "-90%" },
        { value: "-100", display: "-100%" }
    ];
    
    // Générer les options du select avec des classes positives/négatives
    for (const option of weightOptions) {
        const valueClass = parseFloat(option.value) > 0 ? 'positive-weight' : 
                          parseFloat(option.value) < 0 ? 'negative-weight' : '';
        selectHtml += `<option value="${option.value}" data-full-value="${option.value}" class="${valueClass}">${option.display}</option>`;
    }
    
    selectHtml += `</select>`;
    
    optionDiv.innerHTML = `
        <input type="checkbox" class="correct-option" id="correct-option-${questionId}-${optionId}">
        <input type="text" placeholder="Texte de l'option" id="option-text-${questionId}-${optionId}" class="option-text-input">
        <div class="weight-container">
            ${selectHtml}
        </div>
        <input type="text" placeholder="Feedback pour cette option" id="option-feedback-${questionId}-${optionId}" class="feedback-input">
        <button class="remove-btn remove-option-btn" data-qid="${questionId}" data-oid="${optionId}">×</button>
    `;
    
    optionsListElement.appendChild(optionDiv);
    
    // Gestion des événements pour la case à cocher de l'option correcte
    const correctCheckbox = optionDiv.querySelector('.correct-option');
    const weightSelect = optionDiv.querySelector('.weight-input');
    
    // Appliquer la couleur dès la création
    updateWeightColor(weightSelect);
    
    // Quand l'option est cochée comme correcte, mettre en évidence le sélecteur
    correctCheckbox.addEventListener('change', function() {
        if (this.checked) {
            weightSelect.classList.add('active-weight');
            // Si l'option est cochée et que la valeur est négative ou 0, on la met à 100%
            const currentValue = parseFloat(weightSelect.value);
            if (currentValue <= 0) {
                weightSelect.value = "100";
                updateWeightColor(weightSelect);
            }
        } else {
            weightSelect.classList.remove('active-weight');
            // Remettre la valeur à 0 quand on décoche l'option
            weightSelect.value = "0";
            updateWeightColor(weightSelect);
        }
        
        // Ajuster automatiquement les pondérations de toutes les options
        autoAdjustWeights(questionId);
    });
    
    // Ajouter un événement pour mettre à jour la couleur quand la valeur change
    weightSelect.addEventListener('change', function() {
        updateWeightColor(this);
    });
    
    // Événement pour supprimer une option
    const removeOptionBtn = optionDiv.querySelector('.remove-option-btn');
    removeOptionBtn.addEventListener('click', function() {
        optionsListElement.removeChild(optionDiv);
        // Ajuster automatiquement les pondérations après la suppression
        setTimeout(() => autoAdjustWeights(questionId), 0);
        // Vérifier les doublons après la suppression
        setTimeout(() => checkDuplicateOptions(questionId, 'mc'), 0);
    });
    
    // Ajouter un écouteur pour vérifier les doublons lors de la saisie dans le champ de texte
    const optionTextInput = optionDiv.querySelector('.option-text-input');
    optionTextInput.addEventListener('input', function() {
        // Délai court pour permettre à l'utilisateur de finir sa saisie
        clearTimeout(this.duplicateCheckTimeout);
        this.duplicateCheckTimeout = setTimeout(() => {
            checkDuplicateOptions(questionId, 'mc');
        }, 300); // Délai de 300ms avant vérification
    });
    
    // Vérifier les doublons après l'ajout d'une nouvelle option
    setTimeout(() => checkDuplicateOptions(questionId, 'mc'), 0);
}

// Fonction utilitaire pour mettre à jour la couleur de fond du sélecteur en fonction de la valeur
function updateWeightColor(selectElement) {
    // Réinitialiser les classes
    selectElement.classList.remove('positive-weight-bg', 'negative-weight-bg', 'zero-weight-bg');
    
    // Appliquer la classe appropriée
    const value = parseFloat(selectElement.value);
    if (value > 0) {
        selectElement.classList.add('positive-weight-bg');
    } else if (value < 0) {
        selectElement.classList.add('negative-weight-bg');
    } else {
        selectElement.classList.add('zero-weight-bg');
    }
}

// Fonction pour ajouter une option QCU
function addSCOption(questionId, optionsListElement) {
    const optionId = optionsListElement.children.length + 1;
    const radioName = `sc-option-${questionId}`;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-container';
    optionDiv.innerHTML = `
        <input type="radio" name="${radioName}" class="correct-sc-option" id="correct-sc-option-${questionId}-${optionId}" ${optionId === 1 ? 'checked' : ''}>
        <input type="text" placeholder="Texte de l'option" id="sc-option-text-${questionId}-${optionId}">
        <input type="text" placeholder="Feedback pour cette option" id="sc-option-feedback-${questionId}-${optionId}">
        <button class="remove-btn remove-sc-option-btn" data-qid="${questionId}" data-oid="${optionId}">×</button>
    `;
    
    optionsListElement.appendChild(optionDiv);
    
    // Événement pour supprimer une option
    const removeOptionBtn = optionDiv.querySelector('.remove-sc-option-btn');
    removeOptionBtn.addEventListener('click', function() {
        optionsListElement.removeChild(optionDiv);
        // Vérifier les doublons après la suppression
        setTimeout(() => checkDuplicateOptions(questionId, 'sc'), 0);
    });
    
    // Ajouter un écouteur pour vérifier les doublons lors de la saisie dans le champ de texte
    const optionTextInput = optionDiv.querySelector('input[type="text"]');
    optionTextInput.addEventListener('input', function() {
        // Délai court pour permettre à l'utilisateur de finir sa saisie
        clearTimeout(this.duplicateCheckTimeout);
        this.duplicateCheckTimeout = setTimeout(() => {
            checkDuplicateOptions(questionId, 'sc');
        }, 300); // Délai de 300ms avant vérification
    });
    
    // Vérifier les doublons après l'ajout d'une nouvelle option
    setTimeout(() => checkDuplicateOptions(questionId, 'sc'), 0);
}

// Fonction pour ajouter une réponse QRC
function addSAOption(questionId, optionsListElement) {
    const optionId = optionsListElement.children.length + 1;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-container';
    optionDiv.innerHTML = `
        <select id="sa-case-${questionId}-${optionId}" class="case-select">
            <option value="">Sensibilité à la casse</option>
            <option value="case_sensitive">Sensible à la casse</option>
            <option value="case_insensitive">Insensible à la casse</option>
        </select>
        <input type="text" placeholder="Réponse acceptée" id="sa-option-text-${questionId}-${optionId}" class="sa-option-text">
        <div class="sa-weight-container">
            <input type="number" min="0" max="100" step="1" value="100" 
                id="sa-option-weight-${questionId}-${optionId}" 
                class="sa-weight-input positive-weight-bg" 
                data-full-value="100"
                onchange="this.setAttribute('data-full-value', this.value)">
            <span class="weight-symbol">%</span>
        </div>
        <button class="remove-btn remove-sa-option-btn" data-qid="${questionId}" data-oid="${optionId}">×</button>
    `;
    
    optionsListElement.appendChild(optionDiv);
    
    // Événement pour supprimer une option
    const removeOptionBtn = optionDiv.querySelector('.remove-sa-option-btn');
    removeOptionBtn.addEventListener('click', function() {
        optionsListElement.removeChild(optionDiv);
    });
    
    // Ajout d'un événement pour mettre à jour l'attribut data-full-value et la couleur
    const weightInput = optionDiv.querySelector('.sa-weight-input');
    weightInput.addEventListener('input', function() {
        this.setAttribute('data-full-value', this.value);
        updateSAWeightColor(this);
    });
}

// Fonction utilitaire pour mettre à jour la couleur de fond de l'input en fonction de la valeur
function updateSAWeightColor(inputElement) {
    // Réinitialiser les classes
    inputElement.classList.remove('positive-weight-bg', 'negative-weight-bg', 'zero-weight-bg');
    
    // Appliquer la classe appropriée
    const value = parseFloat(inputElement.value) || 0;
    if (value > 0) {
        inputElement.classList.add('positive-weight-bg');
    } else if (value < 0) {
        inputElement.classList.add('negative-weight-bg');
    } else {
        inputElement.classList.add('zero-weight-bg');
    }
}

// Fonction pour ajuster automatiquement les pondérations des options cochées
function autoAdjustWeights(questionId) {
    const optionsContainer = document.getElementById(`options-list-${questionId}`);
    const options = optionsContainer.querySelectorAll('.option-container');
    
    // Compter le nombre d'options cochées
    let checkedCount = 0;
    const checkedOptions = [];
    
    options.forEach(option => {
        const checkbox = option.querySelector('.correct-option');
        if (checkbox && checkbox.checked) {
            checkedCount++;
            const weightSelect = option.querySelector('.weight-input');
            checkedOptions.push(weightSelect);
        }
    });
    
    // Si aucune option n'est cochée, pas besoin d'ajuster
    if (checkedCount === 0) return;
    
    // Calculer la pondération par option en fonction du nombre d'options cochées
    // Utiliser des valeurs prédéfinies pour les fractions courantes
    let weightPerOption;
    
    switch (checkedCount) {
        case 1:
            weightPerOption = "100";
            break;
        case 2:
            weightPerOption = "50";
            break;
        case 3:
            weightPerOption = "33.33333";
            break;
        case 4:
            weightPerOption = "25";
            break;
        case 5:
            weightPerOption = "20";
            break;
        case 6:
            weightPerOption = "16.66667";
            break;
        case 7:
            weightPerOption = "14.28571";
            break;
        case 8:
            weightPerOption = "12.5";
            break;
        case 9:
            weightPerOption = "11.11111";
            break;
        default:
            // Pour 10 options ou plus, calculer une valeur approximative
            weightPerOption = (100 / checkedCount).toFixed(5);
    }
    
    // Appliquer la pondération à chaque option cochée
    checkedOptions.forEach(weightSelect => {
        // Trouver l'option correspondant à la valeur
        for (let i = 0; i < weightSelect.options.length; i++) {
            if (weightSelect.options[i].value === weightPerOption) {
                weightSelect.selectedIndex = i;
                break;
            }
        }
        // Mettre à jour la couleur
        updateWeightColor(weightSelect);
    });
}

/**
 * Vérifie les doublons dans les options d'une question
 * @param {string} questionId - L'identifiant de la question
 * @param {string} questionType - Le type de question ('mc' ou 'sc')
 * @returns {Array} - Tableau d'objets contenant les options dupliquées
 */
function checkDuplicateOptions(questionId, questionType) {
    // Déterminer quel type de liste d'options utiliser
    const listId = questionType === 'sc' ? `sc-options-list-${questionId}` : `options-list-${questionId}`;
    const optionsList = document.getElementById(listId);
    
    if (!optionsList) return [];
    
    // Obtenir toutes les options
    const options = optionsList.querySelectorAll('.option-container');
    const optionTexts = [];
    const duplicates = [];
    
    // Collecter tous les textes d'options et vérifier les doublons
    options.forEach((optionElement, index) => {
        // Déterminer le préfixe du champ de texte en fonction du type de question
        const textFieldPrefix = questionType === 'sc' ? `sc-option-text-` : `option-text-`;
        const optionId = questionType === 'sc' 
            ? optionElement.querySelector('.remove-sc-option-btn').getAttribute('data-oid')
            : optionElement.querySelector('.remove-option-btn').getAttribute('data-oid');
        
        const textField = document.getElementById(`${textFieldPrefix}${questionId}-${optionId}`);
        
        if (textField) {
            const optionText = textField.value.trim().toLowerCase();
            
            // Ignorer les options vides
            if (optionText === '') return;
            
            // Vérifier si ce texte existe déjà dans notre liste
            const existingIndex = optionTexts.findIndex(item => item.text === optionText);
            
            if (existingIndex !== -1) {
                // Trouvé un doublon
                if (!duplicates.some(d => d.text === optionText)) {
                    // Ajouter le premier élément trouvé
                    duplicates.push({
                        text: optionText,
                        elements: [optionTexts[existingIndex].element, textField]
                    });
                } else {
                    // Ajouter à un groupe de doublons existant
                    const duplicateEntry = duplicates.find(d => d.text === optionText);
                    if (duplicateEntry && !duplicateEntry.elements.includes(textField)) {
                        duplicateEntry.elements.push(textField);
                    }
                }
            }
            
            // Dans tous les cas, ajouter à notre liste pour comparaison future
            optionTexts.push({
                text: optionText,
                element: textField
            });
        }
    });
    
    // Appliquer le style visuel aux champs concernés
    duplicates.forEach(duplicate => {
        duplicate.elements.forEach(element => {
            element.classList.add('duplicate-option');
            
            // Ajouter une info-bulle (tooltip) pour expliquer l'erreur
            element.setAttribute('title', 'Option dupliquée ! Le texte de cette option existe déjà.');
        });
    });
    
    // Si aucun doublon n'a été trouvé, nettoyer tous les champs
    if (duplicates.length === 0) {
        // Réinitialiser les styles pour tous les champs d'options
        const allOptionFields = document.querySelectorAll(`#${listId} input[type="text"]`);
        allOptionFields.forEach(field => {
            field.classList.remove('duplicate-option');
            field.removeAttribute('title');
        });
    }
    
    return duplicates;
}