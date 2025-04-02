document.addEventListener('DOMContentLoaded', function() {
    const importBtn = document.getElementById('import-btn');
    const fileInput = document.getElementById('gift-import');
    const fileDisplay = document.getElementById('file-display');
    const fileName = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file-btn');
    const customFileLabel = document.querySelector('.custom-file-label');
    
    // Récupérer des références aux éléments globaux nécessaires
    const questionsContainer = document.getElementById('questions-container');
    const giftOutput = document.getElementById('gift-output');
    const addQuestionBtn = document.getElementById('add-question-btn');
    
    // Par défaut, masquer l'affichage du fichier s'il n'y a pas de fichier sélectionné
    if (!fileInput.files.length) {
        fileDisplay.classList.add('hidden');
    }
    
    // Gestion de l'affichage du nom du fichier lors de sa sélection
    fileInput.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
            const name = fileInput.files[0].name;
            fileName.textContent = name;
            fileDisplay.classList.remove('hidden');
            customFileLabel.textContent = "Changer de fichier";
        } else {
            fileDisplay.classList.add('hidden');
            customFileLabel.textContent = "Choisir un fichier";
        }
    });
    
    // Fonction pour supprimer le fichier sélectionné
    removeFileBtn.addEventListener('click', function() {
        fileInput.value = '';
        fileDisplay.classList.add('hidden');
        customFileLabel.textContent = "Choisir un fichier";
    });

/**
 * Extrait toutes les métadonnées potentielles du contenu GIFT
 * @param {string} giftContent - Le contenu du fichier GIFT
 * @returns {string} - Le code article extrait (ou une chaîne vide)
 */
function extractMetadata(giftContent) {
    console.log('Début de l\'extraction des métadonnées');
    
    // Tableau pour collecter toutes les lignes de métadonnées
    const metadataLines = [];
    
    // On récupère toutes les lignes de commentaires au début du fichier
    const lines = giftContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Si ce n'est pas un commentaire ou si c'est une ligne vide, on arrête
        if (!line.startsWith('//') || line === '//') {
            break;
        }
        metadataLines.push(line);
    }
    
    console.log('Lignes de métadonnées trouvées:', metadataLines);
    
    // Extraire le code article
    let courseCode = '';
    for (let line of metadataLines) {
        // Recherche avec un motif plus précis pour "// Code article: "
        const codeArticleMatch = line.match(/\/\/\s*Code\s*article\s*:\s*(.+)/i);
        if (codeArticleMatch && codeArticleMatch[1]) {
            courseCode = codeArticleMatch[1].trim();
            
            // Mettre à jour le champ dans l'interface
            if (window.courseCode) {
                window.courseCode.value = courseCode;
                console.log('Code article importé:', courseCode);
            }
            break;
        }
        
        // Maintenir la compatibilité avec les anciens formats
        const oldFormatMatch = line.match(/\/\/\s*Code\s*matière\s*:\s*(.+)/i) || 
                               line.match(/\/\/\s*Code\s*matiere\s*:\s*(.+)/i) ||
                               line.match(/\/\/\s*Code\s*:\s*(.+)/i);
        
        if (oldFormatMatch && oldFormatMatch[1]) {
            courseCode = oldFormatMatch[1].trim();
            if (window.courseCode) {
                window.courseCode.value = courseCode;
                console.log('Code article importé (ancien format):', courseCode);
            }
            break;
        }
    }
    
    // Extraire les informations d'auteur
    for (let line of metadataLines) {
        const authorMatch = line.match(/\/\/\s*Auteur\s*:\s*(.+)/i) || 
                           line.match(/\/\/\s*Auteurs?\s*:\s*(.+)/i);
        
        if (authorMatch && authorMatch[1]) {
            const authorFullName = authorMatch[1].trim();
            
            // Pour correspondre au format de génération "// Auteur: Prénom Nom"
            const nameParts = authorFullName.split(' ');
            
            if (nameParts.length >= 1) {
                const firstName = nameParts[0];
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                
                if (window.authorFirstname) {
                    window.authorFirstname.value = firstName;
                    console.log('Prénom de l\'auteur importé:', firstName);
                }
                
                if (window.authorLastname) {
                    window.authorLastname.value = lastName;
                    console.log('Nom de l\'auteur importé:', lastName);
                }
            }
            break;
        }
    }
    
    console.log('Extraction des métadonnées terminée. Code article trouvé:', courseCode);
    return courseCode;  // Retourner le code article pour l'utilisation dans les questions
}
    
    // Fonction pour l'importation des fichiers GIFT
    importBtn.addEventListener('click', function() {
        if (fileInput.files.length === 0) {
            alert('Veuillez sélectionner un fichier GIFT (.txt) à importer.');
            return;
        }
        
        // Désactiver le bouton pendant le traitement pour éviter les clics multiples
        importBtn.disabled = true;
        importBtn.textContent = 'Importation...';
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const giftContent = e.target.result;
                parseGiftContent(giftContent);
            } catch (error) {
                console.error('Erreur lors du parsing du fichier GIFT:', error);
                alert('Erreur lors du parsing du fichier GIFT. Vérifiez le format de votre fichier.');
            } finally {
                // Réactiver le bouton une fois terminé
                importBtn.disabled = false;
                importBtn.textContent = 'Importer';
            }
        };
        
        reader.onerror = function() {
            alert('Erreur lors de la lecture du fichier.');
            importBtn.disabled = false;
            importBtn.textContent = 'Importer';
        };
        
        reader.readAsText(file);
    });
    
    /**
     * Valide un fichier GIFT avant de l'importer
     * @param {string} giftContent - Le contenu du fichier GIFT
     * @returns {boolean} - true si le contenu est valide, false sinon
     */
    function validateGiftFormat(giftContent) {
        // Vérification de base - le contenu doit contenir au moins une question GIFT
        if (!giftContent || typeof giftContent !== 'string') {
            console.error('Contenu GIFT invalide: le contenu est vide ou n\'est pas une chaîne');
            return false;
        }
        
        // Vérifier qu'il y a au moins une structure de question : ::titre::texte{réponses}
        const basicQuestionPattern = /::[^:]*::[^{]*{[^}]*}/s;
        if (!basicQuestionPattern.test(giftContent)) {
            console.error('Contenu GIFT invalide: aucune structure de question trouvée');
            return false;
        }
        
        // Vérifier l'équilibre des accolades
        let braceCount = 0;
        let insideQuestion = false;
        
        for (let i = 0; i < giftContent.length; i++) {
            const char = giftContent[i];
            if (char === '{') {
                braceCount++;
                insideQuestion = true;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    insideQuestion = false;
                }
            }
            
            // Erreur si le nombre d'accolades fermantes dépasse le nombre d'accolades ouvrantes
            if (braceCount < 0) {
                console.error(`Contenu GIFT invalide: accolade fermante sans accolade ouvrante à la position ${i}`);
                return false;
            }
        }
        
        // Erreur si toutes les accolades ne sont pas fermées
        if (braceCount !== 0) {
            console.error(`Contenu GIFT invalide: ${braceCount} accolades non fermées`);
            return false;
        }
        
        return true;
    }
    
   /**
 * Parse le contenu GIFT et crée les questions correspondantes dans l'interface
 * @param {string} giftContent - Le contenu du fichier GIFT
 */
