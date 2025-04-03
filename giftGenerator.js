// Fonction pour générer le code GIFT
// Fonction pour générer le code GIFT
function generateGIFTCode() {
    let giftCode = '';
    const questions = document.querySelectorAll('.question-container');
    
    // Vérifier les doublons dans toutes les questions avant de générer le code
    let hasDuplicates = false;
    let duplicateQuestionNumbers = [];
    
    questions.forEach((question, index) => {
        const questionId = question.dataset.id;
        const questionType = document.querySelector(`input[name="question-type-${questionId}"]:checked`).value;
        
        // Vérifier les doublons pour les QCM et QCU
        if (questionType === 'mc' || questionType === 'sc') {
            const duplicates = checkDuplicateOptions(questionId, questionType);
            if (duplicates.length > 0) {
                hasDuplicates = true;
                duplicateQuestionNumbers.push(index + 1);
            }
        }
    });
    
    // Afficher un avertissement si des doublons sont détectés
    if (hasDuplicates) {
        let message = "Des options dupliquées ont été détectées dans les questions suivantes :\n";
        duplicateQuestionNumbers.forEach(num => {
            message += `- Question ${num}\n`;
        });
        message += "\nLes options dupliquées sont mises en évidence en rouge.\nVoulez-vous continuer quand même ?";
        
        if (!confirm(message)) {
            return; // Arrêter la génération si l'utilisateur choisit d'annuler
        }
    }
    
    // Récupérer les informations d'auteur et de code article
    const authorLastnameValue = window.authorLastname.value.trim();
    const authorFirstnameValue = window.authorFirstname.value.trim();
    const courseCodeValue = window.courseCode.value.trim();
    
    // Ajouter un en-tête avec les métadonnées si elles sont disponibles
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
    
    questions.forEach((question, index) => {
        const questionId = question.dataset.id;
        let questionIdValue = document.getElementById(`question-id-${questionId}`).value.trim();
        
        // Générer ou ajuster l'identifiant selon les règles
        let finalQuestionId;
        
        if (!questionIdValue) {
            // Si le champ est vide, générer automatiquement l'identifiant
            // Utiliser le code article si disponible, sinon "Q" comme préfixe
            const prefix = courseCodeValue ? courseCodeValue : "Q";
            // Formatter le numéro de question avec deux chiffres pour les chiffres 1-9
            const questionNumber = (index + 1).toString().padStart(2, '0');
            finalQuestionId = `${prefix}-Q${questionNumber}`;
        } else {
            // Si renseigné manuellement, ajouter simplement le suffixe -Q et un numéro
            // mais ne pas ajouter le code article
            const qSuffixPattern = /-Q\d+$/;
            if (!qSuffixPattern.test(questionIdValue)) {
                // Formatter le numéro de question avec deux chiffres pour les chiffres 1-9
                const questionNumber = (index + 1).toString().padStart(2, '0');
                finalQuestionId = `${questionIdValue}-Q${questionNumber}`;
            } else {
                // Si l'ID contient déjà un suffixe -Q, le conserver tel quel
                finalQuestionId = questionIdValue;
            }
        }
        
        const questionText = document.getElementById(`question-text-${questionId}`).value.trim();
        const generalFeedback = document.getElementById(`general-feedback-${questionId}`).value.trim();
        const questionType = document.querySelector(`input[name="question-type-${questionId}"]:checked`).value;
        
        if (!questionText) {
            alert(`La question ${index + 1} n'a pas de texte. Veuillez remplir tous les champs.`);
            return;
        }
        
        // Envelopper le texte de la question dans des balises HTML et ajouter des espaces insécables pour les ponctuations doubles
        const formattedQuestionText = addHtmlTags(addNonBreakingSpaces(questionText));
        
        // Format de question GIFT conforme au modèle
        giftCode += `::${finalQuestionId}::[html]${formattedQuestionText}\n{`;
        
        // Gérer en fonction du type de question
        switch(questionType) {
            case 'mc': // QCM
                giftCode = generateMCQuestionCode(giftCode, questionId, questionText);
                break;
                
            case 'sc': // QCU
                giftCode = generateSCQuestionCode(giftCode, questionId, questionText);
                break;
                
            case 'tf': // Vrai/Faux
                const isTrueCorrect = document.getElementById(`true-option-${questionId}`).checked;
                giftCode += isTrueCorrect ? 'T' : 'F';
                break;
                
            case 'sa': // QRC
                giftCode = generateSAQuestionCode(giftCode, questionId, questionText);
                break;
                
            case 'num': // Numérique
                giftCode = generateNumQuestionCode(giftCode, questionId, questionText);
                break;
        }
        
        // Ajouter le feedback général si présent, avec 4 # comme demandé
        if (generalFeedback) {
            // Envelopper le feedback dans des balises HTML et ajouter des espaces insécables
            const formattedFeedback = addHtmlTags(addNonBreakingSpaces(generalFeedback));
            giftCode += `\n####${formattedFeedback}`;
        }
        
        // Fermer l'accolade
        giftCode += '\n}';
        
        // Ajouter deux lignes vides entre les questions pour une meilleure lisibilité
        giftCode += '\n\n\n';
    });
    
    window.giftOutput.value = giftCode;
}

// Fonction utilitaire pour ajouter des balises HTML autour du texte
function addHtmlTags(text) {
    if (!text.startsWith('<p>') && !text.startsWith('<div>') && !text.startsWith('<span>')) {
        return `<p>${text}</p>`;
    }
    return text;
}

