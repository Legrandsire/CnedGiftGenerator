// Fonction pour ajouter une nouvelle question
function addNewQuestion() {
    window.questionCounter++;
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-container';
    // Ajouter la classe 'question-even' ou 'question-odd' selon la parité
    questionDiv.className += window.questionCounter % 2 === 0 ? ' question-even' : ' question-odd';
    questionDiv.dataset.id = window.questionCounter;
    
    questionDiv.innerHTML = `
        <h2>Question ${window.questionCounter}</h2>
        <div class="form-group">
            <label for="question-id-${window.questionCounter}">Identifiant/Numéro de question: <span class="optional-field">(facultatif)</span></label>
            <input type="text" id="question-id-${window.questionCounter}" placeholder="Laissez vide pour générer automatiquement">
            <p class="info-text">Si non renseigné, un identifiant sera généré avec le format: [Code matière]-Q${window.questionCounter}</p>
        </div>
        <div class="form-group">
            <label for="question-type-${window.questionCounter}">Type de question:</label>
            <div class="radio-group">
                <div class="radio-option">
                    <input type="radio" id="mc-type-${window.questionCounter}" name="question-type-${window.questionCounter}" value="mc" checked>
                    <label for="mc-type-${window.questionCounter}">QCM</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="sc-type-${window.questionCounter}" name="question-type-${window.questionCounter}" value="sc">
                    <label for="sc-type-${window.questionCounter}">QCU</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="tf-type-${window.questionCounter}" name="question-type-${window.questionCounter}" value="tf">
                    <label for="tf-type-${window.questionCounter}">Vrai/Faux</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="sa-type-${window.questionCounter}" name="question-type-${window.questionCounter}" value="sa">
                    <label for="sa-type-${window.questionCounter}">QRC</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="num-type-${window.questionCounter}" name="question-type-${window.questionCounter}" value="num">
                    <label for="num-type-${window.questionCounter}">Numérique</label>
                </div>
            </div>
        </div>
        
        <div class="form-group">
            <label for="question-text-${window.questionCounter}">Texte de la question:</label>
            <input type="text" id="question-text-${window.questionCounter}" placeholder="Entrez le texte de la question">
        </div>
        
        <!-- Options QCM -->
        <div id="mc-options-${window.questionCounter}">
            <div class="form-group">
                <label>Options (cochez toutes les réponses correctes):</label>
                <div class="options-list" id="options-list-${window.questionCounter}">
                    <!-- Les options seront ajoutées ici dynamiquement -->
                </div>
                <button class="add-btn add-option-btn" data-qid="${window.questionCounter}">Ajouter une option</button>
            </div>
        </div>
        
        <!-- Options QCU -->
        <div id="sc-options-${window.questionCounter}" class="hidden">
            <div class="form-group">
                <label>Options (cochez la réponse correcte):</label>
                <div class="options-list-radio" id="sc-options-list-${window.questionCounter}">
                    <!-- Les options seront ajoutées ici dynamiquement -->
                </div>
                <button class="add-btn add-sc-option-btn" data-qid="${window.questionCounter}">Ajouter une option</button>
            </div>
        </div>
        
        <!-- Options Vrai/Faux -->
        <div id="tf-options-${window.questionCounter}" class="hidden">
            <div class="form-group">
                <label>Réponse correcte:</label>
                <div class="radio-group">
                    <div class="radio-option">
                        <input type="radio" id="true-option-${window.questionCounter}" name="tf-answer-${window.questionCounter}" value="true" checked>
                        <label for="true-option-${window.questionCounter}">Vrai</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="false-option-${window.questionCounter}" name="tf-answer-${window.questionCounter}" value="false">
                        <label for="false-option-${window.questionCounter}">Faux</label>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Options QRC -->
        <div id="sa-options-${window.questionCounter}" class="hidden">
            <div class="form-group">
                <label>Réponses acceptées:</label>
                <div class="sa-options-list" id="sa-options-list-${window.questionCounter}">
                    <!-- Les réponses seront ajoutées ici dynamiquement -->
                </div>
                <button class="add-btn add-sa-option-btn" data-qid="${window.questionCounter}">Ajouter une réponse</button>
                <p class="info-text">Note: Pour les réponses à sensibilité à la casse, ajoutez un préfixe de casse.</p>
            </div>
        </div>
        
        <!-- Options Numérique -->
        <div id="num-options-${window.questionCounter}" class="hidden">
            <div class="form-group">
                <label for="num-answer-${window.questionCounter}">Réponse exacte:</label>
                <input type="number" step="any" id="num-answer-${window.questionCounter}" placeholder="Valeur numérique">
            </div>
            <div class="form-group">
                <input type="checkbox" id="num-range-${window.questionCounter}">
                <label for="num-range-${window.questionCounter}">Définir une marge d'erreur</label>
            </div>
            <div id="num-range-options-${window.questionCounter}" class="hidden">
                <div class="form-group">
                    <label for="num-margin-${window.questionCounter}">Marge d'erreur:</label>
                    <input type="number" step="any" id="num-margin-${window.questionCounter}" placeholder="± valeur">
                </div>
            </div>
        </div>
        
        <div class="form-group">
            <label for="general-feedback-${window.questionCounter}">Feedback général:</label>
            <textarea id="general-feedback-${window.questionCounter}" placeholder="Feedback affiché à tous les étudiants après la tentative"></textarea>
        </div>
        
        <button class="remove-btn remove-question-btn" data-qid="${window.questionCounter}">Supprimer cette question</button>
    `;
    
    window.questionsContainer.appendChild(questionDiv);
    
    // Ajouter deux options par défaut pour QCM
    const optionsList = document.getElementById(`options-list-${window.questionCounter}`);
    addOption(window.questionCounter, optionsList);
    addOption(window.questionCounter, optionsList);
    
    // Ajouter deux options par défaut pour QCU
    const scOptionsList = document.getElementById(`sc-options-list-${window.questionCounter}`);
    addSCOption(window.questionCounter, scOptionsList);
    addSCOption(window.questionCounter, scOptionsList);
    
    // Ajouter une réponse par défaut pour QRC
    const saOptionsList = document.getElementById(`sa-options-list-${window.questionCounter}`);
    addSAOption(window.questionCounter, saOptionsList);
    
    // Événements pour le type de question
    setupQuestionTypeHandlers(window.questionCounter);
    
    // Gestion de la marge d'erreur pour les questions numériques
    setupNumericQuestionHandlers(window.questionCounter);
    
    // Événement pour ajouter une option QCM
    const addOptionBtn = questionDiv.querySelector('.add-option-btn');
    addOptionBtn.addEventListener('click', function() {
        const qid = this.getAttribute('data-qid');
        const optionsListElement = document.getElementById(`options-list-${qid}`);
        addOption(qid, optionsListElement);
    });
    
    // Événement pour ajouter une option QCU
    const addSCOptionBtn = questionDiv.querySelector('.add-sc-option-btn');
    addSCOptionBtn.addEventListener('click', function() {
        const qid = this.getAttribute('data-qid');
        const optionsListElement = document.getElementById(`sc-options-list-${qid}`);
        addSCOption(qid, optionsListElement);
    });
    
    // Événement pour ajouter une réponse QRC
    const addSAOptionBtn = questionDiv.querySelector('.add-sa-option-btn');
    addSAOptionBtn.addEventListener('click', function() {
        const qid = this.getAttribute('data-qid');
        const optionsListElement = document.getElementById(`sa-options-list-${qid}`);
        addSAOption(qid, optionsListElement);
    });
    
    // Événement pour supprimer une question
    const removeQuestionBtn = questionDiv.querySelector('.remove-question-btn');
    removeQuestionBtn.addEventListener('click', function() {
        const qid = this.getAttribute('data-qid');
        const questionElement = document.querySelector(`.question-container[data-id="${qid}"]`);
        window.questionsContainer.removeChild(questionElement);
    });
}

