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
