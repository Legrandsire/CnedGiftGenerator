# CLAUDE.md — Instructions pour l'agent

> Ce fichier est lu automatiquement par Claude Code à chaque session. Il définit
> le contexte du projet, les conventions à respecter et les obligations de
> l'agent (versionnage, journalisation). **Le lire intégralement avant toute
> action.**

---

## 1. Nature du projet

**Générateur de code GIFT** — application web statique permettant de créer,
importer et exporter des questions au format [GIFT](https://docs.moodle.org/en/GIFT_format)
pour Moodle et autres LMS compatibles.

- **Maître d'ouvrage** : CNED — Unité Opérationnelle Sup-Concours.
- **Public visé** : ingénieurs pédagogiques et auteurs (utilisateurs non techniciens).
- **Langue** de l'interface et de la documentation : français.

La spécification fonctionnelle complète se trouve dans **`Spec.md`**.

---

## 2. Pile technique et contraintes

| Élément | Choix | Contrainte ferme |
|---|---|---|
| Frontend | HTML / CSS / JavaScript **vanilla** | **Aucun framework** (ni React, ni Vue, etc.) |
| Modules JS | Scripts classiques chargés par `<script>` | **Pas de modules ES6** (`import`/`export`) — portée globale via `window` |
| Build | Aucun | Ouverture directe de `index.html`, pas de compilation |
| Dépendance externe | JSZip (CDN) | Seule dépendance autorisée sans validation |
| Persistance | `localStorage` | Usage léger uniquement (ex. première visite) |

L'ordre de chargement des `<script>` dans `index.html` **est significatif** :
une fonction doit être définie avant d'être appelée par un script ultérieur.
Ne pas réordonner sans vérifier les dépendances.

---

## 3. Architecture (à respecter impérativement)

Modularité **par fichier à responsabilité unique**. Chaque `.js` couvre un
domaine fonctionnel précis.

| Fichier | Responsabilité |
|---|---|
| `core.js` | Initialisation, variables globales (`questionCounter`), écouteurs principaux, **constante `APP_VERSION`** |
| `sanitize.js` | Assainissement HTML anti-XSS (`sanitizeRichHtml`, liste blanche de balises) |
| `domIds.js` | Source unique des identifiants DOM (objet `IDS`) — cf. audit [A1] |
| `notify.js` | Notifications toast non bloquantes (`notify.*`) — cf. audit [U1] |
| `confirmDialog.js` | Boîte de confirmation modale non bloquante (`confirmDialog()` → `Promise<boolean>`) |
| `richTextEditor.js` | Éditeur de texte enrichi (gras, italique, exposant, indice) |
| `questionManager.js` | Création / suppression / renumérotation / **déplacement** des questions |
| `optionManager.js` | Gestion des options de réponse (QCM, QCU, QRC) |
| `mediaManager.js` | Pièce jointe média par question, balise `@@PLUGINFILE@@`, export ZIP |
| `giftGenerator.js` | Génération du code GIFT à partir du DOM |
| `exportMoodleXml.js` | Génération de l'export **Moodle XML** (feedback combiné) — en plus du GIFT |
| `importGift.js` | Import et parsing de fichiers `.txt` / `.zip` GIFT |
| `downloadManager.js` | Téléchargement `.txt` et `.zip` |
| `helpManager.js` | Panneau d'aide, tooltips, tour guidé |
| `advancedTourFeatures.js` | Fonctionnalités avancées du tour guidé |
| `summaryManager.js` | Résumé des questions et navigation |
| `previewMode.js` | Mode prévisualisation (lecture seule) |
| `unsavedChangesAlert.js` | Alerte en cas de modifications non sauvegardées |

**Fichiers CSS** : `styles.css` (principal), `rteStyles.css`, `helpStyles.css`,
`summaryStyles.css`, `previewStyles.css`, `mediaStyles.css`, `notifyStyles.css`,
`confirmDialogStyles.css` — un fichier par domaine, en cohérence avec le
découpage JS.

**Règle d'or** : une nouvelle fonctionnalité va dans le fichier dont c'est la
responsabilité. Si elle ne rentre dans aucun, proposer un nouveau fichier dédié
plutôt que de surcharger un fichier existant — et le signaler.

---

## 4. Conventions de code (déjà en place, à conserver)

- **Français** pour commentaires, libellés, messages et noms de fonctions parlants.
- **JSDoc** (`@param`, `@returns`) devant chaque fonction notable.
- **Séparateurs de section** : `// ── Titre ─────────`. Réutiliser ce motif.
- **Typographie CNED** : espaces insécables avant `; : ! ?`, guillemets français.
  `addNonBreakingSpaces()` (dans `giftGenerator.js`) applique cette règle au code
  généré — ne pas la contourner.
- **Identifiants GIFT** : format `CODE-QNN` (numéro sur deux chiffres). Logique
  centralisée dans `giftGenerator.js`.
- **Charte CNED** : turquoise `#2da288` / `#00bcb4`, rose `#ae2585` / `#e6417a`.
  Pas d'autre couleur primaire sans validation.

---

## 5. Versionnage (OBLIGATOIRE)

**SemVer** : `MAJOR.MINOR.PATCH`.

| Incrément | Quand |
|---|---|
| **MAJOR** | Rupture de compatibilité (refonte, format de sortie incompatible) |
| **MINOR** | Nouvelle fonctionnalité rétrocompatible |
| **PATCH** | Correctif sans nouvelle fonctionnalité |

### Source de vérité unique
La version vit **uniquement** dans `core.js` :

```js
const APP_VERSION = '0.10.0';
```

Elle est injectée dans le pied de page par JavaScript. **Ne jamais réécrire le
numéro de version en dur dans `index.html`.**

> Démarrage en `0.10.0` (= ancien « beta 10 »). Le `0.x` traduit le statut pré-stable.

### Procédure à chaque release
1. Mettre à jour `APP_VERSION` dans `core.js`.
2. Ajouter une entrée datée dans `CHANGELOG.md`.
3. Proposer le tag Git : `git tag vX.Y.Z`.

---

## 6. Journalisation (OBLIGATOIRE)

Deux journaux, deux lecteurs.

- **`CHANGELOG.md`** — mémoire fonctionnelle (lecteur humain), format
  [Keep a Changelog](https://keepachangelog.com). Une entrée **par version publiée**.
- **`DEVLOG.md`** — journal de session (lecteur : agent + humain). Une entrée
  **à la fin de chaque session**, même sans release. C'est le fichier à lire en
  **début** de session pour retrouver le contexte. Gabarit imposé décrit dans
  l'en-tête de `DEVLOG.md`.

---

## 7. Mode de collaboration attendu

- **Proposer avant de produire** : solution raisonnée + options à valider, plutôt
  que questions ouvertes ou action directe.
- **Pas d'exécution avant confirmation**, en particulier pour Git, écritures de
  fichiers structurantes, décisions d'architecture.
- **Points de validation explicites** entre les phases d'un workflow.
- **Langage accessible** : compréhensible par un utilisateur non technicien.

---

## 8. Checklist de fin de session

- [ ] `APP_VERSION` reflète l'état réel (si release)
- [ ] `CHANGELOG.md` mis à jour (si release)
- [ ] `DEVLOG.md` complété pour la session
- [ ] Tag Git proposé (si release)
- [ ] Aucune version en dur réintroduite dans `index.html`
- [ ] Nouvelle fonctionnalité placée dans le bon fichier
