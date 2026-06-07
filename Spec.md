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

- Format final : `CODE-QNN` (numéro sur deux chiffres).
- Si l'utilisateur ne fournit pas d'identifiant : préfixe = code article (ou
  `Q` à défaut), suffixe = numéro d'ordre.
- Si l'identifiant fourni ne se termine pas par `-QNN`, le suffixe est ajouté.

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

- Formats acceptés : `.txt` (GIFT brut) et `.zip` (GIFT + médias).
- Validation du format avant import : présence d'au moins une structure de
  question, équilibre des accolades.
- Parsing et reconstruction des questions dans l'interface.

### 2.8 Export

- `.txt` : code GIFT seul.
- `.zip` : code GIFT + médias renommés selon l'identifiant final.
- `.xml` : **format Moodle XML** (module `exportMoodleXml.js`, depuis 0.18.0),
  en plus du GIFT. Couvre les 5 types (mc→`multichoice` single=false,
  sc→`multichoice` single=true, tf→`truefalse`, sa→`shortanswer` avec
  `<usecase>`, num→`numerical` avec `<tolerance>`). HTML enrichi encapsulé en
  `<![CDATA[…]]>`. Médias **non embarqués** en V1 (avertissement ; utiliser le
  ZIP/GIFT). Import XML hors périmètre.

### 2.9 Feedback combiné (QCM / QCU)

Trois messages facultatifs distincts selon le résultat — réponse *correcte*,
*partiellement correcte*, *incorrecte* — saisis dans un encart dédié. Cette
fonctionnalité est **propre à Moodle** : exportée uniquement en XML
(`<correctfeedback>`, `<partiallycorrectfeedback>`, `<incorrectfeedback>`) et
**ignorée à l'export GIFT** (aucune syntaxe GIFT ne l'exprime).

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
- [ ] **Banques de questions** : classer les questions par banque.
- [ ] **Nombre de questions par page** : paramétrage à l'export.
- [ ] **Export RTF** ou format à mise en page simplifiée.

### Infrastructure (objet de la présente mise en place)

- [~] **Versionnage SemVer** via `APP_VERSION` dans `core.js`.
- [~] **CHANGELOG.md** (mémoire fonctionnelle).
- [~] **DEVLOG.md** (journal de session de l'agent).

### Procédure de mise à jour de ce document

À chaque évolution fonctionnelle : déplacer l'élément concerné de la Partie 3
vers la Partie 2 une fois implémenté, et consigner la version dans `CHANGELOG.md`.
