require("dotenv").config();
const express = require("express");
const path = require("path");
const Game = require("./game.js");
const Sqlite = require("./sqlite.js");

const PORT = process.env.PORT || 3030;

const app = express();

const game = new Game();

Sqlite.connect();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Routes
app.get("/", (request, response) => {
  response.render("pages/index", {
    game: game.print(),
    word: game.word,
  });
});

app.post("/api/guess", (request, response) => {
  try {
    let guess = game.guess(request.body.word, request.body.unknowWord);
    response.json({ guess: guess, unknowWord: request.body.unknowWord });
  } catch (error) {
    console.error(error.message);
    response.status(500).send("An error occurred: " + error.message);
  }
});

app.get("/api/word", (request, response) => {
  try {
    let word = game.returnWord();
    response.json({ word: word });
  } catch (error) {
    console.error(error.message);
    response.status(500).send("An error occurred: " + error.message);
  }
});

app.get("/api/scores", (request, response) => {
  try {
    let scores = Sqlite.getPlayers()
      .then((players) => {
        response.json(players);
      })
      .catch((err) => {
        console.error("Failed to get players:", err);
      });
  } catch (error) {
    console.error(error.message);
    response.status(500).send("An error occurred: " + error.message);
  }
});

app.post("/api/scores", (request, response) => {
  try {
    const username = request.body.username;
    const score = request.body.score;
    const date = new Date().toISOString();

    Sqlite.insertPlayer(username, score, date);

    response
      .status(201)
      .json({ success: true, player: { username, score, date } });
  } catch (error) {
    console.error(error.message);
    response.status(500).send("An error occurred: " + error.message);
  }
});

app.get("/api/tries", (request, response) => {
  try {
    let tries = game.getNumberOfTries();
    response.json({ tries: tries });
  } catch (error) {
    console.error(error.message);
    response.status(500).send("An error occurred: " + error.message);
  }
});

(async () => {
  try {
    await game.loadWords("words_fr.txt");
    app.listen(PORT, () =>
      console.log(`Listening on http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error("Failed to load words and start the server:", error);
  }
})();
