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
    
    // Liste des valeurs de pondération avec leur affichage simplifié et valeur complète
    const weightOptions = [
        { value: "0", display: "0%" },
        { value: "100", display: "100%" },
        { value: "90", display: "90%" },
        { value: "83.33333", display: "83%" },
        { value: "80", display: "80%" },
        { value: "75", display: "75%" },
        { value: "70", display: "70%" },
        { value: "66.66667", display: "67%" },
        { value: "60", display: "60%" },
        { value: "50", display: "50%" },
        { value: "40", display: "40%" },
        { value: "33.33333", display: "33%" },
        { value: "30", display: "30%" },
        { value: "25", display: "25%" },
        { value: "20", display: "20%" },
        { value: "16.66667", display: "17%" },
        { value: "14.28571", display: "14%" },
        { value: "12.5", display: "13%" },
        { value: "11.11111", display: "11%" },
        { value: "10", display: "10%" },
        { value: "5", display: "5%" },
        { value: "-5", display: "-5%" },
        { value: "-10", display: "-10%" },
        { value: "-11.11111", display: "-11%" },
        { value: "-12.5", display: "-13%" },
        { value: "-14.28571", display: "-14%" },
        { value: "-16.66667", display: "-17%" },
        { value: "-20", display: "-20%" },
        { value: "-25", display: "-25%" },
        { value: "-30", display: "-30%" },
        { value: "-33.33333", display: "-33%" },
        { value: "-40", display: "-40%" },
        { value: "-50", display: "-50%" },
        { value: "-60", display: "-60%" },
        { value: "-66.66667", display: "-67%" },
        { value: "-70", display: "-70%" },
        { value: "-75", display: "-75%" },
        { value: "-80", display: "-80%" },
        { value: "-83.33333", display: "-83%" },
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
            // On laisse la valeur telle quelle, même si elle est positive
        }
    });
    
    // Ajouter un événement pour mettre à jour la couleur quand la valeur change
    weightSelect.addEventListener('change', function() {
        updateWeightColor(this);
    });
    
    // Événement pour supprimer une option
    const removeOptionBtn = optionDiv.querySelector('.remove-option-btn');
    removeOptionBtn.addEventListener('click', function() {
        optionsListElement.removeChild(optionDiv);
    });
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
    });
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