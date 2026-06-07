# Spec.md — Spécification du Générateur de code GIFT

> Document de référence en trois parties : (1) l'existant tel qu'il fonctionne
> aujourd'hui, (2) la spécification fonctionnelle, (3) les évolutions prévues.
> À tenir à jour au fil des évolutions.

---

## PARTIE 1 — L'existant

### 1.1 Présentation

Application web 100 % côté client permettant de produire du code GIFT pour
Moodle et LMS compatibles. Aucun serveur, aucune donnée transmise : tout se
passe dans le navigateur de l'utilisateur.

### 1.2 Pile technique

- **HTML / CSS / JavaScript vanilla**, sans framework ni système de build.
- **JSZip** (CDN) pour l'empaquetage ZIP des exports avec médias.
- Fonctions partagées exposées sur `window` (pas de modules ES6).
- Persistance légère via `localStorage` (ex. détection de première visite pour
  le tour guidé).

### 1.3 Modules présents

Voir la cartographie détaillée dans `CLAUDE.md`, section 2. En résumé : un
fichier JS par domaine (création de questions, options, médias, génération GIFT,
import, téléchargement, aide, résumé, prévisualisation, alerte de modifications).

---

## PARTIE 2 — Spécification fonctionnelle

### 2.1 Métadonnées du document

Champs facultatifs : nom de l'auteur, prénom de l'auteur, code article.
S'ils sont renseignés, un en-tête de commentaires GIFT est généré
(`// Auteur:`, `// Code article:`, `// Date de génération:`).

### 2.2 Types de questions pris en charge

| Type | Code | Description |
|---|---|---|
| QCM | `mc` | Choix multiple, plusieurs réponses correctes possibles |
| QCU | `sc` | Choix unique, une seule réponse correcte |
| Vrai / Faux | `tf` | Réponse booléenne |
| Réponse courte | `sa` | Texte attendu, sensible ou non à la casse |
| Numérique | `num` | Valeur numérique, avec marge d'erreur optionnelle |

### 2.3 Édition de texte enrichi

Chaque champ de question et de réponse dispose d'un éditeur enrichi :
gras, italique, souligné, exposant, indice, effacement de la mise en forme.
La sortie HTML est nettoyée avant insertion dans le code GIFT.

### 2.4 Identifiants de question

- Format final : `CODE[-B<NN>]-Q<NN>` (numéros sur deux chiffres). Le segment
  `-B<NN>` n'apparaît que si la question appartient à une **banque** (cf. 2.12) ;
  le numéro `Q<NN>` **repart à 01 dans chaque groupe** (zone sans-banque incluse).
- Si l'utilisateur ne fournit pas d'identifiant : préfixe = code article (ou
  `Q` à défaut), segment de banque éventuel, suffixe = numéro d'ordre dans le
  groupe. Un **aperçu vivant** sous le champ reflète l'identifiant final et
  s'adapte au déplacement / changement de banque.
- Si l'identifiant fourni se termine déjà par `-Q<NN>`, il est conservé tel quel ;
  sinon le segment de banque et le suffixe `-Q<NN>` sont ajoutés.
- Règle **centralisée** dans `categoryManager.js` (`computeFinalQuestionId`),
  partagée par les exports GIFT, Moodle XML et lisible.

### 2.5 Médias

- Un média par question (image, audio, vidéo, PDF).
- Stockés en mémoire dans `window.questionMediaFiles[questionId]`.
- À la génération, insertion de la balise `@@PLUGINFILE@@`.
- Nom de fichier normalisé : `{finalQuestionId}_media.{ext}`.
- Export ZIP regroupant le `.txt` GIFT et tous les médias.

### 2.6 Typographie

Application automatique des espaces insécables avant la ponctuation double
(`; : ! ?`) conformément aux conventions typographiques françaises du CNED.

### 2.7 Import

- Formats acceptés : `.txt` (GIFT brut), `.zip` (GIFT + médias) et `.xml`
  (**Moodle XML**, module `importMoodleXml.js`, depuis 0.19.0).
- Un seul bouton « Importer » aiguille selon l'extension **et** le contenu
  (détection de la racine `<quiz>` pour le XML).
- **Import GIFT** : validation du format (présence d'au moins une structure de
  question, équilibre des accolades), parsing et reconstruction des questions.
  Les directives `$CATEGORY:` sont reconnues → **banques recréées** (cf. 2.12).
- **Identifiants auto** : un identifiant importé de forme `CODE[-B<NN>]-Q<NN>`
  (préfixe = code article) est reconnu comme auto-généré et **laissé vide**, pour
  qu'il reste recalculé dynamiquement ; un identifiant manuel est conservé.
- **Import Moodle XML** : parsing `DOMParser`, mapping inverse des 5 types,
  restitution du **feedback combiné** et de l'`<usecase>` (impossible via GIFT),
  médias `base64` décodés et réattachés. Les entrées `<question type="category">`
  recréent les **banques** (cf. 2.12) ; le **code article** est rechargé depuis
  le commentaire `<!-- course-code: … -->` (ou un chemin de catégorie). Les types
  non gérés (essay, matching, cloze…) sont **ignorés** avec un récapitulatif.
  HTML importé assaini (`sanitizeRichHtml`).

### 2.8 Export

- `.txt` : code GIFT seul. Une directive `$CATEGORY: $course$/<code>/<nom>` est
  émise en tête de chaque **banque** (cf. 2.12) ; les questions sans banque
  restent en tête sans directive (catégorie Moodle par défaut).
