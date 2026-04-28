/**
 * Construit la ligne d'en-tête GIFT d'une question.
 * Insère automatiquement le tag @@PLUGINFILE@@ si un média est associé.
 *
 * @param {string}       finalQuestionId  — Identifiant GIFT final (ex. "ECO101-Q03")
 * @param {string|number} questionId      — ID interne de la question (dataset.id)
 * @param {string}       formattedText    — Texte de la question déjà formaté (HTML + nbsp)
 * @returns {string}  — Ligne GIFT de type "::id::[html]texte{" (sans fermeture)
 */
function buildQuestionLine(finalQuestionId, questionId, formattedText) {
    let mediaTag = '';
 
    if (typeof getPluginfileTag === 'function'
        && window.questionMediaFiles
        && window.questionMediaFiles[questionId]) {
        mediaTag = getPluginfileTag(questionId, finalQuestionId);
    }
 
    return `::${finalQuestionId}::[html]${formattedText}${mediaTag}\n{`;
}
 

// Fonction pour générer le code GIFT
function generateGIFTCode() {
    let giftCode = '';
    const questions = document.querySelectorAll('.question-container');
 
    if (questions.length === 0) {
        alert('Aucune question à générer. Veuillez d\'abord ajouter des questions.');
        return;
    }
 
    window.generatedQuestionIds = {};

    // ── 1. Vérification des doublons ─────────────────────────────────────────
    let hasDuplicates = false;
    const duplicateQuestionNumbers = [];
 
    questions.forEach((question, index) => {
        const questionId   = question.dataset.id;
        const questionType = document.querySelector(
            `input[name="question-type-${questionId}"]:checked`
        ).value;
 
        if (questionType === 'mc' || questionType === 'sc') {
            const duplicates = checkDuplicateOptions(questionId, questionType);
            if (duplicates && duplicates.length > 0) {
                hasDuplicates = true;
                duplicateQuestionNumbers.push(index + 1);
            }
        }
    });
 
    if (hasDuplicates) {
        let message = 'Des options dupliquées ont été détectées dans les questions suivantes :\n';
        duplicateQuestionNumbers.forEach(num => { message += `- Question ${num}\n`; });
        message += '\nLes options dupliquées sont mises en évidence en rouge.\nVoulez-vous continuer quand même ?';
        if (!confirm(message)) return;
    }
 
    // ── 2. Récupération des métadonnées ──────────────────────────────────────
    const authorLastnameValue  = window.authorLastname.value.trim();
    const authorFirstnameValue = window.authorFirstname.value.trim();
    const courseCodeValue      = window.courseCode.value.trim();
 
    // ── 3. En-tête de métadonnées ────────────────────────────────────────────
    if (authorLastnameValue || authorFirstnameValue || courseCodeValue) {
        giftCode += '// Métadonnées du document GIFT\n';
        if (authorLastnameValue || authorFirstnameValue) {
            giftCode += `// Auteur: ${authorFirstnameValue} ${authorLastnameValue}\n`;
        }
        if (courseCodeValue) {
            giftCode += `// Code article: ${courseCodeValue}\n`;
        }
        giftCode += '// Date de génération: ' + new Date().toLocaleString() + '\n\n';
    }
 
    // ── 4. Génération des questions ──────────────────────────────────────────
    questions.forEach((question, index) => {
        const questionId = question.dataset.id;
 
        const questionIdField = document.getElementById(`question-id-${questionId}`);
        const questionIdValue = questionIdField ? questionIdField.value.trim() : '';
 
        // Construction de l'identifiant GIFT
        let finalQuestionId;
        if (!questionIdValue) {
            const prefix         = courseCodeValue ? courseCodeValue : 'Q';
            const questionNumber = (index + 1).toString().padStart(2, '0');
            finalQuestionId = `${prefix}-Q${questionNumber}`;
        } else {
            const qSuffixPattern = /-Q\d+$/;
            if (!qSuffixPattern.test(questionIdValue)) {
                const questionNumber = (index + 1).toString().padStart(2, '0');
                finalQuestionId = `${questionIdValue}-Q${questionNumber}`;
            } else {
                finalQuestionId = questionIdValue;
            }
        }
 
        // Lecture via getRichTextValue (compatible RTE et input classique)
        const questionText    = getRichTextValue(`question-text-${questionId}`);
        const generalFeedback = getRichTextValue(`general-feedback-${questionId}`);
        const questionType    = document.querySelector(
            `input[name="question-type-${questionId}"]:checked`
        ).value;
 
        if (!questionText) {
            alert(`La question ${index + 1} n'a pas de texte. Veuillez remplir tous les champs.`);
            return;
        }
 
        const formattedQuestionText = addHtmlTags(addNonBreakingSpaces(questionText));
 
        // ── AJOUT : Mémoriser le finalQuestionId pour l'export ZIP ───────────
        window.generatedQuestionIds[questionId] = finalQuestionId;
        // ─────────────────────────────────────────────────────────────────────
 
        // ── MODIFICATION : Utiliser buildQuestionLine() (gère le tag @@PLUGINFILE@@)
        giftCode += buildQuestionLine(finalQuestionId, questionId, formattedQuestionText);
        // ─────────────────────────────────────────────────────────────────────
 
        switch (questionType) {
            case 'mc':
                giftCode = generateMCQuestionCode(giftCode, questionId, questionText);
                break;
            case 'sc':
                giftCode = generateSCQuestionCode(giftCode, questionId, questionText);
                break;
            case 'tf':
                const isTrueCorrect = document.getElementById(`true-option-${questionId}`).checked;
                giftCode += isTrueCorrect ? 'T' : 'F';
                break;
            case 'sa':
                giftCode = generateSAQuestionCode(giftCode, questionId, questionText);
                break;
            case 'num':
                giftCode = generateNumQuestionCode(giftCode, questionId, questionText);
                break;
        }
 
        if (generalFeedback) {
            const formattedFeedback = addHtmlTags(addNonBreakingSpaces(generalFeedback));
            giftCode += `\n####${formattedFeedback}`;
        }
 
        giftCode += '\n}';
        giftCode += '\n\n\n';
    });
 
    window.giftOutput.value = giftCode;
}

