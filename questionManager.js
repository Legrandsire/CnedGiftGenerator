// Fonction pour ajouter une nouvelle question
function addNewQuestion() {
    window.questionCounter++;
    
const questionDiv = document.createElement('div');
questionDiv.className = 'question-container';
questionDiv.dataset.id = window.questionCounter;
    
    questionDiv.innerHTML = `
        <div class="question-header">
            <h2>Question ${document.querySelectorAll('.question-container').length + 1}</h2>
            <div class="question-move-controls">
                <button type="button" class="move-btn move-up-btn" data-qid="${window.questionCounter}" title="Monter cette question">▲</button>
                <button type="button" class="move-btn move-down-btn" data-qid="${window.questionCounter}" title="Descendre cette question">▼</button>
            </div>
        </div>
        <div class="form-group">
            <label for="${IDS.questionId(window.questionCounter)}">Identifiant/Numéro de question: <span class="optional-field">(facultatif)</span></label>
            <input type="text" id="${IDS.questionId(window.questionCounter)}" placeholder="Laissez vide pour générer automatiquement">
            <p class="info-text">Si non renseigné, un identifiant sera généré avec le format: [Code matière]-Q${window.questionCounter}</p>
        </div>
        <div class="form-group">
            <label for="question-type-${window.questionCounter}">Type de question:</label>
            <div class="radio-group">
                <div class="radio-option">
                    <input type="radio" id="${IDS.typeRadio('mc', window.questionCounter)}" name="question-type-${window.questionCounter}" value="mc" checked>
                    <label for="${IDS.typeRadio('mc', window.questionCounter)}">QCM</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="${IDS.typeRadio('sc', window.questionCounter)}" name="question-type-${window.questionCounter}" value="sc">
                    <label for="${IDS.typeRadio('sc', window.questionCounter)}">QCU</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="${IDS.typeRadio('tf', window.questionCounter)}" name="question-type-${window.questionCounter}" value="tf">
                    <label for="${IDS.typeRadio('tf', window.questionCounter)}">Vrai/Faux</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="${IDS.typeRadio('sa', window.questionCounter)}" name="question-type-${window.questionCounter}" value="sa">
                    <label for="${IDS.typeRadio('sa', window.questionCounter)}">QRC</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="${IDS.typeRadio('num', window.questionCounter)}" name="question-type-${window.questionCounter}" value="num">
                    <label for="${IDS.typeRadio('num', window.questionCounter)}">Numérique</label>
                </div>
            </div>
        </div>
        
        <div class="form-group">
            <label for="${IDS.questionText(window.questionCounter)}">Texte de la question:</label>
        ${createRichTextEditor(`${IDS.questionText(window.questionCounter)}`, 'Entrez le texte de la question')}
        </div>
        
        <!-- Options QCM -->
        <div id="${IDS.typeOptions('mc', window.questionCounter)}">
            <div class="form-group">
                <label>Options (cochez toutes les réponses correctes):</label>
                <div class="options-list" id="${IDS.optionsList(window.questionCounter)}">
                    <!-- Les options seront ajoutées ici dynamiquement -->
                </div>
                <button class="add-btn add-option-btn" data-qid="${window.questionCounter}">Ajouter une option</button>
            </div>
        </div>
        
        <!-- Options QCU -->
        <div id="${IDS.typeOptions('sc', window.questionCounter)}" class="hidden">
            <div class="form-group">
                <label>Options (cochez la réponse correcte):</label>
                <div class="options-list-radio" id="${IDS.scOptionsList(window.questionCounter)}">
                    <!-- Les options seront ajoutées ici dynamiquement -->
                </div>
                <button class="add-btn add-sc-option-btn" data-qid="${window.questionCounter}">Ajouter une option</button>
            </div>
        </div>
        
        <!-- Options Vrai/Faux -->
        <div id="${IDS.typeOptions('tf', window.questionCounter)}" class="hidden">
            <div class="form-group">
                <label>Réponse correcte:</label>
                <div class="radio-group">
                    <div class="radio-option">
                        <input type="radio" id="${IDS.trueOption(window.questionCounter)}" name="tf-answer-${window.questionCounter}" value="true" checked>
                        <label for="${IDS.trueOption(window.questionCounter)}">Vrai</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="${IDS.falseOption(window.questionCounter)}" name="tf-answer-${window.questionCounter}" value="false">
                        <label for="${IDS.falseOption(window.questionCounter)}">Faux</label>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Options QRC -->
        <div id="${IDS.typeOptions('sa', window.questionCounter)}" class="hidden">
            <div class="form-group">
                <label>Réponses acceptées:</label>
                <div class="sa-options-list" id="${IDS.saOptionsList(window.questionCounter)}">
                    <!-- Les réponses seront ajoutées ici dynamiquement -->
                </div>
                <button class="add-btn add-sa-option-btn" data-qid="${window.questionCounter}">Ajouter une réponse</button>
                <p class="info-text">Note: Pour les réponses à sensibilité à la casse, ajoutez un préfixe de casse.</p>
            </div>
        </div>
        
        <!-- Options Numérique -->
        <div id="${IDS.typeOptions('num', window.questionCounter)}" class="hidden">
            <div class="form-group">
                <label for="${IDS.numAnswer(window.questionCounter)}">Réponse exacte:</label>
                <input type="number" step="any" id="${IDS.numAnswer(window.questionCounter)}" placeholder="Valeur numérique">
            </div>
            <div class="form-group">
                <input type="checkbox" id="${IDS.numRange(window.questionCounter)}">
                <label for="${IDS.numRange(window.questionCounter)}">Définir une marge d'erreur</label>
            </div>
            <div id="${IDS.numRangeOptions(window.questionCounter)}" class="hidden">
                <div class="form-group">
                    <label for="${IDS.numMargin(window.questionCounter)}">Marge d'erreur:</label>
                    <input type="number" step="any" id="${IDS.numMargin(window.questionCounter)}" placeholder="± valeur">
                </div>
            </div>
        </div>
        
        <div class="form-group">
            <label for="${IDS.generalFeedback(window.questionCounter)}">Feedback général:</label>
        ${createRichTextEditor(`${IDS.generalFeedback(window.questionCounter)}`, 'Entrez le feedback général (optionnel)')}
        </div>

        <!-- Feedback combiné (QCM/QCU) — export Moodle XML uniquement.
             Replié par défaut : cliquer le résumé (ou sa flèche) pour déplier. -->
        <details id="${IDS.combinedFeedbackBlock(window.questionCounter)}" class="form-group combined-feedback-block">
            <summary class="combined-feedback-note">💬 <strong>Feedback combiné</strong> <span class="combined-feedback-hint">— facultatif, export Moodle&nbsp;XML uniquement (cliquez pour déplier)</span></summary>
            <div class="combined-feedback-body">
                <div class="form-group">
                    <label for="${IDS.correctFeedback(window.questionCounter)}">Si la réponse est correcte&nbsp;:</label>
                ${createRichTextEditor(`${IDS.correctFeedback(window.questionCounter)}`, 'Message en cas de réponse correcte (optionnel)', true)}
                </div>
                <div class="form-group">
                    <label for="${IDS.partiallyCorrectFeedback(window.questionCounter)}">Si la réponse est partiellement correcte&nbsp;:</label>
                ${createRichTextEditor(`${IDS.partiallyCorrectFeedback(window.questionCounter)}`, 'Message en cas de réponse partiellement correcte (optionnel)', true)}
                </div>
                <div class="form-group">
                    <label for="${IDS.incorrectFeedback(window.questionCounter)}">Si la réponse est incorrecte&nbsp;:</label>
                ${createRichTextEditor(`${IDS.incorrectFeedback(window.questionCounter)}`, 'Message en cas de réponse incorrecte (optionnel)', true)}
                </div>
            </div>
        </details>

        <button class="remove-btn remove-question-btn" data-qid="${window.questionCounter}">Supprimer cette question</button>
    `;
    
    window.questionsContainer.appendChild(questionDiv);
    renumberQuestions();
 
    // Initialiser les éditeurs RTE de la nouvelle question
    const newQuestion = window.questionsContainer.lastElementChild;
    initRichTextEditors(newQuestion);
 
    // Attacher le bloc média à la nouvelle question (mediaManager garanti chargé — [A3])
    attachMediaToQuestion(window.questionCounter);

    // Options par défaut + câblage des événements (sous-fonctions — [M3])
    addDefaultOptions(window.questionCounter);
    wireQuestionEvents(questionDiv, window.questionCounter);
}

