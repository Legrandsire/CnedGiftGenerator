# ROADMAP — Fonctionnalités à implémenter

> Backlog détaillé des évolutions, destiné à être traité **au fil de plusieurs
> sessions**. Complète la « Partie 3 — Évolutions prévues » de `Spec.md` (qui
> reste la vue synthétique) en y ajoutant, pour chaque chantier : la
> compatibilité GIFT, l'approche technique retenue, les fichiers impactés et
> l'effort estimé.
>
> **Convention de statut** : `[ ]` à faire · `[~]` en cours · `[x]` fait.
> Quand un chantier est livré, déplacer l'élément correspondant de `Spec.md`
> (Partie 3 → Partie 2) et consigner la version dans `CHANGELOG.md`.

---

## Vue d'ensemble

| # | Chantier | Compatible GIFT ? | Effort | Priorité | Statut |
|---|---|---|---|---|---|
| 0 | Qualité : correctif `dlog` + déplacement des questions | ✅ (sans impact) | Faible | **1** | `[x]` 0.16.0 |
| 1 | Déplacer les questions (flèches ↑/↓) | ✅ (sans impact) | Faible | **1** | `[x]` 0.16.0 |
| 2 | Banque de questions (catégories `$CATEGORY`) | ✅ Nativement | Moyen | 2 | `[x]` 0.21.0 |
| 3 | Sauvegarde native (localStorage / IndexedDB) | n/a (local) | Moyen | 3 | `[ ]` |
| 4 | Export lisible : PDF (impression) + RTF | n/a (export) | Moyen | 4 | `[x]` 0.20.0 |
| 5 | Feedback combiné → export **Moodle XML** | ❌ GIFT / ✅ XML | Élevé | 5 | `[x]` 0.18.0 |
| 6 | Système d'authentification | n/a | À cadrer | Plus tard | `[ ]` |
| 7 | Import **Moodle XML** (rééditer le feedback combiné) | ❌ GIFT / ✅ XML | Moyen | 7 | `[x]` 0.19.0 |
| 8 | Médias dans l'export/import **XML** (base64) | n/a (XML) | Moyen | 8 | `[x]` 0.19.0 |
| 9 | Refonte du mode prévisualisation + correctif chevauchement flèches/ID | n/a (UI) | Faible | 6 | `[x]` 0.22.0 |
| 10 | Refonte UI/UX globale (preview, menus, onglets XML, RTF, responsive, bug, favicon, renommage) | n/a (UI) | Élevé | 6 | `[x]` 0.22.0 |
| 11 | Mode hors-ligne (vendoring JSZip + indicateur réseau) | n/a (local) | Faible | 6 | `[x]` 0.23.0 |
| 12 | Refonte de la visite guidée (module dédié, parcours complet, positionnement) | n/a (UI) | Moyen | 6 | `[x]` 0.23.0 |
| Q | Qualité continue (confirm/alert, tests) | — | Faible | continu | `[~]` |

---

## 0 + 1. Qualité & déplacement des questions — `[x]` livré en 0.16.0

Réalisé dans la session du 2026-06-06. Voir `CHANGELOG.md` [0.16.0] et
`DEVLOG.md`. Conservé ici pour la traçabilité du backlog.

- **Correctif `dlog`** : la fonction de log de debug de l'import s'appelait
  elle-même (récursion infinie si `DEBUG = true`). Corrigée pour appeler
  `console.log`.
- **Déplacer les questions** : flèches ↑/↓ sur chaque question **et** dans le
  sommaire ; renumérotation automatique ; flèches d'extrémité désactivées.

---

## 2. Banque de questions (catégories) — `[x]` livré en 0.21.0

