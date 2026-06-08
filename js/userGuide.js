/**
 * userGuide.js
 * Guide d'utilisation imprimable (PDF) de l'application.
 *
 * Produit un document HTML AUTONOME mis en forme à la charte CNED, ouvert dans
 * une nouvelle fenêtre puis envoyé à l'impression (`window.print()`) :
 * l'utilisateur choisit « Enregistrer au format PDF ». Même procédé que
 * l'export lisible (exportPrintable.js → openPrintableView), donc :
 *   • aucune dépendance (pas de jsPDF) — cf. CLAUDE.md §2 ;
 *   • fonctionne hors-ligne, y compris en ouverture directe file://.
 *
 * Le contenu est STATIQUE (il décrit l'outil, pas les questions saisies) : pas
 * d'image externe (le document est ouvert sur about:blank, les chemins relatifs
 * ne résoudraient pas) → en-tête typographique aux couleurs CNED.
 *
 * Déclencheur : bouton « 📘 Télécharger le guide (PDF) » du panneau d'aide
 * (helpManager.js). Vanilla JS, portée globale via window. Aucun framework.
 */

// ── Feuille de style du guide (charte CNED) ─────────────────────────────────
// Turquoise #2da288 / #00bcb4 · Rose #ae2585 / #e6417a (CLAUDE.md §4).
const USER_GUIDE_CSS = `
    @page { size: A4; margin: 16mm 15mm; }
    * { box-sizing: border-box; }
    body {
        font-family: "Segoe UI", system-ui, Arial, sans-serif;
        color: #1c2b2a;
        line-height: 1.5;
        font-size: 11.5px;
        margin: 0;
    }
    .guide { max-width: 820px; margin: 0 auto; padding: 8px 0 40px; }

    /* En-tête de couverture */
    .guide-header {
        border-top: 6px solid #2da288;
        border-bottom: 2px solid #ae2585;
        padding: 14px 0 12px;
        margin-bottom: 18px;
    }
    .guide-logo {
        height: 52px; width: auto; display: block; margin: 0 0 8px;
    }
    .guide-title { font-size: 26px; color: #1c6b58; margin: 0 0 4px; font-weight: 800; }
    .guide-subtitle { font-size: 13px; color: #2da288; margin: 0; font-weight: 600; }
    .guide-meta { margin-top: 8px; font-size: 10.5px; color: #5a7a73; }
    .guide-meta span { margin-right: 14px; }

    /* Titres de section */
    h2 {
        font-size: 15px; color: #ffffff; background: #2da288;
        padding: 5px 10px; border-radius: 4px; margin: 20px 0 8px;
        page-break-after: avoid;
    }
    h3 { font-size: 12.5px; color: #ae2585; margin: 12px 0 4px; page-break-after: avoid; }

    p { margin: 4px 0 8px; }
    ul, ol { margin: 4px 0 8px; padding-left: 20px; }
    li { margin: 2px 0; }
    strong { color: #1c2b2a; }
    code {
        background: #eef7f4; color: #1c6b58; padding: 1px 5px; border-radius: 3px;
        font-family: Consolas, "Courier New", monospace; font-size: 0.92em;
    }

    section { page-break-inside: avoid; }

    /* Encadrés */
    .tip, .note {
        border-left: 4px solid #00bcb4; background: #eef7f4;
        padding: 7px 12px; margin: 8px 0; border-radius: 0 4px 4px 0;
    }
    .note { border-left-color: #e6417a; background: #fdeef5; }
    .tip strong { color: #1c6b58; }
    .note strong { color: #ae2585; }

    /* Tableau des types de questions */
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 11px; }
    th, td { border: 1px solid #cfe9e3; padding: 5px 8px; text-align: left; vertical-align: top; }
    th { background: #2da288; color: #fff; font-weight: 600; }
    tr:nth-child(even) td { background: #f5fbf9; }

    /* Étapes numérotées de démarrage rapide */
    .quickstart { counter-reset: step; list-style: none; padding-left: 0; }
    .quickstart li {
        counter-increment: step; position: relative;
        padding: 4px 0 4px 34px; margin: 4px 0;
    }
    .quickstart li::before {
        content: counter(step); position: absolute; left: 0; top: 3px;
        width: 22px; height: 22px; border-radius: 50%;
        background: #ae2585; color: #fff; font-weight: 700; font-size: 12px;
        display: flex; align-items: center; justify-content: center;
    }

    .pill {
        display: inline-block; background: #00bcb4; color: #fff;
        font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 10px;
        vertical-align: middle;
    }

    footer {
        margin-top: 24px; padding-top: 8px; border-top: 1px solid #cfe9e3;
        font-size: 10px; color: #5a7a73; text-align: center;
    }

    @media print {
        body { font-size: 10.8px; }
        a { color: inherit; text-decoration: none; }
    }
`;

