require('dotenv').config();
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
app.get('/result', (req, res) => {
    const { word, score, result } = req.query;

    if (!word || !score || !result) {
        return res.redirect('/');
    }

    const resultMessage =
        result === 'win'
            ? 'Félicitations, vous avez gagné ! 🎉'
            : 'Dommage, vous avez perdu ! 😢';

    res.render('pages/result', { word, score, resultMessage });
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
        return res.json({
            result,
            status: 'win',
            redirectTo: `/result?word=${game.word}&score=100&result=win`,
        });
    } else if (game.getNumberOfTries() <= 0) {
        return res.json({
            result,
            status: 'lose',
            redirectTo: `/result?word=${game.word}&score=0&result=lose`,
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
