// ── Options à choix (QCM / QCU) ─────────────────────────────────────────────
// QCM et QCU partagent la même structure (éditeurs RTE texte + feedback,
// détection de doublons) ; ils ne diffèrent que par case à cocher vs bouton
// radio et par la présence d'un sélecteur de pondération (QCM seulement). On les
// factorise via addChoiceOption() piloté par une config — cf. [D1]. La QRC
// (addSAOption), structurellement différente, reste une fonction dédiée.

const MC_OPTION_CONFIG = {
    type: 'mc',
    correctInputHtml: (qid, oid) => `<input type="checkbox" class="correct-option" id="${IDS.correctOption(qid, oid)}">`,
    textId:          (qid, oid) => IDS.optionText(qid, oid),
    feedbackId:      (qid, oid) => IDS.optionFeedback(qid, oid),
    removeClass:     'remove-option-btn',
    correctSelector: '.correct-option',
    hasWeight:       true
};

const SC_OPTION_CONFIG = {
    type: 'sc',
    correctInputHtml: (qid, oid) => `<input type="radio" class="correct-sc-option" name="sc-correct-${qid}" id="${IDS.scCorrect(qid, oid)}">`,
    textId:          (qid, oid) => IDS.scOptionText(qid, oid),
    feedbackId:      (qid, oid) => IDS.scOptionFeedback(qid, oid),
    removeClass:     'remove-sc-option-btn',
    correctSelector: '.correct-sc-option',
    hasWeight:       false
};

/**
 * Ajoute une option à choix (QCM ou QCU) selon la configuration fournie.
 * @param {string|number} questionId         - Identifiant de la question.
 * @param {HTMLElement}   optionsListElement  - Conteneur des options.
 * @param {Object}        config              - MC_OPTION_CONFIG ou SC_OPTION_CONFIG.
 */
function addChoiceOption(questionId, optionsListElement, config) {
    const optionId = optionsListElement.children.length + 1;
 
    // Rappel de pondération (QCM uniquement) à la première option ajoutée
    if (config.hasWeight) {
        const isFirstOptionAddedToQuestion = document.getElementById(IDS.mcOptionsReminder(questionId)) === null;
        if (isFirstOptionAddedToQuestion) {
            const reminderDiv = document.createElement('div');
            reminderDiv.id = IDS.mcOptionsReminder(questionId);
            reminderDiv.className = 'weight-reminder';
            reminderDiv.innerHTML = '<p class="info-text"><strong>Rappel :</strong> Le total des coefficients des bonnes réponses ne doit pas dépasser 100%.</p>';
            const mcOptionsDiv = document.getElementById(IDS.typeOptions('mc', questionId));
            mcOptionsDiv.insertBefore(reminderDiv, mcOptionsDiv.firstChild);
        }
    }
 
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-container';
 
    // Construction du select de pondération (inchangé)
    let selectHtml = `<select id="${IDS.optionWeight(questionId, optionId)}" class="weight-input" title="Pondération en pourcentage">`;
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
        const num = parseFloat(option.value);
        const valueClass = num > 0 ? 'positive-weight'
                         : num < 0 ? 'negative-weight' : '';
        // [U3] Préfixe de signe explicite (accessibilité : la couleur n'est plus
        // le seul indicateur). Les valeurs négatives portent déjà « - ».
        const display = num > 0 ? `+${option.display}` : option.display;
        selectHtml += `<option value="${option.value}" data-full-value="${option.value}" class="${valueClass}">${display}</option>`;
    }
    selectHtml += `</select>`;
 
    // Bloc de pondération uniquement pour les types qui en ont (QCM)
    const weightHtml = config.hasWeight
        ? `<div class="weight-container">${selectHtml}</div>`
        : '';

    // Champs RTE pour le texte et le feedback de l'option
    optionDiv.innerHTML = `
        ${config.correctInputHtml(questionId, optionId)}
        ${createRichTextEditor(config.textId(questionId, optionId), "Texte de l'option", true)}
        ${weightHtml}
        ${createRichTextEditor(config.feedbackId(questionId, optionId), "Feedback pour cette option (optionnel)", true)}
        <button class="remove-btn ${config.removeClass}" data-qid="${questionId}" data-oid="${optionId}">×</button>
    `;
 
    optionsListElement.appendChild(optionDiv);
 
    // Initialiser les éditeurs RTE de cette option après injection dans le DOM
    initRichTextEditors(optionDiv);
 
    // Pondération (QCM uniquement) : couleur initiale + écouteurs
    if (config.hasWeight) {
        const correctCheckbox = optionDiv.querySelector(config.correctSelector);
        const weightSelect    = optionDiv.querySelector('.weight-input');

        // Couleur initiale du sélecteur
        updateWeightColor(weightSelect);

        // Listener de coche : (dé)activation du poids + réajustement automatique
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

        // Mise à jour de la couleur lors d'un changement manuel du sélecteur
        weightSelect.addEventListener('change', function () {
            updateWeightColor(this);
            this.setAttribute('data-full-value', this.value);
        });
    }

    // Suppression de l'option (+ réajustement des poids en QCM)
    const removeOptionBtn = optionDiv.querySelector(`.${config.removeClass}`);
    removeOptionBtn.addEventListener('click', function () {
        optionsListElement.removeChild(optionDiv);
        if (config.hasWeight) {
            queueMicrotask(() => autoAdjustWeights(questionId));
        }
        queueMicrotask(() => checkDuplicateOptions(questionId, config.type));
    });

    // Vérification des doublons à la saisie (sur le div contenteditable RTE)
    const optionTextEditor = document.getElementById(config.textId(questionId, optionId));
    if (optionTextEditor) {
        optionTextEditor.addEventListener('input', function () {
            clearTimeout(this.duplicateCheckTimeout);
            this.duplicateCheckTimeout = setTimeout(() => {
                checkDuplicateOptions(questionId, config.type);
            }, 300);
        });
    }

    queueMicrotask(() => checkDuplicateOptions(questionId, config.type));
}