// ── Contenu du guide ────────────────────────────────────────────────────────

/**
 * Construit le corps HTML (sections) du guide.
 * @returns {string}
 */
function buildUserGuideBody() {
    return `
    <section>
        <h2>1. Présentation et démarrage rapide</h2>
        <p><strong>CNED Quiz Builder</strong> crée des questions pour Moodle et autres LMS,
        aux formats <strong>GIFT</strong> et <strong>Moodle&nbsp;XML</strong>, ainsi que des
        documents lisibles (PDF/RTF/HTML). Outil <strong>100&nbsp;% local</strong> : aucune
        donnée n'est transmise, et il <strong>fonctionne sans connexion</strong>.</p>
        <ol class="quickstart">
            <li>Renseignez l'<strong>auteur</strong> et le <strong>code article</strong> (facultatif).</li>
            <li>Ajoutez une question avec <strong>« Ajouter une question »</strong>.</li>
            <li>Choisissez le <strong>type</strong>, saisissez l'énoncé et les réponses.</li>
            <li>Cliquez sur <strong>« Générer »</strong> pour produire le code.</li>
            <li><strong>Copiez</strong> ou <strong>téléchargez</strong> le résultat pour l'importer dans Moodle.</li>
        </ol>
        <div class="tip"><strong>Astuce :</strong> une <strong>visite guidée</strong> et l'<strong>aide</strong>
        sont accessibles à tout moment en haut à droite.</div>
    </section>

    <section>
        <h2>2. Importer un fichier existant</h2>
        <p>Section <strong>« Importation d'un fichier existant »</strong> : reprenez un fichier
        pour le modifier.</p>
        <ul>
            <li><strong>GIFT</strong> : <code>.txt</code> ou <code>.zip</code> (le ZIP contient les médias).</li>
            <li><strong>Moodle XML</strong> : <code>.xml</code> — seul format qui restitue le
            <strong>feedback combiné</strong> et la sensibilité à la casse.</li>
        </ul>
        <div class="note"><strong>À noter :</strong> les identifiants automatiques sont laissés
        vides à l'import pour rester dynamiques ; les types non gérés sont ignorés et signalés.</div>
    </section>

    <section>
        <h2>3. Informations du document et identifiants</h2>
        <p>L'<strong>auteur</strong> et le <strong>code article</strong> figurent en en-tête du
        fichier généré. Le code article sert à construire l'identifiant de chaque question&nbsp;:</p>
        <p style="text-align:center"><code>&lt;code&gt;[-B&lt;NN&gt;]-Q&lt;NN&gt;</code></p>
        <p>Numéros sur deux chiffres ; le segment <code>-B&lt;NN&gt;</code> n'apparaît que pour
        les questions rangées dans une banque ; la numérotation <code>Q&lt;NN&gt;</code> repart
        à 01 par groupe. Un <strong>aperçu vivant</strong> de l'identifiant s'affiche sous chaque question.</p>
    </section>

    <section>
        <h2>4. Banques de questions (catégories Moodle)</h2>
        <p>Avec <strong>« 📚 Ajouter une banque »</strong>, regroupez des questions en
        <strong>banques</strong> (catégories Moodle). Chaque banque est une section repliable&nbsp;;
        un sélecteur par question permet de la déplacer.</p>
        <ul>
            <li>En GIFT : une directive <code>$CATEGORY:</code> est émise en tête de chaque groupe.</li>
            <li>En Moodle XML : une entrée <code>&lt;question type="category"&gt;</code> est insérée.</li>
        </ul>
    </section>

    <section>
        <h2>5. Créer une question</h2>
        <h3>Les cinq types</h3>
        <table>
            <thead><tr><th>Type</th><th>Usage</th></tr></thead>
            <tbody>
                <tr><td><strong>QCM</strong></td><td>Plusieurs réponses correctes possibles, avec pondérations (total des bonnes&nbsp;=&nbsp;100&nbsp;%).</td></tr>
                <tr><td><strong>QCU</strong></td><td>Une seule réponse correcte.</td></tr>
                <tr><td><strong>Vrai/Faux</strong></td><td>Réponse binaire.</td></tr>
                <tr><td><strong>QRC</strong></td><td>Réponse courte saisie ; plusieurs réponses acceptées, sensibilité à la casse possible.</td></tr>
                <tr><td><strong>Numérique</strong></td><td>Valeur numérique, avec marge d'erreur facultative.</td></tr>
            </tbody>
        </table>
        <h3>Éditeur de texte enrichi</h3>
        <p>Sur l'énoncé et les rétroactions : <strong>gras</strong>, <em>italique</em>, souligné,
        exposant et indice. La <strong>typographie CNED</strong> (espaces insécables, guillemets)
        est appliquée automatiquement à la génération.</p>
        <h3>Média</h3>
        <p><strong>« Ajouter un média »</strong> joint une image, un son ou une vidéo à la question.
        Le média est embarqué à l'export (ZIP GIFT ou XML autonome).</p>
    </section>

    <section>
        <h2>6. Rétroactions (feedback)</h2>
        <ul>
            <li><strong>Par réponse</strong> : message affiché selon l'option choisie.</li>
            <li><strong>Générale</strong> : message commun, quelle que soit la réponse.</li>
            <li><strong>Combinée</strong> <span class="pill">Moodle XML</span> : trois messages
            distincts (correct / partiellement correct / incorrect), pour les QCM/QCU.</li>
        </ul>
        <div class="note"><strong>Important :</strong> le feedback combiné n'existe qu'en
        <strong>Moodle XML</strong> — il est ignoré à l'export GIFT.</div>
    </section>

    <section>
        <h2>7. Sommaire, navigation et déplacement</h2>
        <p>Le <strong>résumé des questions</strong> offre une vue d'ensemble : numéro, identifiant,
        type et énoncé. Cliquez une ligne pour y aller ; utilisez les flèches <strong>↑/↓</strong>
        (sur la question ou dans le sommaire) pour <strong>réordonner</strong>.</p>
    </section>

    <section>
        <h2>8. Prévisualisation</h2>
        <p>Le bouton <strong>« 👁️ Prévisualiser »</strong> (en haut à droite) masque les champs
        d'édition et présente les questions en <strong>lecture seule</strong> : bonnes réponses
        en évidence, rétroactions et média affichés. Cliquez <strong>« ✏️ Éditer »</strong> pour revenir.</p>
    </section>

    <section>
        <h2>9. Générer et exporter</h2>
        <p>Le bouton <strong>« ⚙️ Générer »</strong> produit le code <strong>GIFT et Moodle&nbsp;XML</strong>
        (deux onglets dans la zone de sortie). Les exports sont regroupés en menus par format&nbsp;:</p>
        <ul>
            <li><span class="pill">📝 GIFT</span> copier le code, télécharger en <code>.txt</code> ou <code>.zip</code> (médias inclus).</li>
            <li><span class="pill">🎓 Moodle</span> visualiser le code, télécharger le <code>.xml</code> autonome (feedback combiné + médias).</li>
            <li><span class="pill">📄 Document</span> document lisible : <strong>PDF</strong> (impression), <strong>RTF</strong> (Word/LibreOffice), <strong>HTML</strong> autonome.</li>
        </ul>
        <div class="tip"><strong>Vers Moodle :</strong> importez le <code>.txt</code>/<code>.zip</code> (GIFT)
        ou le <code>.xml</code> (Moodle XML) dans votre banque de questions Moodle.</div>
    </section>

    <section>
        <h2>10. Hors-ligne, contact et visite guidée</h2>
        <ul>
            <li><strong>Hors-ligne :</strong> une fois la page ouverte, l'outil reste pleinement
            utilisable sans Internet. L'état de la connexion est rappelé en pied de page.</li>
            <li><strong>Contact :</strong> le bouton <strong>« 📧 Contact »</strong> prépare un e-mail
            (aucune donnée transmise à un tiers).</li>
            <li><strong>Visite guidée :</strong> un parcours interactif présente chaque fonctionnalité
            depuis le panneau d'aide.</li>
        </ul>
    </section>`;
}