function parseGiftContent(giftContent) {
    console.log("Début du parsing du contenu GIFT");
    
    // Valider le format GIFT
    if (!validateGiftFormat(giftContent)) {
        alert('Le fichier ne semble pas être au format GIFT valide. Vérifiez le contenu du fichier.');
        return;
    }
    
    // Ajouter une classe pour indiquer le chargement en cours
    document.body.classList.add('importing');
    
    // Confirmer avant de remplacer les questions existantes
    if (questionsContainer.children.length > 0) {
        if (!confirm('Cet import remplacera toutes les questions actuelles. Voulez-vous continuer?')) {
            document.body.classList.remove('importing');
            return;
        }
        // Vider le conteneur de questions
        questionsContainer.innerHTML = '';
        // Vider aussi la zone de sortie GIFT
        giftOutput.value = '';
    }
    
    // Afficher un message de traitement
    const processingElement = document.createElement('div');
    processingElement.className = 'processing-message';
    processingElement.textContent = 'Traitement du fichier GIFT en cours...';
    document.body.appendChild(processingElement);
    
    // Réinitialiser le compteur de questions global si possible
    if (typeof window.questionCounter !== 'undefined') {
        window.questionCounter = 0;
    }
    
    // Extraire les métadonnées
    const courseCode = extractMetadata(giftContent);
    
    // Utiliser setTimeout pour permettre à l'interface de se mettre à jour avant le traitement
    setTimeout(() => {
        try {
            // Prétraiter le contenu pour mieux gérer les commentaires et les sauts de ligne
            const preprocessedContent = preprocessGiftContent(giftContent);
            
            // Diviser le contenu en questions individuelles
            const questions = splitGiftQuestions(preprocessedContent);
            
            if (questions.length === 0) {
                alert('Aucune question n\'a été trouvée dans le fichier GIFT.');
                document.body.classList.remove('importing');
                document.body.removeChild(processingElement);
                return;
            }
            
            // Compteurs pour les statistiques
            let successCount = 0;
            let errorCount = 0;
            
            // Traiter chaque question
            questions.forEach((questionText, index) => {
                if (questionText.trim() === '') return;
                
                try {
                    parseGiftQuestion(questionText, courseCode);
                    successCount++;
                } catch (error) {
                    console.error(`Erreur lors du parsing de la question ${index + 1}:`, error);
                    console.log('Texte de la question problématique:', questionText);
                    errorCount++;
                }
            });
            
            // Message de résultat avec plus de détails
            let resultMessage = `${successCount} question(s) importée(s) avec succès.`;
            if (errorCount > 0) {
                resultMessage += `\n${errorCount} question(s) n'ont pas pu être importées correctement. Consultez la console pour plus de détails.`;
            }
            
            alert(resultMessage);
            
            // Regénérer le code GIFT pour montrer le résultat
            const generateBtn = document.getElementById('generate-btn');
            if (generateBtn) {
                generateBtn.click();
            }
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            alert('Une erreur s\'est produite lors de l\'importation du fichier GIFT.');
        } finally {
            // Supprimer le message de traitement et la classe d'importation
            document.body.classList.remove('importing');
            if (document.body.contains(processingElement)) {
                document.body.removeChild(processingElement);
            }
        }
    }, 100); // Petit délai pour permettre l'affichage du message de traitement
}

    /**
     * Prétraite le contenu GIFT pour gérer les commentaires et les feedbacks répartis sur plusieurs lignes
     * @param {string} giftContent - Le contenu du fichier GIFT
     * @returns {string} - Le contenu prétraité
     */
    function preprocessGiftContent(giftContent) {
        // Normaliser les fins de ligne
        let content = giftContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Traiter le contenu ligne par ligne
        const lines = content.split('\n');
        const processedLines = [];
        
        let inOption = false;
        let currentOption = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Si c'est une ligne vide, la conserver
            if (line === '') {
                processedLines.push('');
                continue;
            }
            
            // Si c'est le début d'une option (~ ou =)
            if (line.startsWith('~') || line.startsWith('=')) {
                // Si on était déjà dans une option, ajouter l'option précédente
                if (inOption && currentOption) {
                    processedLines.push(currentOption);
                }
                currentOption = line;
                inOption = true;
                continue;
            }
            
            // Si c'est une ligne de feedback (#)
            if (line.startsWith('#') && inOption) {
                // Ajouter le feedback à l'option actuelle
                currentOption += line;
                continue;
            }
            
            // Si c'est le marqueur de feedback général (####)
            if (line.startsWith('####')) {
                // Si on était dans une option, ajouter l'option précédente
                if (inOption && currentOption) {
                    processedLines.push(currentOption);
                    inOption = false;
                    currentOption = '';
                }
                processedLines.push(line);
                continue;
            }
            
            // Si c'est une ligne normale
            if (inOption) {
                // Si on est dans une option, ajouter à l'option actuelle
                currentOption += ' ' + line;
            } else {
                // Sinon, ajouter comme une ligne normale
                processedLines.push(line);
            }
        }
        
        // Ajouter la dernière option si elle existe
        if (inOption && currentOption) {
            processedLines.push(currentOption);
        }
        
        return processedLines.join('\n');
    }
    
