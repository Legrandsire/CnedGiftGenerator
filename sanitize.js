// ── Assainissement HTML (anti-XSS) ──────────────────────────────────────────
//
// Responsabilité unique : nettoyer le HTML enrichi avant toute insertion via
// innerHTML (import GIFT, prévisualisation). Centralise la mitigation XSS
// décrite dans l'audit ([S1], [S3]).
//
// Principe : liste blanche stricte. On reconstruit un arbre DOM propre en ne
// conservant que les balises de mise en forme produites par l'éditeur enrichi,
// SANS aucun attribut (donc pas de `on*`, pas de `style`, pas de `href/src`
// `javascript:`). Les balises dangereuses (script/style/iframe/object/embed)
// sont supprimées avec leur contenu ; les autres balises inconnues sont
// « déballées » (on garde leur contenu textuel assaini).
// ───────────────────────────────────────────────────────────────────────────

// Balises de mise en forme autorisées (en majuscules, comme tagName).
const SANITIZE_ALLOWED_TAGS = new Set([
    'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'SUP', 'SUB', 'SPAN'
]);

// Balises supprimées intégralement (contenu compris).
const SANITIZE_DROP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED'
]);

/**
 * Produit une copie assainie des enfants d'un nœud, sous forme de fragment.
 * @param {Node} node - Nœud source dont on assainit les enfants.
 * @returns {DocumentFragment} Fragment ne contenant que des nœuds sûrs.
 */
function _sanitizeChildren(node) {
    const fragment = document.createDocumentFragment();

    node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            // Le texte est toujours conservé (réencodé proprement à la sortie).
            fragment.appendChild(document.createTextNode(child.nodeValue));
            return;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) {
            // Commentaires, etc. : ignorés.
            return;
        }

        const tag = child.tagName;

        if (SANITIZE_DROP_TAGS.has(tag)) {
            return; // supprimé avec son contenu
        }

        // Enfants assainis récursivement (toujours nécessaire).
        const innerFragment = _sanitizeChildren(child);

        if (SANITIZE_ALLOWED_TAGS.has(tag)) {
            // Recréer l'élément à neuf → aucun attribut conservé.
            const clean = document.createElement(tag.toLowerCase());
            clean.appendChild(innerFragment);
            fragment.appendChild(clean);
        } else {
            // Balise inconnue mais non dangereuse : on la déballe.
            fragment.appendChild(innerFragment);
        }
    });

    return fragment;
}

/**
 * Assainit une chaîne HTML enrichie en ne gardant qu'une liste blanche de
 * balises de mise en forme, sans aucun attribut.
 * @param {string} html - HTML potentiellement dangereux.
 * @returns {string} HTML assaini, sûr pour une insertion via innerHTML.
 */
function sanitizeRichHtml(html) {
    if (!html || typeof html !== 'string') return '';

    const template = document.createElement('template');
    template.innerHTML = html;

    const cleanFragment = _sanitizeChildren(template.content);

    const container = document.createElement('div');
    container.appendChild(cleanFragment);
    return container.innerHTML;
}

// Exposition explicite sur window (cohérent avec le reste du projet).
window.sanitizeRichHtml = sanitizeRichHtml;