// Ajoute une option QCM (case à cocher + pondération). Délègue à addChoiceOption [D1].
function addOption(questionId, optionsListElement) {
    addChoiceOption(questionId, optionsListElement, MC_OPTION_CONFIG);
}

// Fonction utilitaire pour mettre à jour la couleur de fond du sélecteur en fonction de la valeur
// Met à jour la couleur de fond d'un élément de pondération selon le signe de
// sa valeur. Accepte indifféremment un <select> (QCM/QCU) ou un <input> (QRC).
// Fusion de l'ancienne paire updateWeightColor / updateSAWeightColor — cf. [D3].
function updateWeightColor(element) {
    element.classList.remove('positive-weight-bg', 'negative-weight-bg', 'zero-weight-bg');

    const value = parseFloat(element.value) || 0;
    if (value > 0) {
        element.classList.add('positive-weight-bg');
    } else if (value < 0) {
        element.classList.add('negative-weight-bg');
    } else {
        element.classList.add('zero-weight-bg');
    }
}

// Ajoute une option QCU (bouton radio, sans pondération). Délègue à addChoiceOption [D1].
function addSCOption(questionId, optionsListElement) {
    addChoiceOption(questionId, optionsListElement, SC_OPTION_CONFIG);
}

// Fonction pour ajouter une réponse QRC
function addSAOption(questionId, optionsListElement) {
    const optionId = optionsListElement.children.length + 1;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-container';
    optionDiv.innerHTML = `
        <select id="${IDS.saCase(questionId, optionId)}" class="case-select"
            title="Information : le format GIFT ne gère pas la sensibilité à la casse pour les réponses courtes. Ce choix est conservé pour mémoire mais ignoré à l'export (cf. [B3]).">
            <option value="">Sensibilité à la casse</option>
            <option value="case_sensitive">Sensible à la casse</option>
            <option value="case_insensitive">Insensible à la casse</option>
        </select>
        <input type="text" placeholder="Réponse acceptée" id="${IDS.saOptionText(questionId, optionId)}" class="sa-option-text">
        <div class="sa-weight-container">
            <input type="number" min="0" max="100" step="1" value="100" 
                id="${IDS.saOptionWeight(questionId, optionId)}"
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
        updateWeightColor(this);
    });
}


// Fonction pour ajuster automatiquement les pondérations des options cochées
function autoAdjustWeights(questionId) {
    const optionsContainer = document.getElementById(IDS.optionsList(questionId));
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
    
    // [P3] Pondération canonique par nombre d'options cochées. Pour 1 à 9 on
    // utilise les valeurs exactes attendues par le <select> ; au-delà, calcul
    // direct (100/n). Un Map remplace l'ancien switch à neuf branches.
    const CANONICAL_WEIGHTS = new Map([
        [1, '100'], [2, '50'], [3, '33.33333'], [4, '25'], [5, '20'],
        [6, '16.66667'], [7, '14.28571'], [8, '12.5'], [9, '11.11111']
    ]);
    const weightPerOption = CANONICAL_WEIGHTS.get(checkedCount)
                            || (100 / checkedCount).toFixed(5);
    
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
                        ? IDS.scOptionsList(questionId)
                        : IDS.optionsList(questionId);
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