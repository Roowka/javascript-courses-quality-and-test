require('dotenv').config();
const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');
const Game = require('./game');
const wordBank = require('./wordBank');
const PORT = process.env.PORT || 3030;

const app = express();
const scores = [];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Stockage des sessions de jeux par utilisateur
const games = {};

// Middleware pour gérer les sessions de jeu
app.use((req, res, next) => {
    const sessionId = req.headers['x-session-id'] || req.ip;

    if (!games[sessionId]) {
        const game = new Game();
        games[sessionId] = game;
        game.reset();
    }

    req.game = games[sessionId];
    next();
});

// Routes
app.get('/', (req, res) => {
    const game = req.game;
    res.render('pages/index', {
        game: game.unknowWord,
        word: game.word, // Ne pas envoyer le mot au front-end en production
    });
});

app.get('/api/current-word', (req, res) => {
    const game = req.game;

    if (!game.word) {
        return res.status(404).json({ error: 'No word set. Please start a new game.' });
    }

    res.json({ currentWord: game.word });
});

app.post('/api/reset', (req, res) => {
    const game = req.game;
    game.reset(); // Réinitialiser le jeu
    res.status(200).json({ message: 'Game reset successfully.', unknowWord: game.unknowWord });
});

// Route pour afficher le résultat
app.get('/result', async (req, res) => {
    const {data} = req.query;

    if (!data) {
        return res.redirect('/');
    }

    let decodedData;
    try {
        decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    } catch (error) {
        console.error('Erreur de décodage Base64 :', error);
        return res.redirect('/');
    }

    const {word, score, result} = decodedData;

    const resultMessage =
        result === 'win'
            ? 'Félicitations, vous avez gagné ! 🎉'
            : 'Dommage, vous avez perdu ! 😢';

    const fileName = `${Date.now()}.png`;
    const filePath = path.join(__dirname, 'public', 'shared-images', fileName);
    const imageUrl = `/shared-images/${fileName}`;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Génération du contenu HTML pour l'image
        const htmlContent = `
        <html lang="fr">
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: linear-gradient(120deg, #3b82f6, #9333ea); color: white; text-align: center;">
            <div style="width: 800px; height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <h1 style="font-size: 44px; margin-bottom: 20px;">${resultMessage}</h1>
                <div style="background: white; color: black; padding: 24px 42px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <p style="font-size: 32px; margin: 10px 0;">Le mot était : <strong>${word}</strong></p>
                    <p style="font-size: 32px; margin: 10px 0;">Score : <strong style="color: #e11d48;">${score}</strong></p>
                </div>
                <div style="margin-top: 24px; font-size: 24px;">
                    <p>Relevez le défi maintenant !</p>
                </div>
            </div>
        </body>
        </html>
        `;

        // Charger le contenu HTML dans la page
        await page.setViewport({width: 800, height: 400});
        await page.setContent(htmlContent);

        // Sauvegarder l'image
        await page.screenshot({path: filePath});
        await browser.close();
    } catch (error) {
        console.error('Error generating image:', error);
    }

    res.render('pages/result', {
        word,
        score,
        resultMessage,
        imageUrl,
        baseUrl,
        result,
    });
});

// Route pour gérer les tentatives
app.post('/api/guess', (req, res) => {
    const { letter } = req.body;

    if (!letter || letter.length !== 1) {
        return res.status(400).json({ error: 'Invalid letter provided.' });
    }

    const game = req.game;
    const result = game.guess(letter);

    if (!result.unknowWord.includes('#')) {
        const data = {
            word: game.word,
            score: 100,
            result: 'win',
        };
        const encodedData = Buffer.from(JSON.stringify(data)).toString('base64');
        return res.json({
            result,
            status: 'win',
            redirectTo: `/result?data=${encodedData}`,
        });
    } else if (game.getNumberOfTries() <= 0) {
        const data = {
            word: game.word,
            score: 0,
            result: 'lose',
        };
        const encodedData = Buffer.from(JSON.stringify(data)).toString('base64');
        return res.json({
            result,
            status: 'lose',
            redirectTo: `/result?data=${encodedData}`,
        });
    }

    res.json({
        result,
        status: 'continue',
    });
});



// Lancer le serveur
(async () => {
    try {
        await wordBank.loadWords(); // Charger les mots une seule fois

        app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
    } catch (error) {
        console.error('Failed to load words and start the server:', error);
    }
})();