/**
 * Nettoie un identifiant de question en supprimant les suffixes "-Qx" s'ils existent
 * @param {string} questionId - L'identifiant brut de la question
 * @param {string} courseCode - Le code article actuel
 * @returns {object} - Un objet avec l'identifiant nettoyé et un indicateur s'il était généré auto ou manuel
 */
function cleanQuestionId(questionId, courseCode) {
    // Si l'identifiant est vide, retourner directement
    if (!questionId) {
        return {
            id: '',
            isAuto: true
        };
    }
    
    console.log(`Nettoyage de l'ID: "${questionId}" avec le code article: "${courseCode}"`);
    
    // Si le code article est défini et que l'ID commence par ce code article
    if (courseCode && questionId.startsWith(courseCode + '-Q')) {
        // C'est un ID auto-généré, retourner une chaîne vide
        console.log(`ID auto-généré détecté: ${questionId}`);
        return {
            id: '',
            isAuto: true
        };
    }
    
    // Vérifier s'il y a un motif -Q suivi de chiffres à la fin (y compris format -Q01, -Q02)
    const qSuffixPattern = /-Q\d+$/;
    if (qSuffixPattern.test(questionId)) {
        // Supprimer le suffixe -Q et les chiffres
        const cleanedId = questionId.replace(qSuffixPattern, '');
        console.log(`ID manuel avec suffixe détecté, nettoyé en: ${cleanedId}`);
        return {
            id: cleanedId,
            isAuto: false
        };
    }
    
    // Si c'est un ID sans motif -Q, le considérer comme manuel
    console.log(`ID manuel sans suffixe: ${questionId}`);
    return {
        id: questionId,
        isAuto: false
    };
}
    
