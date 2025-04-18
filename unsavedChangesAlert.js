/**
 * unsavedChangesAlert.js
 * Gestion de l'alerte de fermeture avec modifications non enregistrées
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le système de détection des modifications
    initUnsavedChangesDetection();
});

/**
 * Initialise le système de détection des modifications non enregistrées
 */
function initUnsavedChangesDetection() {
    let formModified = false;
    
    // Fonction pour marquer le formulaire comme modifié
    function markAsModified() {
        formModified = true;
    }
    
    // Surveiller les changements dans les champs de texte
    document.addEventListener('input', function(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            markAsModified();
        }
    });
    
    // Surveiller les changements dans les sélecteurs
    document.addEventListener('change', function(event) {
        if (event.target.tagName === 'SELECT' || 
            event.target.tagName === 'INPUT' && 
            (event.target.type === 'checkbox' || event.target.type === 'radio')) {
            markAsModified();
        }
    });
    
    // Surveiller les clics sur les boutons d'ajout/suppression
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('add-btn') || 
            event.target.classList.contains('remove-btn') ||
            event.target.classList.contains('add-question-btn') ||
            event.target.classList.contains('remove-question-btn')) {
            markAsModified();
        }
    });
    
    // Réinitialiser l'état modifié lors de la génération ou du téléchargement
    document.getElementById('generate-btn').addEventListener('click', function() {
        setTimeout(() => { formModified = false; }, 100);
    });
    
    document.getElementById('download-btn').addEventListener('click', function() {
        setTimeout(() => { formModified = false; }, 100);
    });
    
    // Réinitialiser l'état modifié après avoir tout effacé
    document.getElementById('clear-btn').addEventListener('click', function() {
        setTimeout(() => { formModified = false; }, 100);
    });
    
    // Alerte lors de la fermeture de la page avec des modifications non enregistrées
    window.addEventListener('beforeunload', function(e) {
        if (formModified) {
            const message = 'Des modifications non enregistrées ont été détectées. Voulez-vous vraiment quitter la page sans enregistrer ?';
            e.returnValue = message;  // Standard
            return message;  // Pour les anciens navigateurs
        }
    });
}