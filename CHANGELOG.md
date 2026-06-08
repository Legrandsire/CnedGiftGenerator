# Changelog

Toutes les modifications notables de ce projet sont consignées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et le projet adhère au [versionnage sémantique](https://semver.org/lang/fr/).

---

## [Non publié]

---

## [0.23.0] — 2026-06-07

### Ajouté
- **Mode hors-ligne** : l'outil fonctionne désormais **sans connexion Internet**,
  y compris en ouverture directe `file://`.
  - **JSZip hébergé en local** (`vendor/jszip.min.js`, version 3.10.1) au lieu du
    CDN cdnjs : plus aucune dépendance réseau à l'exécution. L'export ZIP est
    inchangé.
  - **Indicateur d'état réseau** discret en pied de page (« ● En ligne » turquoise /
    « ● Hors-ligne » gris), mis à jour en temps réel (`navigator.onLine` +
    événements `online`/`offline`).
  - Mention **« Fonctionne sans connexion »** ajoutée à l'aide (onglet Général).
- **Visite guidée refondue** — nouveau module dédié **`tourManager.js`** (+
  `tourStyles.css`) :
  - Parcours **complet** couvrant tout le flux actuel : métadonnées, import,
    banques de questions, ajout de question, type, éditeur enrichi, média,
    feedback combiné, sommaire, génération, **menus GIFT / Moodle / Document**,
    **onglets de sortie GIFT/XML**, prévisualisation, **Contact** et aide.
  - **Ouverture automatique des menus déroulants** pour les étapes dont la cible
    se trouve à l'intérieur (refermés au changement d'étape et en fin de visite).
- Le bouton **« Générer »** produit désormais **les deux formats d'un coup** :
  le code GIFT **et** le code Moodle XML (l'onglet « Code Moodle XML » est prêt
  sans cliquer « Générer & visualiser »).

### Modifié
- **Visite guidée plus robuste** (retours utilisateur) :
  - **Encadré précis** : défilement **instantané** + mesure différée (double
    `requestAnimationFrame`) au lieu d'un défilement animé qui faussait la mesure ;
    suppression de la transition géométrique de la surbrillance (plus de
    « traînage »). L'encadré se cale exactement sur la cible.
  - **Sortie automatique de la prévisualisation** au lancement de la visite (elle
    masque/transforme des éléments) → toutes les étapes fonctionnent, y compris
    quand des questions sont déjà créées ou importées.
  - **Repositionnement au défilement et au redimensionnement** (sans reconstruire
    l'infobulle).
  - Positionnement déjà fiabilisé : coordonnées viewport (`position: fixed`),
    **clamp sur les deux axes**, bascule de côté près des bords, infobulle
    **au-dessus** de la pile de boutons fixes (Aide / Prévisualiser / Contact).
- Visite guidée passée d'un dispositif **dupliqué** (`startGuidedTour` dans
  `helpManager.js` + `enhancedGuidedTour` orphelin) à un **module unique**
  explicatif. `helpManager.js` ne gère plus que le panneau d'aide et les tooltips.

### Corrigé
- **Import en mode prévisualisation** : importer un fichier GIFT/XML pendant que
  la prévisualisation est active affiche désormais **directement** le contenu en
  preview, au lieu de rendre les champs éditables sous l'habillage preview
  jusqu'à un rebascule manuel (`refreshPreviewMode()` ré-applique le rendu sans
  clignotement).
- **Nom de banque modifiable en prévisualisation** : le champ « Nom » des banques
  (existantes comme nouvelles) est désormais réellement non modifiable en preview —
  présenté comme un **texte statique** (ni bordure, ni fond, non focalisable via
  souris ou clavier : `readOnly` + `tabindex=-1` + `pointer-events:none`). Les
  boutons de création/repli de banque sont en outre masqués en preview.
- **Prévisualisation** : suppression de la petite **flèche « ↳ »** devant le
  feedback d'une réponse.

### Supprimé
- **`advancedTourFeatures.js`** (tour « démo » orphelin, jamais appelé) et ses
  démonstrations animées (saisie auto, faux clics).

---

## [0.22.1] — 2026-06-07