/**
 * Extrait les options avec leurs feedbacks d'une section de réponses GIFT
 * @param {string} answersContent - Le contenu des réponses
 * @param {boolean} isSingleChoice - true pour QCU, false pour QCM
 * @returns {Array} - Un tableau d'objets représentant chaque option
 */
function extractOptionsWithFeedback(answersContent, isSingleChoice) {
    const options = [];
    
    // Normaliser les retours à la ligne
    const normalizedContent = answersContent.replace(/\r\n/g, '\n');
    
    // Diviser le contenu en lignes
    const lines = normalizedContent.split('\n');
    
    // Variables temporaires pour reconstituer les options
    let currentOption = null;
    let optionLines = [];
    let inFeedback = false;
    
    // Parcourir chaque ligne
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Ignorer les lignes vides
        if (line === '') continue;
        
        // Si c'est le début d'une option (= ou ~)
        if ((isSingleChoice && (line.startsWith('=') || line.startsWith('~'))) || 
            (!isSingleChoice && line.startsWith('~'))) {
            
            // Si on a déjà une option en cours, l'ajouter à la liste
            if (currentOption !== null) {
                options.push(parseOptionWithFeedback(optionLines.join(' '), isSingleChoice));
                inFeedback = false;
            }
            
            // Commencer une nouvelle option
            currentOption = line;
            optionLines = [line];
        }
        // Si c'est un feedback (ligne commençant par #)
        else if (line.startsWith('#')) {
            // Marquer que nous sommes dans une section de feedback
            inFeedback = true;
            // Ajouter à l'option en cours avec un espace pour assurer la séparation
            optionLines.push(line);
        }
        // Sinon, c'est la suite du texte de l'option ou du feedback
        else if (currentOption !== null) {
            // Si nous sommes dans une section de feedback, préserver cette structure
            if (inFeedback) {
                // Ajouter un espace pour garantir la bonne séparation
                optionLines[optionLines.length - 1] += ' ' + line;
            } else {
                // Sinon, c'est la suite du texte de l'option
                optionLines.push(' ' + line);
            }
        }
    }
    
    // Ajouter la dernière option
    if (currentOption !== null) {
        options.push(parseOptionWithFeedback(optionLines.join(' '), isSingleChoice));
    }
    
    console.log("Extracted options:", options);
    return options;
}
    
/**
 * Parse une ligne d'option avec feedback
 * @param {string} optionLine - La ligne d'option
 * @param {boolean} isSingleChoice - true pour QCU, false pour QCM
 * @returns {Object} - Un objet représentant l'option
 */
