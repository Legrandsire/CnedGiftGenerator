// Fonction pour ajouter une option QCM
function addOption(questionId, optionsListElement) {
    const optionId = optionsListElement.children.length + 1;
 
    // Rappel de pondération (inchangé)
    const isFirstOptionAddedToQuestion = document.getElementById(`mc-options-reminder-${questionId}`) === null;
    if (isFirstOptionAddedToQuestion) {
        const reminderDiv = document.createElement('div');
        reminderDiv.id = `mc-options-reminder-${questionId}`;
        reminderDiv.className = 'weight-reminder';
        reminderDiv.innerHTML = '<p class="info-text"><strong>Rappel :</strong> Le total des coefficients des bonnes réponses ne doit pas dépasser 100%.</p>';
        const mcOptionsDiv = document.getElementById(`mc-options-${questionId}`);
        mcOptionsDiv.insertBefore(reminderDiv, mcOptionsDiv.firstChild);
    }
 
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-container';
 
    // Construction du select de pondération (inchangé)
    let selectHtml = `<select id="option-weight-${questionId}-${optionId}" class="weight-input" title="Pondération en pourcentage">`;
    const weightOptions = [
        { value: "0",          display: "0%"      },
        { value: "100",        display: "100%"    },
        { value: "90",         display: "90%"     },
        { value: "83.33333",   display: "83,33%"  },
        { value: "80",         display: "80%"     },
        { value: "75",         display: "75%"     },
        { value: "70",         display: "70%"     },
        { value: "66.66667",   display: "66,66%"  },
        { value: "60",         display: "60%"     },
        { value: "50",         display: "50%"     },
        { value: "40",         display: "40%"     },
        { value: "33.33333",   display: "33,33%"  },
        { value: "30",         display: "30%"     },
        { value: "25",         display: "25%"     },
        { value: "20",         display: "20%"     },
        { value: "16.66667",   display: "16,66%"  },
        { value: "14.28571",   display: "14,28%"  },
        { value: "12.5",       display: "12,50%"  },
        { value: "11.11111",   display: "11,11%"  },
        { value: "10",         display: "10%"     },
        { value: "5",          display: "5%"      },
        { value: "-5",         display: "-5%"     },
        { value: "-10",        display: "-10%"    },
        { value: "-11.11111",  display: "-11,11%" },
        { value: "-12.5",      display: "-12,50%" },
        { value: "-14.28571",  display: "-14,28%" },
        { value: "-16.66667",  display: "-16,66%" },
        { value: "-20",        display: "-20%"    },
        { value: "-25",        display: "-25%"    },
        { value: "-30",        display: "-30%"    },
        { value: "-33.33333",  display: "-33,33%" },
        { value: "-40",        display: "-40%"    },
        { value: "-50",        display: "-50%"    },
        { value: "-60",        display: "-60%"    },
        { value: "-66.66667",  display: "-66,66%" },
        { value: "-70",        display: "-70%"    },
        { value: "-75",        display: "-75%"    },
        { value: "-80",        display: "-80%"    },
        { value: "-83.33333",  display: "-83,33%" },
        { value: "-90",        display: "-90%"    },
        { value: "-100",       display: "-100%"   }
    ];
    for (const option of weightOptions) {
        const valueClass = parseFloat(option.value) > 0 ? 'positive-weight'
                         : parseFloat(option.value) < 0 ? 'negative-weight' : '';
        selectHtml += `<option value="${option.value}" data-full-value="${option.value}" class="${valueClass}">${option.display}</option>`;
    }
    selectHtml += `</select>`;
 
    // Champs RTE pour le texte et le feedback de l'option
    optionDiv.innerHTML = `
        <input type="checkbox" class="correct-option" id="correct-option-${questionId}-${optionId}">
        ${createRichTextEditor(`option-text-${questionId}-${optionId}`, "Texte de l'option", true)}
        <div class="weight-container">
            ${selectHtml}
        </div>
        ${createRichTextEditor(`option-feedback-${questionId}-${optionId}`, "Feedback pour cette option (optionnel)", true)}
        <button class="remove-btn remove-option-btn" data-qid="${questionId}" data-oid="${optionId}">×</button>
    `;
 
    optionsListElement.appendChild(optionDiv);
 
    // Initialiser les éditeurs RTE de cette option après injection dans le DOM
    initRichTextEditors(optionDiv);
 
    // Références aux éléments
    const correctCheckbox = optionDiv.querySelector('.correct-option');
    const weightSelect    = optionDiv.querySelector('.weight-input');
 
    // Couleur initiale du sélecteur
    updateWeightColor(weightSelect);
 
    // ── CORRECTION : listener complet avec autoAdjustWeights ────────────────
    correctCheckbox.addEventListener('change', function () {
        if (this.checked) {
            weightSelect.classList.add('active-weight');
            // Si la valeur est négative ou nulle, passer à 100 %
            const currentValue = parseFloat(weightSelect.value);
            if (currentValue <= 0) {
                weightSelect.value = '100';
                updateWeightColor(weightSelect);
            }
        } else {
            weightSelect.classList.remove('active-weight');
            // Remettre à 0 lors de la décoche
            weightSelect.value = '0';
            updateWeightColor(weightSelect);
        }
        // Recalculer automatiquement les pondérations de toutes les options
        autoAdjustWeights(questionId);
    });
    // ── FIN CORRECTION ───────────────────────────────────────────────────────
 
    // Mise à jour de la couleur lors d'un changement manuel du sélecteur
    weightSelect.addEventListener('change', function () {
        updateWeightColor(this);
        this.setAttribute('data-full-value', this.value);
    });
 
    // ── CORRECTION : suppression avec autoAdjustWeights ──────────────────────
    const removeOptionBtn = optionDiv.querySelector('.remove-option-btn');
    removeOptionBtn.addEventListener('click', function () {
        optionsListElement.removeChild(optionDiv);
        setTimeout(() => autoAdjustWeights(questionId), 0);
        setTimeout(() => checkDuplicateOptions(questionId, 'mc'), 0);
    });
    // ── FIN CORRECTION ───────────────────────────────────────────────────────
 
    // Vérification des doublons à la saisie (sur le div contenteditable RTE)
    const optionTextEditor = document.getElementById(`option-text-${questionId}-${optionId}`);
    if (optionTextEditor) {
        optionTextEditor.addEventListener('input', function () {
            clearTimeout(this.duplicateCheckTimeout);
            this.duplicateCheckTimeout = setTimeout(() => {
                checkDuplicateOptions(questionId, 'mc');
            }, 300);
        });
    }
 
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
 
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-container';
 
    // ── CHANGEMENT ──────────────────────────────────────────────────────────
    // Les deux <input type="text"> remplacés par des éditeurs RTE.
    // Les IDs sc-option-text-... et sc-option-feedback-... sont conservés.
    optionDiv.innerHTML = `
        <input type="radio" class="correct-sc-option" name="sc-correct-${questionId}" id="sc-correct-${questionId}-${optionId}">
        ${createRichTextEditor(`sc-option-text-${questionId}-${optionId}`, "Texte de l'option", true)}
        ${createRichTextEditor(`sc-option-feedback-${questionId}-${optionId}`, "Feedback pour cette option (optionnel)", true)}
        <button class="remove-btn remove-sc-option-btn" data-qid="${questionId}" data-oid="${optionId}">×</button>
    `;
    // ── FIN CHANGEMENT ───────────────────────────────────────────────────────
 
    optionsListElement.appendChild(optionDiv);
 
    // ── CHANGEMENT ──────────────────────────────────────────────────────────
    // Initialiser les éditeurs RTE de cette option après injection dans le DOM
    initRichTextEditors(optionDiv);
    // ── FIN CHANGEMENT ───────────────────────────────────────────────────────
 
    // Suppression de l'option (inchangé)
    const removeOptionBtn = optionDiv.querySelector('.remove-sc-option-btn');
    removeOptionBtn.addEventListener('click', function () {
        optionsListElement.removeChild(optionDiv);
        setTimeout(() => checkDuplicateOptions(questionId, 'sc'), 0);
    });
 
    // Vérification des doublons (inchangé, sauf le sélecteur)
    // ── CHANGEMENT ──────────────────────────────────────────────────────────
    const optionTextEditor = document.getElementById(`sc-option-text-${questionId}-${optionId}`);
    if (optionTextEditor) {
        optionTextEditor.addEventListener('input', function () {
            clearTimeout(this.duplicateCheckTimeout);
            this.duplicateCheckTimeout = setTimeout(() => {
                checkDuplicateOptions(questionId, 'sc');
            }, 300);
        });
    }
    // ── FIN CHANGEMENT ───────────────────────────────────────────────────────
 
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
    const listId      = questionType === 'sc'
                        ? `sc-options-list-${questionId}`
                        : `options-list-${questionId}`;
    const optionsList = document.getElementById(listId);
    if (!optionsList) return [];
 
    const options     = optionsList.querySelectorAll('.option-container');
    const optionTexts = [];
    const duplicates  = [];
 
    options.forEach((optionElement) => {
        const textFieldPrefix = questionType === 'sc' ? 'sc-option-text-' : 'option-text-';
        const optionId        = questionType === 'sc'
            ? optionElement.querySelector('.remove-sc-option-btn').getAttribute('data-oid')
            : optionElement.querySelector('.remove-option-btn').getAttribute('data-oid');
 
        const fieldId   = `${textFieldPrefix}${questionId}-${optionId}`;
        const textField = document.getElementById(fieldId);
        if (!textField) return;
 
        // CORRECTION 1 : getRichTextValue() + extraction du texte brut pour comparaison
        const rawHtml    = getRichTextValue(fieldId);
        const optionText = rawHtml
            .replace(/<[^>]+>/g, '')   // supprimer les balises HTML
            .replace(/&nbsp;/g, ' ')   // normaliser les espaces insécables
            .trim()
            .toLowerCase();
 
        // Ignorer les options vides
        if (optionText === '') return;
 
        const existingIndex = optionTexts.findIndex(item => item.text === optionText);
 
        if (existingIndex !== -1) {
            if (!duplicates.some(d => d.text === optionText)) {
                duplicates.push({
                    text:     optionText,
                    elements: [optionTexts[existingIndex].element, textField]
                });
            } else {
                const duplicateEntry = duplicates.find(d => d.text === optionText);
                if (duplicateEntry && !duplicateEntry.elements.includes(textField)) {
                    duplicateEntry.elements.push(textField);
                }
            }
        }
 
        optionTexts.push({ text: optionText, element: textField });
    });
 
    // Appliquer le style visuel aux champs dupliqués
    duplicates.forEach(duplicate => {
        duplicate.elements.forEach(element => {
            element.classList.add('duplicate-option');
            element.setAttribute('title', 'Option dupliquée ! Le texte de cette option existe déjà.');
        });
    });
 
    // CORRECTION 2 : cibler les divs .rte-editor au lieu de input[type="text"]
    if (duplicates.length === 0) {
        const allOptionFields = optionsList.querySelectorAll('.rte-editor');
        allOptionFields.forEach(field => {
            field.classList.remove('duplicate-option');
            field.removeAttribute('title');
        });
    }
 
    return duplicates;
}