> **Livré** dans la session du 2026-06-07 (0.21.0). Nouveau module
> `categoryManager.js` + `categoryStyles.css`. Banques = sections `<details>`
> repliables (+ zone « Sans banque ») dans le formulaire **et** le sommaire ;
> sélecteur de banque par question ; **identifiant unifié** `<code>[-B<NN>]-Q<NN>`
> (`computeFinalQuestionId` centralisé, dé-dupliqué des 3 consommateurs) avec
> **aperçu vivant** ; `$CATEGORY:` émis/reconnu en GIFT et `<question
> type="category">` en Moodle XML ; **code article** embarqué/rechargé à l'import
> XML ; identifiants auto **laissés vides** à l'import (GIFT+XML) pour rester
> dynamiques. +9 tests (section 6). Choix validés (AskUserQuestion) : numérotation
> Q **par banque**, hors-banque conservant `CODE-QNN`, chemin
> `$course$/<code>/<nom>`, déplacement par **sélecteur**, version unique 0.21.0.
> Descriptif d'origine conservé ci-dessous pour la traçabilité.

**Objectif.** Permettre de classer les questions en « banques »/catégories, pour
reproduire le fonctionnement des banques de questions Moodle (un quiz pioche des
questions dans une banque de questions similaires).

**Compatibilité GIFT : native.** Le format GIFT gère cela via la directive :

```
$CATEGORY: chemin/de/la/banque
```

Toutes les questions situées **après** cette ligne sont importées dans la
catégorie indiquée (hiérarchie séparée par `/`). C'est exactement le mécanisme
des catégories du banque de questions Moodle.

**Approche technique proposée.**
- Ajouter un champ « Banque / Catégorie » par question (liste déroulante
  alimentée par les banques déjà saisies + saisie libre). Champ **facultatif**.
- À la **génération** (`giftGenerator.js`) : regrouper les questions par banque
  et émettre une ligne `$CATEGORY: …` en tête de chaque groupe. Les questions
  sans banque restent en tête, sans directive (catégorie par défaut Moodle).
- À l'**import** (`importGift.js`) : reconnaître les lignes `$CATEGORY:` et
  réaffecter les questions suivantes à cette banque (aujourd'hui ignorées par le
  parseur).
- Possibilité d'afficher la banque dans le **sommaire** (`summaryManager.js`),
  voire de filtrer/regrouper par banque.

**Fichiers impactés.** Nouveau module dédié `categoryManager.js` (règle d'or
CLAUDE.md §3 : nouveau domaine → nouveau fichier) ; ajustements dans
`giftGenerator.js`, `importGift.js`, `questionManager.js` (champ dans le
gabarit), `summaryManager.js`, et `domIds.js` (id du champ).

**Points de vigilance.**
- Décider de l'ordre de sortie (regrouper par banque modifie l'ordre des
  questions dans le `.txt` ; à articuler avec le déplacement manuel).
- Round-trip : un export → import doit préserver les banques. Ajouter des tests.

---

## 3. Sauvegarde native

**Objectif.** Offrir une sauvegarde plus simple que l'actuel cycle
export/import GIFT manuel.

**Compatibilité.** Sans objet (stockage local au navigateur).

**Approche technique proposée.**
- **Sauvegarde automatique** de l'état éditable dans `localStorage`, déclenchée
  en arrière-plan (débounce) à chaque modification.
- **Restauration au chargement** : proposer « Reprendre votre dernière
  session ? » si une sauvegarde existe.
- **Médias** : `localStorage` est limité (~5 Mo) et inadapté au binaire. Deux
  options à trancher :
  1. exclure les médias de l'autosave (l'auteur les réattache) — simple ;
  2. stocker les médias via **IndexedDB** (API native, sans dépendance, gère le
     binaire et de plus gros volumes) — plus robuste.
- **Complément** : export/import d'un fichier « projet » `.json` (état complet,
  fidèle — pondérations exactes, banques…) pour archiver ou transférer une
  session entre postes.

**Fichiers impactés.** Nouveau module `storageManager.js` ; points
d'accroche dans `core.js` (init/restauration) et les gestionnaires qui modifient
l'état (questions, options, médias) pour déclencher l'autosave.

**Points de vigilance.**
- Respecter la contrainte CLAUDE.md « `localStorage` : usage léger ».
- Gérer le dépassement de quota (try/catch + message clair).
- Articuler avec l'alerte « modifications non sauvegardées »
  (`unsavedChangesAlert.js`) : l'autosave en change la sémantique.

---

## 4. Export lisible : PDF + RTF — `[x]` livré en 0.20.0