function parseOptionWithFeedback(optionLine, isSingleChoice) {
    const option = {
        text: '',
        isCorrect: false,
        weight: '0',
        feedback: ''
    };
    
    // Extraire le feedback s'il existe
    const feedbackParts = optionLine.split('#');
    if (feedbackParts.length > 1) {
        // Récupérer tout ce qui suit le premier # comme feedback
        option.feedback = feedbackParts.slice(1).join('#').trim();
        optionLine = feedbackParts[0].trim();
    }
    
    // Traiter en fonction du type de question
    if (isSingleChoice) {
        // Pour QCU (= ou ~)
        option.isCorrect = optionLine.startsWith('=');
        option.text = optionLine.substring(1).trim();
        option.weight = option.isCorrect ? '100' : '0';
    } else {
        // Pour QCM (~)
        option.text = optionLine.substring(1).trim();
        
        // Extraire la pondération si elle existe
        const weightMatch = option.text.match(/^%([+-]?\d+(?:\.\d+)?)%(.*)/);
        if (weightMatch) {
            // Stocker la valeur originale non formatée pour utilisation ultérieure
            let weightValue = parseFloat(weightMatch[1]);
            
            // Liste des valeurs fractionnaires nécessitant un traitement spécial
            const fractionValues = [
                83.33333, -83.33333, 
                66.66667, -66.66667, 
                33.33333, -33.33333, 
                16.66667, -16.66667, 
                14.28571, -14.28571, 
                12.5, -12.5, 
                11.11111, -11.11111
            ];
            
            // Vérifier si le poids est proche d'une des valeurs fractionnaires
            // Utilisation d'une petite tolérance pour gérer les erreurs d'arrondi
            for (const fractionValue of fractionValues) {
                if (Math.abs(weightValue - fractionValue) < 0.0001) {
                    weightValue = fractionValue;
                    break;
                }
            }
            
            option.weight = weightValue.toString();
            option.text = weightMatch[2].trim();
            option.isCorrect = parseFloat(option.weight) > 0;
        }
    }
    
    // Nettoyer les balises HTML du texte et du feedback
    option.text = cleanHtmlTags(option.text);
    option.feedback = cleanHtmlTags(option.feedback);
    
    return option;
}
    function splitGiftQuestions(giftContent) {
        // Nettoyer le contenu (retirer les commentaires, etc.)
        let cleanContent = giftContent
            .replace(/^\/\/.*$/gm, '') // Supprimer les commentaires de ligne
            .replace(/\n\s*\n/g, '\n\n'); // Normaliser les sauts de ligne
        
        console.log("Clean content for parsing:", cleanContent);
        
        // Array pour stocker les questions
        const questions = [];
        
        // Parcourir le texte et extraire chaque question complète
        let insideQuestion = false;
        let currentQuestion = '';
        let braceCount = 0;
        
        for (let i = 0; i < cleanContent.length; i++) {
            const char = cleanContent[i];
            
            // Si on trouve l'identifiant d'une question "::" et qu'on n'est pas déjà dans une question
            if (char === ':' && cleanContent[i + 1] === ':' && !insideQuestion) {
                currentQuestion = '';
                insideQuestion = true;
            }
            
            // Ajouter le caractère actuel à la question en cours
            if (insideQuestion) {
                currentQuestion += char;
                
                // Compter les accolades
                if (char === '{') {
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    
                    // Si braceCount revient à 0, c'est la fin de la question
                    if (braceCount === 0) {
                        questions.push(currentQuestion);
                        currentQuestion = '';
                        insideQuestion = false;
                    }
                }
            }
        }
        
        // Filtrer les questions vides et invalides
        const filteredQuestions = questions.filter(q => {
            // Une question GIFT valide doit contenir à la fois ::, { et }
            return q.trim() !== '' && q.includes('::') && 
                   q.includes('{') && q.includes('}');
        });
        
        console.log("Questions extracted:", filteredQuestions);
        return filteredQuestions;
    }
    
/**
 * Parse une question GIFT individuelle et crée l'élément de question correspondant
 * @param {string} questionText - Le texte d'une question GIFT
 * @param {string} courseCode - Le code article actuel
 */