// Fonction utilitaire pour ajouter des espaces insécables avant les ponctuations doubles
function addNonBreakingSpaces(text) {
    // Remplacer l'espace normal suivi d'une ponctuation double par un espace insécable
    return text.replace(/ ([;:!?])/g, '&nbsp;$1');
}

// Fonction pour générer le code des questions à choix multiples
// Fonction pour générer le code des questions à choix multiples
function generateMCQuestionCode(giftCode, questionId, questionText) {
    const mcOptions = document.querySelectorAll('#options-list-' + questionId + ' .option-container');
    
    // Vérifier s'il y a au moins une option cochée
    let hasMcCorrectOption = false;
    let totalWeight = 0;
    
    // Calculer le total des poids pour les options correctes
    mcOptions.forEach(option => {
        const isCorrect = option.querySelector('.correct-option').checked;
        if (isCorrect) {
            const optionId = option.querySelector('.remove-option-btn').getAttribute('data-oid');
            const weightSelect = document.getElementById(`option-weight-${questionId}-${optionId}`);
            // Utiliser la valeur complète stockée dans le select, pas la valeur affichée
            const weight = parseFloat(weightSelect.value) || 0;
            totalWeight += weight;
            hasMcCorrectOption = true;
        }
    });
    
    if (!hasMcCorrectOption && mcOptions.length > 0) {
        alert(`La question "${questionText}" n'a pas de réponse correcte sélectionnée.`);
        return giftCode;
    }
    
    // Vérifier si le total des poids est proche de 100% (avec une marge d'erreur)
    if (hasMcCorrectOption && (totalWeight < 99.5 || totalWeight > 100.5)) {
        if (!confirm(`Attention : Le total des pondérations pour la question "${questionText}" est de ${totalWeight.toFixed(2)}%, ce qui diffère de 100%. Voulez-vous continuer quand même ?`)) {
            return giftCode;
        }
    }
    
    // Générer le code GIFT pour les options QCM
    mcOptions.forEach(option => {
        const optionId = option.querySelector('.remove-option-btn').getAttribute('data-oid');
        const isCorrect = option.querySelector('.correct-option').checked;
        const optionText = document.getElementById(`option-text-${questionId}-${optionId}`).value.trim();
        const feedbackText = document.getElementById(`option-feedback-${questionId}-${optionId}`).value.trim();
        
        if (!optionText) return;
        
        // Ajouter les balises HTML et espaces insécables aux textes d'option
        const formattedOptionText = addHtmlTags(addNonBreakingSpaces(optionText));
        
        // Obtenir la valeur de poids du select
        const weightSelect = document.getElementById(`option-weight-${questionId}-${optionId}`);
        const weight = parseFloat(weightSelect.value);
        
        // Déterminer le format approprié pour le poids
        let formattedWeight;
        
        // Liste des valeurs fractionnaires nécessitant 5 décimales
        const fractionValues = [
            83.33333, -83.33333, 
            66.66667, -66.66667, 
            33.33333, -33.33333, 
            16.66667, -16.66667, 
            14.28571, -14.28571, 
            12.5, -12.5, 
            11.11111, -11.11111
        ];
        
        // Si c'est une des valeurs fractionnaires spécifiques, utiliser 5 décimales
        if (fractionValues.includes(weight)) {
            formattedWeight = weight.toFixed(5);
        } else {
            // Sinon, pour les nombres entiers, ne pas afficher de décimales
            if (Number.isInteger(weight)) {
                formattedWeight = weight.toString();
            } else {
                // Pour les autres valeurs décimales, utiliser 2 décimales
                formattedWeight = weight.toFixed(2);
            }
        }
        
        // Formater avec le poids approprié
        giftCode += `\n~%${formattedWeight}%${formattedOptionText}`;
        
        // Ajouter feedback spécifique à l'option si présent
        if (feedbackText) {
            const formattedFeedback = addHtmlTags(addNonBreakingSpaces(feedbackText));
            giftCode += `\n#${formattedFeedback}`;
        }
    });
    
    return giftCode;
}
// Fonction pour générer le code des questions à choix unique
// Fonction pour générer le code des questions à choix unique
function generateSCQuestionCode(giftCode, questionId, questionText) {
    const scOptions = document.querySelectorAll('#sc-options-list-' + questionId + ' .option-container');
    
    // Vérifier s'il y a exactement une option cochée
    let hasScCorrectOption = false;
    scOptions.forEach(option => {
        const isCorrect = option.querySelector('.correct-sc-option').checked;
        if (isCorrect) hasScCorrectOption = true;
    });
    
    if (!hasScCorrectOption && scOptions.length > 0) {
        alert(`La question "${questionText}" n'a pas de réponse correcte sélectionnée.`);
        return giftCode;
    }
    
    scOptions.forEach(option => {
        const optionId = option.querySelector('.remove-sc-option-btn').getAttribute('data-oid');
        const isCorrect = option.querySelector('.correct-sc-option').checked;
        const optionText = document.getElementById(`sc-option-text-${questionId}-${optionId}`).value.trim();
        const feedbackText = document.getElementById(`sc-option-feedback-${questionId}-${optionId}`).value.trim();
        
        if (!optionText) return;
        
        // Ajouter des balises HTML et espaces insécables au texte de l'option
        const formattedOptionText = addHtmlTags(addNonBreakingSpaces(optionText));
        
        // Ajout d'un saut de ligne entre chaque option
        if (isCorrect) {
            giftCode += `\n=${formattedOptionText}`;
        } else {
            giftCode += `\n~${formattedOptionText}`;
        }
        
        // Ajouter feedback spécifique à l'option si présent
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