// Fonction utilitaire pour ajouter des balises HTML autour du texte
function addHtmlTags(text) {
    if (!text || text.trim() === '') return '';
    const trimmed = text.trim();
    // Balises de bloc communes produites par le RTE ou saisies manuellement
    if (/^<(p|div|h[1-6]|ul|ol|li|blockquote|pre|table|section|article)\b/i.test(trimmed)) {
        return trimmed;
    }
    return `<p>${trimmed}</p>`;
}

// Fonction utilitaire pour ajouter des espaces insécables avant les ponctuations doubles
function addNonBreakingSpaces(text) {
    if (!text) return '';
 
    // Vérifier si le texte contient du HTML
    const hasHtml = /<[a-z]/i.test(text);
 
    if (!hasHtml) {
        // Texte brut : appliquer directement
        return text
            .replace(/ ([;:!?»])/g,  '\u00a0$1')
            .replace(/([«]) /g, '$1\u00a0');
    }
 
    // Texte avec HTML : scinder en jetons (balises vs texte) et traiter séparément
    return text.replace(/(<[^>]+>)|([^<]+)/g, function (match, tag, textNode) {
        if (tag) {
            // C'est une balise HTML → la laisser intacte
            return tag;
        }
        if (textNode) {
            // C'est un nœud texte → appliquer les substitutions
            return textNode
                .replace(/ ([;:!?»])/g,  '\u00a0$1')
                .replace(/([«]) /g, '$1\u00a0');
        }
        return match;
    });
}

// Fonction pour générer le code des questions à choix multiples
function generateMCQuestionCode(giftCode, questionId, questionText) {
    const mcOptions = document.querySelectorAll('#options-list-' + questionId + ' .option-container');
 
    let hasCorrectOption = false;
    mcOptions.forEach(option => {
        if (option.querySelector('.correct-option').checked) hasCorrectOption = true;
    });
 
    if (!hasCorrectOption && mcOptions.length > 0) {
        alert(`La question "${questionText}" n'a pas de réponse correcte sélectionnée.`);
        return giftCode;
    }
 
    mcOptions.forEach(option => {
        const optionId   = option.querySelector('.remove-option-btn').getAttribute('data-oid');
        const isCorrect  = option.querySelector('.correct-option').checked;
 
        // ── IDs CORRECTS (option-text-... et option-feedback-...) ────────────
        const optionText   = getRichTextValue(`option-text-${questionId}-${optionId}`);
        const feedbackText = getRichTextValue(`option-feedback-${questionId}-${optionId}`);
        // ─────────────────────────────────────────────────────────────────────
 
        if (!optionText) return;
 
        const formattedOptionText = addHtmlTags(addNonBreakingSpaces(optionText));
 
        if (isCorrect) {
            const weightSelect    = document.getElementById(`option-weight-${questionId}-${optionId}`);
            const weight          = weightSelect
                                    ? (weightSelect.getAttribute('data-full-value') || weightSelect.value)
                                    : '100';
            const formattedWeight = parseFloat(weight).toFixed(5);
            giftCode += `\n~%${formattedWeight}%${formattedOptionText}`;
        } else {
            giftCode += `\n~${formattedOptionText}`;
        }
 
        if (feedbackText) {
            const formattedFeedback = addHtmlTags(addNonBreakingSpaces(feedbackText));
            giftCode += `\n#${formattedFeedback}`;
        }
    });
 
    return giftCode;
}

