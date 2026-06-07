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

    // ─────────────────────────────────────────────────────────────────────────
    // 4. TESTS IMPORT MOODLE XML + MÉDIAS BASE64 (chantiers n°7 et n°8)
    // ─────────────────────────────────────────────────────────────────────────
    async function runXmlImportTests() {
        // PNG transparent 1×1 (base64) pour les tests de média embarqué.
        const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        /** Premier id interne de question présent dans le DOM. */
        function firstQid() {
            const c = document.querySelector('.question-container');
            return c ? c.dataset.id : null;
        }

        // ── Aiguillage ───────────────────────────────────────────────────────
        await test('XML import : looksLikeMoodleXml détecte <quiz>, ignore le GIFT', () => {
            assert(window.looksLikeMoodleXml('<?xml version="1.0"?>\n<quiz></quiz>') === true, 'XML reconnu');
            assert(window.looksLikeMoodleXml('::Q01::Texte{T}') === false, 'GIFT non reconnu comme XML');
        });

        // ── Export média base64 (chantier n°8) ───────────────────────────────
        await test('XML export : média embarqué en <file base64> + tag @@PLUGINFILE@@', () => {
            resetApp();
            window.questionMediaFiles = {};
            const id = newQuestion('tf');
            document.getElementById(`true-option-${id}`).checked = true;
            setRichTextValue(`question-text-${id}`, 'Avec image');
            window.questionMediaFiles[id] = new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' });

            const xml = generateMoodleXmlCode({ [id]: 'QUJD' }); // base64 factice « ABC »
            assertMatch(xml, /<file name="[^"]*_media\.png" path="\/" encoding="base64">QUJD<\/file>/, '<file> base64 émis');
            assertMatch(xml, /@@PLUGINFILE@@\/[^"]*_media\.png/, 'tag @@PLUGINFILE@@ inséré');
            assertMatch(xml, /<img src="@@PLUGINFILE@@/, 'balise <img> HTML (sans échappement GIFT)');
            window.questionMediaFiles = {};
        });

        await test('XML export : aucun <file> si aucun média (rétrocompatible)', () => {
            resetApp();
            window.questionMediaFiles = {};
            const id = newQuestion('tf');
            document.getElementById(`true-option-${id}`).checked = true;
            setRichTextValue(`question-text-${id}`, 'Sans média');
            const xml = generateMoodleXmlCode();
            assertNoMatch(xml, /<file /, 'pas de balise <file> sans média');
        });

        // ── Import par type ──────────────────────────────────────────────────
        await test('XML import QCM : type mc + feedback combiné restitué', async () => {
            resetApp();
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="multichoice">
    <name><text>ECO-Q01</text></name>
    <questiontext format="html"><text><![CDATA[<p>Capitale ?</p>]]></text></questiontext>
    <single>false</single>
    <correctfeedback format="html"><text><![CDATA[<p>Bravo</p>]]></text></correctfeedback>
    <incorrectfeedback format="html"><text><![CDATA[<p>Raté</p>]]></text></incorrectfeedback>
    <answer fraction="100" format="html"><text><![CDATA[<p>Paris</p>]]></text></answer>
    <answer fraction="0" format="html"><text><![CDATA[<p>Londres</p>]]></text></answer>
  </question>
</quiz>`;
            await window.importMoodleXmlContent(xml);
            const qid = firstQid();
            assert(qid !== null, 'une question créée');
            assert(document.getElementById(IDS.typeRadio('mc', qid)).checked === true, 'type QCM sélectionné');
            assertMatch(gift(), /=[^\n]*Paris/, 'Paris en bonne réponse');
            assertMatch(gift(), /~[^\n]*Londres/, 'Londres en mauvaise réponse');
            assertMatch(getRichTextValue(IDS.correctFeedback(qid)), /Bravo/, 'feedback correct restitué');
            assertMatch(getRichTextValue(IDS.incorrectFeedback(qid)), /Raté/, 'feedback incorrect restitué');
        });

        await test('XML import QCU : single=true → type sc', async () => {
            resetApp();
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="multichoice">
    <name><text>Q</text></name>
    <questiontext format="html"><text><![CDATA[<p>Une seule</p>]]></text></questiontext>
    <single>true</single>
    <answer fraction="100" format="html"><text><![CDATA[<p>Vrai</p>]]></text></answer>
    <answer fraction="0" format="html"><text><![CDATA[<p>Faux</p>]]></text></answer>
  </question>
</quiz>`;
            await window.importMoodleXmlContent(xml);
            const qid = firstQid();
            assert(document.getElementById(IDS.typeRadio('sc', qid)).checked === true, 'type QCU sélectionné');
            assertMatch(gift(), /=[^\n]*Vrai/, 'bonne réponse QCU');
        });

        await test('XML import Vrai/Faux : true à 100 % coche « Vrai »', async () => {
            resetApp();
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="truefalse">
    <name><text>Q</text></name>
    <questiontext format="html"><text><![CDATA[<p>Affirmation</p>]]></text></questiontext>
    <answer fraction="100" format="moodle_auto_format"><text>true</text></answer>
    <answer fraction="0" format="moodle_auto_format"><text>false</text></answer>
  </question>
</quiz>`;
            await window.importMoodleXmlContent(xml);
            const qid = firstQid();
            assert(document.getElementById(IDS.trueOption(qid)).checked === true, '« Vrai » coché');
            assert(document.getElementById(IDS.falseOption(qid)).checked === false, '« Faux » décoché');
        });

        await test('XML import QRC : <usecase>1</usecase> → sélecteur sensible à la casse', async () => {
            resetApp();
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="shortanswer">
    <name><text>Q</text></name>
    <questiontext format="html"><text><![CDATA[<p>Traduire</p>]]></text></questiontext>
    <usecase>1</usecase>
    <answer fraction="100" format="moodle_auto_format"><text>Bonjour</text></answer>
  </question>
</quiz>`;
            await window.importMoodleXmlContent(xml);
            const qid = firstQid();
            const opt = document.querySelector(`#sa-options-list-${qid} .option-container`);
            const oid = opt.querySelector('.remove-sa-option-btn').getAttribute('data-oid');
            assertEqual(document.getElementById(IDS.saOptionText(qid, oid)).value, 'Bonjour', 'réponse importée');
            assertEqual(document.getElementById(IDS.saCase(qid, oid)).value, 'case_sensitive', 'casse sensible restituée');
        });

        await test('XML import Numérique : <tolerance> → marge cochée', async () => {
            resetApp();
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="numerical">
    <name><text>Q</text></name>
    <questiontext format="html"><text><![CDATA[<p>Combien</p>]]></text></questiontext>
    <answer fraction="100" format="moodle_auto_format"><text>42</text><tolerance>2</tolerance></answer>
  </question>
</quiz>`;
            await window.importMoodleXmlContent(xml);
            const qid = firstQid();
            assertEqual(document.getElementById(IDS.numAnswer(qid)).value, '42', 'réponse numérique');
            assert(document.getElementById(IDS.numRange(qid)).checked === true, 'marge activée');
            assertEqual(document.getElementById(IDS.numMargin(qid)).value, '2', 'tolérance restituée');
        });

        // ── Types non gérés : ignorés (import partiel) ───────────────────────
        await test('XML import : type non géré ignoré, le reste est importé', async () => {
            resetApp();
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="category"><category><text>$course$/Banque</text></category></question>
  <question type="essay">
    <name><text>Dissertation</text></name>
    <questiontext format="html"><text><![CDATA[<p>Rédigez</p>]]></text></questiontext>
  </question>
  <question type="truefalse">
    <name><text>Q</text></name>
    <questiontext format="html"><text><![CDATA[<p>Vrai ?</p>]]></text></questiontext>
    <answer fraction="100" format="moodle_auto_format"><text>true</text></answer>
    <answer fraction="0" format="moodle_auto_format"><text>false</text></answer>
  </question>
</quiz>`;
            await window.importMoodleXmlContent(xml);
            assertEqual(document.querySelectorAll('.question-container').length, 1, 'seule la question gérée est importée');
        });

        // ── Round-trip XML complet ───────────────────────────────────────────
        await test('Round-trip XML : générer → importer → régénérer (feedback combiné stable)', async () => {
            resetApp();
            const id = newQuestion('mc');
            setRichTextValue(`option-text-${id}-1`, 'Paris');
            setRichTextValue(`option-text-${id}-2`, 'Londres');
            document.getElementById(`correct-option-${id}-1`).checked = true;
            setWeight(`option-weight-${id}-1`, '100');
            setWeight(`option-weight-${id}-2`, '0');
            setRichTextValue(`question-text-${id}`, 'Capitale de la France ?');
            setRichTextValue(`correct-feedback-${id}`, 'Bravo');
            setRichTextValue(`incorrect-feedback-${id}`, 'Raté');
            const xml1 = generateMoodleXmlCode();

            resetApp();
            await window.importMoodleXmlContent(xml1);
            const xml2 = generateMoodleXmlCode();

            assertMatch(xml2, /<single>false<\/single>/, 'QCM préservé');
            assertMatch(xml2, /fraction="100"[\s\S]*?Paris/, 'bonne réponse Paris préservée');
            assertMatch(xml2, /correctfeedback[\s\S]*?Bravo/, 'feedback correct préservé');
            assertMatch(xml2, /incorrectfeedback[\s\S]*?Raté/, 'feedback incorrect préservé');
        });

        // ── Médias : round-trip d'import (chantier n°8) ──────────────────────
        await test('XML import média : <file base64> réattaché à la question', async () => {
            resetApp();
            window.questionMediaFiles = {};
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="truefalse">
    <name><text>MED-Q01</text></name>
    <questiontext format="html"><text><![CDATA[<p>Image <img src="@@PLUGINFILE@@/MED-Q01_media.png" alt="media"></p>]]></text><file name="MED-Q01_media.png" path="/" encoding="base64">${PNG_B64}</file></questiontext>
    <answer fraction="100" format="moodle_auto_format"><text>true</text></answer>
    <answer fraction="0" format="moodle_auto_format"><text>false</text></answer>
  </question>
</quiz>`;
            await window.importMoodleXmlContent(xml);
            const qid = firstQid();
            const file = window.questionMediaFiles[qid];
            assert(!!file, 'média réattaché à la question');
            assertEqual(file.name, 'MED-Q01_media.png', 'nom de fichier préservé');
            assertNoMatch(getRichTextValue(IDS.questionText(qid)), /@@PLUGINFILE@@/, 'tag média retiré du texte');
            window.questionMediaFiles = {};
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. TESTS EXPORT LISIBLE : PDF (HTML) + RTF (chantier n°4)
    // ─────────────────────────────────────────────────────────────────────────
    async function runPrintableTests() {
        const META = { author: '', courseCode: '', date: '01/01/2026', title: 'Test' };

        // ── readQuestionState : lecture normalisée ───────────────────────────
        await test('Imprimable : readQuestionState QCM (bonne réponse, poids, feedback)', () => {
            resetApp();
            const id = newQuestion('mc');
            setRichTextValue(`option-text-${id}-1`, 'Paris');
            setRichTextValue(`option-text-${id}-2`, 'Londres');
            document.getElementById(`correct-option-${id}-1`).checked = true;
            setWeight(`option-weight-${id}-1`, '100');
            setRichTextValue(`option-feedback-${id}-1`, 'Exact');
            setRichTextValue(`question-text-${id}`, 'Capitale de la France ?');

            const el = document.querySelector(`.question-container[data-id="${id}"]`);
            const st = readQuestionState(el, 0, '');
            assertEqual(st.typeCode, 'mc', 'type mc');
            assertEqual(st.answers.length, 2, 'deux réponses lues');
            assertEqual(st.answers[0].isCorrect, true, 'Paris correcte');
            assertEqual(st.answers[1].isCorrect, false, 'Londres incorrecte');
            assertMatch(st.answers[0].feedbackHtml, /Exact/, 'feedback option lu');
        });

        await test('Imprimable : readQuestionState QRC (sensibilité à la casse, réponses acceptées)', () => {
            resetApp();
            const id = newQuestion('sa');
            document.getElementById(`sa-option-text-${id}-1`).value = 'Bonjour';
            document.getElementById(`sa-case-${id}-1`).value = 'case_sensitive';
            setRichTextValue(`question-text-${id}`, 'Traduire hello');

            const el = document.querySelector(`.question-container[data-id="${id}"]`);
            const st = readQuestionState(el, 0, '');
            assertEqual(st.answers[0].isCorrect, true, 'réponse acceptée marquée correcte');
            assertEqual(st.answers[0].caseLabel, 'sensible à la casse', 'casse honorée');
        });

        await test('Imprimable : readQuestionState Numérique (valeur + marge)', () => {
            resetApp();
            const id = newQuestion('num');
            document.getElementById(`num-answer-${id}`).value = '42';
            document.getElementById(`num-range-${id}`).checked = true;
            document.getElementById(`num-margin-${id}`).value = '2';
            setRichTextValue(`question-text-${id}`, 'Combien ?');

            const el = document.querySelector(`.question-container[data-id="${id}"]`);
            const st = readQuestionState(el, 0, '');
            assertEqual(st.numeric.value, '42', 'valeur 42');
            assertEqual(st.numeric.margin, '2', 'marge 2');
        });

        await test('Imprimable : question sans texte ignorée (null)', () => {
            resetApp();
            const id = newQuestion('mc');
            const el = document.querySelector(`.question-container[data-id="${id}"]`);
            const st = readQuestionState(el, 0, '');
            assertEqual(st, null, 'question sans énoncé → null');
        });

        // ── RTF : fonctions pures ────────────────────────────────────────────
        await test('RTF : rtfEscape échappe les accents en \\uN?', () => {
            assertEqual(rtfEscape('é'), '\\u233?', 'é → \\u233?');
            assertEqual(rtfEscape('à'), '\\u224?', 'à → \\u224?');
        });

        await test('RTF : rtfEscape protège { } \\ et les ASCII restent intacts', () => {
            assertEqual(rtfEscape('{a}'), '\\{a\\}', 'accolades échappées');
            assertEqual(rtfEscape('a\\b'), 'a\\\\b', 'antislash doublé');
            assertEqual(rtfEscape('Paris'), 'Paris', 'ASCII inchangé');
        });

        await test('RTF : richHtmlToRtf convertit gras et exposant', () => {
            assertMatch(richHtmlToRtf('<b>gras</b>'), /\{\\b gras\}/, '<b> → {\\b …}');
            assertMatch(richHtmlToRtf('x<sup>2</sup>'), /x\{\\super 2\}/, '<sup> → {\\super …}');
        });

        await test('RTF : bonne réponse en gras/turquoise (cf1), mauvaise neutre', () => {
            resetApp();
            const id = newQuestion('mc');
            setRichTextValue(`option-text-${id}-1`, 'Paris');
            setRichTextValue(`option-text-${id}-2`, 'Londres');
            document.getElementById(`correct-option-${id}-1`).checked = true;
            setWeight(`option-weight-${id}-1`, '100');
            setRichTextValue(`question-text-${id}`, 'Capitale ?');

            const states = buildPrintableStates();
            const rtf = buildRtf(states, META);
            assertMatch(rtf, /\{\\b\\cf1 [^{}]*Paris/, 'Paris en gras + couleur correcte');
            assertNoMatch(rtf, /\\cf1[^{}]*Londres/, 'Londres sans la couleur « correcte »');
        });

        await test('RTF : en-tête {\\rtf1 et table de couleurs CNED', () => {
            resetApp();
            const id = newQuestion('tf');
            document.getElementById(`true-option-${id}`).checked = true;
            setRichTextValue(`question-text-${id}`, 'Vrai ?');
            const rtf = buildRtf(buildPrintableStates(), META);
            assertMatch(rtf, /^\{\\rtf1\\ansi/, 'en-tête RTF');
            assertMatch(rtf, /\\red45\\green162\\blue136/, 'turquoise CNED dans la colortbl');
            assertMatch(rtf, /\}$/, 'document refermé');
        });

        // ── HTML / PDF : génération de la chaîne ──────────────────────────────
        await test('HTML imprimable : structure + bonne réponse mise en évidence', () => {
            resetApp();
            const id = newQuestion('mc');
            setRichTextValue(`option-text-${id}-1`, 'Paris');
            setRichTextValue(`option-text-${id}-2`, 'Londres');
            document.getElementById(`correct-option-${id}-1`).checked = true;
            setWeight(`option-weight-${id}-1`, '100');
            setRichTextValue(`question-text-${id}`, 'Capitale ?');

            const html = buildPrintableHtml(buildPrintableStates(), META, { autoPrint: false });
            assertMatch(html, /class="printable-question"/, 'bloc question présent');
            assertMatch(html, /class="pq-answer correct"[\s\S]*?Paris/, 'Paris en réponse correcte');
            assertMatch(html, /✓/, 'marque visuelle de bonne réponse');
            assertMatch(html, /Londres/, 'option incorrecte présente');
        });

        await test('HTML imprimable : énoncé HTML enrichi conservé (balises littérales)', () => {
            resetApp();
            const id = newQuestion('tf');
            document.getElementById(`true-option-${id}`).checked = true;
            setRichTextValue(`question-text-${id}`, '<p>Bonjour</p>');
            const html = buildPrintableHtml(buildPrintableStates(), META, { autoPrint: false });
            assertMatch(html, /<div class="pq-statement"><p>Bonjour<\/p>/, 'énoncé HTML littéral');
        });

        await test('HTML imprimable : en-tête métadonnées (auteur + code article)', () => {
            resetApp();
            const id = newQuestion('tf');
            document.getElementById(`true-option-${id}`).checked = true;
            setRichTextValue(`question-text-${id}`, 'Ok');
            const meta = { author: 'Dupont', courseCode: 'ECO101', date: '01/01/2026', title: 'Questions — ECO101' };
            const html = buildPrintableHtml(buildPrintableStates(), meta, { autoPrint: false });
            assertMatch(html, /Auteur : Dupont/, 'auteur dans l\'en-tête');
            assertMatch(html, /Code article : ECO101/, 'code article dans l\'en-tête');
        });

        await test('HTML imprimable : numérique affiche « valeur ± marge »', () => {
            resetApp();
            const id = newQuestion('num');
            document.getElementById(`num-answer-${id}`).value = '42';
            document.getElementById(`num-range-${id}`).checked = true;
            document.getElementById(`num-margin-${id}`).value = '2';
            setRichTextValue(`question-text-${id}`, 'Combien ?');
            const html = buildPrintableHtml(buildPrintableStates(), META, { autoPrint: false });
            assertMatch(html, /42 ± 2/, 'valeur et marge affichées');
        });

        // ── Médias ───────────────────────────────────────────────────────────
        await test('RTF : image PNG embarquée (\\pict\\pngblip + hex)', async () => {
            resetApp();
            window.questionMediaFiles = {};
            const id = newQuestion('tf');
            document.getElementById(`true-option-${id}`).checked = true;
            setRichTextValue(`question-text-${id}`, 'Avec image');
            window.questionMediaFiles[id] = new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' });

            const states = buildPrintableStates();
            await attachPrintableMedia(states);
            const rtf = buildRtf(states, META);
            assertMatch(rtf, /\{\\pict\\pngblip[\s\S]*?010203\}/, 'image embarquée en \\pict\\pngblip (hex 010203)');
            window.questionMediaFiles = {};
        });

        await test('HTML imprimable : image embarquée en data-URL inline', async () => {
            resetApp();
            window.questionMediaFiles = {};
            const id = newQuestion('tf');
            document.getElementById(`true-option-${id}`).checked = true;
            setRichTextValue(`question-text-${id}`, 'Avec image');
            window.questionMediaFiles[id] = new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' });

            const states = buildPrintableStates();
            await attachPrintableMedia(states);
            const html = buildPrintableHtml(states, META, { autoPrint: false });
            assertMatch(html, /<img src="data:image\/png;base64,/, 'image inline en data-URL');
            window.questionMediaFiles = {};
        });

        await test('Imprimable : GIFT et XML restent intacts (non-régression)', () => {
            resetApp();
            const id = newQuestion('mc');
            setRichTextValue(`option-text-${id}-1`, 'Paris');
            document.getElementById(`correct-option-${id}-1`).checked = true;
            setWeight(`option-weight-${id}-1`, '100');
            setRichTextValue(`question-text-${id}`, 'Capitale ?');
            generateGIFTCode();
            assertMatch(gift(), /\n=[^\n]*Paris/, 'export GIFT toujours fonctionnel');
            assertMatch(generateMoodleXmlCode(), /<question type="multichoice">/, 'export XML toujours fonctionnel');
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. TESTS BANQUES DE QUESTIONS (chantier n°2 — catégories $CATEGORY)
    // ─────────────────────────────────────────────────────────────────────────
    async function runBankTests() {
        const qEl = (qid) => document.querySelector(`.question-container[data-id="${qid}"]`);
        // Crée une question Vrai/Faux AVEC énoncé (sinon la génération l'ignore).
        const tfQuestion = () => {
            const id = newQuestion('tf');
            setRichTextValue(`question-text-${id}`, 'Énoncé');
            return id;
        };

        // ── Fonctions pures ──────────────────────────────────────────────────
        await test('Banque : buildFinalQuestionId (hors banque / banque / manuel)', () => {
            assertEqual(buildFinalQuestionId('', 'CODE', null, 1), 'CODE-Q01', 'hors banque');
            assertEqual(buildFinalQuestionId('', 'CODE', 2, 3), 'CODE-B02-Q03', 'en banque B02, Q03');
            assertEqual(buildFinalQuestionId('FOO', 'CODE', 1, 2), 'FOO-B01-Q02', 'préfixe manuel + banque');
            assertEqual(buildFinalQuestionId('FOO-Q05', 'CODE', 1, 2), 'FOO-Q05', 'ID manuel complet conservé');
            assertEqual(buildFinalQuestionId('', '', null, 1), 'Q-Q01', 'sans code article → préfixe Q');
        });

        await test('Banque : buildCategoryPath et bankNameFromCategoryPath', () => {
            assertEqual(buildCategoryPath('CODE', 'Algèbre', 'B01'), '$course$/CODE/Algèbre', 'chemin code + nom');
            assertEqual(buildCategoryPath('', 'Géométrie', 'B02'), '$course$/Géométrie', 'sans code article');
            assertEqual(buildCategoryPath('CODE', 'a/b', 'B01'), '$course$/CODE/a-b', '« / » du nom neutralisé');
            assertEqual(bankNameFromCategoryPath('$course$/CODE/Algèbre'), 'Algèbre', 'feuille du chemin');
            assertEqual(bankNameFromCategoryPath('Algèbre'), 'Algèbre', 'nom seul');
        });

        // ── Génération GIFT ──────────────────────────────────────────────────
        await test('Banque GIFT : question hors banque garde CODE-QNN (sans -B)', () => {
            resetApp();
            window.courseCode.value = 'CODE';
            tfQuestion();
            generateGIFTCode();
            assertMatch(gift(), /::CODE-Q01::/, 'ID sans segment -B');
            assertNoMatch(gift(), /-B\d+-Q/, 'aucun segment -B hors banque');
            assertNoMatch(gift(), /\$CATEGORY:/, 'aucune directive $CATEGORY hors banque');
        });

        await test('Banque GIFT : question en banque → CODE-B01-Q01 + $CATEGORY', () => {
            resetApp();
            window.courseCode.value = 'CODE';
            const qid = tfQuestion();
            const section = createBank('Algèbre');
            moveQuestionToBank(qEl(qid), section);
            generateGIFTCode();
            const g = gift();
            assertMatch(g, /\$CATEGORY:\s*\$course\$\/CODE\/Algèbre/, 'directive $CATEGORY émise');
            assertMatch(g, /::CODE-B01-Q01::/, 'ID avec segment -B01');
        });

        await test('Banque GIFT : numérotation Q repart à 01 dans chaque banque', () => {
            resetApp();
            window.courseCode.value = 'CODE';
            const q1 = tfQuestion();
            const q2 = tfQuestion();
            const b1 = createBank('A');
            const b2 = createBank('B');
            moveQuestionToBank(qEl(q1), b1);
            moveQuestionToBank(qEl(q2), b2);
            generateGIFTCode();
            const g = gift();
            assertMatch(g, /::CODE-B01-Q01::/, 'banque A → Q01');
            assertMatch(g, /::CODE-B02-Q01::/, 'banque B → Q01');
        });

        // ── Round-trip GIFT ──────────────────────────────────────────────────
        await test('Round-trip GIFT banque : générer → importer → régénérer', async () => {
            resetApp();
            window.courseCode.value = 'CODE';
            const qid = tfQuestion();
            const section = createBank('Histoire');
            moveQuestionToBank(qEl(qid), section);
            generateGIFTCode();
            const g1 = gift();

            resetApp();
            parseGiftContent(g1);
            await wait(300);
            const g2 = gift();
            assertMatch(g2, /\$CATEGORY:\s*\$course\$\/CODE\/Histoire/, 'banque recréée à l\'import');
            assertMatch(g2, /::CODE-B01-Q01::/, 'ID de banque préservé');
            assertEqual(getBankSections().length, 1, 'une banque recréée');
        });

        // ── Export + round-trip XML ──────────────────────────────────────────
        await test('Banque XML : entrée <question type="category"> émise', () => {
            resetApp();
            window.courseCode.value = 'CODE';
            const qid = tfQuestion();
            document.getElementById(`true-option-${qid}`).checked = true;
            const section = createBank('Géo');
            moveQuestionToBank(qEl(qid), section);
            const xml = generateMoodleXmlCode();
            assertMatch(xml, /<question type="category">[\s\S]*?\$course\$\/CODE\/Géo/, 'entrée catégorie émise');
            assertMatch(xml, /<!-- course-code: CODE -->/, 'code article embarqué en commentaire');
        });

        await test('Round-trip XML banque : catégorie préservée + code article rechargé', async () => {
            resetApp();
            window.courseCode.value = 'CODE';
            const qid = tfQuestion();
            document.getElementById(`true-option-${qid}`).checked = true;
            const section = createBank('Géo');
            moveQuestionToBank(qEl(qid), section);
            const xml1 = generateMoodleXmlCode();

            resetApp();
            await window.importMoodleXmlContent(xml1);
            assertEqual(document.getElementById('course-code').value, 'CODE', 'code article rechargé depuis le commentaire');
            assertEqual(getBankSections().length, 1, 'banque recréée à l\'import XML');
            const xml2 = generateMoodleXmlCode();
            assertMatch(xml2, /<question type="category">[\s\S]*?\$course\$\/CODE\/Géo/, 'catégorie préservée');
        });

        // ── Identifiant auto vs manuel à l'import (reste dynamique) ───────────
        await test('Banque : ID auto importé reste vide (dynamique), ID manuel conservé', () => {
            // Auto : base = code article → champ vide
            assertEqual(window.cleanQuestionId('CODE-B01-Q03', 'CODE').id, '', 'ID auto → champ vide');
            assertEqual(window.cleanQuestionId('CODE-Q03', 'CODE').id, '', 'ID auto sans banque → champ vide');
            // Manuel : base ≠ code article → base conservée (suffixe -B/-Q retiré)
            assertEqual(window.cleanQuestionId('FOO-B01-Q03', 'CODE').id, 'FOO', 'ID manuel → base conservée');
            assertEqual(window.cleanQuestionId('MANUEL', 'CODE').id, 'MANUEL', 'ID manuel sans suffixe conservé');
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
                await runXmlImportTests();
                await runPrintableTests();
                await runBankTests();
            } catch (err) {
                record('Initialisation de la suite', 'FAIL', String(err));
            }
            render();
        }, 50);
    });
})();
