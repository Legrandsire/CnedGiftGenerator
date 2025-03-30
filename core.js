// Variables globales partagées entre les fichiers
let questionCounter = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM principaux
    const questionsContainer = document.getElementById('questions-container');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    const giftOutput = document.getElementById('gift-output');
    
    // Champs d'information pour les métadonnées
    const authorLastname = document.getElementById('author-lastname');
    const authorFirstname = document.getElementById('author-firstname');
    const courseCode = document.getElementById('course-code');
    
    // Exposer les éléments importants en tant que variables globales
    window.questionsContainer = questionsContainer;
    window.questionCounter = questionCounter;
    window.giftOutput = giftOutput;
    window.authorLastname = authorLastname;
    window.authorFirstname = authorFirstname;
    window.courseCode = courseCode;
    
    // Initialiser les écouteurs d'événements principaux
    addQuestionBtn.addEventListener('click', function() {
        // Utilise la fonction de questionManager.js
        addNewQuestion();
    });
    
    generateBtn.addEventListener('click', function() {
        // Utilise la fonction de giftGenerator.js
        generateGIFTCode();
    });
    
    copyBtn.addEventListener('click', function() {
        giftOutput.select();
        document.execCommand('copy');
        alert('Code GIFT copié dans le presse-papier!');
    });
    
    clearBtn.addEventListener('click', function() {
        if (confirm('Êtes-vous sûr de vouloir effacer toutes les questions?')) {
            questionsContainer.innerHTML = '';
            giftOutput.value = '';
            window.questionCounter = 0;
            
            // Effacer également les champs d'auteur et code matière
            authorLastname.value = '';
            authorFirstname.value = '';
            courseCode.value = '';
        }
    });
    
    // Ajouter une première question par défaut
    addNewQuestion();
});