// Configurer les gestionnaires d'événements pour les types de questions
function setupQuestionTypeHandlers(questionId) {
    const mcRadio = document.getElementById(`mc-type-${questionId}`);
    const scRadio = document.getElementById(`sc-type-${questionId}`);
    const tfRadio = document.getElementById(`tf-type-${questionId}`);
    const saRadio = document.getElementById(`sa-type-${questionId}`);
    const numRadio = document.getElementById(`num-type-${questionId}`);
    
    const mcOptions = document.getElementById(`mc-options-${questionId}`);
    const scOptions = document.getElementById(`sc-options-${questionId}`);
    const tfOptions = document.getElementById(`tf-options-${questionId}`);
    const saOptions = document.getElementById(`sa-options-${questionId}`);
    const numOptions = document.getElementById(`num-options-${questionId}`);
    
    mcRadio.addEventListener('change', function() {
        if (this.checked) {
            mcOptions.classList.remove('hidden');
            scOptions.classList.add('hidden');
            tfOptions.classList.add('hidden');
            saOptions.classList.add('hidden');
            numOptions.classList.add('hidden');
        }
    });
    
    scRadio.addEventListener('change', function() {
        if (this.checked) {
            mcOptions.classList.add('hidden');
            scOptions.classList.remove('hidden');
            tfOptions.classList.add('hidden');
            saOptions.classList.add('hidden');
            numOptions.classList.add('hidden');
        }
    });
    
    tfRadio.addEventListener('change', function() {
        if (this.checked) {
            mcOptions.classList.add('hidden');
            scOptions.classList.add('hidden');
            tfOptions.classList.remove('hidden');
            saOptions.classList.add('hidden');
            numOptions.classList.add('hidden');
        }
    });
    
    saRadio.addEventListener('change', function() {
        if (this.checked) {
            mcOptions.classList.add('hidden');
            scOptions.classList.add('hidden');
            tfOptions.classList.add('hidden');
            saOptions.classList.remove('hidden');
            numOptions.classList.add('hidden');
        }
    });
    
    numRadio.addEventListener('change', function() {
        if (this.checked) {
            mcOptions.classList.add('hidden');
            scOptions.classList.add('hidden');
            tfOptions.classList.add('hidden');
            saOptions.classList.add('hidden');
            numOptions.classList.remove('hidden');
        }
    });
}

// Configurer les gestionnaires d'événements pour les questions numériques
function setupNumericQuestionHandlers(questionId) {
    const numRange = document.getElementById(`num-range-${questionId}`);
    const numRangeOptions = document.getElementById(`num-range-options-${questionId}`);
    
    numRange.addEventListener('change', function() {
        if (this.checked) {
            numRangeOptions.classList.remove('hidden');
        } else {
            numRangeOptions.classList.add('hidden');
        }
    });
}