// ── Harnais de tests vanilla — Générateur de code GIFT ─────────────────────
//
// Aucune dépendance, aucun build : ouvrir `tests/tests.html` dans un navigateur.
// Les résultats s'affichent dans la page ET dans la console.
//
// Deux familles de tests :
//   1. Fonctions pures (typographie, balises, en-tête) — déterministes.
//   2. Intégration round-trip (génération / import) — pilotent les vraies
//      fonctions de l'application sur un DOM réduit.
//
// Chaque test est isolé : une exception est rapportée comme ÉCHEC sans
// interrompre la suite. Référence audit : [M1].
// ───────────────────────────────────────────────────────────────────────────

(function () {
    'use strict';

    // ── Mini-framework d'assertions ──────────────────────────────────────────
    const results = [];

    function record(name, status, detail) {
        results.push({ name, status, detail: detail || '' });
        const tag = status === 'PASS' ? '✅' : status === 'SKIP' ? '⏭️' : '❌';
        console.log(`${tag} ${name}${detail ? ' — ' + detail : ''}`);
    }

    /**
     * Enregistre et exécute un test synchrone.
     * @param {string}   name - Libellé du test.
     * @param {Function} fn   - Corps du test ; lève une erreur en cas d'échec.
     */
    async function test(name, fn) {
        try {
            await fn();
            record(name, 'PASS');
        } catch (err) {
            if (err && err.__skip) {
                record(name, 'SKIP', err.message);
            } else {
                record(name, 'FAIL', err && err.message ? err.message : String(err));
            }
        }
    }

    function assert(cond, message) {
        if (!cond) throw new Error(message || 'assertion échouée');
    }
    function assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message || 'égalité attendue'} — attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`);
        }
    }
    function assertMatch(text, regex, message) {
        if (!regex.test(text)) {
            throw new Error(`${message || 'motif attendu'} — ${regex} introuvable dans :\n${text}`);
        }
    }
    function assertNoMatch(text, regex, message) {
        if (regex.test(text)) {
            throw new Error(`${message || 'motif interdit présent'} — ${regex} trouvé dans :\n${text}`);
        }
    }
    function skip(message) {
        const e = new Error(message);
        e.__skip = true;
        throw e;
    }
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const NBSP = ' ';

    // ── Helpers de pilotage de l'application ─────────────────────────────────
    function resetApp() {
        window.questionsContainer.innerHTML = '';
        window.giftOutput.value = '';
        window.questionCounter = 0;
        window.authorLastname.value = '';
        window.authorFirstname.value = '';
        window.courseCode.value = '';
    }

    /** Crée une question du type voulu et renvoie son id interne. */
    function newQuestion(type) {
        addNewQuestion();
        const all = document.querySelectorAll('.question-container');
        const id = all[all.length - 1].dataset.id;
        const radio = document.getElementById(`${type}-type-${id}`);
        if (radio) radio.checked = true;
        return id;
    }

    function setWeight(selectId, value) {
        const s = document.getElementById(selectId);
        s.value = String(value);
        s.setAttribute('data-full-value', String(value));
    }

    function gift() {
        return document.getElementById('gift-output').value;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. TESTS DE FONCTIONS PURES (vérifiés aussi hors navigateur)
    // ─────────────────────────────────────────────────────────────────────────
    async function runPureTests() {
        await test('Typographie : espace insécable avant « ? »', () => {
            assertEqual(addNonBreakingSpaces('Pourquoi ?'), 'Pourquoi' + NBSP + '?');
        });
        await test('Typographie : espace insécable avant « : »', () => {
            assertEqual(addNonBreakingSpaces('Note : ok'), 'Note' + NBSP + ': ok');
        });
        await test('Typographie : guillemets français', () => {
            assertEqual(addNonBreakingSpaces('« mot »'), '«' + NBSP + 'mot' + NBSP + '»');
        });
        await test('Typographie : pas d\'espace ajouté sans espace préalable', () => {
            assertEqual(addNonBreakingSpaces('mot?'), 'mot?');
        });
        await test('Typographie : balises HTML préservées', () => {
            assertEqual(addNonBreakingSpaces('<b>Quoi ?</b>'), '<b>Quoi' + NBSP + '?</b>');
        });
        await test('addHtmlTags : texte brut enveloppé dans <p>', () => {
            assertEqual(addHtmlTags('Bonjour'), '<p>Bonjour</p>');
        });
        await test('addHtmlTags : bloc existant préservé', () => {
            assertEqual(addHtmlTags('<p>Déjà</p>'), '<p>Déjà</p>');
        });
        await test('buildQuestionLine : en-tête GIFT sans média', () => {
            assertEqual(
                buildQuestionLine('ECO-Q01', '999', '<p>Txt</p>'),
                '::ECO-Q01::[html]<p>Txt</p>\n{'
            );
        });

        // ── Sécurité XSS [S1/S3] ─────────────────────────────────────────────
        await test('sanitizeRichHtml : conserve la mise en forme autorisée', () => {
            assertEqual(sanitizeRichHtml('<b>gras</b> et <i>ital</i>'), '<b>gras</b> et <i>ital</i>');
        });
        await test('sanitizeRichHtml : supprime <script> et son contenu', () => {
            assertEqual(sanitizeRichHtml('<script>alert(1)</script>texte'), 'texte');
        });
        await test('sanitizeRichHtml : neutralise <img onerror>', () => {
            assertEqual(sanitizeRichHtml('<img src=x onerror="alert(1)">'), '');
        });
        await test('sanitizeRichHtml : retire les attributs on* des balises permises', () => {
            assertEqual(sanitizeRichHtml('<p onclick="x()">hi</p>'), '<p>hi</p>');
        });
        await test('sanitizeRichHtml : déballe les liens javascript:', () => {
            assertEqual(sanitizeRichHtml('<a href="javascript:alert(1)">lien</a>'), 'lien');
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. TESTS D'INTÉGRATION (génération / round-trip)
    // ─────────────────────────────────────────────────────────────────────────
    async function runIntegrationTests() {
        await test('QCM : 100 % génère « = », option fausse génère « ~ » [B2/0.10.1]', () => {
            resetApp();
            const id = newQuestion('mc');
            setRichTextValue(`option-text-${id}-1`, 'Paris');
            setRichTextValue(`option-text-${id}-2`, 'Londres');
            document.getElementById(`correct-option-${id}-1`).checked = true;
            setWeight(`option-weight-${id}-1`, '100');
            setRichTextValue(`question-text-${id}`, 'Capitale de la France ?');
            generateGIFTCode();
            const out = gift();
            assertMatch(out, /\n=[^\n]*Paris/, 'ligne = pour la bonne réponse');
            assertMatch(out, /\n~[^\n]*Londres/, 'ligne ~ pour la mauvaise réponse');
            assertNoMatch(out, /100%/, 'aucun « 100% » ne doit être visible');
        });

        await test('QCM : poids partiel sans décimales superflues [B2]', () => {
            resetApp();
            const id = newQuestion('mc');
            setRichTextValue(`option-text-${id}-1`, 'Bonne');
            setRichTextValue(`option-text-${id}-2`, 'Aussi');
            document.getElementById(`correct-option-${id}-1`).checked = true;
            document.getElementById(`correct-option-${id}-2`).checked = true;
            setWeight(`option-weight-${id}-1`, '50');
            setWeight(`option-weight-${id}-2`, '50');
            setRichTextValue(`question-text-${id}`, 'Deux bonnes réponses');
            generateGIFTCode();
            const out = gift();
            assertMatch(out, /~%50%/, 'poids 50 % sans trailing zeros');
            assertNoMatch(out, /50\.0+%/, 'pas de 50.00000%');
        });

        await test('QCU : bonne réponse « = », autre « ~ » (chemin factorisé [D1])', () => {
            resetApp();
            const id = newQuestion('sc');
            setRichTextValue(`sc-option-text-${id}-1`, 'Vrai');
            setRichTextValue(`sc-option-text-${id}-2`, 'Faux');
            document.getElementById(`sc-correct-${id}-1`).checked = true;
            setRichTextValue(`question-text-${id}`, 'Une seule bonne réponse');
            generateGIFTCode();
            const out = gift();
            assertMatch(out, /\n=[^\n]*Vrai/, 'bonne réponse générée en =');
            assertMatch(out, /\n~[^\n]*Faux/, 'autre réponse générée en ~');
        });

        await test('QCM : poids non nul sur option NON cochée génère « ~%X% » [B4]', () => {
            resetApp();
            const id = newQuestion('mc');
            setRichTextValue(`option-text-${id}-1`, 'Bonne');
            setRichTextValue(`option-text-${id}-2`, 'Piège');
            document.getElementById(`correct-option-${id}-1`).checked = true;
            setWeight(`option-weight-${id}-1`, '100');
            setWeight(`option-weight-${id}-2`, '-50'); // non cochée, mais malus saisi
            setRichTextValue(`question-text-${id}`, 'Choisissez');
            generateGIFTCode();
            const out = gift();
            assertMatch(out, /~%-50%[^\n]*Piège/, 'malus ~%-50% respecté sur l\'option non cochée');
        });

        await test('QRC : réponse à 100 % génère « =texte » sans pourcentage [B2]', () => {
            resetApp();
            const id = newQuestion('sa');
            document.getElementById(`sa-option-text-${id}-1`).value = 'Bonjour';
            setRichTextValue(`question-text-${id}`, 'Traduisez hello');
            generateGIFTCode();
            const out = gift();
            assertMatch(out, /\n=Bonjour/, 'ligne =Bonjour');
            assertNoMatch(out, /=%100%/, 'pas de =%100%');
        });

        await test('Vrai/Faux : « Vrai » coché génère « T »', () => {
            resetApp();
            const id = newQuestion('tf');
            document.getElementById(`true-option-${id}`).checked = true;
            setRichTextValue(`question-text-${id}`, 'Affirmation vraie');
            generateGIFTCode();
            assertMatch(gift(), /\{T/, 'le corps contient {T');
        });

        await test('Numérique : réponse exacte génère « #valeur »', () => {
            resetApp();
            const id = newQuestion('num');
            document.getElementById(`num-answer-${id}`).value = '42';
            setRichTextValue(`question-text-${id}`, 'La réponse ?');
            generateGIFTCode();
            assertMatch(gift(), /\{#42/, 'le corps contient {#42');
        });

        await test('Métadonnées : en-tête auteur + code + identifiant auto', () => {
            resetApp();
            window.authorLastname.value = 'Grandsire';
            window.authorFirstname.value = 'Vincent';
            window.courseCode.value = 'ECO101';
            const id = newQuestion('tf');
            document.getElementById(`true-option-${id}`).checked = true;
            setRichTextValue(`question-text-${id}`, 'Affirmation');
            generateGIFTCode();
            const out = gift();
            assertMatch(out, /\/\/ Auteur: Vincent Grandsire/, 'ligne auteur');
            assertMatch(out, /\/\/ Code article: ECO101/, 'ligne code article');
            assertMatch(out, /::ECO101-Q01::/, 'identifiant GIFT auto ECO101-Q01');
        });

        // ── Éditeur enrichi sans execCommand [M2] ────────────────────────────
        function makeEditor(html) {
            const host = document.createElement('div');
            host.setAttribute('contenteditable', 'true');
            host.className = 'rte-editor';
            host.innerHTML = html;
            document.getElementById('app-scaffold').appendChild(host);
            return host;
        }
        function selectContents(node) {
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(node);
            sel.removeAllRanges();
            sel.addRange(range);
        }

        await test('RTE [M2] : applyFormat enveloppe la sélection en <b>', () => {
            const host = makeEditor('Bonjour');
            selectContents(host);
            rteApplyFormat(host, 'B');
            assertMatch(host.innerHTML, /<b>Bonjour<\/b>/i, 'gras appliqué');
            host.remove();
        });

        await test('RTE [M2] : second appel retire le gras (toggle)', () => {
            const host = makeEditor('<b>Bonjour</b>');
            selectContents(host.querySelector('b'));
            rteApplyFormat(host, 'B');
            assertNoMatch(host.innerHTML, /<b>/i, 'gras retiré');
            assertMatch(host.textContent, /Bonjour/, 'texte conservé');
            host.remove();
        });

        await test('RTE [M2] : clearFormatting retire la mise en forme', () => {
            const host = makeEditor('a <b>b</b> <i>c</i>');
            rteClearFormatting(host);
            assertNoMatch(host.innerHTML, /<(b|i|strong|em)>/i, 'plus de balises de forme');
            assertMatch(host.textContent, /a\s*b\s*c/, 'texte conservé');
            host.remove();
        });

        await test('RTE [M2] : isFormatActive détecte le contexte', () => {
            const host = makeEditor('<b>gras</b>');
            selectContents(host.querySelector('b'));
            assert(rteIsFormatActive(host, 'B') === true, 'B actif');
            assert(rteIsFormatActive(host, 'I') === false, 'I inactif');
            host.remove();
        });

        // ── Déplacement des questions [0.16.0] ───────────────────────────────
        await test('Déplacement : monter/descendre réordonne les questions [0.16.0]', () => {
            resetApp();
            const id1 = newQuestion('tf');
            setRichTextValue(`question-text-${id1}`, 'Première');
            const id2 = newQuestion('tf');
            setRichTextValue(`question-text-${id2}`, 'Deuxième');

            let containers = document.querySelectorAll('.question-container');
            assertEqual(containers[0].dataset.id, id1, 'ordre initial : id1 en tête');

            // Monter la deuxième → elle passe en premier
            moveQuestion(id2, 'up');
            containers = document.querySelectorAll('.question-container');
            assertEqual(containers[0].dataset.id, id2, 'id2 remonté en tête');
            assertEqual(containers[1].dataset.id, id1, 'id1 redescendu');
            assertEqual(containers[0].querySelector('h2').textContent, 'Question 1', 'titre renuméroté');

            // Descendre id2 → retour à l'ordre initial
            moveQuestion(id2, 'down');
            containers = document.querySelectorAll('.question-container');
            assertEqual(containers[0].dataset.id, id1, 'retour à l\'ordre initial');
        });

        await test('Déplacement : flèches d\'extrémité désactivées [0.16.0]', () => {
            resetApp();
            newQuestion('tf');
            newQuestion('tf');
            const containers = document.querySelectorAll('.question-container');
            const first = containers[0];
            const last  = containers[containers.length - 1];
            assert(first.querySelector('.move-up-btn').disabled === true, 'flèche haut désactivée en tête');
            assert(last.querySelector('.move-down-btn').disabled === true, 'flèche bas désactivée en pied');
            assert(first.querySelector('.move-down-btn').disabled === false, 'flèche bas active en tête');
            assert(last.querySelector('.move-up-btn').disabled === false, 'flèche haut active en pied');
        });

        await test('Round-trip QRC : générer → importer → régénérer', async () => {
            resetApp();
            const id = newQuestion('sa');
            document.getElementById(`sa-option-text-${id}-1`).value = 'Bonjour';
            setRichTextValue(`question-text-${id}`, 'Traduire hello');
            generateGIFTCode();
            const g1 = gift();
            // Import du code généré. parseGiftContent reconstruit le DOM via un
            // setTimeout interne (~100 ms) puis reclique « Générer » : on attend.
            resetApp();
            parseGiftContent(g1);
            await wait(300);
            assert(
                document.querySelectorAll('.question-container').length > 0,
                'au moins une question reconstruite après import'
            );
            assertMatch(gift(), /\n=Bonjour/, 'réponse préservée après round-trip');
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. TESTS EXPORT MOODLE XML (chantier n°5 — feedback combiné)
    // ─────────────────────────────────────────────────────────────────────────
    async function runXmlTests() {
        // ── Fonctions pures d'encodage ───────────────────────────────────────
        await test('XML : xmlEscapeText échappe & < > " \'', () => {
            assertEqual(xmlEscapeText('a & b < c > d " e \' f'),
                'a &amp; b &lt; c &gt; d &quot; e &apos; f');
        });
        await test('XML : wrapCdata neutralise la séquence ]]>', () => {
            assertEqual(wrapCdata('a]]>b'), '<![CDATA[a]]]]><![CDATA[>b]]>');
        });

        // ── Mapping des types ────────────────────────────────────────────────
        await test('XML QCM : type multichoice, single=false, fractions', () => {
            resetApp();
            const id = newQuestion('mc');
            setRichTextValue(`option-text-${id}-1`, 'Bonne');
            setRichTextValue(`option-text-${id}-2`, 'Mauvaise');
            document.getElementById(`correct-option-${id}-1`).checked = true;
            setWeight(`option-weight-${id}-1`, '100');
            setWeight(`option-weight-${id}-2`, '0');
            setRichTextValue(`question-text-${id}`, 'Choisir');
            const xml = generateMoodleXmlCode();
            assertMatch(xml, /<question type="multichoice">/, 'type multichoice');
            assertMatch(xml, /<single>false<\/single>/, 'single=false pour QCM');
            assertMatch(xml, /fraction="100"/, 'fraction 100 sur la bonne');
            assertMatch(xml, /fraction="0"/, 'fraction 0 sur la mauvaise');
        });

        await test('XML QCU : type multichoice, single=true', () => {
            resetApp();
            const id = newQuestion('sc');
            setRichTextValue(`sc-option-text-${id}-1`, 'Vrai');
            setRichTextValue(`sc-option-text-${id}-2`, 'Faux');
            document.getElementById(`sc-correct-${id}-1`).checked = true;
            setRichTextValue(`question-text-${id}`, 'Une seule');
            const xml = generateMoodleXmlCode();
            assertMatch(xml, /<single>true<\/single>/, 'single=true pour QCU');
            assertMatch(xml, /fraction="100"[^>]*>[\s\S]*?Vrai/, 'bonne réponse à 100');
        });

        await test('XML Vrai/Faux : type truefalse, answers true/false', () => {
            resetApp();
            const id = newQuestion('tf');
            document.getElementById(`true-option-${id}`).checked = true;
            setRichTextValue(`question-text-${id}`, 'Affirmation');
            const xml = generateMoodleXmlCode();
            assertMatch(xml, /<question type="truefalse">/, 'type truefalse');
            assertMatch(xml, /fraction="100"[^>]*><text>true<\/text>/, 'true à 100');
            assertMatch(xml, /fraction="0"[^>]*><text>false<\/text>/, 'false à 0');
        });

        await test('XML QRC : type shortanswer, <usecase> honoré', () => {
            resetApp();
            const id = newQuestion('sa');
            document.getElementById(`sa-option-text-${id}-1`).value = 'Bonjour';
            document.getElementById(`sa-case-${id}-1`).value = 'case_sensitive';
            setRichTextValue(`question-text-${id}`, 'Traduire');
            const xml = generateMoodleXmlCode();
            assertMatch(xml, /<question type="shortanswer">/, 'type shortanswer');
            assertMatch(xml, /<usecase>1<\/usecase>/, 'sensibilité à la casse → usecase=1');
            assertMatch(xml, /<text>Bonjour<\/text>/, 'réponse présente');
        });

        await test('XML Numérique : type numerical avec tolérance', () => {
            resetApp();
            const id = newQuestion('num');
            document.getElementById(`num-answer-${id}`).value = '42';
            document.getElementById(`num-range-${id}`).checked = true;
            document.getElementById(`num-range-options-${id}`).classList.remove('hidden');
            document.getElementById(`num-margin-${id}`).value = '2';
            setRichTextValue(`question-text-${id}`, 'Combien ?');
            const xml = generateMoodleXmlCode();
            assertMatch(xml, /<question type="numerical">/, 'type numerical');
            assertMatch(xml, /<text>42<\/text>/, 'réponse 42');
            assertMatch(xml, /<tolerance>2<\/tolerance>/, 'tolérance 2');
        });

        // ── Feedback combiné ─────────────────────────────────────────────────
        await test('XML : feedback combiné émis quand renseigné (QCM)', () => {
            resetApp();
            const id = newQuestion('mc');
            setRichTextValue(`option-text-${id}-1`, 'A');
            document.getElementById(`correct-option-${id}-1`).checked = true;
            setWeight(`option-weight-${id}-1`, '100');
            setRichTextValue(`question-text-${id}`, 'Q');
            setRichTextValue(`correct-feedback-${id}`, 'Bravo');
            setRichTextValue(`incorrect-feedback-${id}`, 'Raté');
            const xml = generateMoodleXmlCode();
            assertMatch(xml, /<correctfeedback format="html"><text><!\[CDATA\[[\s\S]*?Bravo/, 'correctfeedback présent');
            assertMatch(xml, /<incorrectfeedback format="html"><text><!\[CDATA\[[\s\S]*?Raté/, 'incorrectfeedback présent');
        });

        await test('XML : feedback combiné absent si non renseigné', () => {
            resetApp();
            const id = newQuestion('mc');
            setRichTextValue(`option-text-${id}-1`, 'A');
            document.getElementById(`correct-option-${id}-1`).checked = true;
            setWeight(`option-weight-${id}-1`, '100');
            setRichTextValue(`question-text-${id}`, 'Q');
            const xml = generateMoodleXmlCode();
            assertNoMatch(xml, /<correctfeedback/, 'pas de balise correctfeedback vide');
        });

        await test('XML : feedback combiné ignoré dans l\'export GIFT', () => {
            resetApp();
            const id = newQuestion('mc');
            setRichTextValue(`option-text-${id}-1`, 'A');
            document.getElementById(`correct-option-${id}-1`).checked = true;
            setWeight(`option-weight-${id}-1`, '100');
            setRichTextValue(`question-text-${id}`, 'Q');
            setRichTextValue(`correct-feedback-${id}`, 'BravoUnique123');
            generateGIFTCode();
            assertNoMatch(gift(), /BravoUnique123/, 'le feedback combiné n\'apparaît pas en GIFT');
        });

        // ── Encodage HTML / échappement ──────────────────────────────────────
        await test('XML : énoncé HTML enrichi encapsulé en CDATA (balises non échappées)', () => {
            resetApp();
            const id = newQuestion('tf');
            document.getElementById(`true-option-${id}`).checked = true;
            setRichTextValue(`question-text-${id}`, 'Bonjour');
            const xml = generateMoodleXmlCode();
            // Approche CDATA : les balises de bloc passent littéralement (<p>…</p>),
            // sans être transformées en entités (&lt;p&gt;).
            assertMatch(xml, /<questiontext format="html"><text><!\[CDATA\[<p>Bonjour<\/p>\]\]><\/text>/, 'énoncé en CDATA avec balises littérales');
            assertNoMatch(xml, /&lt;p&gt;/, 'pas d\'échappement en entités du HTML');
        });

        await test('XML : document bien formé (déclaration + racine quiz)', () => {
            resetApp();
            const id = newQuestion('tf');
            document.getElementById(`true-option-${id}`).checked = true;
            setRichTextValue(`question-text-${id}`, 'Ok');
            const xml = generateMoodleXmlCode();
            assertMatch(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/, 'déclaration XML');
            assertMatch(xml, /<quiz>[\s\S]*<\/quiz>/, 'racine <quiz>');
        });
    }

    // ── Rendu HTML des résultats ─────────────────────────────────────────────
    function render() {
        const root = document.getElementById('results');
        const pass = results.filter(r => r.status === 'PASS').length;
        const fail = results.filter(r => r.status === 'FAIL').length;
        const skipN = results.filter(r => r.status === 'SKIP').length;

        const summary = document.createElement('div');
        summary.className = 'summary ' + (fail === 0 ? 'ok' : 'ko');
        summary.textContent = `${pass} réussite(s) · ${fail} échec(s) · ${skipN} ignoré(s)`;
        root.appendChild(summary);

        results.forEach(r => {
            const line = document.createElement('div');
            line.className = 'result ' + r.status.toLowerCase();
            const tag = r.status === 'PASS' ? '✅' : r.status === 'SKIP' ? '⏭️' : '❌';
            line.textContent = `${tag} ${r.name}${r.detail ? ' — ' + r.detail : ''}`;
            root.appendChild(line);
        });
    }

    // ── Lancement après initialisation complète de l'application ─────────────
    window.addEventListener('load', function () {
        // Laisser core.js terminer son DOMContentLoaded (question par défaut, etc.)
        setTimeout(async function () {
            try {
                await runPureTests();
                await runIntegrationTests();
                await runXmlTests();
            } catch (err) {
                record('Initialisation de la suite', 'FAIL', String(err));
            }
            render();
        }, 50);
    });
})();
