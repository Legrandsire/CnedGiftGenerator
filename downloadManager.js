document.addEventListener('DOMContentLoaded', function() {
    // Récupérer les éléments nécessaires
    const giftOutput = document.getElementById('gift-output');
    const downloadBtn = document.getElementById('download-btn');
    const authorLastname = document.getElementById('author-lastname');
    const authorFirstname = document.getElementById('author-firstname');
    const courseCode = document.getElementById('course-code');
    
    // Ajouter l'écouteur d'événement pour le téléchargement
    downloadBtn.addEventListener('click', function() {
        // Récupérer le contenu GIFT
        const giftContent = giftOutput.value;
        
        // Vérifier si le contenu est vide
        if (!giftContent.trim()) {
            alert('Aucun code GIFT à télécharger. Veuillez d\'abord générer le code.');
            return;
        }
        
        // Récupérer les informations d'auteur et de code matière pour le nom du fichier
        const authorLastnameValue = authorLastname.value.trim();
        const authorFirstnameValue = authorFirstname.value.trim();
        const courseCodeValue = courseCode.value.trim();
        
        // Créer un objet Blob avec le contenu GIFT
        const blob = new Blob([giftContent], { type: 'text/plain;charset=utf-8' });
        
        // Créer un élément <a> pour le téléchargement
        const link = document.createElement('a');
        
        // Générer un nom de fichier basé sur les métadonnées et la date actuelle
        const date = new Date();
        const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
        const formattedTime = date.toTimeString().slice(0, 8).replace(/:/g, '');
        
        // Construire le nom du fichier
        let fileName = `questions_gift`;
        
        // Ajouter le code matière s'il existe
        if (courseCodeValue) {
            fileName += `_${courseCodeValue}`;
        }
        
        // Ajouter le nom de l'auteur s'il existe
        if (authorLastnameValue) {
            fileName += `_${authorLastnameValue}`;
        }
        
        // Ajouter la date et l'heure
        fileName += `_${formattedDate}_${formattedTime}.txt`;
        
        // Configurer l'élément <a> avec l'URL du Blob et le nom du fichier
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.target = '_blank';
        
        // Ajouter l'élément <a> au document (invisible)
        document.body.appendChild(link);
        
        // Déclencher le téléchargement
        link.click();
        
        // Nettoyer
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
        
        // Message de confirmation
        alert(`Le fichier "${fileName}" a été téléchargé.`);
    });
});