// Fonction pour générer le code des questions à choix unique
function generateSCQuestionCode(giftCode, questionId, questionText) {
    const scOptions = document.querySelectorAll('#sc-options-list-' + questionId + ' .option-container');
 
    let hasScCorrectOption = false;
    scOptions.forEach(option => {
        if (option.querySelector('.correct-sc-option').checked) hasScCorrectOption = true;
    });
 
    if (!hasScCorrectOption && scOptions.length > 0) {
        alert(`La question "${questionText}" n'a pas de réponse correcte sélectionnée.`);
        return giftCode;
    }
 
    scOptions.forEach(option => {
        const optionId   = option.querySelector('.remove-sc-option-btn').getAttribute('data-oid');
        const isCorrect  = option.querySelector('.correct-sc-option').checked;
 
        // Lecture via getRichTextValue (compatible RTE et input)
        const optionText   = getRichTextValue(`sc-option-text-${questionId}-${optionId}`);
        const feedbackText = getRichTextValue(`sc-option-feedback-${questionId}-${optionId}`);
 
        if (!optionText) return;
 
        const formattedOptionText = addHtmlTags(addNonBreakingSpaces(optionText));
 
        if (isCorrect) {
            giftCode += `\n=${formattedOptionText}`;
        } else {
            giftCode += `\n~${formattedOptionText}`;
        }
 
        if (feedbackText) {
            const formattedFeedback = addHtmlTags(addNonBreakingSpaces(feedbackText));
            giftCode += `\n#${formattedFeedback}`;
        }
    });
 
    return giftCode;
}

// Fonction pour générer le code des questions à réponse courte
function generateSAQuestionCode(giftCode, questionId, questionText) {
    const saOptions = document.querySelectorAll('#sa-options-list-' + questionId + ' .option-container');
    
    let hasSaOption = false;
    saOptions.forEach(option => {
        const optionId = option.querySelector('.remove-sa-option-btn').getAttribute('data-oid');
        
        // Récupérer les éléments avec vérification de leur existence
        const caseTypeElement = document.getElementById(`sa-case-${questionId}-${optionId}`);
        const optionTextElement = document.getElementById(`sa-option-text-${questionId}-${optionId}`);
        const weightInput = document.getElementById(`sa-option-weight-${questionId}-${optionId}`);
        
        // Vérifier que les éléments nécessaires existent
        if (!caseTypeElement || !optionTextElement || !weightInput) {
            console.warn(`Éléments manquants pour l'option ${optionId} de la question ${questionId}`);
            return;
        }
        
        const caseType = caseTypeElement.value;
        const optionText = optionTextElement.value.trim();
        
        // Récupérer la valeur de poids avec sécurité
        const weight = weightInput.getAttribute('data-full-value') || weightInput.value.trim();
        
        if (!optionText) return;
        hasSaOption = true;
        
        // Modifier le format pour toujours inclure le pourcentage
        let prefix = `=%${weight}%`;
        
        // Ajouter seulement les espaces insécables au texte de la réponse sans balises HTML
        const formattedOptionText = addNonBreakingSpaces(optionText);
        
        // Gérer la sensibilité à la casse et ajouter un saut de ligne
        if (caseType === 'case_sensitive') {
            giftCode += `\n${prefix}${formattedOptionText}`;
        } else if (caseType === 'case_insensitive') {
            giftCode += `\n${prefix}${formattedOptionText}`;
        } else {
            giftCode += `\n${prefix}${formattedOptionText}`;
        }
        
        // Ajouter feedback spécifique à l'option si présent
        const feedbackElement = document.getElementById(`sa-option-feedback-${questionId}-${optionId}`);
        if (feedbackElement) {
            const feedbackText = feedbackElement.value.trim();
            if (feedbackText) {
                // Pour le feedback, on conserve les balises HTML car elles sont nécessaires
                const formattedFeedback = addHtmlTags(addNonBreakingSpaces(feedbackText));
                giftCode += `\n#${formattedFeedback}`;
            }
        }
    });
    
    if (!hasSaOption) {
        alert(`La question "${questionText}" n'a pas de réponse définie.`);
        return giftCode;
    }
    
    return giftCode;
}

// Fonction pour générer le code des questions numériques
function generateNumQuestionCode(giftCode, questionId, questionText) {
    const numAnswer = document.getElementById(`num-answer-${questionId}`).value.trim();
    const useRange = document.getElementById(`num-range-${questionId}`).checked;
    
    if (!numAnswer) {
        alert(`La question "${questionText}" n'a pas de réponse numérique définie.`);
        return giftCode;
    }
    
    if (useRange) {
        const margin = document.getElementById(`num-margin-${questionId}`).value.trim();
        if (!margin) {
            alert(`La question "${questionText}" utilise une marge d'erreur mais celle-ci n'est pas définie.`);
            return giftCode;
        }
        giftCode += `#${numAnswer}:${margin}`;
    } else {
        giftCode += `#${numAnswer}`;
    }
    
    return giftCode;
}