async function downloadAsZip() {
    // ── 1. Générer le code GIFT (met aussi à jour window.generatedQuestionIds) ──
    const giftOutput = document.getElementById('gift-output');
 
    if (typeof generateGIFTCode === 'function') {
        generateGIFTCode();
    } else if (typeof window.generateGIFTCode === 'function') {
        window.generateGIFTCode();
    } else {
        alert('Impossible de générer le code GIFT. Veuillez cliquer sur "Générer le code GIFT" manuellement.');
        return;
    }
 
    const giftContent = giftOutput ? giftOutput.value : '';
    if (!giftContent.trim()) {
        alert('Aucun code GIFT à télécharger. Veuillez d\'abord ajouter des questions.');
        return;
    }
 
    // ── 2. Construire le nom de base du fichier (même logique que downloadBtn) ──
    const authorLastname  = document.getElementById('author-lastname');
    const authorFirstname = document.getElementById('author-firstname');
    const courseCode      = document.getElementById('course-code');
 
    const authorLastnameValue  = authorLastname  ? authorLastname.value.trim()  : '';
    const courseCodeValue      = courseCode      ? courseCode.value.trim()      : '';
 
    const date          = new Date();
    const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
    const formattedTime = date.toTimeString().slice(0, 8).replace(/:/g, '');
 
    let baseName = 'questions_gift';
    if (courseCodeValue)     baseName += `_${courseCodeValue}`;
    if (authorLastnameValue) baseName += `_${authorLastnameValue}`;
    baseName += `_${formattedDate}_${formattedTime}`;
 
    // ── 3. Créer le ZIP avec JSZip ───────────────────────────────────────────
    if (typeof JSZip === 'undefined') {
        alert('La bibliothèque JSZip n\'est pas chargée. Vérifiez que la balise <script> JSZip est présente dans index.html.');
        return;
    }
 
    const zip = new JSZip();
 
    // Ajouter le fichier GIFT
    zip.file(`${baseName}.txt`, giftContent);
 
    // Ajouter les médias (renommés avec le finalQuestionId)
    const mediaList = (typeof getMediaList === 'function') ? getMediaList() : [];
    for (const { file, filename } of mediaList) {
        const arrayBuffer = await file.arrayBuffer();
        zip.file(filename, arrayBuffer);
    }
 
    // ── 4. Générer et télécharger ────────────────────────────────────────────
    try {
        const blob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href     = URL.createObjectURL(blob);
        link.download = `${baseName}.zip`;
        link.target   = '_blank';
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
    } catch (err) {
        console.error('[downloadAsZip] Erreur lors de la génération du ZIP :', err);
        alert('Une erreur s\'est produite lors de la création du ZIP.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Récupérer les éléments nécessaires
    const giftOutput = document.getElementById('gift-output');
    const downloadBtn = document.getElementById('download-btn');
    const authorLastname = document.getElementById('author-lastname');
    const authorFirstname = document.getElementById('author-firstname');
    const courseCode = document.getElementById('course-code');
    
    // Ajouter l'écouteur d'événement pour le téléchargement
    downloadBtn.addEventListener('click', function() {
        // Générer d'abord le code GIFT s'il est vide
        if (!giftOutput.value.trim()) {
            // Vérifier si la fonction generateGIFTCode existe dans la portée globale
            if (typeof generateGIFTCode === 'function') {
                generateGIFTCode();
            } else if (typeof window.generateGIFTCode === 'function') {
                window.generateGIFTCode();
            } else {
                console.error('La fonction generateGIFTCode n\'est pas disponible');
                alert('Impossible de générer le code GIFT automatiquement. Veuillez cliquer sur "Générer le code GIFT" avant de télécharger.');
                return;
            }
        }
        
        // Récupérer le contenu GIFT (qui vient d'être généré si nécessaire)
        const giftContent = giftOutput.value;
        
        // Vérifier si le contenu est toujours vide après génération (cas où il n'y a pas de questions)
        if (!giftContent.trim()) {
            alert('Aucun code GIFT à télécharger. Veuillez d\'abord ajouter des questions.');
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
        

    });
 // ── AJOUT : Bouton "Télécharger le ZIP" ──────────────────────────────
            const downloadZipBtn = document.getElementById('download-zip-btn');
        if (downloadZipBtn) {
            downloadZipBtn.addEventListener('click', downloadAsZip);
        }

});