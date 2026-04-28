/**
 * mediaManager.js
 * Gestion des médias associés aux questions du générateur de code GIFT
 *
 * Fonctionnement :
 *  - Chaque question peut avoir un fichier média attaché (image, audio, vidéo, PDF).
 *  - Le fichier est stocké en mémoire dans window.questionMediaFiles[questionId].
 *  - À la génération GIFT, la balise @@PLUGINFILE@@ est insérée dans le texte de la question.
 *  - À l'export ZIP, le .txt GIFT + tous les médias sont empaquetés ensemble.
 */

// ── Stockage global des fichiers médias ──────────────────────────────────────
window.questionMediaFiles = {};   // { questionId: File }
window.generatedQuestionIds = {}; // { questionId: finalQuestionId } — rempli par giftGenerator.js


// ── Constantes ───────────────────────────────────────────────────────────────
const MEDIA_ACCEPT = 'image/*,audio/*,video/*,.pdf';

const MEDIA_ICONS = {
    image : '🖼️',
    audio : '🎵',
    video : '🎬',
    pdf   : '📄',
    other : '📎'
};

const IMAGE_EXTENSIONS = new Set(['png','jpg','jpeg','gif','webp','svg']);


// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Retourne la catégorie d'un fichier selon son extension.
 * @param {string} filename
 * @returns {'image'|'audio'|'video'|'pdf'|'other'}
 */
function getMediaCategory(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext))                          return 'image';
    if (['mp3','wav','ogg','aac','flac','m4a'].includes(ext)) return 'audio';
    if (['mp4','webm','ogv','avi','mov'].includes(ext))     return 'video';
    if (ext === 'pdf')                                       return 'pdf';
    return 'other';
}

/**
 * Retourne l'icône correspondant à la catégorie du fichier.
 * @param {string} filename
 * @returns {string}
 */
function getMediaIcon(filename) {
    return MEDIA_ICONS[getMediaCategory(filename)] || MEDIA_ICONS.other;
}

/**
 * Retourne le nom de fichier standardisé pour le média d'une question.
 * Format : {finalQuestionId}_media.{ext}
 * @param {string|number} questionId  — ID interne de la question (dataset.id)
 * @param {string}        finalQuestionId — ID GIFT calculé lors de la génération
 * @returns {string|null}
 */
function getMediaFilename(questionId, finalQuestionId) {
    const file = window.questionMediaFiles[questionId];
    if (!file) return null;
    const ext = file.name.split('.').pop().toLowerCase();
    return `${finalQuestionId}_media.${ext}`;
}

/**
 * Retourne le tag @@PLUGINFILE@@ à insérer dans le code GIFT.
 * Le '=' est échappé avec '\' conformément à la syntaxe GIFT.
 * @param {string|number} questionId
 * @param {string}        finalQuestionId
 * @returns {string}  — vide si aucun média
 */
function getPluginfileTag(questionId, finalQuestionId) {
    const filename = getMediaFilename(questionId, finalQuestionId);
    if (!filename) return '';

    const cat = getMediaCategory(filename);
    if (cat === 'image') {
        return `<img src\\="@@PLUGINFILE@@/${filename}" alt\\="media">`;
    }
    if (cat === 'audio') {
        return `<audio controls\\="controls"><source src\\="@@PLUGINFILE@@/${filename}"></source></audio>`;
    }
    if (cat === 'video') {
        return `<video controls\\="controls"><source src\\="@@PLUGINFILE@@/${filename}"></source></video>`;
    }
    // PDF ou autre : lien de téléchargement
    return `<a href\\="@@PLUGINFILE@@/${filename}">${filename}</a>`;
}


// ── Construction de l'UI ─────────────────────────────────────────────────────

/**
 * Crée et retourne le div contenant l'interface d'upload pour une question.
 * À insérer dans le DOM par l'appelant.
 * @param {string|number} questionId
 * @returns {HTMLDivElement}
 */
function createMediaUploadUI(questionId) {
    const container = document.createElement('div');
    container.className = 'form-group media-upload-container';
    container.id = `media-container-${questionId}`;

    container.innerHTML = `
        <label class="media-label">
            Média associé à la question&nbsp;:
            <span class="optional-field">(facultatif)</span>
        </label>
        <div class="media-upload-area">
            <input  type="file"
                    id="media-file-${questionId}"
                    class="media-file-input"
                    accept="${MEDIA_ACCEPT}"
                    style="display:none">
            <button type="button"
                    class="control-btn media-add-btn"
                    data-qid="${questionId}">
                📎 Ajouter un média
            </button>
            <div id="media-preview-${questionId}" class="media-preview hidden"></div>
        </div>
        <p class="info-text">
            Le média sera intégré via <code>@@PLUGINFILE@@</code> dans le GIFT
            et inclus dans l'export&nbsp;ZIP.
        </p>
    `;

    return container;
}

/**
 * Affiche la prévisualisation du fichier sélectionné.
 * @param {string|number} questionId
 * @param {File}          file
 */