// ── Sous-fonctions de addNewQuestion ([M3]) ─────────────────────────────────

/**
 * Ajoute les options par défaut d'une nouvelle question (2 QCM, 2 QCU, 1 QRC).
 * @param {string|number} questionId
 */
function addDefaultOptions(questionId) {
    const optionsList = document.getElementById(IDS.optionsList(questionId));
    addOption(questionId, optionsList);
    addOption(questionId, optionsList);

    const scOptionsList = document.getElementById(IDS.scOptionsList(questionId));
    addSCOption(questionId, scOptionsList);
    addSCOption(questionId, scOptionsList);

    const saOptionsList = document.getElementById(IDS.saOptionsList(questionId));
    addSAOption(questionId, saOptionsList);
}

/**
 * Câble les écouteurs d'une question : bascule de type, marge numérique,
 * ajout d'options (QCM/QCU/QRC) et suppression de la question.
 * @param {HTMLElement}   questionDiv
 * @param {string|number} questionId
 */
function wireQuestionEvents(questionDiv, questionId) {
    setupQuestionTypeHandlers(questionId);
    setupNumericQuestionHandlers(questionId);

    questionDiv.querySelector('.add-option-btn').addEventListener('click', function () {
        const qid = this.getAttribute('data-qid');
        addOption(qid, document.getElementById(IDS.optionsList(qid)));
    });

    questionDiv.querySelector('.add-sc-option-btn').addEventListener('click', function () {
        const qid = this.getAttribute('data-qid');
        addSCOption(qid, document.getElementById(IDS.scOptionsList(qid)));
    });

    questionDiv.querySelector('.add-sa-option-btn').addEventListener('click', function () {
        const qid = this.getAttribute('data-qid');
        addSAOption(qid, document.getElementById(IDS.saOptionsList(qid)));
    });

    questionDiv.querySelector('.move-up-btn').addEventListener('click', function () {
        moveQuestion(this.getAttribute('data-qid'), 'up');
    });

    questionDiv.querySelector('.move-down-btn').addEventListener('click', function () {
        moveQuestion(this.getAttribute('data-qid'), 'down');
    });

    questionDiv.querySelector('.remove-question-btn').addEventListener('click', function () {
        const qid = this.getAttribute('data-qid');
        const questionElement = document.querySelector(`.question-container[data-id="${qid}"]`);
        cleanupMediaForQuestion(qid);
        window.questionsContainer.removeChild(questionElement);
        renumberQuestions();
    });
}

