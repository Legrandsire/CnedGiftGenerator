/**
 * bugReport.js
 * Formulaire de CONTACT (chantier UI/UX n°10).
 *
 * Contrainte : application 100 % statique, sans backend (cf. Spec.md 1.1 /
 * CLAUDE.md §2). On ne peut donc PAS envoyer de requête serveur ni de courriel
 * directement. Choix validé : un formulaire de contact classique (nom, prénom,
 * email, message) qui, à l'envoi, construit un lien `mailto:` PRÉ-REMPLI
 * (destinataire, objet, et corps reprenant l'expéditeur + le message + la
 * version + le navigateur) et ouvre le client mail de l'utilisateur. Aucune
 * donnée n'est transmise à un service tiers (conforme à Spec.md 1.1).
 *
 * Vanilla JS, portée globale via window. Aucun framework.
 */

// Destinataire du formulaire de contact (CNED).
const BUG_REPORT_EMAIL = 'vincent.grandsire@ac-cned.fr';

APP_INIT.push(function initBugReport() {
    createBugReportButton();
});

/**
 * Crée le bouton « Contact », 3ᵉ élément de la pile fixe haut-droite
 * (sous Aide et Prévisualiser).
 */
function createBugReportButton() {
    const btn = document.createElement('button');
    btn.id = 'bug-report-btn';
    btn.className = 'bug-report-btn';
    btn.type = 'button';
    btn.innerHTML = '<span class="bug-icon">📧</span> <span class="bug-text">Contact</span>';
    btn.title = 'Nous contacter / signaler un problème';
    document.body.appendChild(btn);

    btn.addEventListener('click', openBugReportDialog);
}

/**
 * Ouvre la modale de signalement de bug.
 */
function openBugReportDialog() {
    // Éviter les doublons si déjà ouverte.
    if (document.getElementById('bug-report-overlay')) return;

    const version = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : '?';

    const overlay = document.createElement('div');
    overlay.id = 'bug-report-overlay';
    overlay.className = 'bug-report-overlay';

    overlay.innerHTML = `
        <div class="bug-report-dialog" role="dialog" aria-modal="true" aria-labelledby="bug-report-title">
            <div class="bug-report-header">
                <h2 id="bug-report-title">📧 Contact</h2>
                <button type="button" class="bug-report-close" aria-label="Fermer">×</button>
            </div>
            <div class="bug-report-body">
                <p class="bug-report-intro">
                    Une question, une suggestion ou un problème&nbsp;? Renseignez le
                    formulaire. À l'envoi, votre logiciel de messagerie s'ouvrira avec un
                    courriel pré-rempli (vos coordonnées, la version de l'outil et votre
                    navigateur y sont repris automatiquement).
                </p>
                <div class="bug-report-row">
                    <div class="bug-report-field">
                        <label for="bug-report-firstname">Prénom&nbsp;:</label>
                        <input type="text" id="bug-report-firstname" class="bug-report-input" placeholder="Votre prénom">
                    </div>
                    <div class="bug-report-field">
                        <label for="bug-report-lastname">Nom&nbsp;:</label>
                        <input type="text" id="bug-report-lastname" class="bug-report-input" placeholder="Votre nom">
                    </div>
                </div>
                <label for="bug-report-email">Adresse électronique&nbsp;:</label>
                <input type="email" id="bug-report-email" class="bug-report-input" placeholder="vous@exemple.fr">
                <label for="bug-report-desc">Message&nbsp;:</label>
                <textarea id="bug-report-desc" class="bug-report-textarea"
                          placeholder="Ex. : à l'import d'un fichier XML, la question 3 perd son image…"></textarea>
                <p class="bug-report-meta">
                    Destinataire&nbsp;: <strong>${BUG_REPORT_EMAIL}</strong><br>
                    Version&nbsp;: <strong>${version}</strong>
                </p>
            </div>
            <div class="bug-report-footer">
                <button type="button" class="bug-report-cancel control-btn">Annuler</button>
                <button type="button" class="bug-report-send btn-primary">✉️ Préparer le courriel</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();

    overlay.querySelector('.bug-report-close').addEventListener('click', close);
    overlay.querySelector('.bug-report-cancel').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close(); // clic sur le fond
    });
    document.addEventListener('keydown', function onEsc(e) {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
    });

    overlay.querySelector('.bug-report-send').addEventListener('click', function () {
        sendBugReport({
            firstname: overlay.querySelector('#bug-report-firstname').value.trim(),
            lastname:  overlay.querySelector('#bug-report-lastname').value.trim(),
            email:     overlay.querySelector('#bug-report-email').value.trim(),
            message:   overlay.querySelector('#bug-report-desc').value.trim()
        });
        close();
    });

    // Focus sur le premier champ.
    const first = overlay.querySelector('#bug-report-firstname');
    if (first) first.focus();
}

/**
 * Construit le lien mailto pré-rempli (expéditeur + message + infos techniques)
 * et ouvre le client mail.
 * @param {{firstname?:string, lastname?:string, email?:string, message?:string}} data
 */
function sendBugReport(data) {
    data = data || {};
    const version = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : '?';

    const fullName = `${data.firstname || ''} ${data.lastname || ''}`.trim();
    const subject = `[Contact] CNED Quiz Builder v${version}` + (fullName ? ` — ${fullName}` : '');

    const body =
        'Expéditeur :\n' +
        `Nom et prénom : ${fullName || '(non renseigné)'}\n` +
        `Adresse électronique : ${data.email || '(non renseignée)'}\n` +
        '\n' +
        'Message :\n' +
        (data.message || '(à compléter)') +
        '\n\n' +
        '---\n' +
        'Informations techniques (ne pas modifier) :\n' +
        `Version : ${version}\n` +
        `Navigateur : ${navigator.userAgent}\n` +
        `Page : ${location.href}\n` +
        `Date : ${new Date().toLocaleString('fr-FR')}\n`;

    const mailto = `mailto:${BUG_REPORT_EMAIL}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

    // Ouvre le client mail. window.location convient pour un lien mailto.
    window.location.href = mailto;

    if (typeof notify !== 'undefined' && notify.info) {
        notify.info('Votre logiciel de messagerie devrait s\'ouvrir avec le message pré-rempli. Cliquez sur « Envoyer » pour finaliser.');
    }
}

// Exposition globale (réemploi éventuel / tests).
window.openBugReportDialog = openBugReportDialog;