> **Livré** dans la session du 2026-06-07 (0.20.0). Nouveau module
> `exportPrintable.js` + `printStyles.css`. Trois sorties sur une **source
> unique** (`readQuestionState()`) : **📄 PDF** (fenêtre `window.open` +
> `window.print()`, images en base64 inline), **🌐 HTML** autonome (même
> document, CSS/images inlinées) et **📝 RTF** (.rtf éditable, gras des bonnes
> réponses, accents en `\uN?`, médias renvoyés vers ZIP/XML). **Aucune
> dépendance** (pas de jsPDF). Les exports GIFT et Moodle XML restent intacts.
> Choix validés : version unique 0.20.0 (PDF+RTF+HTML ensemble) ;
> `readQuestionState()` consommée par l'imprimable seul (unification des 3
> lecteurs DOM = amélioration future) ; CSS source unique inlinée depuis
> `document.styleSheets` (fallback si bloqué en `file://`). +14 tests (section 5).
> Descriptif conservé ci-dessous pour la traçabilité.

**Objectif.** Exporter un document plus lisible par un humain que le code GIFT,
visuellement soigné (charte CNED). Validé : **PDF** et **RTF**.

**Compatibilité.** Sans objet (formats de sortie destinés à la lecture/édition,
pas à Moodle).

**Approche technique proposée — contrainte « pas de build, seule JSZip
autorisée » (donc pas de jsPDF & co).**
- **PDF** : générer une **page HTML mise en forme** (énoncé, réponses avec la/les
  bonne(s) en évidence, feedback, média éventuel) dans une fenêtre dédiée, avec
  une feuille `printStyles.css` aux couleurs CNED, puis déclencher
  `window.print()`. L'utilisateur choisit « Enregistrer au format PDF » dans la
  boîte d'impression. Aucune dépendance.
- **RTF** : générer une **chaîne RTF** téléchargeable (`.rtf`), ouvrable dans
  Word/LibreOffice et éditable. Mise en forme de base (titres, gras pour les
  bonnes réponses, etc.).
  - ⚠️ **Nuance** : le RTF gère moins finement la mise en page que le PDF
    d'impression ; les caractères accentués demandent un échappement Unicode
    (`\uN`) — à traiter dans le générateur RTF.
- Optionnel : proposer aussi le **téléchargement d'un `.html` autonome**
  (lisible/éditable, ouvrable partout).

**Fichiers impactés.** Nouveau module `exportPrintable.js` (+ `printStyles.css`
pour le PDF ; le RTF est une génération de chaîne). Boutons dans `index.html`,
câblage façon `downloadManager.js`.

**Points de vigilance.**
- Réutiliser la lecture du DOM existante (proche de `giftGenerator.js`) sans
  dupliquer la logique d'extraction des réponses : envisager une fonction
  partagée de lecture de l'état d'une question.