/**
 * Déplace une question d'un cran vers le haut ou le bas dans la liste, puis
 * renumérote et rafraîchit le sommaire. Les médias étant indexés par l'id
 * interne (dataset.id) et non par la position, le déplacement n'a aucun effet
 * sur eux. L'identifiant GIFT auto (CODE-QNN) suit le nouvel ordre.
 * @param {string|number} questionId - dataset.id de la question à déplacer
 * @param {'up'|'down'}   direction
 */
function moveQuestion(questionId, direction) {
    const question = document.querySelector(`.question-container[data-id="${questionId}"]`);
    if (!question) return;

    if (direction === 'up') {
        const prev = question.previousElementSibling;
        if (prev) question.parentNode.insertBefore(question, prev);
    } else if (direction === 'down') {
        const next = question.nextElementSibling;
        if (next) question.parentNode.insertBefore(next, question);
    }

    renumberQuestions();

    // Rafraîchir le sommaire s'il est chargé (module périphérique facultatif).
    if (typeof window.updateQuestionsSummary === 'function') {
        window.updateQuestionsSummary();
    }
}
window.moveQuestion = moveQuestion;

// Configurer les gestionnaires d'événements pour les types de questions
function setupQuestionTypeHandlers(questionId) {
    // Les cinq types partagent exactement la même logique : à la sélection d'un
    // type, on affiche son panneau d'options et on masque les autres. On boucle
    // donc au lieu de dupliquer cinq écouteurs identiques — cf. [D2].
    const TYPES = ['mc', 'sc', 'tf', 'sa', 'num'];

    TYPES.forEach(type => {
        const radio = document.getElementById(IDS.typeRadio(type, questionId));
        if (!radio) return;

        radio.addEventListener('change', function () {
            if (!this.checked) return;
            TYPES.forEach(t => {
                const panel = document.getElementById(IDS.typeOptions(t, questionId));
                if (panel) panel.classList.toggle('hidden', t !== type);
            });
            // Le feedback combiné n'a de sens que pour les questions multichoice
            // (QCM/QCU) → on l'affiche pour ces types seulement.
            const combinedBlock = document.getElementById(IDS.combinedFeedbackBlock(questionId));
            if (combinedBlock) {
                combinedBlock.classList.toggle('hidden', !(type === 'mc' || type === 'sc'));
            }
        });
    });
}

// Configurer les gestionnaires d'événements pour les questions numériques
function setupNumericQuestionHandlers(questionId) {
    const numRange = document.getElementById(IDS.numRange(questionId));
    const numRangeOptions = document.getElementById(IDS.numRangeOptions(questionId));
    
    numRange.addEventListener('change', function() {
        if (this.checked) {
            numRangeOptions.classList.remove('hidden');
        } else {
            numRangeOptions.classList.add('hidden');
        }
    });
}

function renumberQuestions() {
    const questions = document.querySelectorAll('.question-container');
    const lastIndex = questions.length - 1;
    questions.forEach((question, index) => {
        const expectedTitle = `Question ${index + 1}`;
        const expectedClass = (index + 1) % 2 === 0 ? 'question-even' : 'question-odd';

        // [P1] N'écrire dans le DOM que si la valeur change réellement, pour
        // éviter des reflows/repaints inutiles à chaque ajout ou suppression.
        const h2 = question.querySelector('h2');
        if (h2 && h2.textContent !== expectedTitle) {
            h2.textContent = expectedTitle;
        }

        if (!question.classList.contains(expectedClass)) {
            question.classList.remove('question-odd', 'question-even');
            question.classList.add(expectedClass);
        }

        // Désactiver les flèches aux extrémités (on ne peut pas monter la
        // première ni descendre la dernière). Même garde [P1] : n'écrire que
        // si l'état change réellement.
        const upBtn = question.querySelector('.move-up-btn');
        const downBtn = question.querySelector('.move-down-btn');
        if (upBtn && upBtn.disabled !== (index === 0)) {
            upBtn.disabled = (index === 0);
        }
        if (downBtn && downBtn.disabled !== (index === lastIndex)) {
            downBtn.disabled = (index === lastIndex);
        }
    });
}