function renderMediaPreview(questionId, file) {
    const previewDiv = document.getElementById(`media-preview-${questionId}`);
    const addBtn     = document.querySelector(`.media-add-btn[data-qid="${questionId}"]`);
    if (!previewDiv) return;

    const cat  = getMediaCategory(file.name);
    const icon = getMediaIcon(file.name);

    let previewHTML = `
        <div class="media-info">
            <span class="media-icon">${icon}</span>
            <span class="media-filename">${file.name}</span>
            <button type="button"
                    class="remove-media-btn"
                    data-qid="${questionId}"
                    title="Supprimer le média">×</button>
        </div>
    `;

    if (cat === 'image') {
        const url = URL.createObjectURL(file);
        previewHTML += `<img src="${url}" class="media-thumbnail" alt="Aperçu du média">`;
    }

    previewDiv.innerHTML = previewHTML;
    previewDiv.classList.remove('hidden');

    if (addBtn) addBtn.textContent = '📎 Changer le média';

    // Bouton de suppression
    previewDiv.querySelector('.remove-media-btn')
              .addEventListener('click', () => removeMedia(questionId));
}

/**
 * Supprime le média associé à une question.
 * @param {string|number} questionId
 */
function removeMedia(questionId) {
    delete window.questionMediaFiles[questionId];

    const fileInput  = document.getElementById(`media-file-${questionId}`);
    const previewDiv = document.getElementById(`media-preview-${questionId}`);
    const addBtn     = document.querySelector(`.media-add-btn[data-qid="${questionId}"]`);

    if (fileInput)  fileInput.value = '';
    if (previewDiv) {
        previewDiv.innerHTML = '';
        previewDiv.classList.add('hidden');
    }
    if (addBtn) addBtn.textContent = '📎 Ajouter un média';
}


// ── Initialisation des événements ────────────────────────────────────────────

/**
 * Attache les écouteurs d'événements au bloc média d'une question.
 * Doit être appelé APRÈS que le DOM du bloc a été inséré.
 * @param {string|number} questionId
 */
function initMediaEvents(questionId) {
    const addBtn    = document.querySelector(`.media-add-btn[data-qid="${questionId}"]`);
    const fileInput = document.getElementById(`media-file-${questionId}`);

    if (!addBtn || !fileInput) {
        console.warn(`[mediaManager] Éléments introuvables pour la question ${questionId}`);
        return;
    }

    // Ouvrir le sélecteur de fichier au clic du bouton
    addBtn.addEventListener('click', () => fileInput.click());

    // Gérer la sélection d'un fichier
    fileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        window.questionMediaFiles[questionId] = file;
        renderMediaPreview(questionId, file);
    });
}

/**
 * Insère l'UI média dans le conteneur d'une question et initialise ses événements.
 * Cherche le form-group de l'identifiant de question pour insérer juste après.
 * @param {string|number} questionId
 */
function attachMediaToQuestion(questionId) {
    const idField    = document.getElementById(`question-id-${questionId}`);
    const formGroup  = idField ? idField.closest('.form-group') : null;
    const questionDiv = document.querySelector(`.question-container[data-id="${questionId}"]`);

    if (!questionDiv) {
        console.warn(`[mediaManager] Conteneur de question introuvable : ${questionId}`);
        return;
    }

    const mediaUI = createMediaUploadUI(questionId);

    if (formGroup && formGroup.parentNode === questionDiv) {
        // Insérer juste après le bloc "identifiant de question"
        formGroup.insertAdjacentElement('afterend', mediaUI);
    } else {
        // Fallback : insérer en premier enfant
        questionDiv.insertBefore(mediaUI, questionDiv.firstChild.nextSibling);
    }

    initMediaEvents(questionId);
}

/**
 * Nettoie les données média d'une question supprimée.
 * @param {string|number} questionId
 */
function cleanupMediaForQuestion(questionId) {
    delete window.questionMediaFiles[questionId];
    delete window.generatedQuestionIds[questionId];
}


// ── Export ZIP ───────────────────────────────────────────────────────────────

/**
 * Vérifie si au moins un média est associé à une question.
 * @returns {boolean}
 */
function hasAnyMedia() {
    return Object.keys(window.questionMediaFiles).length > 0;
}

/**
 * Retourne la liste des médias présents avec leurs noms de fichiers finaux.
 * Nécessite que window.generatedQuestionIds soit à jour (après génération GIFT).
 * @returns {Array<{questionId, file, filename}>}
 */
function getMediaList() {
    const list = [];
    for (const [questionId, file] of Object.entries(window.questionMediaFiles)) {
        const finalId  = window.generatedQuestionIds[questionId];
        const filename = finalId ? getMediaFilename(questionId, finalId) : file.name;
        list.push({ questionId, file, filename });
    }
    return list;
}


// ── Exposition globale ───────────────────────────────────────────────────────
window.attachMediaToQuestion  = attachMediaToQuestion;
window.cleanupMediaForQuestion = cleanupMediaForQuestion;
window.getPluginfileTag       = getPluginfileTag;
window.getMediaFilename       = getMediaFilename;
window.hasAnyMedia            = hasAnyMedia;
window.getMediaList           = getMediaList;
window.removeMedia            = removeMedia;