- `.zip` : code GIFT + médias renommés selon l'identifiant final.
- `.xml` : **format Moodle XML** (module `exportMoodleXml.js`, depuis 0.18.0),
  en plus du GIFT. Couvre les 5 types (mc→`multichoice` single=false,
  sc→`multichoice` single=true, tf→`truefalse`, sa→`shortanswer` avec
  `<usecase>`, num→`numerical` avec `<tolerance>`). HTML enrichi encapsulé en
  `<![CDATA[…]]>`. **Médias embarqués en `base64`** (depuis 0.19.0) :
  `<file … encoding="base64">` placé dans `<questiontext>` (`path="/"`) → fichier
  `.xml` **autonome**, rangé par Moodle dans la *filearea* de la question
  (aucun répertoire à choisir). Avertissement de poids au-delà de ~10 Mo. Une
  entrée `<question type="category">` précède chaque **banque** (cf. 2.12) ; le
  **code article** est embarqué en commentaire `<!-- course-code: … -->` pour
  être rechargé à l'import.

### 2.9 Feedback combiné (QCM / QCU)

Trois messages facultatifs distincts selon le résultat — réponse *correcte*,
*partiellement correcte*, *incorrecte* — saisis dans un encart dédié. Cette
fonctionnalité est **propre à Moodle** : exportée uniquement en XML
(`<correctfeedback>`, `<partiallycorrectfeedback>`, `<incorrectfeedback>`) et
**ignorée à l'export GIFT** (aucune syntaxe GIFT ne l'exprime).

### 2.11 Export lisible (PDF / RTF / HTML)

Sorties destinées à la **lecture/relecture humaine** (charte CNED), distinctes
des exports Moodle (module `exportPrintable.js` + `printStyles.css`, depuis
0.20.0). **Aucune dépendance** (pas de jsPDF) :

- **PDF (impression)** : un document HTML mis en forme est ouvert dans une
  fenêtre dédiée et l'impression est déclenchée (`window.print()`) ; l'auteur
  choisit « Enregistrer au format PDF ». Les **images** sont embarquées en
  base64 inline (les autres médias sont mentionnés en texte).
- **HTML autonome** : le même document, téléchargé en `.html` self-contained.
- **RTF** : document `.rtf` éditable (Word/LibreOffice) — titres, **gras +
  couleur** pour les bonnes réponses, listes, sous-ensemble RTE (gras, italique,
  exposant, indice). Accents échappés en `\uN?` ; médias renvoyés vers l'export
  ZIP/XML.

Le contenu met en évidence la/les **bonne(s) réponse(s)** par type (QCM/QCU avec
poids, QRC avec sensibilité à la casse, Numérique avec marge, Vrai/Faux), avec
énoncé, rétroactions (par option, générale, combinée) et en-tête de métadonnées.
Une fonction partagée `readQuestionState()` lit l'état normalisé de chaque
question ; les exports GIFT et Moodle XML restent inchangés.

### 2.12 Banques de questions (catégories)

Classement des questions en **banques**, reproduisant les catégories de la banque
de questions Moodle (module `categoryManager.js` + `categoryStyles.css`, depuis
0.21.0).

- **Organisation** : chaque banque est une **section repliable** (`<details>`) du
  formulaire — en-tête avec badge `B<NN>`, nom éditable, compteur et actions
  (ajouter une question, supprimer) — précédée d'une zone **« Sans banque »**.
  Boutons globaux « 📚 Ajouter une banque » et « Tout replier/déplier ». Le
  **sommaire** reflète le même regroupement repliable.
- **Numéro vs nom** : `B<NN>` (numéro = ordre des banques, stable au renommage)
  sert à l'**identifiant** (cf. 2.4) ; le **nom libre** alimente la catégorie
  Moodle et l'affichage.
- **Déplacement** : un **sélecteur de banque** par question la déplace entre
  banques ; les flèches ↑/↓ réordonnent à l'intérieur d'un groupe.
- **Chemin de catégorie** : `$course$/<code article>/<nom de banque>` (segment
  code omis si vide ; « / » du nom neutralisé). Émis en GIFT (`$CATEGORY:`) et en
  Moodle XML (`<question type="category">`), reconnu aux imports correspondants.
- **Rétrocompatibilité** : sans aucune banque, la sortie est identique à
  l'historique (questions `CODE-QNN`, aucune directive).

### 2.10 Fonctions d'assistance

- **Panneau d'aide** latéral à onglets, **tooltips**, **tour guidé** au premier
  passage.
- **Résumé** condensé de toutes les questions, avec navigation.
- **Mode prévisualisation** (bascule édition / lecture seule).
- **Détection des doublons** d'options (QCM / QCU), mise en évidence visuelle.
- **Alerte** avant perte de modifications non sauvegardées.

---

## PARTIE 3 — Évolutions prévues (TODO)

> Reprend et structure les pistes déjà identifiées. Statut : `[ ]` à faire,
> `[~]` en cours, `[x]` fait.

### Fonctionnalités

- [ ] **Déplacer des questions** (réordonnancement dans la liste).
- [x] **Banques de questions** : classer les questions par banque — livré en
  0.21.0 (cf. 2.12).
- [ ] **Nombre de questions par page** : paramétrage à l'export.
- [x] **Export lisible : PDF (impression) + RTF + HTML autonome** — livré en
  0.20.0 (cf. 2.11).

### Infrastructure (objet de la présente mise en place)

- [~] **Versionnage SemVer** via `APP_VERSION` dans `core.js`.
- [~] **CHANGELOG.md** (mémoire fonctionnelle).
- [~] **DEVLOG.md** (journal de session de l'agent).

### Procédure de mise à jour de ce document

À chaque évolution fonctionnelle : déplacer l'élément concerné de la Partie 3
vers la Partie 2 une fois implémenté, et consigner la version dans `CHANGELOG.md`.