### Modifié
- **Prévisualisation épurée** (suite du chantier UI/UX n°10, retour utilisateur) :
  suppression de l'empilement de boîtes colorées imbriquées au profit de filets
  fins et d'espace.
  - **Réponses** sans encadré : marque ✓/✗ colorée (bleu/rouge) + texte, bonne
    réponse en gras bleu ; feedback d'option en retrait préfixé « ↳ », sans cadre.
  - **Filets de séparation** teintés selon la parité de la question (vert/rose) :
    fin entre réponses, plus marqué (2 px) avant les rétroactions.
  - **Énoncé** mis en valeur : police plus grande, fond très légèrement teinté
    selon la parité.
  - **Rétroaction générale / feedback combiné** : titre discret en capitales,
    sans fond ni boîte.
  - **Étiquette de type** en contraste inversé (fond clair vert/rose, texte foncé).
  - **Carte de question** quasi blanche, identité de parité portée par un fin
    accent latéral (au lieu d'un aplat de couleur).

---

## [0.22.0] — 2026-06-07

### Ajouté
- **Refonte UI/UX** — chantier ROADMAP n°10 (absorbe le n°9). Nouveaux modules
  `actionMenu.js` / `actionMenuStyles.css` et `bugReport.js` / `bugReportStyles.css`.
- **Mode prévisualisation** entièrement repensé : rendu plus **compact** et plus
  **contrasté** ; bonnes réponses en **bleu**, mauvaises en **rouge** (dégradés,
  bordures) ; le **feedback combiné** est désormais affiché en **lecture seule**
  et bien placé (il restait éditable et mal positionné) ; le **média** associé est
  affiché et l'affordance « Ajouter un média » est masquée.
- **Onglets de sortie** « Code GIFT » / « Code Moodle XML » sur une zone unique :
  nouveau bouton **« Générer & visualiser »** dans le menu Moodle pour afficher le
  code XML sans le télécharger.
- **Barre d'action** regroupée en **menus déroulants** par format (« GIFT ▾ »,
  « Moodle ▾ », « Document ▾ »), à côté du bouton primaire « Générer » et de
  « Tout effacer ».
- **Bouton « Contact »** (pile haut-droite) : formulaire modal (nom, prénom,
  adresse électronique, message) qui ouvre un courriel **pré-rempli** (expéditeur,
  message, version, navigateur) vers `vincent.grandsire@ac-cned.fr`. App 100 %
  statique → lien `mailto:`, sans backend ni service tiers (aucune donnée
  transmise hors du navigateur).
- **RTF plus lisible** : séparateurs de **natures différentes** — filet **double**
  turquoise + libellé pour les **banques**, filet sous le **titre** de question,
  filet **pointillé** entre les **composantes** (énoncé / réponses / rétroactions).
- **Renommage** de l'outil en **« CNED Quiz Builder »** (`<title>`, en-tête,
  texte d'introduction), reflétant la production de GIFT **et** de Moodle XML.
- **Favicon** : le logo CNED apparaît désormais dans l'onglet du navigateur.
- **Responsive** smartphone/tablette : barre d'action et menus en pile, en-tête,
  métadonnées, sommaire (défilement horizontal) et prévisualisation adaptés.

### Modifié
- **Pile de boutons haut-droite** : « Prévisualiser » passe en **largeur fixe** et
  se place **sous** « Aide » (plus de chevauchement ni de variation de largeur).
- **Notifications (toasts)** repositionnées **sous** la pile de boutons (elles la
  recouvraient).
- **Correctif chevauchement (chantier n°9)** : en prévisualisation, l'identifiant
  ne se superpose plus aux flèches ↑/↓ (placé dans l'en-tête, contrôles d'édition
  masqués).
- **Tour guidé** : l'étape « Copier/Télécharger » pointe désormais vers le menu
  « GIFT ».

### Tests
- +2 (séparateurs RTF : composante « Réponses », en-tête de banque) → **74**.

---

## [0.21.0] — 2026-06-07

### Ajouté
- **Banques de questions** (catégories Moodle `$CATEGORY`) — chantier ROADMAP
  n°2. Nouveau module `categoryManager.js` + `categoryStyles.css`. Permet de
  classer les questions en banques reproduisant les catégories de la banque de
  questions Moodle.
  - **Sections repliables** : chaque banque est une section `<details>` (badge
    `B<NN>`, nom éditable, compteur, actions « + question » / « Supprimer »),
    avec une zone **« Sans banque »** en tête. Boutons globaux **« 📚 Ajouter une
    banque »** et **« Tout replier/déplier »**. Même regroupement repliable dans
    le **sommaire** (en-têtes de groupe, état de repli persistant).
  - **Identifiant** : format `<code>[-B<NN>]-Q<NN>`. Le segment `-B<NN>`
    n'apparaît que pour une banque (numéro = ordre des banques, stable au
    renommage) ; la numérotation `Q<NN>` **repart à 01 dans chaque banque** (et
    dans la zone sans-banque). Une question hors banque garde l'ancien format
    `CODE-QNN` → fichiers existants inchangés. **Aperçu d'identifiant vivant**
    sous le champ : il s'adapte en direct au déplacement / changement de banque.
  - **Déplacement** : un sélecteur **« Banque »** par question déplace celle-ci
    entre banques ; les flèches ↑/↓ réordonnent **à l'intérieur** d'un groupe.
  - **GIFT** : émission d'une directive `$CATEGORY: $course$/<code>/<nom>` en
    tête de chaque banque ; reconnaissance à l'**import** (recréation des banques,
    jusqu'ici ignorée).
  - **Moodle XML** : entrées `<question type="category">` à l'export ; mapping
    inverse à l'import. Le **code article** est désormais embarqué en commentaire
    (`<!-- course-code: … -->`) et **rechargé à l'import XML** (champ « Code
    article »), là où l'XML n'a pas de champ natif.

