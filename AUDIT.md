# AUDIT — Générateur de code GIFT

> **Date** : 2026-06-05
> **Version auditée** : 0.10.1
> **Périmètre** : audit transverse (cohérence GIFT, qualité, architecture,
> sécurité, performance, UX).
> **Statut** : référence pérenne — à mettre à jour à mesure que les items
> sont traités. Cocher les cases au fur et à mesure.

---

## Sommaire

1. [Bugs à corriger](#1-bugs-à-corriger) — par sévérité décroissante
2. [Duplications & DRY](#2-duplications--dry)
3. [Architecture & couplages](#3-architecture--couplages)
4. [Sécurité XSS](#4-sécurité-xss)
5. [Performance](#5-performance)
6. [UX & accessibilité](#6-ux--accessibilité)
7. [Maintenabilité & tests](#7-maintenabilité--tests)
8. [Plan de release proposé](#8-plan-de-release-proposé)

---

## 1. Bugs à corriger

### 🔴 [B1] Téléchargements UTF-8 sans BOM — accents cassés sous Windows

- [x] **Fait** — release 0.10.2
- **Fichier** : [downloadManager.js:111](downloadManager.js#L111) et [downloadManager.js:46](downloadManager.js#L46)
- **Symptôme** : le fichier `.txt` téléchargé affiche `MÃ©tadonnÃ©es` au lieu
  de `Métadonnées` quand il est ouvert dans Notepad Windows, ou ré-importé
  dans certains LMS configurés en Windows-1252.
- **Cause** : le `Blob` est créé en UTF-8 sans byte-order-mark (BOM). Beaucoup
  d'outils Windows ne détectent pas l'UTF-8 sans BOM et retombent sur
  Windows-1252.
- **Fix** :
  ```js
  // Avant
  const blob = new Blob([giftContent], { type: 'text/plain;charset=utf-8' });
  // Après
  const blob = new Blob(['﻿' + giftContent], { type: 'text/plain;charset=utf-8' });
  ```
  Faire de même pour le contenu écrit dans le ZIP ([downloadManager.js:46](downloadManager.js#L46)).
  Côté import, gérer le BOM en le strippant : `giftContent.replace(/^﻿/, '')`.
- **Sévérité** : haute (visible utilisateur final)
- **Release cible** : 0.10.2

---

### 🟡 [B2] QRC : `=%100%texte` reproduit le bug du QCM (100 % visible)

- [x] **Fait** — release 0.10.3
- **Fichier** : [giftGenerator.js:312](giftGenerator.js#L312)
- **Symptôme** : à terme, Moodle affichera probablement aussi « 100% » à côté
  des réponses QRC, comme c'était le cas pour les QCM avant le fix 0.10.1.
- **Fix** : appliquer la même logique qu'en QCM. Si `weight === 100`, générer
  `=texte` ; sinon `=%X%texte` sans trailing zeros.
- **Sévérité** : moyenne
- **Release cible** : 0.10.3

---

### 🟡 [B3] QRC : le sélecteur de sensibilité à la casse ne fait rien

- [x] **Fait** — release 0.10.3 (décision CNED : conserver + documenter via tooltip)
- **Fichier** : [giftGenerator.js:318-324](giftGenerator.js#L318-L324)
- **Symptôme** : les 3 branches du `if/else if/else` (sensible / insensible
  / par défaut) génèrent **exactement le même code**.
  ```js
  if (caseType === 'case_sensitive')   { giftCode += `\n${prefix}${formattedOptionText}`; }
  else if (caseType === 'case_insensitive') { giftCode += `\n${prefix}${formattedOptionText}`; }
  else { giftCode += `\n${prefix}${formattedOptionText}`; }
  ```
  Le sélecteur dans l'UI est trompeur pour l'auteur.
- **Cause** : le format GIFT standard n'a pas de syntaxe native pour la
  sensibilité à la casse en QRC. Soit on retire le sélecteur, soit on
  documente que c'est ignoré, soit on émet un commentaire GIFT.
- **Fix proposé** : retirer le sélecteur de l'UI et la branche dans le
  générateur, OU le conserver et générer un préfixe non standard accepté
  par Moodle si l'utilisateur en a besoin (à confirmer côté CNED).
- **Sévérité** : moyenne (fonctionnalité fantôme)
- **Release cible** : 0.10.3

---

### 🟢 [B4] QCM : poids négatif sur option non cochée silencieusement ignoré

- [x] **Fait** — release 0.11.2 (option retenue : générer `~%-X%texte`)
- **Fichier** : [giftGenerator.js:229-231](giftGenerator.js#L229-L231)
- **Symptôme** : si l'auteur sélectionne un poids négatif (ex. -50 %) sur une
  option **non cochée**, le générateur émet `~texte` sans le malus. L'UI
  laisse pourtant l'auteur modifier ce poids.
- **Fix proposé** :
  - Soit générer `~%-X%texte` quand poids ≠ 0 et option non cochée (respecte
    le choix utilisateur).
  - Soit désactiver le sélecteur de poids quand la case n'est pas cochée
    (UI plus claire).
- **Sévérité** : faible (cas limite)
- **Release cible** : 0.11.0

---

### 🟢 [B5] Import : liste hardcodée de valeurs fractionnaires fragile

- [x] **Fait** — release 0.11.2
- **Fichier** : [importGift.js:615-623](importGift.js#L615-L623)
- **Symptôme** : la liste `[83.33333, 66.66667, ...]` est utilisée pour
  recoller les pondérations importées sur les options du `<select>`. Si
  Moodle exporte avec une précision différente (ex. `0.33333` ou
  `33.333333`), le matching échoue et la valeur "la plus proche" est
  utilisée (logique de fallback déjà présente, mais imprécise).
- **Fix proposé** : remplacer la liste par un calcul `100/n` pour
  reconnaître automatiquement n'importe quelle fraction `1/n`.
- **Sévérité** : faible
- **Release cible** : 0.11.0

---

## 2. Duplications & DRY

### [D1] Trois fonctions `addOption*` quasi identiques

- [x] **Fait** — release 0.11.3 (QCM+QCU factorisés via `addChoiceOption` ;
  QRC laissée dédiée, choix validé pour la lisibilité — gain réel ~40 lignes,
  pas les ~300 estimées car les trois fonctions sont moins similaires qu'attendu)
- **Fichiers** : [optionManager.js:2-142](optionManager.js#L2) (`addOption`),
  [optionManager.js:161-206](optionManager.js#L161) (`addSCOption`),
  [optionManager.js:209-246](optionManager.js#L209) (`addSAOption`)
- **Reco** : factoriser en `addOption(type, qid, listEl)` paramétré par
  type. Extraire les différences (input radio/checkbox, présence du
  sélecteur de poids, sélecteur de casse pour QRC) dans une config.
- **Effort** : ~2 h
- **Bénéfice** : ~300 lignes en moins, ajouts/modifs futurs en un seul
  endroit.

### [D2] `setupQuestionTypeHandlers` = 5 listeners identiques

- [x] **Fait** — release 0.11.1
- **Fichier** : [questionManager.js:196-258](questionManager.js#L196)
- **Reco** :
  ```js
  const TYPES = ['mc', 'sc', 'tf', 'sa', 'num'];
  TYPES.forEach(type => {
    document.getElementById(`${type}-type-${qid}`).addEventListener('change', e => {
      if (!e.target.checked) return;
      TYPES.forEach(t => document.getElementById(`${t}-options-${qid}`)
        .classList.toggle('hidden', t !== type));
    });
  });
  ```
- **Effort** : ~30 min
- **Bénéfice** : ~50 lignes en moins.

### [D3] `updateWeightColor` vs `updateSAWeightColor`

- [x] **Fait** — release 0.11.1
- **Fichiers** : [optionManager.js:145-158](optionManager.js#L145) et
  [optionManager.js:249-262](optionManager.js#L249)
- **Reco** : fusionner en une seule fonction qui accepte n'importe quel
  élément avec `.value`.
- **Effort** : ~10 min

### [D4] Deux blocs de "build filename" presque identiques

- [x] **Fait** — release 0.11.1
- **Fichier** : [downloadManager.js](downloadManager.js) — `downloadAsZip`
  (lignes 1-70) et le handler du bouton txt (lignes 72-153) construisent
  le nom de fichier de la même manière.
- **Reco** : extraire `buildExportFilename(extension)` partagé.
- **Effort** : ~20 min

### [D5] ~30+ `console.log` de débogage

- [x] **Fait** — release 0.11.1
- **Fichier principal** : [importGift.js](importGift.js) (la plupart)
- **Reco** : supprimer ou les passer derrière un flag `DEBUG = false`.
- **Effort** : ~15 min

---

## 3. Architecture & couplages

### [A1] Centraliser la construction des sélecteurs DOM

- [x] **Fait** — `domIds.js` créé. Fichiers cœur migrés : `giftGenerator`
  (0.12.0), `optionManager` / `questionManager` / `importGift` (0.12.1).
  Gabarit `addNewQuestion` + UI périphérique (`previewMode`, `summaryManager`,
  `mediaManager`) migrés (0.14.1). Restent bruts (volontairement) : les `name=`
  de groupes radio et les identifiants internes à `mediaManager` (`media-*`).
- **Constat** : 63 occurrences de `getElementById(\`...-${questionId}-...\`)`
  réparties sur 7 fichiers. Renommer un préfixe (ex. `option-text-` →
  `mc-option-text-`) casse silencieusement plusieurs fichiers.
- **Reco** : créer `domIds.js` avec un objet `IDS` :
  ```js
  window.IDS = {
    questionText  : (qid)      => `question-text-${qid}`,
    optionText    : (qid, oid) => `option-text-${qid}-${oid}`,
    optionWeight  : (qid, oid) => `option-weight-${qid}-${oid}`,
    optionFeedback: (qid, oid) => `option-feedback-${qid}-${oid}`,
    scOptionText  : (qid, oid) => `sc-option-text-${qid}-${oid}`,
    // … etc.
  };
  ```
  Puis remplacer dans tout le projet : `IDS.optionText(qid, oid)`.
- **Effort** : ~3 h (par étapes : créer le module, migrer un fichier, valider,
  enchaîner)

### [A2] Centraliser les `DOMContentLoaded`

- [x] **Fait** — release 0.14.0 (patron d'enregistrement `window.APP_INIT`
  exécuté par `core.js`)
- **Constat** : 6+ fichiers ont leur propre `DOMContentLoaded`. L'ordre
  d'exécution n'est pas garanti, d'où les `typeof X === 'function'` defensive.
- **Reco** : un seul écouteur dans `core.js` qui appelle explicitement
  `initImport()`, `initDownload()`, `initHelp()`, etc. Chaque module
  exporte sa fonction `init()` via `window`.
- **Effort** : ~1 h

### [A3] Defensive coding révélateur d'un ordre fragile

- [x] **Fait** — release 0.14.0 (gardes `typeof … === 'function'` retirées,
  ordre garanti par l'orchestrateur `APP_INIT`)
- **Exemples** :
  - [questionManager.js:132](questionManager.js#L132) : `if (typeof attachMediaToQuestion === 'function')`
  - [downloadManager.js:5-12](downloadManager.js#L5-L12) : `typeof generateGIFTCode === 'function' ? ... : window.generateGIFTCode === 'function' ? ...`
- **Reco** : si A2 est fait, ces vérifications disparaissent (l'ordre est
  garanti). En attendant, documenter l'ordre dans `index.html`.

---

## 4. Sécurité XSS

> Sévérité globale : **moyenne** — contexte interne CNED, mais un auteur
> partagerait un `.gift` piégé. Mitigation centralisée recommandée.

### [S1] Import GIFT sans assainissement HTML

- [x] **Fait** — release 0.11.5 (`sanitize.js` + `setRichTextValue` assaini)
- **Fichier** : [richTextEditor.js:146](richTextEditor.js#L146)
  (`setRichTextValue`)
- **Scénario** : un `.gift` contient `<img src=x onerror="alert(1)">` dans
  le texte d'une question → exécution à l'import.
- **Fix** : créer `sanitizeRichHtml(html)` qui ne garde qu'une whitelist :
  `p, br, b, i, u, sup, sub, span` ; strip tous les attributs `on*`, les
  balises `script/style/iframe/object/embed`, et les `javascript:` dans
  les `href/src`. À appliquer dans `setRichTextValue` et en prévisualisation.
- **Effort** : ~2 h (implémentation + tests)

### [S2] Identifiant de question injecté en innerHTML

- [x] **Fait** — release 0.11.5 (ligne de sommaire en DOM-API + textContent)
- **Fichier** : [summaryManager.js:163](summaryManager.js#L163)
- **Scénario** : l'utilisateur saisit `<img src=x onerror=...>` dans le
  champ identifiant → exécution à chaque rafraîchissement du sommaire.
- **Fix immédiat** : utiliser `textContent` pour `questionIdValue` au lieu
  de l'interpoler dans `innerHTML`. Construire la cellule en DOM-API plutôt
  qu'en string.

### [S3] Prévisualisation injecte le HTML utilisateur

- [x] **Fait** — release 0.11.5 (`sanitizeRichHtml()` avant chaque innerHTML)
- **Fichier** : [previewMode.js:314, 403, 421, 463, 473](previewMode.js#L314)
- **Fix** : utiliser `sanitizeRichHtml()` (cf. [S1]) avant chaque
  `innerHTML = userContent`.

---

## 5. Performance

### [P1] `renumberQuestions` est O(n) à chaque ajout/suppression

- [x] **Fait (mitigation)** — release 0.11.4. La renumérotation reste O(n)
  (inhérent à une numérotation séquentielle après suppression), mais n'écrit
  plus dans le DOM que si la valeur change réellement (évite les reflows). La
  virtualisation/lazy n'a pas été retenue : sur-ingénierie pour < 50 questions.
- **Fichier** : [questionManager.js:274-291](questionManager.js#L274)
- **Constat** : appelé après chaque ajout. Pour 100+ questions, devient
  perceptible.
- **Reco** : ne renuméroter qu'à partir de l'index modifié, ou seulement
  les visibles dans le viewport (lazy). Non bloquant tant que les fichiers
  restent petits (< 50 questions).

### [P2] `setTimeout(..., 0)` indique un séquencement fragile

- [x] **Fait** — release 0.11.4 (passés en `queueMicrotask` ; les occurrences
  des anciens `addSCOption`/`addSAOption` ont disparu avec la factorisation [D1])
- **Fichiers** : [optionManager.js:125, 126, 141, 189, 205](optionManager.js#L125)
- **Reco** : utiliser `queueMicrotask()` (plus précis) ou réorganiser le
  code pour ne plus dépendre du yielding.

### [P3] `autoAdjustWeights` : switch hardcodé

- [x] **Fait** — release 0.11.2
- **Fichier** : [optionManager.js:289-320](optionManager.js#L289)
- **Reco** : remplacer le `switch` par un mapping `Map` + calcul direct
  `(100/n).toFixed(5)` pour les cas par défaut.

---

## 6. UX & accessibilité

### [U1] Remplacer les `alert()` par des toasts non-bloquants

- [x] **Fait** — release 0.13.0 (`notify.js` ; tous les `alert()` applicatifs
  remplacés, `confirm()` conservés)
- **Constat** : 15+ `alert()` éparpillés. Bloque l'utilisateur, expérience
  datée.
- **Reco** : créer un module `notify.js` avec `notify.error()`, `notify.info()`,
  `notify.success()`. Affichage en coin d'écran avec auto-dismiss.

### [U2] Pas d'indicateur visuel pour l'import en cours

- [x] **Fait** — release 0.13.0 (overlay + spinner CSS sur `body.importing`)
- **Constat** : `document.body.classList.add('importing')` ajoute une classe
  mais aucun CSS n'est défini pour signaler visuellement l'attente.
- **Reco** : ajouter un spinner ou une overlay semi-transparente pendant
  l'import.

### [U3] Couleur seule pour signaler la pondération

- [x] **Fait** — release 0.13.0 (préfixe « + » / « - » dans le sélecteur)
- **Constat** : les classes `positive-weight-bg` / `negative-weight-bg`
  utilisent uniquement la couleur (vert/rouge) pour signaler le signe.
- **Reco** : ajouter un préfixe `+` / `−` dans le `<option>` pour
  accessibilité (daltonisme).

---

## 7. Maintenabilité & tests

### [M1] Aucun test automatisé

- [x] **Fait (v1)** — release 0.11.0 (remonté avant les refactos comme
  garde-fou). Harnais `tests/tests.html` + `tests/testRunner.js`. Fonctions
  pures vérifiées ; tests d'intégration à lancer en navigateur. À étoffer :
  round-trip complet par type, médias ZIP.
- **Reco** : créer `tests.html` qui charge tous les scripts et exécute des
  assertions vanilla JS. Périmètre prioritaire :
  - **Round-trip GIFT** : générer chaque type de question, re-importer,
    vérifier que la structure DOM est équivalente.
  - **Métadonnées** : auteur + code article → export → re-import.
  - **Médias ZIP** : attacher un média, exporter ZIP, ré-importer, vérifier
    l'association.
- **Effort initial** : ~4 h pour 10 tests de base.
- **Bénéfice** : éviter les régressions silencieuses sur la chaîne
  import/export (où les bugs sont les plus coûteux).

### [M2] `document.execCommand` est déprécié

- [x] **Fait** — presse-papier migré vers `navigator.clipboard` (0.14.3) ;
  éditeur enrichi migré vers l'API Selection/Range (0.15.0, `rteApplyFormat` /
  `rteClearFormatting` / `rteIsFormatActive`, sans `queryCommandState`).
  `execCommand` ne subsiste qu'en repli de copie. 4 tests RTE ajoutés.
- **Fichier** : [richTextEditor.js:71, 84-85](richTextEditor.js#L71)
- **Constat** : `document.execCommand` est marqué comme obsolète depuis
  2022. Aucune date d'arrêt annoncée, mais à terme cassera.
- **Reco** : prévoir une migration vers l'API Selection moderne (sans
  changer d'éditeur). Pas urgent — à planifier sur 12 mois.

### [M3] Noms de fonctions parfois trop longs / responsabilités multiples

- [x] **Fait** — release 0.14.2 (`addNewQuestion` → `addDefaultOptions` +
  `wireQuestionEvents` ; `parseGiftQuestion` → `stripImportedPluginfileTags` +
  `associateZipMedia`)
- **Exemples** :
  - `parseGiftQuestion` ([importGift.js:703-791](importGift.js#L703)) : 90 lignes,
    fait extraction + cleanup HTML + appel à `addNewQuestion` + association
    média.
  - `addNewQuestion` ([questionManager.js:2-193](questionManager.js#L2)) :
    190 lignes (génération HTML + init RTE + init média + listeners).
- **Reco** : extraire des sous-fonctions ; viser ~30 lignes par fonction.

---

## 8. Plan de release proposé

| Release | Contenu | Effort estimé |
|---|---|---|
| **0.10.2** (PATCH urgent) | [B1] BOM UTF-8 dans les téléchargements | 30 min |
| **0.10.3** (PATCH) | [B2] QRC `=` pour 100 % + [B3] sensibilité à la casse | 1 h |
| **0.11.0** (MINOR) | [D1-D5] refacto DRY + [B4][B5] cas limites + [P3] | 6 h |
| **0.11.1** (PATCH) | [S1-S3] sanitize XSS (centralisé) | 3 h |
| **0.12.0** (MINOR) | [A1][A2] `domIds.js` + orchestrateur central + [U1] toasts | 6 h |
| **0.13.0** (MINOR) | [M1] suite de tests round-trip + [U2][U3] | 8 h |
| **Plus tard** | [M2] migration `execCommand` (planifier sur 12 mois) | 2-3 jours |

---

## Suivi

Au fil de l'implémentation :
- Cocher les cases `[ ]` → `[x]` quand un item est livré.
- Mettre à jour la colonne "Release cible" si la priorité change.
- Mentionner le numéro d'item (`[B1]`, `[D2]`, etc.) dans les entrées
  `CHANGELOG.md` pour traçabilité.