// ── Point d'entrée ──────────────────────────────────────────────────────────

/**
 * Renvoie l'URL ABSOLUE du logo CNED, utilisable dans la fenêtre du guide
 * (ouverte sur about:blank, où un chemin relatif ne résoudrait pas). On reprend
 * en priorité le `src` du logo déjà affiché en page (résolu en absolu par le
 * navigateur, donc valable aussi en file://), avec repli sur le chemin connu.
 * @returns {string}
 */
function getCnedLogoSrc() {
    const existing = document.querySelector('img.logo');
    if (existing && existing.src) return existing.src;
    try {
        return new URL('assets/images/CNED_Logo_RVB_HD.PNG', document.baseURI).href;
    } catch (e) {
        return 'assets/images/CNED_Logo_RVB_HD.PNG';
    }
}

/**
 * Ouvre le guide d'utilisation dans une nouvelle fenêtre et déclenche
 * l'impression (l'utilisateur choisit « Enregistrer au format PDF »).
 * @returns {void}
 */
function openUserGuide() {
    const version = (typeof APP_VERSION !== 'undefined') ? APP_VERSION
                  : (window.APP_VERSION || '');
    const date = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const logoSrc = getCnedLogoSrc();

    const html =
        '<!DOCTYPE html>\n<html lang="fr"><head><meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>Guide d\'utilisation — CNED Quiz Builder</title>' +
        `<style>\n${USER_GUIDE_CSS}\n</style></head><body><div class="guide">` +
        '<header class="guide-header">' +
            `<img class="guide-logo" src="${logoSrc}" alt="Logo CNED">` +
            '<h1 class="guide-title">CNED Quiz Builder</h1>' +
            '<p class="guide-subtitle">Guide d\'utilisation — Générateur GIFT &amp; Moodle XML</p>' +
            `<p class="guide-meta"><span>Version ${version}</span>` +
            `<span>Édité le ${date}</span></p>` +
        '</header>' +
        buildUserGuideBody() +
        `<footer>CNED Quiz Builder — version ${version} · Document généré pour impression / PDF · ` +
        'Outil 100&nbsp;% local, fonctionne sans connexion.</footer>' +
        '</div>' +
        '<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},250);};<\/script>' +
        '</body></html>';

    const win = window.open('', '_blank');
    if (!win) {
        if (typeof notify !== 'undefined' && notify.error) {
            notify.error('La fenêtre du guide a été bloquée par le navigateur. Autorisez les pop-ups pour ce site.');
        }
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
}

// Exposition globale (déclenché par le panneau d'aide).
window.openUserGuide = openUserGuide;