### Modifié
- **Règle d'identifiant unifiée** : `computeFinalQuestionId`, jusqu'ici
  **dupliquée** (`giftGenerator.js` + `exportMoodleXml.js`) et consommée par
  `exportPrintable.js`, est désormais **centralisée** dans `categoryManager.js`
  (sensible à la banque). Les trois sorties (GIFT, XML, lisible) partagent la
  même règle.
- **Import (GIFT et XML)** : un identifiant **auto-généré** (`<code>[-B<NN>]-Q<NN>`)
  est désormais correctement reconnu et **laissé vide** → l'identifiant reste
  **recalculé dynamiquement** après import (au lieu d'être figé en « manuel »).

### Tests
- +9 tests (section 6) : identifiant `B<NN>` (pur), chemins de catégorie,
  hors-banque `CODE-QNN`, `$CATEGORY` GIFT, round-trip GIFT et XML des banques,
  rechargement du code article, distinction auto/manuel à l'import.

---

## [0.20.0] — 2026-06-07

### Ajouté
- **Export lisible** (nouveau module `exportPrintable.js` + `printStyles.css`),
  destiné à la **lecture/relecture humaine** (charte CNED), pas à Moodle.
  Chantier ROADMAP n°4. Trois sorties bâties sur une **source unique** :
  - **📄 PDF (impression)** : ouvre une fenêtre contenant un document mis en
    forme et déclenche l'impression — l'auteur choisit « Enregistrer au format
    PDF ». Les **images** sont embarquées en **base64 inline** pour survivre au
    document d'impression (les autres médias sont mentionnés en texte).
  - **🌐 HTML (.html)** : le **même document**, téléchargé en page **autonome**
    (CSS et images inlinées), lisible et ouvrable partout.
  - **📝 RTF (.rtf)** : document **éditable** dans Word/LibreOffice. Mise en
    forme : titre souligné d'un filet, **gras + couleur** pour les bonnes
    réponses, réponses indentées, et conversion du sous-ensemble RTE (gras,
    italique, exposant `\super`, indice `\sub`). Accents échappés en `\uN?`.
    **Images PNG/JPEG embarquées directement** (`\pict\pngblip`/`\jpegblip` en
    hexadécimal) → `.rtf` **autonome avec ses images** ; les autres médias
    (audio/vidéo/PDF, GIF/WebP/SVG) renvoient vers l'export ZIP/XML.
- **Contenu par type** : QCM/QCU (bonne(s) réponse(s) en évidence, poids si
  ≠ 100 %, feedback par option), QRC (réponses acceptées + sensibilité à la
  casse), Numérique (valeur ± marge), Vrai/Faux. Avec énoncé, rétroaction
  générale, feedback combiné et en-tête de métadonnées (auteur, code article,
  date, identifiants `CODE-QNN`).
- **Mise en page** : disposition **flex** des réponses (la coche reste alignée
  même quand le texte est un bloc `<p>`), contenu enveloppé en paragraphes
  (`formatBlock` = typographie CNED + `addHtmlTags`), blocs plus **compacts**,
  en-tête de question soulignée — en réponse aux retours de relecture.
- **Tests** : 16 nouveaux tests (section 5 du harnais) — `readQuestionState` par
  type, échappement RTF des accents/caractères de contrôle, gras des bonnes
  réponses, conversion RTE→RTF, **image embarquée RTF (`\pict`) et HTML
  (data-URL)**, structure HTML d'impression, non-régression GIFT/XML.

### Notes techniques
- **Aucune dépendance nouvelle** (contrainte CLAUDE.md §2) : pas de jsPDF, le PDF
  passe par `window.print()`.
- **Fonction partagée `readQuestionState()`** introduite pour lire l'état
  normalisé d'une question, consommée par l'export lisible **seul** ;
  `giftGenerator.js` et `exportMoodleXml.js` restent **intacts** (les exports
  GIFT et Moodle XML sont inchangés). L'unification des trois lecteurs de DOM est
  notée comme amélioration future.
- `printStyles.css` est la **source unique** des styles, scopée sous
  `.printable-doc` (sans effet sur l'app) ; `exportPrintable.js` l'inline dans le
  document généré via `document.styleSheets`, avec un fallback compact si la
  lecture des `cssRules` est bloquée (cas Chrome en `file://`).

---

## [0.19.0] — 2026-06-07

### Ajouté
- **Import Moodle XML** (nouveau module `importMoodleXml.js`) : pendant de
  l'export XML (0.18.0). Permet de **réimporter un `.xml` Moodle** pour le
  rééditer — seul moyen de **récupérer le feedback combiné** et l'`<usecase>`,
  que le GIFT ne sait pas transporter. Mapping inverse des **5 types** :
  - `multichoice` `single=false`/`true` → QCM / QCU (fractions → poids) ;
  - `truefalse` → Vrai/Faux ;
  - `shortanswer` (+ `<usecase>`) → QRC avec sélecteur de casse ;
  - `numerical` (+ `<tolerance>`) → Numérique avec marge ;
  - les 3 `…feedback` → les champs de feedback combiné repliables.
- **Médias embarqués en base64** dans l'export **et** l'import XML
  (chantier n°8) : un `.xml` désormais **autonome** (sans ZIP annexe). À
  l'export, chaque média est émis en `<file … encoding="base64">` **à l'intérieur
  de `<questiontext>`** (`path="/"`) avec le tag `@@PLUGINFILE@@` dans le texte ;
  à l'import, le base64 est décodé et le média réattaché via `mediaManager`.
- **Aiguillage de l'import** : le bouton « Importer » accepte aussi le `.xml`
  (`accept=".txt,.zip,.xml"`). L'aiguillage se fait par extension **et** par
  détection du contenu (racine `<quiz>`) — un `.txt` contenant en fait du XML est
  redirigé automatiquement.
- **Tests** : 11 nouveaux tests (export média base64, import des 5 types, feedback
  combiné restitué, `<usecase>`/`<tolerance>` restitués, type non géré ignoré,
  round-trip XML complet, réattachement média).

### Modifié
- `generateMoodleXmlCode([mediaBase64])` accepte un dictionnaire optionnel
  `{ idQuestion: base64 }` (rétrocompatible : omis → aucun média embarqué).
- `downloadAsMoodleXml()` devient asynchrone (pré-lecture des médias en base64).
  L'**avertissement « médias non inclus » est supprimé** ; un avertissement de
  **poids** le remplace au-delà d'un seuil indicatif (~10 Mo de médias, le base64
  ajoutant ~+33 %).

### Notes
- **Placement des médias dans Moodle** : en plaçant le `<file>` dans le champ
  `<questiontext>` (`path="/"`), Moodle range le fichier dans la *filearea* propre
  à la question — **aucun répertoire à choisir** à l'import, ce qui corrige les
  ambiguïtés rencontrées avec l'export ZIP.
- **Types non gérés** (essay, matching, cloze, description…) : **ignorés** avec un
  récapitulatif (import partiel non bloquant). Les marqueurs
  `<question type="category">` sont sautés silencieusement.
- **Sécurité** : tout HTML importé passe par `sanitizeRichHtml` (via
  `setRichTextValue`), comme l'import GIFT.
- **Export et import GIFT inchangés.**

---

## [0.18.0] — 2026-06-06

### Ajouté
- **Export Moodle XML** (nouveau module `exportMoodleXml.js`) : second format de
  sortie **en plus** de l'export GIFT (inchangé). Nouveau bouton
  « 🎓 Moodle XML (.xml) ». Couvre les **5 types** de questions :
  - QCM → `multichoice` (`single=false`), pondérations reprises telles quelles ;
  - QCU → `multichoice` (`single=true`) ;
  - Vrai/Faux → `truefalse` ;
  - QRC → `shortanswer` ;
  - Numérique → `numerical` (avec `<tolerance>`).
- **Feedback combiné** (la raison d'être de ce chantier — impossible en GIFT) :
  trois champs facultatifs **par QCM et QCU** (réponse *correcte* /
  *partiellement correcte* / *incorrecte*), exportés en `<correctfeedback>`,
  `<partiallycorrectfeedback>`, `<incorrectfeedback>`. Un encart dédié signale
  qu'ils ne valent **que pour l'export Moodle XML** (ignorés en GIFT). L'encart
  est **replié par défaut** (élément `<details>`, à déplier d'un clic) et adopte
  la **couleur de la question** (turquoise pour les impaires, rose pour les
  paires).
- **Sensibilité à la casse des QRC honorée en XML** via `<usecase>` — un gain
  par rapport au GIFT, où ce réglage reste sans effet (cf. [B3]).
- **Tests** : 12 nouveaux tests dédiés à la génération XML (mapping des types,
  fractions, feedback combiné présent/absent, feedback combiné ignoré en GIFT,
  encodage CDATA, échappement `&`/`<`/`>`, document bien formé).

### Modifié
- `buildExportFilename(extension, baseLabel)` accepte désormais un préfixe
  (rétrocompatible) : l'export XML produit `questions_moodle_…xml`.

### Notes
- **Encodage** : le HTML enrichi (énoncés, réponses, feedback) est encapsulé en
  `<![CDATA[…]]>` (comme l'export natif de Moodle) ; la séquence `]]>` est
  neutralisée. Les valeurs hors CDATA (noms, attributs) sont échappées en entités.
- **Médias** : non embarqués dans le `.xml` en V1 — un avertissement invite à
  utiliser l'export ZIP/GIFT pour conserver les images. Embarquement base64
  envisagé en V2.
- **Import XML** : hors périmètre (export seul).

---

## [0.17.0] — 2026-06-06

### Ajouté
- **Boîte de dialogue de confirmation non bloquante** : nouveau module
  `confirmDialog.js` (+ `confirmDialogStyles.css`) exposant
  `confirmDialog(options)` → `Promise<boolean>`, une fenêtre modale aux couleurs
  CNED (overlay, bouton « danger » rouge optionnel, fermeture par Échap/clic sur
  le fond, Entrée = confirmer). Remplace les `confirm()` bloquants du navigateur.

### Modifié
- **Migration des `confirm()` bloquants** vers la modale `confirmDialog` :
  - effacement de toutes les questions (`core.js`) ;
  - remplacement des questions à l'import (`importGift.js` ; `parseGiftContent`
    devient `async`, la confirmation a lieu avant l'overlay d'import).
- **Doublons d'options à la génération** (`giftGenerator.js`) : l'ancien
  `confirm()` « continuer quand même ? » est remplacé par un **avertissement non
  bloquant** (`notify.warning`). La génération **se poursuit désormais** (les
  doublons sont du GIFT valide et restent surlignés en rouge dans l'interface).
  - **Changement de comportement assumé** : auparavant la génération était
    interrompue si l'auteur cliquait « Annuler ». Ce point est justifié par le
    fait que `generateGIFTCode()` est appelée de façon synchrone par le
    téléchargement et l'import (qui lisent son résultat immédiatement) ; un
    blocage asynchrone y aurait été risqué. L'auteur reste averti et peut
    corriger puis régénérer.

### Supprimé
- Plus aucun `confirm()`/`alert()` bloquant dans le code applicatif (les
  `beforeunload` natifs de l'alerte « modifications non sauvegardées » sont
  conservés : ils relèvent du navigateur).

---

## [0.16.0] — 2026-06-06

### Ajouté
- **Déplacer les questions** : flèches ▲/▼ sur chaque question (à droite du
  titre) **et** dans le sommaire, pour réordonner la liste sans copier-coller.
  La renumérotation, l'alternance de couleurs et l'identifiant GIFT auto
  (`CODE-QNN`) suivent automatiquement le nouvel ordre ; les médias (indexés par
  l'id interne) ne sont pas affectés. Les flèches d'extrémité sont désactivées
  (`questionManager.js`, `summaryManager.js`, `styles.css`, `summaryStyles.css`).

### Corrigé
- **Import — log de débogage** : `dlog()` (`importGift.js`) s'appelait
  elle-même au lieu d'appeler `console.log`, provoquant une récursion infinie si
  le flag `DEBUG` était passé à `true`. Sans effet en production (`DEBUG = false`),
  mais bloquant pour tout mainteneur activant la trace de parsing.

### Tests
- 2 tests de déplacement (réordonnancement haut/bas + renumérotation ;
  désactivation des flèches aux extrémités).

### Documentation
- Nouveau `ROADMAP.md` : backlog détaillé des évolutions à venir (banque de
  questions, sauvegarde native, export PDF/RTF, export Moodle XML pour le
  feedback combiné, idée d'authentification) — compatibilité GIFT, approche et
  fichiers impactés pour chaque chantier.

---

## [0.15.0] — 2026-06-06

### Modifié
- **[M2] (achevé)** : l'éditeur de texte enrichi n'utilise plus
  `document.execCommand`. La mise en forme (gras, italique, souligné, exposant,
  indice) et l'effacement de format reposent désormais sur l'API
  `Selection`/`Range` (`rteApplyFormat`, `rteClearFormatting`,
  `rteIsFormatActive`) ; l'état actif de la barre d'outils n'utilise plus
  `queryCommandState` (`richTextEditor.js`). `execCommand` ne subsiste qu'en
  repli de la copie presse-papier (contexte non sécurisé).
  - **Note** : l'activation/désactivation d'un format opère sur la balise
    englobante de la sélection (cas d'usage : sélectionner le texte puis
    cliquer) ; appliquer un format sans sélection est sans effet.

### Tests
- 4 tests de l'éditeur enrichi (gras, bascule, effacement, détection d'état).

### Outillage
- `.vscode/launch.json` : configurations Chrome pointant directement sur les
  fichiers (`index.html`, `tests/tests.html`) plutôt que sur un `localhost`
  inexistant — F5 ouvre désormais l'app dans un navigateur externe sans serveur.

---

## [0.14.3] — 2026-06-06

### Modifié
- **[M2] (partiel)** : la copie du code GIFT utilise désormais l'API
  `navigator.clipboard.writeText()`, avec repli sur `document.execCommand('copy')`
  si l'API est indisponible (contexte non sécurisé) (`core.js`). La migration de
  l'éditeur enrichi (`execCommand` de mise en forme) reste un chantier dédié
  (horizon 12 mois, cf. AUDIT [M2]).

---

## [0.14.2] — 2026-06-06

### Modifié (refactorisation interne, sans changement de comportement)
- **[M3]** : découpe de fonctions trop longues.
  - `addNewQuestion` (`questionManager.js`) délègue désormais à
    `addDefaultOptions()` et `wireQuestionEvents()` ; elle se limite à
    l'orchestration (le gabarit HTML reste un littéral assigné, responsabilité
    unique « markup »).
  - `parseGiftQuestion` (`importGift.js`) délègue à `stripImportedPluginfileTags()`
    et `associateZipMedia()`.

---

## [0.14.1] — 2026-06-06

### Modifié (refactorisation interne, sans changement de comportement)
- **[A1] (achevé)** : migration vers `IDS` du grand gabarit `addNewQuestion`
  (création des champs, `questionManager.js`) et de l'UI périphérique
  (`previewMode.js`, `summaryManager.js`, `mediaManager.js`). Tous les
  identifiants DOM transverses passent désormais par `IDS` ; ne restent bruts
  que les `name=` de groupes radio et les identifiants strictement internes à
  `mediaManager` (`media-*`).

---

## [0.14.0] — 2026-06-06

### Modifié (architecture, sans changement de comportement)
- **[A2] Orchestrateur d'initialisation** : remplacement des 6 écouteurs
  `DOMContentLoaded` autonomes (import, download, help, summary, preview,
  unsaved) par un patron d'enregistrement `window.APP_INIT` ; `core.js` exécute
  la file dans l'ordre de chargement après son propre setup. Bénéfice : ordre
  d'init garanti et explicite ; un module non chargé n'enregistre rien (le
  harnais de tests reste opérationnel sans l'UI périphérique).
- **[A3] Retrait des vérifications défensives d'ordre** : suppression des
  `typeof X === 'function'` devenus inutiles (`generateGIFTCode`,
  `attachMediaToQuestion`, `cleanupMediaForQuestion`, `getMediaList`,
  `getPluginfileTag`, `sanitizeRichHtml`). `mediaManager.js` est désormais aussi
  chargé par le harnais de tests pour refléter la configuration réelle.

---

## [0.13.0] — 2026-06-06

### Ajouté
- **[U1] Notifications toast** : nouveau module `notify.js` (+ `notifyStyles.css`)
  fournissant `notify.success/info/warning/error`, des notifications
  non bloquantes en coin d'écran à disparition automatique, aux couleurs CNED.
  Tous les `alert()` du code applicatif sont remplacés (les `confirm()`, qui
  exigent une réponse, restent inchangés).
- **[U2] Indicateur d'import** : overlay semi-transparent + spinner pendant le
  parsing GIFT (CSS sur `body.importing`, classe déjà posée par l'import).

### Modifié
- **[U3] Accessibilité** : les pondérations positives affichent désormais un
  préfixe « + » dans le sélecteur (les négatives portant déjà « - »), pour ne
  plus dépendre uniquement de la couleur (daltonisme) (`optionManager.js`).

---

## [0.12.1] — 2026-06-06

### Modifié (refactorisation interne, sans changement de comportement)
- **[A1]** : migration vers `IDS` des fichiers cœur restants —
  `optionManager.js`, `questionManager.js`, `importGift.js`. Toutes les
  **lectures** d'identifiants (`getElementById` / `getRichTextValue` /
  `setRichTextValue`) passent désormais par `IDS`, ainsi que les principaux
  gabarits de création d'`optionManager`. Restent à migrer (suite) : le grand
  gabarit `innerHTML` de `addNewQuestion` (création des champs) et l'UI
  périphérique (help, preview, summary, media…), prévus pour une session dédiée.

---

## [0.12.0] — 2026-06-06

### Ajouté
- **[A1] `domIds.js`** : module centralisant la construction des identifiants
  DOM (objet `IDS` de fonctions `(qid[, oid]) => '…'`). Objectif : renommer un
  préfixe en un seul endroit au lieu de risquer de casser silencieusement
  plusieurs fichiers.

### Modifié (refactorisation interne, sans changement de comportement)
- **[A1]** : migration de `giftGenerator.js` vers `IDS` (17 identifiants),
  premier fichier d'une migration progressive fichier par fichier (méthode
  recommandée par l'audit). Les fichiers cœur restants (`optionManager`,
  `questionManager`, `importGift`) suivront ; l'UI périphérique est laissée pour
  une session dédiée.

---

## [0.11.5] — 2026-06-06

### Sécurité
- **XSS [S1][S2][S3]** : nouveau module `sanitize.js` exposant
  `sanitizeRichHtml()` (liste blanche stricte de balises de mise en forme,
  suppression de tous les attributs et des balises dangereuses
  `script/style/iframe/object/embed`).
  - **[S1]** : `setRichTextValue` assainit désormais le HTML avant insertion,
    neutralisant les fichiers GIFT piégés à l'import (`richTextEditor.js`).
  - **[S2]** : la ligne du sommaire est construite en DOM-API ; l'identifiant
    et le texte de question sont injectés via `textContent` et ne peuvent plus
    exécuter de HTML/JS (`summaryManager.js`).
  - **[S3]** : la prévisualisation passe tout contenu utilisateur par
    `sanitizeRichHtml()` avant `innerHTML` (`previewMode.js`).

### Tests
- 5 tests unitaires de `sanitizeRichHtml` (formatage conservé, `<script>`,
  `<img onerror>`, attributs `on*`, liens `javascript:`).

---

## [0.11.4] — 2026-06-06

### Modifié (performance, sans changement de comportement)
- **[P2]** : les `setTimeout(…, 0)` de séquencement dans `addChoiceOption`
  (réajustement des poids, détection de doublons après ajout/suppression)
  remplacés par `queueMicrotask`, plus précis et exécuté avant le rendu
  (`optionManager.js`). Le debounce de saisie (300 ms) reste un `setTimeout`.
- **[P1]** : `renumberQuestions` n'écrit plus dans le DOM que lorsque le titre
  ou la classe d'alternance change réellement, évitant des reflows inutiles à
  chaque ajout/suppression de question (`questionManager.js`).

---

## [0.11.3] — 2026-06-06

### Modifié (refactorisation interne, sans changement de comportement)
- **[D1]** : factorisation des options à choix. QCM et QCU passent par une
  fonction partagée `addChoiceOption(qid, listEl, config)` pilotée par une
  configuration (`MC_OPTION_CONFIG` / `SC_OPTION_CONFIG`) ; `addOption` et
  `addSCOption` deviennent de simples wrappers. La QRC (`addSAOption`),
  structurellement différente (champ texte simple, pas de RTE ni de feedback),
  reste une fonction dédiée — choix validé pour préserver la lisibilité
  (`optionManager.js`).

### Tests
- Ajout d'un test de génération QCU (couvre le chemin factorisé [D1]).

---

## [0.11.2] — 2026-06-06

### Corrigé
- **QCM [B4]** : un poids non nul fixé sur une option **non cochée** (ex. malus
  −50 %) était silencieusement ignoré (`~texte`). Le générateur produit
  désormais `~%X%texte` pour respecter le poids saisi (`giftGenerator.js`).
- **Import [B5]** : les pondérations fractionnaires sont reconnues
  automatiquement comme fractions `1/n` (calcul `100/n`), quelle que soit la
  précision exportée par Moodle, au lieu d'une liste de valeurs figée
  (`importGift.js`).

### Modifié (refactorisation interne)
- **[P3]** : `autoAdjustWeights` remplace son `switch` à neuf branches par un
  `Map` de valeurs canoniques + calcul direct `(100/n)` (`optionManager.js`).

### Tests
- Ajout d'un test couvrant [B4] (poids négatif sur option non cochée).

---

## [0.11.1] — 2026-06-05

### Modifié (refactorisations internes, sans changement de comportement)
- **[D3]** : fusion de `updateWeightColor` et `updateSAWeightColor` en une seule
  fonction acceptant indifféremment un `<select>` ou un `<input>`
  (`optionManager.js`, appels mis à jour dans `importGift.js`).
- **[D2]** : `setupQuestionTypeHandlers` réécrit en une boucle sur les cinq
  types au lieu de cinq écouteurs dupliqués (`questionManager.js`).
- **[D4]** : extraction de `buildExportFilename(extension)`, partagée par les
  téléchargements `.txt` et `.zip` (`downloadManager.js`).
- **[D5]** : les logs de débogage de l'import sont désormais désactivés par
  défaut (flag `DEBUG` + helper `dlog`), au lieu d'être imprimés en console à
  chaque import (`importGift.js`).

> Filet de sécurité : la suite de tests `tests/tests.html` reste verte après
> ces refactos.

---

## [0.11.0] — 2026-06-05

### Ajouté
- **Suite de tests [M1]** : premier harnais de tests automatisés, sans
  dépendance ni build, dans le dossier `tests/`. Ouvrir `tests/tests.html`
  dans un navigateur exécute la suite et affiche un rapport (réussites /
  échecs / ignorés). Couverture initiale : fonctions pures (typographie,
  balises HTML, en-tête GIFT) et tests d'intégration (génération QCM/QRC/
  Vrai-Faux/numérique, métadonnées, round-trip QRC).
  - **Note d'ordonnancement** : [M1] a été remonté avant les refactorings
    DRY/architecture (initialement prévu en 0.13.0) afin de servir de
    garde-fou anti-régression pendant ces refactos.

### Modifié
- **Import GIFT** : le point d'entrée `parseGiftContent` est désormais exposé
  sur `window` (auparavant prisonnier de la closure `DOMContentLoaded`). Permet
  aux tests d'invoquer l'import directement et prépare le futur orchestrateur
  central (cf. [A2]). Aucun changement de comportement (`importGift.js`).

---

## [0.10.3] — 2026-06-05

### Corrigé
- **QRC [B2]** : la bonne réponse à 100 % était générée en `=%100%texte`, ce qui
  reproduisait le défaut d'affichage « 100 % » déjà corrigé pour les QCM en
  0.10.1. Le générateur produit désormais la syntaxe canonique `=texte` pour
  100 %, et `=%X%texte` sans décimales superflues pour les pondérations
  partielles (`giftGenerator.js`). Le round-trip est préservé (l'importeur
  reconnaissait déjà les deux formes).

### Modifié
- **QRC [B3]** : le sélecteur de sensibilité à la casse n'a aucun effet (le
  format GIFT standard ne gère pas la casse pour les réponses courtes). Ses
  trois branches identiques dans le générateur sont consolidées en une seule,
  et un tooltip explicite est ajouté sur le `<select>` pour informer l'auteur
  que le choix est conservé pour mémoire mais ignoré à l'export
  (`giftGenerator.js`, `optionManager.js`).

---

## [0.10.2] — 2026-06-05

### Corrigé
- **Téléchargements [B1]** : ajout d'un BOM UTF-8 en tête des fichiers `.txt`
  exportés (téléchargement direct **et** fichier contenu dans le `.zip`). Sans
  ce marqueur, Notepad/Windows et certains imports Moodle configurés en
  Windows-1252 affichaient les accents cassés (`MÃ©tadonnÃ©es` au lieu de
  `Métadonnées`) (`downloadManager.js`).
- **Import GIFT [B1]** : un éventuel BOM UTF-8 en tête de fichier est désormais
  retiré au parsing (`parseGiftContent`), pour les deux chemins `.txt` et
  `.zip`, évitant de polluer la première ligne de métadonnées (`importGift.js`).

---

## [0.10.1] — 2026-06-05

### Corrigé
- **QCM** : la bonne réponse à 100 % était générée en `~%100.00000%texte`,
  ce qui faisait apparaître le coefficient « 100 % » à côté de la réponse
  lors de l'import dans Moodle. Le générateur produit désormais la syntaxe
  canonique `=texte` pour les options cochées à 100 %, et `~%X%texte` sans
  décimales superflues pour les pondérations partielles ou négatives
  (`giftGenerator.js`).
- **Import GIFT** : l'importeur QCM ne reconnaissait que les lignes `~`. Il
  accepte désormais aussi les lignes `=` (bonne réponse à 100 %), ce qui
  garantit le round-trip pour les QCM mixant `=` et `~%-X%` (malus)
  (`importGift.js`).

---

## [0.10.0] — 2026-06-05

### Ajouté (formalisation de l'existant)
- Mise en place du système de versionnage SemVer (`APP_VERSION` dans `core.js`).
- Documentation projet : `CLAUDE.md`, `Spec.md`.
- Journaux : `CHANGELOG.md`, `DEVLOG.md`.

### Modifié
- La version affichée dans le pied de page est désormais injectée
  dynamiquement depuis `APP_VERSION` (fin de la saisie en dur).

---

## [0.10.0 — état initial] — antérieur

> Reprise de l'historique : cette version correspond à l'ancien « beta 10 ».
> Les versions antérieures n'étaient pas formellement consignées.

### Présent à cette version
- Cinq types de questions : QCM, QCU, Vrai/Faux, réponse courte, numérique.
- Éditeur de texte enrichi par champ.
- Gestion d'un média par question + export ZIP (`@@PLUGINFILE@@`).
- Import `.txt` et `.zip` avec validation du format GIFT.
- Application automatique des espaces insécables (typographie CNED).
- Panneau d'aide, tooltips, tour guidé.
- Résumé des questions et navigation.
- Mode prévisualisation.
- Détection des doublons d'options.
- Alerte sur modifications non sauvegardées.

---

<!--
GABARIT pour une nouvelle version (à copier au-dessus) :

## [X.Y.Z] — AAAA-MM-JJ
### Ajouté
### Modifié
### Corrigé
### Supprimé
-->