function parseGiftQuestion(questionText, courseCode) {
    // Nettoyage préliminaire du texte
    questionText = questionText.trim();
    
    // Extraction des parties principales de la question
    // Identifiant de la question entre ::
    const titleMatch = questionText.match(/::(.*?)::/);
    let questionId = titleMatch ? titleMatch[1].trim() : '';
    
    // Nettoyer l'identifiant en supprimant les suffixes "-Qx"
    const cleanedIdInfo = cleanQuestionId(questionId, courseCode);
    questionId = cleanedIdInfo.id; // Utiliser l'ID nettoyé (vide si auto-généré)
    
    // Extraction du texte de la question - tout ce qui est entre ::[html] et {
    let questionContent = '';
    if (titleMatch) {
        // Trouver le texte après l'identifiant
        const afterTitle = questionText.substring(titleMatch[0].length).trim();
        // Vérifier s'il y a un tag [html]
        const htmlTagMatch = afterTitle.match(/^\[html\](.*?)\{/s);
        if (htmlTagMatch) {
            questionContent = htmlTagMatch[1].trim();
            // Nettoyer les balises HTML et les espaces insécables pour l'affichage
            questionContent = cleanHtmlTags(questionContent);
        } else {
            // Si pas de tag [html], prendre tout jusqu'à {
            const plainMatch = afterTitle.match(/(.*?)\{/s);
            if (plainMatch) {
                questionContent = plainMatch[1].trim();
            }
        }
    }
    
    // Extraction des réponses et du feedback - tout ce qui est entre { et }
    let answersContent = '';
    const openBraceIndex = questionText.indexOf('{');
    if (openBraceIndex !== -1) {
        const closeBraceIndex = questionText.lastIndexOf('}');
        if (closeBraceIndex > openBraceIndex) {
            answersContent = questionText.substring(openBraceIndex + 1, closeBraceIndex).trim();
        }
    }
    
    console.log('Parsing question:', {
        id: questionId, // ID nettoyé (vide si auto-généré)
        content: questionContent,
        answers: answersContent
    });
    
    // Déterminer le type de question
    let questionType = determineQuestionType(answersContent);
    console.log('Question type determined:', questionType);
    
    // Créer une nouvelle question dans l'interface
    const newQuestionId = addNewQuestionFromImport(questionId, questionContent, questionType);
    
    // Remplir les réponses en fonction du type de question
    if (newQuestionId) {
        fillQuestionAnswers(newQuestionId, questionType, answersContent);
    }
}

// Fonction utilitaire pour nettoyer les balises HTML
function cleanHtmlTags(text) {
    // Remplacer les espaces insécables par des espaces normaux
    text = text.replace(/&nbsp;/g, ' ');
    
    // Supprimer les balises HTML communes
    return text.replace(/<\/?p>/g, '')
              .replace(/<\/?div>/g, '')
              .replace(/<\/?span>/g, '')
              .replace(/<\/?br\s?\/?>/g, '\n')
              .replace(/<[^>]+>/g, ''); // Supprimer toutes les autres balises HTML
}
    
    /**
     * Détermine le type de question GIFT
     * @param {string} answersContent - La section des réponses d'une question GIFT
     * @returns {string} - Le type de question ('mc', 'sc', 'tf', 'sa', 'num')
     */
    function determineQuestionType(answersContent) {
        // Nettoyer le contenu des réponses et supprimer le feedback général
        let cleanContent = answersContent.trim();
        const feedbackIndex = cleanContent.indexOf('####');
        if (feedbackIndex !== -1) {
            cleanContent = cleanContent.substring(0, feedbackIndex).trim();
        }
        
        console.log('Determining question type from:', cleanContent);
        
        // Question Vrai/Faux
        if (cleanContent === 'T' || cleanContent === 'F') {
            return 'tf';
        }
        
        // Question numérique
        if (cleanContent.startsWith('#')) {
            return 'num';
        }
        
        // Diviser en lignes pour analyser la structure
        const lines = cleanContent.split('\n').map(line => line.trim()).filter(line => line !== '');
        
        // Vérifier si c'est un QCM avec pourcentages
        const hasMcWeights = lines.some(line => line.match(/~%[+-]?[\d.]+%/));
        if (hasMcWeights) {
            return 'mc';
        }
        
        // Question à réponse courte
        // Si au moins une ligne commence par = et aucune par ~, c'est un QRC
        const hasEquals = lines.some(line => line.startsWith('='));
        const hasTilde = lines.some(line => line.startsWith('~'));
        
        if (hasEquals && !hasTilde) {
            return 'sa';
        }
        
        // Question à choix unique ou multiple
        if (hasTilde) {
            // Si au moins une ligne commence par =, c'est une QCU
            if (hasEquals) {
                return 'sc';
            } else {
                // Sinon c'est un QCM
                return 'mc';
            }
        }
        
        // Par défaut, s'il y a au moins une ligne avec =, considérer comme QRC
        if (hasEquals) {
            return 'sa';
        }
        
        // Si on ne peut pas déterminer le type, par défaut QCM
        console.log('Could not determine type, defaulting to mc');
        return 'mc';
    }
/**
 * Ajoute une nouvelle question à l'interface à partir des données importées
 * @param {string} questionId - L'identifiant de la question
 * @param {string} questionContent - Le texte de la question
 * @param {string} questionType - Le type de question ('mc', 'sc', 'tf', 'sa', 'num')
 * @returns {string} - L'identifiant du nouvel élément de question créé
 */
function addNewQuestionFromImport(questionId, questionContent, questionType) {
    console.log(`Adding new question: ${questionId}, type: ${questionType}`);
    
    // Utiliser directement la fonction addNewQuestion() exposée globalement
    // au lieu de simuler un clic sur le bouton
    addNewQuestion();
    
    // Récupérer la dernière question ajoutée
    const questionContainer = questionsContainer.lastElementChild;
    if (!questionContainer) {
        console.error('Failed to create a new question element');
        return null;
    }
    
    const newQuestionId = questionContainer.dataset.id;
    
    // Remplir les informations de base
    document.getElementById(`question-id-${newQuestionId}`).value = questionId;
    document.getElementById(`question-text-${newQuestionId}`).value = questionContent;
    
    // Sélectionner le type de question
    const questionTypeRadio = document.getElementById(`${questionType}-type-${newQuestionId}`);
    if (questionTypeRadio) {
        questionTypeRadio.checked = true;
        // Déclencher l'événement change pour afficher les bons champs
        const changeEvent = new Event('change');
        questionTypeRadio.dispatchEvent(changeEvent);
    }
    
    return newQuestionId;
}
    
/**
 * Remplit les réponses d'une question en fonction de son type
 * @param {string} questionId - L'identifiant de l'élément de question
 * @param {string} questionType - Le type de question ('mc', 'sc', 'tf', 'sa', 'num')
 * @param {string} answersContent - Le contenu des réponses
 */
function fillQuestionAnswers(questionId, questionType, answersContent) {
    console.log(`Filling answers for question ${questionId} of type ${questionType}`);
    console.log('Answers content:', answersContent);
    
    // Extraire le feedback général s'il existe
    let generalFeedback = '';
    const feedbackMatch = answersContent.match(/####([\s\S]*)/);
    if (feedbackMatch) {
        generalFeedback = feedbackMatch[1].trim();
        // Nettoyer le feedback général des balises HTML
        generalFeedback = cleanHtmlTags(generalFeedback);
        // Mettre à jour le champ de feedback
        document.getElementById(`general-feedback-${questionId}`).value = generalFeedback;
    }
    
    // Nettoyer le contenu des réponses (retirer le feedback général)
    let cleanAnswers = answersContent;
    if (feedbackMatch) {
        cleanAnswers = answersContent.substring(0, answersContent.indexOf('####'));
    }
    
    // Traiter spécifiquement les commentaires de retour (feedback) pour chaque option
    cleanAnswers = cleanAnswers.replace(/#([^\n]*)/g, function(match, p1) {
        return "#" + p1.trim();
    });
    
    switch (questionType) {
        case 'tf': // Vrai/Faux
            const isTrueChecked = cleanAnswers.trim().startsWith('T');
            document.getElementById(`true-option-${questionId}`).checked = isTrueChecked;
            document.getElementById(`false-option-${questionId}`).checked = !isTrueChecked;
            break;
            
        case 'num': // Numérique
            const numMatch = cleanAnswers.match(/#([\d.-]+)(?::([\d.-]+))?/);
            if (numMatch) {
                const numValue = numMatch[1];
                const numMargin = numMatch[2];
                
                document.getElementById(`num-answer-${questionId}`).value = numValue;
                
                if (numMargin) {
                    document.getElementById(`num-range-${questionId}`).checked = true;
                    document.getElementById(`num-margin-${questionId}`).value = numMargin;
                    // Afficher les options de marge
                    const numRangeOptions = document.getElementById(`num-range-options-${questionId}`);
                    if (numRangeOptions) {
                        numRangeOptions.classList.remove('hidden');
                    }
                }
            }
            break;
            
        case 'sa': // QRC
            const saOptionsList = document.getElementById(`sa-options-list-${questionId}`);
            if (!saOptionsList) {
                console.error(`Could not find sa-options-list-${questionId}`);
                break;
            }
            
            // Vider les options existantes
            while (saOptionsList.firstChild) {
                saOptionsList.removeChild(saOptionsList.firstChild);
            }
            
            // Extraire les réponses acceptées avec leurs pondérations
            const saResponses = [];
            // Recherche les lignes commençant par = ou =% pour les QRC
            const reEqualLines = /^=(?:%(\d+(?:\.\d+)?)%)?([^#\n]*)(?:#([^\n]*))?/gm;
            let match;
            
            while ((match = reEqualLines.exec(cleanAnswers)) !== null) {
                let weight = match[1] ? match[1] : '100';
                let text = match[2].trim();
                let feedback = match[3] ? match[3].trim() : '';
                
                // Nettoyer le texte et le feedback des balises HTML
                text = cleanHtmlTags(text);
                feedback = feedback ? cleanHtmlTags(feedback) : '';
                
                saResponses.push({
                    weight: weight,
                    text: text,
                    feedback: feedback
                });
            }
            
            console.log('SA responses extracted:', saResponses);
            
            if (saResponses.length === 0) {
                console.error('No SA responses found in:', cleanAnswers);
            }
            
            // Ajouter chaque réponse
            saResponses.forEach((response) => {
                const addSAOptionBtn = document.querySelector(`.add-sa-option-btn[data-qid="${questionId}"]`);
                if (addSAOptionBtn) {
                    addSAOptionBtn.click();
                    
                    // Mettre à jour le dernier élément ajouté
                    const optionElements = saOptionsList.querySelectorAll('.option-container');
                    const lastOption = optionElements[optionElements.length - 1];
                    
                    if (lastOption) {
                        const optionId = lastOption.querySelector('.remove-sa-option-btn').getAttribute('data-oid');
                        const textInput = document.getElementById(`sa-option-text-${questionId}-${optionId}`);
                        const weightInput = document.getElementById(`sa-option-weight-${questionId}-${optionId}`);
                        const feedbackInput = document.getElementById(`sa-option-feedback-${questionId}-${optionId}`);
                        
                        if (textInput) textInput.value = response.text;
                        if (weightInput) {
                            weightInput.value = response.weight;
                            weightInput.setAttribute('data-full-value', response.weight);
                            updateSAWeightColor(weightInput);
                        }
                        if (feedbackInput && response.feedback) feedbackInput.value = response.feedback;
                    }
                }
            });
            break;
            
        case 'sc': // QCU
            const scOptionsList = document.getElementById(`sc-options-list-${questionId}`);
            if (!scOptionsList) {
                console.error(`Could not find sc-options-list-${questionId}`);
                break;
            }
            
            // Vider les options existantes
            while (scOptionsList.firstChild) {
                scOptionsList.removeChild(scOptionsList.firstChild);
            }
            
            // Traiter proprement les options et leurs feedbacks
            const scOptionsWithFeedback = extractOptionsWithFeedback(cleanAnswers, true);
            console.log('SC options with feedback:', scOptionsWithFeedback);
            
            // Ajouter chaque option
            scOptionsWithFeedback.forEach((option) => {
                const addSCOptionBtn = document.querySelector(`.add-sc-option-btn[data-qid="${questionId}"]`);
                if (addSCOptionBtn) {
                    addSCOptionBtn.click();
                    
                    // Mettre à jour le dernier élément ajouté
                    const optionElements = scOptionsList.querySelectorAll('.option-container');
                    const lastOption = optionElements[optionElements.length - 1];
                    
                    if (lastOption) {
                        const optionId = lastOption.querySelector('.remove-sc-option-btn').getAttribute('data-oid');
                        const radioInput = lastOption.querySelector(`.correct-sc-option`);
                        
                        if (radioInput) radioInput.checked = option.isCorrect;
                        
                        const textInput = document.getElementById(`sc-option-text-${questionId}-${optionId}`);
                        if (textInput) textInput.value = cleanHtmlTags(option.text);
                        
                        const feedbackInput = document.getElementById(`sc-option-feedback-${questionId}-${optionId}`);
                        if (feedbackInput && option.feedback) feedbackInput.value = cleanHtmlTags(option.feedback);
                    }
                }
            });
            break;
            
        case 'mc': // QCM
            const mcOptionsList = document.getElementById(`options-list-${questionId}`);
            if (!mcOptionsList) {
                console.error(`Could not find options-list-${questionId}`);
                break;
            }
            
            // Vider les options existantes
            while (mcOptionsList.firstChild) {
                mcOptionsList.removeChild(mcOptionsList.firstChild);
            }
            
            // Traiter proprement les options et leurs feedbacks
            const mcOptionsWithFeedback = extractOptionsWithFeedback(cleanAnswers, false);
            console.log('MC options with feedback:', mcOptionsWithFeedback);
            
            // Ajouter chaque option
            mcOptionsWithFeedback.forEach((option) => {
                const addOptionBtn = document.querySelector(`.add-option-btn[data-qid="${questionId}"]`);
                if (addOptionBtn) {
                    addOptionBtn.click();
                    
                    // Mettre à jour le dernier élément ajouté
                    const optionElements = mcOptionsList.querySelectorAll('.option-container');
                    const lastOption = optionElements[optionElements.length - 1];
                    
                    if (lastOption) {
                        const optionId = lastOption.querySelector('.remove-option-btn').getAttribute('data-oid');
                        const checkbox = lastOption.querySelector('.correct-option');
                        
                        if (checkbox) checkbox.checked = option.isCorrect;
                        
                        const textInput = document.getElementById(`option-text-${questionId}-${optionId}`);
                        if (textInput) textInput.value = cleanHtmlTags(option.text);
                        
                        // Sélectionner la valeur du poids dans le select
                        const weightSelect = document.getElementById(`option-weight-${questionId}-${optionId}`);
                        if (weightSelect) {
                            // Trouver l'option la plus proche dans le select
                            let closestOption = null;
                            let minDiff = Infinity;
                            
                            for (let i = 0; i < weightSelect.options.length; i++) {
                                const optValue = parseFloat(weightSelect.options[i].value);
                                const diff = Math.abs(optValue - parseFloat(option.weight));
                                
                                if (diff < minDiff) {
                                    minDiff = diff;
                                    closestOption = weightSelect.options[i];
                                }
                            }
                            
                            if (closestOption) {
                                closestOption.selected = true;
                                
                                // Ajouter la classe active-weight si nécessaire
                                if (option.isCorrect) {
                                    weightSelect.classList.add('active-weight');
                                } else {
                                    weightSelect.classList.remove('active-weight');
                                }
                                
                                // Appliquer la couleur en fonction de la valeur sélectionnée
                                updateWeightColor(weightSelect);
                            }
                        }
                        
                        // Ajouter le feedback s'il existe
                        const feedbackInput = document.getElementById(`option-feedback-${questionId}-${optionId}`);
                        if (feedbackInput && option.feedback) feedbackInput.value = cleanHtmlTags(option.feedback);
                    }
                }
            });
            break;
        }
    }
});