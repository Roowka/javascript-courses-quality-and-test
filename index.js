require('dotenv').config();
const express = require('express');
const path = require('path');
const Game = require('./game.js');

const PORT = process.env.PORT || 3030;

const app = express();
const game = new Game();

const scores = [];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Routes
app.get('/', (request, response) => {
    response.render('pages/index', {
        game: game.unknowWord,
        word: game.word,
    });
});

// Route pour afficher le résultat
app.get('/result', (req, res) => {
    const { word, score, result } = req.query;

    // Vérification des données (protection minimale)
    if (!word || !score || !result) {
        return res.redirect('/');
    }

    // Message selon le résultat
    const resultMessage = result === 'win' ? 'Félicitations, vous avez gagné ! 🎉' : 'Dommage, vous avez perdu ! 😢';
    res.render('pages/result', { word, score, resultMessage });
});

// Create a new html page that display the scores
app.get('/scores', (request, response) => {
    response.render('pages/scores', { scores: scores });
});

app.post('/', (request, response) => {
    try {
        if (request.body.reset) {
            console.log("Reset !");
            game.reset();
        } else if (request.body.word) {
            let guess = game.guess(request.body.word);
            console.log("Guess :" + guess);
        } else {
            console.log("No word provided in the request body.");
        }

        response.render('pages/index', {
            unknowWord: game.unknowWord,
            word: game.word,
        });
    } catch (error) {
        console.error(error.message);
        response.status(500).send("An error occurred: " + error.message);
    }
});

app.post('/api/guess', (req, res) => {
    const { letter, unknowWord, tries, score } = req.body;

    if (!letter) {
        return res.status(400).send("No letter provided in the request body.");
    }

    const result = game.guess(letter, unknowWord);

    // Victoire : le mot est complètement deviné
    if (!result.unknowWord.includes('#')) {
        return res.json({
            result,
            redirectTo: `/result?word=${game.word}&score=${score}&result=win`
        });
    }

    // Défaite : plus d'essais restants
    if (tries <= 1) {
        return res.json({
            result,
            redirectTo: `/result?word=${game.word}&score=${score}&result=lose`
        });
    }

    // Sinon, continuer la partie
    res.json({ result });
});


// API to get the current word
app.get('/api/current-word', (request, response) => {
    response.json({ currentWord: game.word });
});

// Add a random score to the scores array with the /api/score endpoint
app.get('/api/score/add', (request, response) => {
    const score = Math.floor(Math.random() * 100);
    scores.push(score);
    response.json({ score: score });
});

// Get all the scores
app.get('/api/scores', (request, response) => {
    response.json({ scores: scores });
});

(async () => {
    try {
        await game.loadWords();
        app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
    } catch (error) {
        console.error("Failed to load words and start the server:", error);
    }
})();