- Médias : afficher les images dans le PDF ; pour le RTF, prévoir au minimum une
  mention (l'embarquement binaire RTF est complexe).

---

## 5. Feedback combiné → export Moodle XML — `[x]` livré en 0.18.0

> **Livré** dans la session du 2026-06-06 (0.18.0). Voir `CHANGELOG.md` [0.18.0]
> et `DEVLOG.md`. Réalisation conforme à l'approche ci-dessous, avec ces
> précisions validées : export des **5 types** (pas seulement le QCM) pour un
> `.xml` complet ; feedback combiné sur **QCM + QCU** ; **CDATA** pour le HTML ;
> **médias différés** (avertissement, embarquement base64 reporté en V2) ;
> **import XML hors périmètre**. Bonus : la **sensibilité à la casse des QRC**
> est honorée en XML via `<usecase>` (impossible en GIFT). Descriptif conservé
> ci-dessous pour la traçabilité.

**Objectif.** Permettre un retour pédagogique **différent selon le résultat** :
réponse *correcte* / *partiellement correcte* / *incorrecte* (cas QCM).

**Compatibilité GIFT : impossible.** Le format GIFT ne connaît que :
- le feedback **par option** (`#…`) — déjà géré par l'outil ;
- le feedback **général** (`####…`) — déjà géré par l'outil.

Le « feedback combiné » (3 messages) est une fonctionnalité **propre à Moodle**,
stockée uniquement dans le **format Moodle XML**. Il n'existe aucune syntaxe
GIFT pour l'exprimer.

**Approche technique retenue (validée).** Ajouter un **export Moodle XML** comme
format de sortie alternatif, qui supporte le feedback combiné. Bénéfice annexe :
l'XML lèverait d'autres limites du GIFT pour de futures évolutions.
- Ajouter, dans le gabarit QCM, trois champs de feedback combiné (correct /
  partiellement correct / incorrect), **facultatifs**.
- Nouveau module `exportMoodleXml.js` produisant le XML Moodle
  (`<quiz><question>…`), incluant `<correctfeedback>`,
  `<partiallycorrectfeedback>`, `<incorrectfeedback>`.
- Bouton d'export `.xml` dédié dans `index.html`.

**Fichiers impactés.** Nouveau module `exportMoodleXml.js` ; champs
supplémentaires dans `questionManager.js` (gabarit) et `domIds.js` ; bouton dans
`index.html`. (Import XML : hors périmètre initial, à décider plus tard.)

**Points de vigilance.**
- Chantier le plus lourd : c'est un **second format complet** à maintenir en
  parallèle du GIFT.
- Les champs de feedback combiné n'ont de sens **qu'à l'export XML** (ignorés à
  l'export GIFT) — bien le signaler dans l'UI pour ne pas induire en erreur.
- Encodage XML (échappement `&`, `<`, `>`), encodage du HTML enrichi
  (`<![CDATA[…]]>` ou entités).

---

## 6. Système d'authentification *(idée à cadrer, plus tard)*

**Objectif (à préciser).** Idée nouvelle, à implémenter ultérieurement.

**À cadrer avant tout développement.** L'outil est aujourd'hui **100 % côté
client, sans serveur ni donnée transmise** (cf. `Spec.md` 1.1). Une vraie
authentification (comptes, mots de passe) suppose un **backend**, ce qui
romprait cette architecture et la contrainte « application web statique » du
CLAUDE.md.

**Questions à trancher avec le maître d'ouvrage (CNED) :**
- Quel **besoin** réel ? (protéger l'accès à l'outil ? identifier l'auteur ?
  partager/synchroniser des travaux entre utilisateurs ?)
- Authentification **locale** (simple verrou/profil stocké dans le navigateur,
  sans sécurité réelle) **ou** authentification **serveur** (SSO CNED, comptes) ?
- Si serveur : cela sort du cadre « statique » → décision d'architecture majeure
  (hébergement, backend, RGPD/données personnelles).

➡️ **À ne pas démarrer sans cadrage fonctionnel et validation d'architecture.**

---

## 7. Import Moodle XML — `[x]` livré en 0.19.0

> **Livré** dans la session du 2026-06-07 (0.19.0), avec le chantier n°8.
> Nouveau module `importMoodleXml.js` (parsing `DOMParser`, mapping inverse des
> 5 types, restitution du feedback combiné et de l'`<usecase>`). Aiguillage du
> bouton « Importer » par extension `.xml` **et** détection du contenu `<quiz>`.
> Types non gérés **ignorés + notifiés** (import partiel). HTML assaini via
> `sanitizeRichHtml`. Descriptif conservé ci-dessous pour la traçabilité.

**Objectif.** Permettre de **réimporter un fichier `.xml` Moodle** produit par
l'outil (ou par Moodle) afin de le **rééditer** dans l'interface. Pendant du
chantier n°5 (export XML, livré en 0.18.0).

**Intérêt clé.** C'est le **seul moyen de rééditer un feedback combiné** : le
GIFT ne sait pas le transporter, donc un aller-retour via GIFT le perd. L'import
XML referme la boucle « éditer → exporter → rééditer » pour les fonctionnalités
propres à Moodle.

**Compatibilité.** Le feedback combiné et l'`<usecase>` (sensibilité à la casse)
sont restitués, là où l'import GIFT ne le peut pas.

**Approche technique proposée — sans dépendance.**
- Nouveau module `importMoodleXml.js` qui parse le XML avec **`DOMParser`**
  (API native, gère nativement le CDATA), puis reconstruit les questions dans
  l'UI en réutilisant `addNewQuestion` et la même mécanique de remplissage que
  l'import GIFT (réemploi, pas de duplication).
- **Mapping inverse** (symétrique de `exportMoodleXml.js`) :
  - `multichoice` `single=false`/`true` → QCM / QCU ; `fraction` → poids ;
  - `truefalse` → Vrai/Faux ;
  - `shortanswer` → QRC, `<usecase>` → sélecteur de casse ;
  - `numerical` → Numérique, `<tolerance>` → marge ;
  - `<correctfeedback>` / `<partiallycorrectfeedback>` / `<incorrectfeedback>` →
    les 3 champs de feedback combiné.
- Le bouton d'import accepterait aussi le `.xml` (aiguillage par extension ou par
  détection du contenu `<quiz>`), en complément du `.txt` / `.zip` GIFT actuels.

**Fichiers impactés.** Nouveau module `importMoodleXml.js` ; ajustements dans la
zone d'import (`importGift.js` ou `index.html` pour accepter `.xml`) ; tests
round-trip XML (générer → importer → régénérer) dans `tests/`.

**Points de vigilance.**
- Robustesse du parsing (fichiers Moodle réels plus riches que ceux produits par
  l'outil : balises supplémentaires à ignorer proprement).
- Assainir le HTML importé (`sanitizeRichHtml`) comme à l'import GIFT (XSS).
- Médias : voir chantier n°8 (différés tant qu'il n'est pas traité).

---

## 8. Médias dans l'export / import XML (base64) — `[x]` livré en 0.19.0

> **Livré** dans la session du 2026-06-07 (0.19.0), avec le chantier n°7.
> Export : `<file … encoding="base64">` placé **dans `<questiontext>`**
> (`path="/"`) + tag `@@PLUGINFILE@@` dans le texte ; l'avertissement « médias
> non inclus » est remplacé par un avertissement de **poids** (~10 Mo). Import :
> décodage base64 → `File` → réattachement via `mediaManager`. **Point clé** :
> le `<file>` dans `<questiontext>` fait que Moodle range le média dans la
> *filearea* de la question — plus de répertoire à choisir (corrige l'ambiguïté
> du ZIP). Descriptif conservé ci-dessous pour la traçabilité.

**Objectif.** Embarquer les médias **dans le fichier `.xml`** lui-même, pour un
fichier Moodle **autonome** (sans ZIP annexe). Complète les chantiers n°5
(export, médias différés en V1) et n°7 (import).

**Compatibilité.** Sans objet (mécanisme interne au format Moodle XML).

**Approche technique proposée.**
- **Export** : pour chaque question avec média, émettre la balise
  `@@PLUGINFILE@@` dans le texte **et** un élément
  `<file name="…" path="/" encoding="base64">…</file>` contenant le binaire
  encodé en base64 (lecture via `FileReader`/`arrayBuffer` → base64). Lever alors
  l'avertissement « médias non inclus » de l'export XML actuel.
- **Import** : décoder les `<file … encoding="base64">` et réattacher chaque
  média à sa question (réemploi de `mediaManager`), en retirant `@@PLUGINFILE@@`
  du texte comme le fait déjà l'import GIFT.

**Fichiers impactés.** `exportMoodleXml.js` (émission des `<file>` + tag),
`importMoodleXml.js` (décodage), `mediaManager.js` (réattachement) ; tests.

**Points de vigilance.**
- **Poids** : le base64 gonfle le fichier (~+33 %) ; gros médias → `.xml`
  volumineux. Documenter, voire prévoir un seuil/avertissement.
- Cohérence des noms de fichiers avec la convention `{finalQuestionId}_media.{ext}`
  déjà utilisée par l'export ZIP.
- Encodage : produire le base64 sans saut de ligne parasite hors CDATA.

---

## 9. Refonte du mode prévisualisation + correctif flèches/ID — `[x]` livré en 0.22.0

> **Livré** dans la session du 2026-06-07 (0.22.0), au sein du chantier **n°10**
> (refonte UI/UX globale qui l'absorbe). Preview compacte et contrastée (bonnes
> réponses **bleu**, mauvaises **rouge**), feedback combiné en **lecture seule**
> et bien placé, média affiché / affordance d'ajout masquée, chevauchement
> identifiant ↔ flèches corrigé (identifiant déplacé dans l'en-tête, contrôles
> d'édition masqués). Voir aussi `CHANGELOG.md` [0.22.0]. Descriptif d'origine
> conservé ci-dessous pour la traçabilité.

**Objectif.** Améliorer la lisibilité du **mode prévisualisation** (rendu jugé
peu convaincant) et corriger un **bug d'UI** : en mode édition, les **flèches de
déplacement ↑/↓** se **superposent à l'identifiant** de la question.

**Compatibilité.** Sans objet (purement interface, aucun impact sur les exports).

**Pistes techniques.**
- **Correctif flèches/ID** : revoir le positionnement (probablement `position:
  absolute` des flèches vs marge du champ identifiant) dans `styles.css` /
  `questionManager.js` — réserver un espace dédié aux flèches (flex/gap) plutôt
  qu'un chevauchement.
- **Prévisualisation** : harmoniser le rendu lecture seule (`previewMode.js` /
  `previewStyles.css`) avec la charte CNED ; envisager de **réutiliser le rendu
  de l'export lisible** (`exportPrintable.js` / `printStyles.css`, chantier n°4)
  pour une prévisualisation fidèle au document imprimable.

**Fichiers impactés.** `styles.css`, `questionManager.js`, `previewMode.js`,
`previewStyles.css` ; éventuellement réemploi de `printStyles.css`.

**Origine.** Signalé lors de la relecture du chantier n°4 (session 2026-06-07).

---

## 11. Mode hors-ligne — `[x]` livré en 0.23.0

> **Livré** dans la session du 2026-06-07 (0.23.0). La seule dépendance réseau à
> l'exécution (JSZip via CDN cdnjs) est désormais **hébergée en local**
> (`vendor/jszip.min.js`, v3.10.1) ; `index.html` pointe dessus. L'outil
> fonctionne **100 % hors-ligne**, y compris en ouverture directe `file://`.
> Ajout d'un **indicateur d'état réseau** discret en pied de page
> (`initNetworkStatusIndicator()` dans `core.js`, événements `online`/`offline`)
> et d'une mention « Fonctionne sans connexion » dans l'aide. **Pas de PWA/service
> worker** (inadapté à l'usage `file://` documenté). Choix validés
> (AskUserQuestion) : vendoring + indicateur, dossier `vendor/`.

---

## 12. Refonte de la visite guidée — `[x]` livré en 0.23.0

> **Livré** dans la session du 2026-06-07 (0.23.0). Nouveau module dédié
> **`tourManager.js`** (+ `tourStyles.css`) remplaçant le dispositif dupliqué
> (`startGuidedTour` dans `helpManager.js` + `enhancedGuidedTour` orphelin dans
> `advancedTourFeatures.js`, **supprimé**). Parcours **complet** (17 étapes)
> couvrant tout le flux actuel (banques, menus GIFT/Moodle/Document, onglets de
> sortie, exports, Contact, prévisualisation…). Tour **explicatif** (sans démos
> animées). **Positionnement fiabilisé** : `position: fixed`, clamp X/Y, bascule
> de côté près des bords, z-index au-dessus de la pile de boutons fixes,
> **ouverture automatique des menus déroulants** pour les étapes concernées.
> Choix validés (AskUserQuestion) : parcours complet, style explicatif, extraction
> dans `tourManager.js`, version unique 0.23.0.

---

## Q. Qualité continue *(au fil de l'eau)*

- `[x]` **Correctif `dlog`** (récursion) — livré en 0.16.0.
- `[x]` **Migration des `confirm()`/`alert()` bloquants** — livré en 0.17.0.
  Nouveau module `confirmDialog.js` (modale non bloquante → `Promise<boolean>`).
  Effacement et import migrés ; doublons → `notify.warning` + poursuite
  (changement de comportement assumé, cf. CHANGELOG [0.17.0]). Les
  `beforeunload` natifs (`unsavedChangesAlert.js`) sont conservés.
- `[~]` **Extension du harnais de tests** à chaque nouvelle fonctionnalité
  (round-trip catégories, etc.), pour rester « vert à chaque release ».
