/**
 * Construit le nom de base des fichiers exportés à partir des métadonnées
 * (code article, nom d'auteur) et de l'horodatage courant. Logique partagée
 * entre le téléchargement .txt et le téléchargement .zip — cf. [D4].
 *
 * @param {string} [extension] - Extension à ajouter (sans point). Si omise,
 *                               renvoie le nom de base sans extension.
 * @param {string} [baseLabel='questions_gift'] - Préfixe du nom (ex.
 *                               'questions_moodle' pour l'export XML).
 * @returns {string} Nom de fichier, ex. "questions_gift_ECO101_Dupont_20260605_153353[.txt]".
 */
function buildExportFilename(extension, baseLabel) {
    const courseCodeEl     = document.getElementById('course-code');
    const authorLastnameEl = document.getElementById('author-lastname');

    const courseCodeValue     = courseCodeEl     ? courseCodeEl.value.trim()     : '';
    const authorLastnameValue = authorLastnameEl ? authorLastnameEl.value.trim() : '';

    const date          = new Date();
    const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
    const formattedTime = date.toTimeString().slice(0, 8).replace(/:/g, '');

    let baseName = baseLabel || 'questions_gift';
    if (courseCodeValue)     baseName += `_${courseCodeValue}`;
    if (authorLastnameValue) baseName += `_${authorLastnameValue}`;
    baseName += `_${formattedDate}_${formattedTime}`;

    return extension ? `${baseName}.${extension}` : baseName;
}

async function downloadAsZip() {
    // ── 1. Générer le code GIFT (met aussi à jour window.generatedQuestionIds) ──
    const giftOutput = document.getElementById('gift-output');
 
    generateGIFTCode();

    const giftContent = giftOutput ? giftOutput.value : '';
    if (!giftContent.trim()) {
        notify.error('Aucun code GIFT à télécharger. Veuillez d\'abord ajouter des questions.');
        return;
    }
 
    // ── 2. Construire le nom de base du fichier (logique partagée — cf. [D4]) ──
    const baseName = buildExportFilename();

    // ── 3. Créer le ZIP avec JSZip ───────────────────────────────────────────
    if (typeof JSZip === 'undefined') {
        notify.error('La bibliothèque JSZip n\'est pas chargée. Vérifiez que la balise <script> JSZip est présente dans index.html.');
        return;
    }
 
    const zip = new JSZip();
 
    // Ajouter le fichier GIFT (BOM UTF-8 en tête pour Windows/Notepad — cf. [B1])
    zip.file(`${baseName}.txt`, '﻿' + giftContent);
 
    // Ajouter les médias (renommés avec le finalQuestionId)
    const mediaList = getMediaList();
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
        notify.error('Une erreur s\'est produite lors de la création du ZIP.');
    }
}

APP_INIT.push(function initDownload() {
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
            generateGIFTCode();
        }
        
        // Récupérer le contenu GIFT (qui vient d'être généré si nécessaire)
        const giftContent = giftOutput.value;
        
        // Vérifier si le contenu est toujours vide après génération (cas où il n'y a pas de questions)
        if (!giftContent.trim()) {
            notify.error('Aucun code GIFT à télécharger. Veuillez d\'abord ajouter des questions.');
            return;
        }
        
        // Créer un objet Blob avec le contenu GIFT
        // BOM UTF-8 en tête pour que Notepad/Windows-1252 affiche les accents (cf. [B1])
        const blob = new Blob(['﻿' + giftContent], { type: 'text/plain;charset=utf-8' });

        // Créer un élément <a> pour le téléchargement
        const link = document.createElement('a');

        // Nom de fichier basé sur les métadonnées et l'horodatage (logique partagée — cf. [D4])
        const fileName = buildExportFilename('txt');

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