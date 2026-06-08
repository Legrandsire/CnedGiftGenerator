# DEVLOG — Journal de session

> Journal tenu par l'agent (Claude Code) à chaque session de travail.
> **En début de session** : lire la dernière entrée pour savoir où le projet
> en était. **En fin de session** : ajouter une entrée selon le gabarit.
>
> À distinguer du `CHANGELOG.md` : ici on consigne le *travail* (y compris sans
> release), là-bas on consigne les *versions publiées*.

---

## Gabarit d'entrée

```markdown
## AAAA-MM-JJ — <titre court>
- **Objectif** : ce qui était demandé
- **Fichiers modifiés** : liste
- **Décisions** : choix techniques notables + justification
- **En suspens** : ce qui reste à faire / à valider
- **Version** : X.Y.Z si incrémentée, sinon « inchangée »
```

---

## 2026-06-08 (suite 3) — Réorganisation de l'arborescence (0.25.0)

- **Objectif** : classer les modules (jusqu'ici tous à la racine, ~50 fichiers)
  dans des dossiers par nature, pour la lisibilité/maintenance.
- **Option retenue (validée par l'utilisateur)** : **Option A** — découpage
  simple par nature plutôt que sous-groupement de `js/` par domaine (Option B,
  écartée : bénéfice surtout cosmétique, plus de chemins à maintenir).
- **Réalisé** :
  - Création de `css/`, `js/`, `assets/images/`, `docs/`. Déplacements via
    `git mv` (historique préservé) : 13 CSS → `css/`, 24 JS → `js/`, logo →
    `assets/images/`, `Spec.md`/`ROADMAP.md`/`AUDIT.md` → `docs/`.
  - Restent à la racine : `index.html`, `CLAUDE.md`, `CHANGELOG.md`,
    `DEVLOG.md`, `vendor/`, `tests/`.
  - Chemins corrigés : `index.html` (favicon + 13 `<link>` + 23 `<script>`,
    `vendor/jszip.min.js` intact), `tests/tests.html` (`../css/`, `../js/`),
    `js/userGuide.js` (logo `assets/images/...`).
- **Vérifications** : aucun `import`/`fetch` ES6 (rien à corriger côté JS) ;
  lecture de `printStyles.css` dans `exportPrintable.js` robuste (test par
  `indexOf`, insensible au dossier) ; ordre de chargement inchangé ; grep de
  contrôle → aucune référence orpheline.
- **En suspens** : exécuter `tests/tests.html` dans un navigateur pour confirmer
  visuellement (validation par chemins faite, suite de tests non lancée en
  headless). Tag Git `v0.25.0` à poser.
- **Version** : 0.25.0 (MINOR — réorganisation rétrocompatible, zéro changement
  fonctionnel).

---

## 2026-06-08 (suite 2) — Guide d'utilisation imprimable PDF (0.24.0)

- **Objectif** : produire un guide d'utilisation complet mais synthétique, au
  format **PDF imprimable** (charte CNED), téléchargeable depuis le menu d'aide.
- **Choix validés (AskUserQuestion)** : nouveau module **`userGuide.js`** (reco) ;
  déclencheur dans le **panneau d'aide seul** (reco).
- **Réalisé** :
  - **`userGuide.js`** : `openUserGuide()` construit un document HTML autonome
    (CSS inline charté CNED, A4, sauts de page maîtrisés), `window.open` +
    `document.write` + auto-impression — exactement le procédé de
    `exportPrintable.js` (`openPrintableView`), donc sans dépendance et compatible
    `file://`. Contenu **statique** (10 sections) → pas d'image externe
    (about:blank), en-tête typographique aux couleurs CNED.
  - **`helpManager.js`** : bouton « 📘 Télécharger le guide (PDF) » dans le bloc
    « Nouveau sur l'outil ? » (onglet Général) + câblage (`openUserGuide`, garde
    défensive). **`helpStyles.css`** : espacement des deux boutons du bloc.
  - **`index.html`** : `<script src="userGuide.js">` (après tourManager.js).
- **Fichiers** : `core.js` (0.23.0 → 0.24.0), `index.html`, `helpManager.js`,
  `helpStyles.css`, `CHANGELOG.md`, `DEVLOG.md`, `ROADMAP.md`, `CLAUDE.md`.
  **Nouveau** : `userGuide.js`.
- **Décisions** : contenu statique (décrit l'outil, pas les questions) → robuste,
  aucune lecture du DOM ; couleurs/format alignés sur `printStyles.css` sans le
  réutiliser (document totalement autonome).
- **Tests** : suite `tests/tests.html` **inchangée (74)** — `userGuide.js` non
  chargé par le harnais (composant UI sans test dédié). `node --check` OK.
- **À valider (navigateur)** : panneau d'aide → bouton guide → fenêtre PDF charte
  CNED, impression/enregistrement PDF, rendu hors-ligne (`file://`).
- **Tag Git proposé (non exécuté)** : `v0.24.0`.
- **Version** : 0.24.0 (MINOR — nouvelle fonctionnalité rétrocompatible).

---

## 2026-06-08 — Correctifs preview/génération + visite guidée plus robuste (0.23.0, non publiée)

- **Objectif** : retours utilisateur sur la 0.23.0 (encore non commitée/taggée) —
  corriger plusieurs désagréments et fiabiliser la visite guidée.
- **Visite guidée — robustesse** (`tourManager.js`, `tourStyles.css`) :
  - Encadrés imprécis → **défilement instantané** (`behavior: 'auto'`) + mesure
    en **double `requestAnimationFrame`** (l'ancien `smooth` + `setTimeout(350)`
    mesurait en plein défilement). **Transition géométrique retirée** de
    `.tour-target-highlight` (plus de « traînage »).
  - **Sortie auto de la preview** au démarrage (`isPreviewModeActive` →
    `togglePreviewMode`) : la preview masquait/transformait des cibles → parcours
    cassé, surtout avec questions importées.
  - **Repositionnement au scroll + resize** throttlé en rAF ; séparation
    `renderTooltip` (contenu, 1×/étape) / `position` (géométrie, rappelable).
- **Preview — correctifs** (`previewMode.js`, `previewStyles.css`) :
  - Nouvelle fonction **`refreshPreviewMode()`** (restore + apply, synchrone)
    exposée et appelée en fin d'**import GIFT et XML** (`importGift.js`,
    `importMoodleXml.js`) → l'import en preview affiche directement le contenu.
  - **Boutons de banque** (`#add-bank-btn`, `#toggle-all-banks-btn`) masqués en
    preview → plus de banque créable au nom éditable.
  - **Nom de banque (existantes)** : le `readOnly` seul laissait le champ
    *paraître* éditable (bordure, fond, focus) — voire focalisable. Corrigé en le
    rendant **statique et inerte** : `readOnly` + `tabIndex=-1` +
    `pointer-events:none` et style sans bordure/fond (`previewStyles.css`,
    `.preview-readonly-bankname`), restauré à la sortie.
  - **Flèche « ↳ »** du feedback d'option supprimée (`.preview-option-feedback::before`).
- **Génération** (`actionMenu.js`) : le bouton **« Générer »** remplit aussi la
  zone **Moodle XML** (via `generateMoodleXmlCode`, sans base64), en plus du GIFT ;
  garde sur `.question-container.length > 0` pour éviter une double notification
  d'erreur quand il n'y a pas de question.
- **Fichiers** : `tourManager.js`, `tourStyles.css`, `previewMode.js`,
  `previewStyles.css`, `actionMenu.js`, `importGift.js`, `importMoodleXml.js`,
  `CHANGELOG.md`, `DEVLOG.md`.
- **Décisions** : tout consolidé dans **0.23.0** (jamais publiée) plutôt qu'un
  nouveau numéro ; visite = pas de restauration de la preview en fin de tour
  (le tour décrit l'édition, on reste en édition).
- **Tests** : suite `tests/tests.html` **inchangée (74)** — modules concernés non
  chargés par le harnais. `node --check` OK sur les 5 JS modifiés.
- **En suspens / à valider (navigateur)** : visite guidée (encadrés précis aux 4
  bords, départ depuis preview, longue page avec questions importées) ; import
  GIFT/XML en preview ; nom de banque non éditable ; bouton Générer remplissant
  les 2 onglets ; flèche « ↳ » disparue.
- **Tag Git proposé (non exécuté)** : `v0.23.0` (englobe ces correctifs).
- **Version** : 0.23.0 (inchangée — consolidation avant publication).

---

## 2026-06-07 (suite 5) — Mode hors-ligne + refonte de la visite guidée (0.23.0)

- **Objectif** : deux chantiers UI/UX menés l'un après l'autre.
  1. **Hors-ligne** : rendre l'outil utilisable sans connexion (utilisateurs non
     techniciens), la seule dépendance réseau étant JSZip via CDN.
  2. **Visite guidée** : incomplète depuis l'ajout de fonctionnalités et buguée
     graphiquement (infobulle masquant des boutons) ; deux implémentations
     coexistaient (dont une orpheline).
- **Choix validés (AskUserQuestion)** : (1a) vendoring JSZip **+ indicateur**
  d'état réseau ; (1c) dossier **`vendor/`** ; (2a) parcours **complet** ; (2b)
  tour **explicatif** (sans démos animées) ; (2c) extraction dans **`tourManager.js`** ;
  versionnage = **une seule MINOR 0.23.0**.
- **Réalisé — Chantier 1 (hors-ligne)** :
  - JSZip 3.10.1 téléchargé dans **`vendor/jszip.min.js`** ; `index.html` pointe
    dessus (plus de cdnjs). Export ZIP inchangé (même global `JSZip`).
  - **Indicateur réseau** en pied de page : `#network-status` (index.html) +
    `initNetworkStatusIndicator()` (core.js, événements `online`/`offline`) +
    styles `.network-status` (styles.css). Sortie défensive si l'élément est
    absent (cas de `tests.html`).
  - Ligne d'aide « ✈️ Fonctionne sans connexion » (helpManager.js, onglet Général).
- **Réalisé — Chantier 2 (visite guidée)** :
  - Nouveau **`tourManager.js`** + **`tourStyles.css`**. 17 étapes couvrant tout
    le flux (métadonnées → … → menus/onglets → preview → Contact → aide).
  - **Positionnement réécrit** : `position: fixed` (coordonnées viewport), clamp
    X **et** Y, `chooseSide`/`anchorFor` (bascule de côté), z-index 1601 (au-dessus
    de la pile fixe), repositionnement au `resize`, garde « cible introuvable → skip ».
  - **Ouverture auto des menus** via `openMenu` par étape (expose `openDropdown`
    depuis actionMenu.js ; ferme avec `closeAllDropdowns`).
  - `checkFirstVisit()` déplacé de helpManager.js vers tourManager.js (sa propre
    entrée `APP_INIT`). **`advancedTourFeatures.js` supprimé** (`git rm`) + retrait
    des blocs de tour de `helpStyles.css`.
- **Fichiers** : `core.js` (0.22.1 → 0.23.0 + indicateur), `index.html` (script
  JSZip local, `<script>`/`<link>` tour, `#network-status`), `styles.css`,
  `helpManager.js` (allégé), `actionMenu.js` (expose `openDropdown`), `helpStyles.css`
  (blocs tour retirés), `CHANGELOG.md`, `ROADMAP.md`, `CLAUDE.md`. **Nouveaux** :
  `vendor/jszip.min.js`, `tourManager.js`, `tourStyles.css`. **Supprimé** :
  `advancedTourFeatures.js`.
- **Décisions techniques** :
  - Indicateur réseau dans `core.js` (init/footer, pas de domaine dédié justifiant
    un fichier) ; hors-ligne traité en gris (état normal, pas une erreur).
  - Tour en `position: fixed` : la mesure `getBoundingClientRect()` est
    viewport-relative → clamp trivial, plus de calcul de `scrollTop`.
  - Étapes pointant des items de menu : on vise le **déclencheur** et on ouvre le
    menu (cible toujours présente, même repliée).
- **Tests** : suite `tests/tests.html` **inchangée (74)** — ni JSZip ni les
  modules d'aide/tour n'y sont chargés ; l'ajout dans `core.js` est neutre hors
  `#network-status`. Syntaxe Node (`node --check`) validée sur core/actionMenu/
  helpManager/tourManager.
- **En suspens / à valider** : ouvrir `tests/tests.html` (confirmer 74 verts) ;
  valider au navigateur l'export ZIP en `file://`, l'indicateur réseau, et la
  visite guidée complète (positionnement aux 4 bords, ouverture des menus).
- **Tag Git proposé (non exécuté)** : `v0.23.0`.
- **Version** : 0.23.0 (MINOR — deux fonctionnalités rétrocompatibles).

---

## 2026-06-07 (suite 4) — Prévisualisation épurée (0.22.1)

- **Objectif** : retour utilisateur après 0.22.0 — la preview était jugée
  « chargée » (boîtes colorées imbriquées). Rendre l'affichage **épuré**.
- **Choix validé (AskUserQuestion)** : style **« Liste épurée »** (parmi liste /
  accent latéral / minimal tinté).
- **Réalisé** (un seul fichier : `previewStyles.css`) :
  - Réponses sans encadré (marque ✓/✗ + texte, gras bleu pour la bonne) ;
    feedback d'option en retrait « ↳ », sans cadre ; pondération/casse en texte
    discret (sans pastille).
  - Filets de séparation **teintés par parité** (vert/rose), plus marqués (2 px)
    avant les rétroactions ; carte quasi blanche + fin accent latéral.
  - Énoncé mis en valeur (police 1.2em + fond très léger teinté par parité).
  - Étiquette de type en **contraste inversé** (fond clair, texte foncé).
- **Méthode** : itérations livrées sur une **branche d'essai `preview-epuree`**
  (3 commits), validées visuellement par l'utilisateur, puis **fusionnées en
  fast-forward dans `main`** ; bump PATCH ici.
- **Fichiers modifiés** : `previewStyles.css` (via la branche), puis `core.js`
  (0.22.0 → 0.22.1), `CHANGELOG.md`, `DEVLOG.md`.
- **Tests** : inchangés (74) — modification purement CSS, preview non couverte
  par le harnais.
- **Tag Git proposé (non exécuté)** : `v0.22.1`.
- **Version** : 0.22.1 (PATCH — raffinement visuel, rétrocompatible).

---

## 2026-06-07 (suite 3) — Refonte UI/UX globale (0.22.0)

- **Objectif** : chantier ROADMAP n°10 (absorbe le n°9) — refonte visuelle,
  ergonomie, responsive, sans toucher aux exports/imports (GIFT/XML/lisible) ni
  casser la suite de tests.
- **Choix validés (AskUserQuestion)** : (a) renommage **« CNED Quiz Builder »** ;
  (b) barre du bas en **menus déroulants** par format ; (c) sortie XML en
  **onglets** GIFT/XML (zone unique) ; (d) signalement de bug = **formulaire
  modal → mailto** ; (e) **une seule MINOR 0.22.0**.
- **Livré en 0.22.0** :
  - **Preview refondue** (`previewMode.js` / `previewStyles.css`) : compacte,
    bonnes réponses **bleu** / mauvaises **rouge** (dégradés/bordures), feedback
    combiné **lecture seule** bien placé (`transformCombinedFeedback`), média
    affiché (`transformMedia`), affordance « Ajouter un média » et contrôles
    d'en-tête (banque + flèches) masqués ; **identifiant déplacé dans l'en-tête**
    → fin du chevauchement avec les flèches ↑/↓ (correctif chantier n°9).
  - **Pile de boutons haut-droite** : Aide → Prévisualiser → Signaler un bug, à
    **largeur fixe**, empilés (`helpStyles.css`, `previewStyles.css`,
    `bugReportStyles.css`). **Toasts** repositionnés en dessous (`notifyStyles.css`).
  - **Menus déroulants + onglets** (`actionMenu.js` / `actionMenuStyles.css`) :
    « GIFT ▾ / Moodle ▾ / Document ▾ » ; les boutons gardent leurs **id** (câblage
    intact). Onglets de sortie GIFT/XML (`switchOutputTab`) + bouton **« Générer &
    visualiser »** le code Moodle (affichage sans téléchargement, sans base64).
  - **Contact** (`bugReport.js` / `bugReportStyles.css`) : bouton « 📧 Contact »
    (gris ardoise, distinct d'« Éditer »), modale = formulaire nom/prénom/email/
    message → `mailto:` pré-rempli (expéditeur + message + version + navigateur)
    vers `vincent.grandsire@ac-cned.fr`.
  - **RTF** (`exportPrintable.js`) : séparateurs de natures différentes — filet
    **double** + libellé pour les **banques** (`rtfBankHeader`), filet sous le
    titre de question, filet **pointillé** entre **composantes** (`rtfRule`).
    `readQuestionState` porte désormais `bankNum`/`bankName`.
  - **Renommage** (index.html : `<title>`, `<h1>`, intro) + **favicon** (logo CNED).
  - **Responsive** : media queries (barre d'action, en-tête, métadonnées,
    sommaire défilable, preview, pile de boutons).
  - **Tour guidé** : étape copier/télécharger → menu « GIFT » (`#gift-menu-toggle`).
- **Fichiers modifiés** : `core.js` (0.21.0 → 0.22.0), `index.html`, `styles.css`,
  `previewMode.js`, `previewStyles.css`, `helpStyles.css`, `helpManager.js`,
  `notifyStyles.css`, `exportPrintable.js`, `tests/testRunner.js`, `CHANGELOG.md`,
  `ROADMAP.md`, `CLAUDE.md`. **Nouveaux** : `actionMenu.js`, `actionMenuStyles.css`,
  `bugReport.js`, `bugReportStyles.css`.
- **Décisions techniques** :
  - Menus déroulants : les boutons d'action **conservent leurs identifiants** →
    aucun recâblage de core/download/export ; `actionMenu.js` ne gère que
    l'ouverture/fermeture et les onglets.
  - Visualisation XML **sans embarquement base64** (lisibilité de la zone de
    sortie) ; le téléchargement `.xml` reste, lui, autonome (médias inclus).
  - Nouveaux scripts **non chargés dans `tests/tests.html`** (composants UI sans
    test dédié) ; les câblages touchant de nouveaux DOM (`xml-output`, onglets,
    `generate-xml-btn`) sont **défensifs** (vérification d'existence).
- **Retours utilisateur (en cours de chantier)** :
  - Preview **plus compacte** : paddings/gaps réduits, marges des `<p>` du RTE
    neutralisées, icônes de validité plus petites.
  - Bouton de contact **gris ardoise** (l'ancien rose doublonnait avec « Éditer »).
  - **Choix validés (AskUserQuestion, 2ᵉ tour)** : envoi = **formulaire enrichi →
    mailto** (refus d'un service tiers pour préserver « aucune donnée transmise »,
    Spec.md 1.1) ; renommage **« Signaler un bug » → « Contact »** + champs
    nom/prénom/email.
- **Tests** : +2 (séparateurs RTF) → **74**. Validés en Node pour la **syntaxe**
  des fichiers modifiés/créés ; la suite complète exige le navigateur.
- **En suspens / à valider** : ouvrir `tests/tests.html` et confirmer les **74
  tests** verts ; valider visuellement la preview, les menus, les onglets, le
  responsive et le mailto au navigateur avant le tag.
- **Tag Git proposé (non exécuté)** : `v0.22.0`.
- **Version** : 0.22.0 (MINOR — refonte UI/UX rétrocompatible).

---

## 2026-06-07 (suite 2) — Banques de questions / catégories (0.21.0)

- **Objectif** : chantier ROADMAP n°2 — classer les questions en **banques**
  (catégories Moodle `$CATEGORY`), avec identifiant `<code>[-B<NN>]-Q<NN>` et UI
  repliable dans le formulaire **et** le sommaire, sans casser GIFT/XML/lisible
  ni les 63 tests.
- **Choix validés (AskUserQuestion)** : (1) numérotation `Q` **par banque** ;
  (2) hors-banque conservant `CODE-QNN` (sans `-B`) → round-trip des fichiers
  existants ; (3) chemin `$course$/<code>/<nom>` ; (4) déplacement par
  **sélecteur de banque** par question ; (5) **une seule MINOR 0.21.0** ;
  (6) regroupement DOM en vraies sections `<details>` + zone « Sans banque ».
- **Architecture** : **DOM = source de vérité** (pas de modèle JS parallèle).
  `#questions-container` → `.no-bank-zone` (toujours en tête) + sections
  `<details.bank-section>` ; toute question vit dans un `.bank-questions` →
  `querySelectorAll('.question-container')` reste dans l'ordre de génération.
- **Livré en 0.21.0** :
  - **Nouveau `categoryManager.js`** : création/renommage/suppression de banque,
    sélecteur par question, **`computeFinalQuestionId` unifié** (dé-dupliqué de
    giftGenerator + exportMoodleXml, consommé aussi par exportPrintable),
    `buildCategoryPath`/`bankNameFromCategoryPath`/`ensureBankByName`,
    `refreshBanks` (badges `B<NN>`, compteurs, flèches **par groupe**, sélecteurs,
    **aperçu d'identifiant vivant**). **Nouveau `categoryStyles.css`**.
  - **GIFT** (`giftGenerator.js`, `importGift.js`) : `$CATEGORY:` émis aux
    transitions de banque ; reconnu à l'import (`splitGiftQuestions` renvoie
    `{text, category}`).
  - **XML** (`exportMoodleXml.js`, `importMoodleXml.js`) : `<question
    type="category">` à l'export ; mapping inverse à l'import. **Code article**
    embarqué (`<!-- course-code: … -->`) et rechargé à l'import.
  - **Sommaire** (`summaryManager.js`) : en-têtes de groupe repliables, état de
    repli persistant (`bankId`), flèches par groupe.
  - **questionManager.js** : question créée dans la zone par défaut,
    `addNewQuestion()` **retourne** l'élément (imports adaptés), sélecteur de
    banque + aperçu d'ID câblés, `moveQuestion` confiné au groupe.
- **Correctifs (retours utilisateur en cours de chantier)** :
  - Import XML : champ « Code article » non chargé → embarqué en commentaire +
    `deriveCourseCode` (commentaire, puis chemin de catégorie).
  - Imports GIFT **et** XML : identifiants auto figés en « manuels » →
    `cleanQuestionId` reconnaît `(-B<NN>)?-Q<NN>` et **vide** le champ si la base
    = code article (reste dynamique) ; fonction exposée pour réemploi XML.
- **Fichiers modifiés** : `core.js` (0.20.0 → 0.21.0), `domIds.js`,
  `questionManager.js`, `giftGenerator.js`, `exportMoodleXml.js`,
  `exportPrintable.js`, `importGift.js`, `importMoodleXml.js`, `summaryManager.js`,
  `summaryStyles.css`, `index.html`, `tests/tests.html`, `tests/testRunner.js`,
  `CHANGELOG.md`, `ROADMAP.md`, `Spec.md`, `CLAUDE.md`. **Nouveaux** :
  `categoryManager.js`, `categoryStyles.css`.
- **Tests** : +9 (section 6) → **72** au total. Validés en Node (syntaxe des
  fichiers ; logique pure de `buildFinalQuestionId`, `cleanQuestionId`,
  extraction `$CATEGORY` et chemins). Round-trip DOM + DOMParser exigent le
  navigateur.
- **En suspens / à valider** : ouvrir `tests/tests.html` et confirmer les **72
  tests** verts au navigateur avant le tag. Fonctionnellement validé par
  l'utilisateur (import/export GIFT et XML, déplacement, aperçu d'ID).
- **Tag Git proposé (non exécuté)** : `v0.21.0`.
- **Version** : 0.21.0 (MINOR — banques de questions, rétrocompatible).

---

## 2026-06-07 (suite) — Export lisible PDF + RTF + HTML (0.20.0)

- **Objectif** : chantier ROADMAP n°4 — produire un document **lisible par un
  humain** (relecture), soigné aux couleurs CNED, **sans dépendance nouvelle**
  (donc pas de jsPDF) et **sans toucher** aux exports/imports GIFT et Moodle XML.
- **Choix validés (AskUserQuestion)** : (1) **une seule version 0.20.0** —
  PDF + RTF + HTML ensemble ; (2) fonction partagée `readQuestionState()`
  **nouvelle, consommée par l'imprimable seul** (GIFT/XML intacts → zéro risque
  sur les tests ; unification des 3 lecteurs DOM = amélioration future) ;
  (3) PDF via **`window.open` + `window.print()`**, images en **base64 inline** ;
  (4) **HTML autonome livré** en V1 (coût marginal nul, même générateur) ;
  (5) CSS dans **`printStyles.css` source unique**, inlinée à la génération via
  `document.styleSheets` (fallback `FALLBACK_PRINT_CSS` si `cssRules` bloqué en
  `file://`).
- **Livré en 0.20.0** :
  - **Nouveau module `exportPrintable.js`** : `readQuestionState()` (lecture
    normalisée d'une question, neutre vis-à-vis du format) ; 3 points d'entrée
    `openPrintableView()` (PDF), `downloadAsHtml()`, `downloadAsRtf()`. Helpers :
    `richHtmlToRtf()` (DOMParser → sous-ensemble RTF : b/i/u/sup/sub/blocs),
    `rtfEscape()` (accents `\uN?`, `{ } \`), `getPrintCss()`, `buildPrintableHtml()`,
    `buildRtf()`. Réutilise `computeFinalQuestionId`/`fileToBase64` (exportMoodleXml),
    `getMediaFilename`/`getMediaCategory` (mediaManager), `buildExportFilename`
    (downloadManager), `IDS`, `getRichTextValue`, `addNonBreakingSpaces`.
  - **Nouveau `printStyles.css`** (charte CNED, règles scopées `.printable-*`),
    lié dans `index.html` (sans effet sur l'app) et inliné dans le document généré.
  - **`index.html`** : 3 boutons (`📄 PDF (impression)`, `📝 RTF (.rtf)`,
    `🌐 HTML (.html)`) dans `.action-group-secondary` ; `<link>` printStyles.css ;
    `<script src="exportPrintable.js">` après downloadManager. **`styles.css`** :
    classe `.btn-print` (contour turquoise, pour distinguer des exports Moodle).
  - **Tests** : +14 (`tests/testRunner.js`, section 5) ; module + lien CSS +
    boutons ajoutés à `tests/tests.html`.
- **Décisions techniques** :
  - **Médias** : images embarquées en base64 inline (PDF/HTML), pour survivre au
    document d'impression séparé / au `.html` autonome. Audio/vidéo/PDF et tout le
    RTF → **mention** « voir l'export ZIP/XML » (embarquement binaire RTF trop
    complexe pour le bénéfice).
  - **PDF par nouvelle fenêtre** : isole `printStyles.css`, évite les `@media print`
    intrusifs sur l'app, auto-impression via un petit script `window.onload`.
  - **Contenu lisible** : bonne(s) réponse(s) en évidence (✓ + gras + turquoise),
    poids si ≠ 100 %, casse QRC, marge numérique, feedbacks (option/général/
    combiné), en-tête métadonnées.
- **Fichiers modifiés** : `core.js` (0.19.0 → 0.20.0), `index.html`, `styles.css`,
  `tests/tests.html`, `tests/testRunner.js`, `CHANGELOG.md`, `ROADMAP.md`,
  `Spec.md`, `CLAUDE.md`. **Nouveaux** : `exportPrintable.js`, `printStyles.css`.
- **Itération de raffinement (même session, après 1ʳᵉ relecture utilisateur)** :
  - **Correctifs de tests** : (1) caractères **nbsp** (U+00A0) parasites dans la
    source de `exportPrintable.js` (espaces insécables saisis dans les libellés)
    → tous remplacés par des espaces normaux (le nbsp d'affichage est désormais
    produit par le code via `&nbsp;`/`nbspHtml`) ; (2) l'énoncé n'était pas
    enveloppé en `<p>` → nouveau helper `formatBlock` (= `addHtmlTags ∘
    addNonBreakingSpaces`, comme GIFT/XML) appliqué à l'énoncé, aux feedbacks et
    aux réponses.
  - **Mise en page** (retours « pas assez compact, coches non alignées ») :
    réponses en **flexbox** (`.pq-answer` flex, coche `.pq-mark` à largeur fixe,
    `.pq-answer-body` en colonne) → coche alignée même si le texte est un bloc ;
    blocs resserrés ; en-tête de question soulignée ; titres RTF soulignés d'un
    filet, réponses RTF indentées.
  - **RTF avec images** (demande « format éditable Word contenant les images ») :
    le RTF embarque désormais les **images PNG/JPEG** via `\pict\pngblip`/
    `\jpegblip` (hex), avec dimensions en twips plafonnées. `downloadAsRtf`
    devient **async** (préchargement média partagé `attachPrintableMedia`, qui
    remplace `attachPrintableImages` et alimente aussi le data-URL HTML/PDF).
  - **+2 tests** (image RTF `\pict`, image HTML data-URL) → **16** au total
    pour la section 5.
- **En suspens / à valider** :
  - **Tests au navigateur** : ouvrir `tests/tests.html` et vérifier que les
    **63 tests** (47 + 16) sont verts. Validé en Node : syntaxe des fichiers,
    logique de `rtfEscape` (accents, `{ } \`), absence de nbsp résiduel.
    `richHtmlToRtf`, l'embarquement `\pict` et le pilotage du DOM exigent le
    navigateur.
  - **Test manuel** : générer un quiz des 5 types (avec image, feedbacks combinés),
    puis : PDF (vérifier l'aperçu d'impression + image visible), `.html` (ouvrir le
    fichier téléchargé → autonome), `.rtf` (ouvrir dans Word/LibreOffice → accents
    corrects, bonnes réponses en gras). Vérifier que GIFT/ZIP/XML sont inchangés.
  - **Nuance file:// (Chrome)** : la lecture des `cssRules` de printStyles.css peut
    être bloquée → le fallback CSS s'applique (rendu CNED correct mais moins riche).
    Servir l'app en http(s) donne le rendu complet.
  - **Hors périmètre, consigné** : la relecture a aussi relevé que les flèches
    ↑/↓ se superposent à l'ID de question et que le mode prévisualisation est
    perfectible → **nouveau chantier ROADMAP n°9** (refonte prévisualisation +
    correctif flèches/ID), traité dans une session ultérieure (choix validé).
- **Tag Git proposé (non exécuté)** : `v0.20.0`.
- **Version** : 0.20.0 (MINOR — export lisible PDF/RTF/HTML, rétrocompatible).

---

## 2026-06-07 — Import Moodle XML + médias base64 (0.19.0)

- **Objectif** : chantiers ROADMAP n°7 (import Moodle XML, pour **rééditer le
  feedback combiné** que le GIFT perd) et n°8 (médias `base64` dans
  l'export/import XML, pour un `.xml` **autonome**), traités ensemble. Aller-retour
  complet « éditer → exporter .xml → réimporter .xml → rééditer », médias inclus,
  **sans toucher aux exports/imports GIFT**.
- **Choix validés (AskUserQuestion)** : (1) **une seule version 0.19.0** (7+8 d'un
  bloc) ; (2) **même bouton** d'import, `accept` étendu à `.xml`, aiguillage par
  extension **et** contenu (`<quiz>`) ; (3) types non gérés → **ignorer +
  notifier** (import partiel) ; (4) **avertissement de poids** (~10 Mo) pour le
  base64, jamais bloquant.
- **Livré en 0.19.0** :
  - **Nouveau module `importMoodleXml.js`** : `importMoodleXmlContent()` (async —
    `DOMParser`, confirmation modale avant remplacement, comme l'import GIFT) +
    `looksLikeMoodleXml()`. Mapping inverse : multichoice `single` → QCM/QCU
    (fraction → poids, option la plus proche), truefalse, shortanswer + `<usecase>`
    → sélecteur de casse, numerical + `<tolerance>` → marge ; les 3 `…feedback` →
    encart de feedback combiné. Réemploi de `addNewQuestion`, `IDS`,
    `setRichTextValue` (qui assainit), clics sur les boutons « + option ».
  - **`exportMoodleXml.js`** : `<file … encoding="base64">` émis **dans
    `<questiontext>`** (`path="/"`) + `@@PLUGINFILE@@` via `buildXmlMediaTag()`
    (sans l'échappement GIFT du `=`). `generateMoodleXmlCode([mediaBase64])` +
    `downloadAsMoodleXml()` désormais **async** (pré-lecture via `fileToBase64`).
    Avertissement « médias non inclus » **remplacé** par un avertissement de poids.
  - **Aiguillage** : `index.html` (`accept=".txt,.zip,.xml"`, libellé), `importGift.js`
    (branche `.xml` → `handleXmlImport` + sniff `<quiz>` dans l'import texte).
  - **Médias à l'import** : base64 décodé (`atob` → `Uint8Array` → `File`) puis
    réattaché via `attachMediaFromZip` (mediaManager), tag `@@PLUGINFILE@@` retiré
    du texte.
  - **Tests** : +11 (`tests/testRunner.js`, section 4) ; module chargé dans
    `tests/tests.html`.
- **Décisions techniques** :
  - **Placement média = `<file>` dans `<questiontext>`** : répond directement au
    problème historique de localisation des médias. Moodle range alors le fichier
    dans la *filearea* propre à la question — **aucun répertoire à choisir**, à la
    différence du ZIP. C'est l'argument décisif du base64-en-XML.
  - **`name` de question repris verbatim** dans le champ identifiant à l'import
    (ex. `ECO-Q01`) : `computeFinalQuestionId` le conserve tel quel (motif `-QNN`),
    d'où un round-trip XML→XML stable. Le code matière/auteur n'est pas porté par
    le XML : non restitué (sans objet pour la réédition).
  - **`generateMoodleXmlCode` rétrocompatible** : `mediaBase64` optionnel → les
    tests d'export existants (sans média) restent identiques au caractère près.
- **Fichiers modifiés** : `core.js` (0.18.0 → 0.19.0), `exportMoodleXml.js`,
  `importGift.js`, `index.html`, `tests/tests.html`, `tests/testRunner.js`,
  `CHANGELOG.md`, `ROADMAP.md`, `Spec.md`, `CLAUDE.md`. **Nouveau** :
  `importMoodleXml.js`.
- **En suspens / à valider** :
  - **Tests au navigateur** : ouvrir `tests/tests.html` et vérifier que les
    **47 tests** (36 + 11) sont verts. L'agent ne peut pas lancer de navigateur ;
    en Node ont été validés : syntaxe des fichiers, aiguillage `looksLikeMoodleXml`,
    décodage base64 (signature PNG), normalisation nbsp. Le parsing `DOMParser` et
    le pilotage du DOM exigent le navigateur.
  - **Test manuel Moodle** : exporter un QCM avec média + feedback combiné en
    `.xml`, l'importer dans Moodle (vérifier image rangée dans la question et 3
    messages), réimporter le `.xml` dans l'outil (vérifier la réédition complète).
- **Tag Git proposé (non exécuté)** : `v0.19.0`.
- **Version** : 0.19.0 (MINOR — import XML + médias base64, rétrocompatible).

---

## 2026-06-06 (suite) — Export Moodle XML + feedback combiné (0.18.0)

- **Objectif** : chantier ROADMAP n°5 — ajouter un **export Moodle XML** (en
  plus du GIFT, qui reste intact) pour permettre le **feedback combiné**
  (correct / partiellement correct / incorrect), impossible à exprimer en GIFT.
- **Choix validés (AskUserQuestion)** : (1) export des **5 types** (pas
  seulement le QCM) pour un `.xml` complet ; (2) feedback combiné sur **QCM +
  QCU** (tous deux `multichoice` côté Moodle) ; (3) **médias différés** +
  avertissement (pas de `@@PLUGINFILE@@` cassé) ; (4) HTML enrichi en **CDATA**.
- **Livré en 0.18.0** :
  - Nouveau module `exportMoodleXml.js` : `generateMoodleXmlCode()` (lit le DOM,
    renvoie la chaîne XML) + `downloadAsMoodleXml()` (BOM UTF-8, nom
    `questions_moodle_…xml`, avertissement médias) + câblage du bouton via
    `APP_INIT`. Helpers d'encodage : `xmlEscapeText`, `wrapCdata` (neutralise
    `]]>`), `xmlHtmlField`, etc.
  - Mapping : mc→multichoice(single=false), sc→multichoice(single=true),
    tf→truefalse, sa→shortanswer (+`<usecase>` honoré, bonus vs GIFT),
    num→numerical (+`<tolerance>`). Les `fraction` reprennent directement les
    `data-full-value` (déjà au format Moodle : 33.33333, 66.66667…).
  - Gabarit (`questionManager.js`) : encart « Feedback combiné » (3 RTE compacts)
    après le feedback général, **affiché pour QCM/QCU seulement** (bascule
    ajoutée à `setupQuestionTypeHandlers`), avec mention « export Moodle XML
    uniquement ».
  - `domIds.js` : `combinedFeedbackBlock`, `correctFeedback`,
    `partiallyCorrectFeedback`, `incorrectFeedback`.
  - `index.html` : bouton « 🎓 Moodle XML (.xml) » + `<script>` (après
    `giftGenerator.js`). `styles.css` : style du bouton (rose CNED) et de l'encart.
  - `downloadManager.js` : `buildExportFilename` accepte un préfixe
    (rétrocompatible).
  - Tests : +12 (`tests/testRunner.js`, section 3) ; module chargé dans
    `tests/tests.html`.
- **Décisions techniques** :
  - **Pas de refonte de `giftGenerator.js`** : `exportMoodleXml.js` relit le DOM
    en réutilisant les helpers partagés (typographie, getRichTextValue, IDS,
    poids) ; pas de duplication de logique métier. *(Une extraction d'un
    « modèle de question » partagé — souhaitée aussi par le chantier 4 — est
    plus lourde et risquerait les tests verts : signalée comme amélioration
    future, pas V1.)*
  - **Feedback combiné émis seulement si renseigné** (balises omises sinon →
    Moodle applique ses libellés par défaut).
  - **CDATA** plutôt qu'entités pour le HTML enrichi : cohérent avec l'export
    natif Moodle, pas de risque de double-échappement.
- **Fichiers modifiés** : `core.js` (0.17.0 → 0.18.0), `domIds.js`,
  `questionManager.js`, `index.html`, `styles.css`, `downloadManager.js`,
  `tests/tests.html`, `tests/testRunner.js`, `CHANGELOG.md`, `ROADMAP.md`,
  `Spec.md`. **Nouveau** : `exportMoodleXml.js`.
- **En suspens / à valider** :
  - **Tests au navigateur** : ouvrir `tests/tests.html` et vérifier que les
    **36 tests** (24 + 12 XML) sont verts. L'agent ne peut pas lancer de
    navigateur ; les 2 fonctions pures d'encodage ont été validées en Node.
  - **Test manuel** : créer un QCM avec feedback combiné, exporter en `.xml`,
    importer le fichier dans Moodle pour confirmer le rendu des 3 messages.
    Vérifier aussi qu'une question avec média déclenche l'avertissement.
  - **V2 possibles** : embarquement base64 des médias ; import XML.
- **Tag Git proposé (non exécuté)** : `v0.18.0`.
- **Version** : 0.18.0 (MINOR — nouveau format d'export rétrocompatible).

---

## 2026-06-06 (suite) — Modale de confirmation non bloquante (0.17.0)

- **Objectif** : poursuivre la qualité (« traite tout de suite ») en migrant les
  `confirm()`/`alert()` bloquants restants vers une UI non bloquante cohérente
  avec `notify.js`.
- **Recensement** : 3 `confirm()` réels (effacement `core.js`, doublons
  `giftGenerator.js`, import `importGift.js`) ; aucun `alert()` applicatif
  restant (déjà migré en 0.13.0).
- **Livré en 0.17.0** :
  - Nouveau module `confirmDialog.js` (+ `confirmDialogStyles.css`) :
    `confirmDialog(opts)` renvoie une `Promise<boolean>` ; modale CNED, bouton
    « danger » optionnel, Échap/clic-fond = annuler, Entrée = confirmer, focus
    initial sur le bouton de confirmation.
  - Effacement (`core.js`) et import (`importGift.js`) migrés vers la modale.
    `parseGiftContent` est désormais `async` (la confirmation précède l'overlay
    d'import).
  - Doublons (`giftGenerator.js`) : `confirm()` → `notify.warning` **+
    poursuite** de la génération.
- **Décisions techniques** :
  - **Doublons = avertir et poursuivre** (changement de comportement assumé).
    Raison : `generateGIFTCode()` est synchrone et son résultat est lu
    immédiatement par `downloadManager`/import ; la rendre asynchrone pour un
    blocage aurait propagé le risque à plusieurs chemins. Documenté dans le
    CHANGELOG ; réversible si le maître d'ouvrage préfère un vrai blocage.
  - Module dédié plutôt qu'ajout à `notify.js` : responsabilité distincte
    (dialogue modal vs toast) — règle d'or CLAUDE.md §3.
  - `confirmDialog.js` chargé après `notify.js` dans `index.html` **et**
    `tests/tests.html` (parité de configuration ; non sollicité par les tests
    actuels car le seul chemin d'import testé part d'un conteneur vide).
- **Fichiers modifiés** : `index.html` (CSS + script), `core.js` (modale +
  bump 0.16.0 → 0.17.0), `importGift.js` (async + modale), `giftGenerator.js`
  (warning), `tests/tests.html` (script), `CHANGELOG.md`, `ROADMAP.md`,
  `CLAUDE.md` (table d'architecture). **Nouveaux** : `confirmDialog.js`,
  `confirmDialogStyles.css`.
- **En suspens / à valider** :
  - **Tests au navigateur** : 24 tests toujours verts (pas de test dédié à la
    modale — elle exige une interaction ; testée manuellement).
  - **Tests manuels** : effacement (annuler/confirmer + Échap/Entrée),
    import remplaçant des questions existantes, génération avec doublons (toast
    + code généré).
- **Tag Git proposé (non exécuté)** : `v0.17.0`.
- **Version** : 0.17.0 (MINOR — nouveau module UI, migration rétrocompatible).

---

## 2026-06-06 (suite) — ROADMAP + déplacement des questions (0.16.0)

- **Objectif** : (1) produire un `ROADMAP.md` recensant les fonctionnalités à
  implémenter au fil des prochaines sessions ; (2) livrer tout de suite le
  correctif qualité (`dlog`) et le **déplacement des questions**.
- **Décisions de cadrage (validées par l'utilisateur)** :
  - **Feedback combiné** : impossible en GIFT → planifié via un **export Moodle
    XML** (chantier dédié, le plus lourd).
  - **Export lisible** : PDF (impression navigateur) **+ RTF** (chaîne générée,
    sans dépendance ; nuance accents → échappement Unicode documentée).
  - **Banque de questions** : compatible GIFT nativement (`$CATEGORY:`).
  - **Sauvegarde native** : localStorage (état) + IndexedDB (médias) à trancher.
  - **Authentification** : idée future, à cadrer (romprait l'architecture 100 %
    statique → décision d'archi majeure, ne pas démarrer sans validation CNED).
- **Livré en 0.16.0** :
  - **Déplacer les questions** : flèches ▲/▼ dans l'en-tête de chaque question et
    dans le sommaire. `moveQuestion(id, direction)` déplace le nœud DOM puis
    `renumberQuestions()` (étendue pour désactiver les flèches d'extrémité) et
    `updateQuestionsSummary()`. Délégation d'événements ajoutée au sommaire.
  - **Correctif `dlog`** : récursion infinie corrigée (`console.log`).
- **Fichiers modifiés** : `questionManager.js` (en-tête + `moveQuestion` +
  câblage + renum.), `summaryManager.js` (flèches + délégation), `styles.css`,
  `summaryStyles.css`, `importGift.js` (dlog), `core.js` (0.15.0 → 0.16.0),
  `tests/testRunner.js` (+2 tests), `CHANGELOG.md`. **Nouveau** : `ROADMAP.md`.
- **Décisions techniques** :
  - Flèches plutôt que glisser-déposer : plus accessible pour un public non
    technicien, et testable sans simuler des événements drag.
  - `moveQuestion` exposée sur `window` et tolérante à l'absence de
    `summaryManager` (module périphérique non chargé en contexte de tests).
  - Médias inchangés par le déplacement (indexés par `dataset.id`, pas la
    position) — vérifié, pas de remap nécessaire.
- **En suspens / à valider** :
  - **Tests à exécuter au navigateur** (l'agent ne peut pas lancer de navigateur)
    : ouvrir `tests/tests.html` et vérifier 24 tests verts (22 + 2 déplacement),
    puis test manuel des flèches (question + sommaire).
  - Reste du ROADMAP à planifier session par session (priorité proposée :
    banque → sauvegarde → export PDF/RTF → Moodle XML → authentification).
  - Qualité différée : migration des `confirm()`/`alert()` bloquants (non urgent).
- **Tag Git proposé (non exécuté)** : `v0.16.0`.
- **Version** : 0.16.0 (MINOR — nouvelle fonctionnalité rétrocompatible).

---

## 2026-06-06 (suite) — Architecture & maintenabilité (0.14.0 → 0.14.3)

- **Objectif** : traiter les items restants de l'audit, à la demande de
  l'utilisateur (« on fait ce qu'il reste »), après revalidation des risques.
- **Releases publiées** :
  - **0.14.0** — [A2] orchestrateur d'init `window.APP_INIT` (les 6
    `DOMContentLoaded` de modules deviennent des fonctions empilées, exécutées
    par `core.js`) ; [A3] retrait des gardes `typeof … === 'function'`
    (`mediaManager` désormais chargé aussi par le harnais).
  - **0.14.1** — [A1] **achevé** : migration du gabarit `addNewQuestion` et de
    l'UI périphérique (`previewMode`, `summaryManager`, `mediaManager`) vers
    `IDS`.
  - **0.14.2** — [M3] découpe : `addNewQuestion` → `addDefaultOptions` +
    `wireQuestionEvents` ; `parseGiftQuestion` → `stripImportedPluginfileTags` +
    `associateZipMedia`.
  - **0.14.3** — [M2] **partiel** : copie presse-papier via
    `navigator.clipboard` (repli `execCommand`).
  - **0.15.0** — [M2] **achevé** : éditeur enrichi migré vers l'API
    Selection/Range (`rteApplyFormat` / `rteClearFormatting` /
    `rteIsFormatActive`), plus aucun `execCommand` de mise en forme ni
    `queryCommandState`. 4 tests RTE ajoutés. **Correctif outillage** :
    `.vscode/launch.json` pointe désormais sur les fichiers (clé `file`) au lieu
    d'un `localhost` inexistant → ouverture en navigateur externe sans serveur.
- **Décisions** :
  - [A2] via **patron d'enregistrement** plutôt qu'appels explicites : un module
    non chargé n'enregistre rien → le harnais de tests reste opérationnel sans
    l'UI périphérique, sans réintroduire de gardes défensives.
  - [M3] : le gabarit HTML de `addNewQuestion` reste un littéral assigné
    (responsabilité unique « markup ») — non extrait en sous-fonction.
  - [M2] : volet **RTE** (`execCommand` de mise en forme) **non migré** —
    gros, non testable sans navigateur, risque sur une fonctionnalité cœur ;
    conforme à l'horizon « 12 mois » de l'audit.
- **Validation** : suite `tests/tests.html` verte (22) à chaque étape +
  **tests manuels utilisateur** de l'UI périphérique (aide, résumé,
  prévisualisation, alerte non-sauvegardé, média) après [A2]/[A1 suite].
- **En suspens** : **aucun** — la totalité des 25 items de `AUDIT.md` est
  traitée. Reste recommandé hors audit : test manuel approfondi de l'éditeur
  enrichi (sélections partielles, formats imbriqués) suite à la migration [M2].
- **Version** : 0.15.0.

---

## 2026-06-06 — Application progressive du plan AUDIT.md (0.10.2 → 0.13.0)

- **Objectif** : traiter les items de `AUDIT.md`, en releases versionnées,
  validées par tests à chaque étape (« proposer → valider → appliquer →
  cocher »). Demande utilisateur : appliquer **tout** l'audit.
- **Releases publiées** :
  - **0.10.2** — [B1] BOM UTF-8 à l'export `.txt`/`.zip` + strip à l'import.
  - **0.10.3** — [B2] QRC `=texte` pour 100 % ; [B3] sélecteur de casse QRC
    conservé + tooltip (décision : ignoré à l'export, documenté).
  - **0.11.0** — [M1] **remonté en tête** : harnais de tests `tests/tests.html`
    + `tests/testRunner.js` (sans dépendance, lancé au navigateur). Exposition
    de `parseGiftContent` sur `window`.
  - **0.11.1** — [D3] fusion `updateWeightColor` ; [D2] boucle handlers ;
    [D4] `buildExportFilename` ; [D5] `console.log` derrière flag `DEBUG`.
  - **0.11.2** — [B4] poids négatif → `~%-X%` ; [B5] fractions `100/n` ;
    [P3] `autoAdjustWeights` via `Map`.
  - **0.11.3** — [D1] factorisation QCM+QCU (`addChoiceOption`), QRC laissée
    dédiée (décision validée).
  - **0.11.4** — [P2] `queueMicrotask` ; [P1] `renumberQuestions` sans écriture
    DOM inutile.
  - **0.11.5** — [S1][S2][S3] sécurité XSS : `sanitize.js` (`sanitizeRichHtml`),
    `setRichTextValue` assaini, sommaire en DOM-API, prévisualisation assainie.
  - **0.12.0 / 0.12.1** — [A1] `domIds.js` (objet `IDS`) + migration des
    **lectures d'id** des 4 fichiers cœur (gift, option, question, import).
  - **0.13.0** — [U1] toasts `notify.js` (tous les `alert()` applicatifs
    remplacés) ; [U2] overlay+spinner d'import ; [U3] préfixe de signe sur les
    pondérations.
- **Nouveaux fichiers** : `tests/tests.html`, `tests/testRunner.js`,
  `sanitize.js`, `domIds.js`, `notify.js`, `notifyStyles.css` (tous signalés et
  ajoutés à la table d'architecture de CLAUDE.md).
- **Tests** : suite passée de 0 à **22 tests** (fonctions pures + intégration
  génération/round-trip + XSS), verte à chaque release. Vérifiée par
  l'utilisateur au navigateur après chaque étape (l'agent ne peut pas exécuter
  de navigateur ; `jsdom` indisponible et interdit par la contrainte « pas de
  dépendance »).
- **Décisions** :
  - [M1] remonté avant les refactos pour servir de garde-fou (déviation
    assumée vs ordre de l'audit).
  - [D1] : QCM+QCU factorisés, QRC séparée (lisibilité > DRY ; gain réel
    ~40 lignes, pas les ~300 estimées).
  - [A1] : migration limitée aux **lectures** d'id des fichiers cœur (scope
    fidèle aux « 63 getElementById » de l'audit).
  - **[A2][A3] reportés** : la conversion des `DOMContentLoaded` touche 4
    fichiers UI non testés et déstabilise le harnais (garde
    `attachMediaToQuestion` ⇒ tests sans `mediaManager`). Risque jugé trop
    élevé sans test manuel approfondi → session dédiée.
- **En suspens (restant dans AUDIT.md)** :
  - **[A1] (suite)** : grand gabarit `innerHTML` de `addNewQuestion` (mints) +
    UI périphérique (help, preview, summary, media, tour).
  - **[A2][A3]** : orchestrateur central + retrait des gardes défensives.
  - **[M2]** : migration `document.execCommand` (planifier sur 12 mois).
  - **[M3]** : découpe de `parseGiftQuestion` / `addNewQuestion` (fonctions
    longues).
  - Tests à étoffer : round-trip complet par type, médias ZIP.
- **Tags Git proposés (non exécutés)** : `v0.10.2` `v0.10.3` `v0.11.0`
  `v0.11.1` `v0.11.2` `v0.11.3` `v0.11.4` `v0.11.5` `v0.12.0` `v0.12.1`
  `v0.13.0`.
- **Version** : 0.13.0.

---

## 2026-06-05 — Centralisation version + fix QCM 100 % + audit complet

- **Objectif** :
  1. Appliquer la centralisation `APP_VERSION` prévue dans CLAUDE.md §5.
  2. Corriger le bug du coefficient « 100 % » visible à l'import Moodle.
  3. Faire un audit transverse du projet (cohérence GIFT, DRY, architecture, XSS).
- **Fichiers modifiés** :
  - `core.js` : ajout `const APP_VERSION`, injection footer au DOMContentLoaded,
    bump de version `0.10.0` → `0.10.1`.
  - `index.html` : `<p>Version beta 10</p>` → `<p id="app-version"></p>`.
  - `giftGenerator.js` : `generateMCQuestionCode` génère `=texte` pour les
    options cochées à 100 %, et `~%X%texte` sans décimales superflues sinon.
  - `importGift.js` : `extractOptionsWithFeedback` accepte aussi les lignes
    `=` en contexte QCM ; `parseOptionWithFeedback` reconnaît `=texte` comme
    bonne réponse à 100 %. Garantit le round-trip pour les QCM mixant `=` et
    `~%-X%` (malus).
  - `CHANGELOG.md` : entrée `[0.10.1]`.
- **Décisions** :
  - Option « combiner A+B » choisie par l'utilisateur :
    syntaxe `=` pour 100 % **et** suppression des trailing zeros pour les
    autres poids. Conséquence connue : un QCM à 1 bonne réponse 100 % sera
    re-classifié QCU au ré-import (limitation inhérente du format GIFT —
    sémantiquement équivalent côté Moodle).
  - Audit livré sans modifications additionnelles : 4 axes couverts (GIFT,
    DRY, archi, XSS). Plan de release proposé : 0.10.2 (UTF-8 BOM), 0.10.3
    (QRC), 0.11.0 (refacto DRY), 0.11.x/0.12.0 (sécurité XSS).
- **En suspens** :
  - **0.10.2 urgent** : ajouter le BOM UTF-8 (`﻿`) dans `downloadManager.js`
    (lignes 46 et 111) — les fichiers téléchargés s'affichent avec accents
    cassés sur Notepad Windows et certains imports Moodle (cf. fichier
    `questions_gift_17336QCWB0126_Grandsire_20260605_153353.txt` fourni).
  - QRC : appliquer le même fix `=texte` pour 100 % qu'en QCM, et supprimer
    le `switch` trompeur sur la sensibilité à la casse
    (`giftGenerator.js:318-324`).
  - Voir les autres trouvailles de l'audit dans la conversation.
- **Version** : 0.10.1 (PATCH — correctif bug Moodle, pas de nouvelle
  fonctionnalité).

---

## 2026-06-05 — Mise en place de la documentation et du versionnage

- **Objectif** : doter le projet d'un contexte exploitable par Claude Code
  (CLAUDE.md, Spec.md), d'un système de versionnage et d'une journalisation.
- **Fichiers modifiés** : ajout de `CLAUDE.md`, `Spec.md`, `CHANGELOG.md`,
  `DEVLOG.md`. À venir : édition de `core.js` (constante `APP_VERSION`) et de
  `index.html` (injection dynamique de la version dans le footer).
- **Décisions** :
  - Versionnage SemVer, démarrage à `0.10.0` (= ancien « beta 10 », le `0.x`
    marquant le statut pré-stable).
  - Source de vérité unique de la version : `APP_VERSION` dans `core.js`.
  - Deux journaux séparés (CHANGELOG humain / DEVLOG de session) pour des
    lecteurs distincts.
- **En suspens** :
  - Appliquer concrètement la centralisation de la version dans `core.js` +
    injection footer (modification de code, à faire en session Claude Code).
  - Première vraie release à consigner quand une des fonctionnalités TODO
    (déplacer des questions, banques…) sera livrée.
- **Version** : 0.10.0 (formalisation de l'existant, pas de nouvelle fonctionnalité).
