const malusScore = 50;

// LOCAL STORAGE
let date = localStorage.getItem("date") || new Date().toISOString();
let score = localStorage.getItem("score") || 1000;

let numberOfTries;

fetch("/api/tries")
  .then((response) => response.json())
  .then((data) => {
    numberOfTries = data.tries;
    document.getElementById("nbLeftTries").innerHTML =
      "Nombre de tentatives restantes : " + numberOfTries;
  });

// Vérifie si le délai d'une journée est passé
if (new Date(date).getTime() + 24 * 60 * 60 * 1000 < new Date().getTime()) {
  numberOfTries = 5;
  localStorage.setItem("numberOfTries", numberOfTries);
  localStorage.setItem("date", new Date().toISOString());
}

let word;

// UI si le joueur a déjà joué
if (localStorage.getItem("win") === "true") {
  setAlreadyPlayedUI(true);
} else if (localStorage.getItem("win") === "false") {
  setAlreadyPlayedUI(false);
}

// Scores
async function getScores() {
  fetch("/api/scores")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("scoresList").innerHTML = "";
      for (let i = 0; i < data.length; i++) {
        let player = data[i];
        let username = player["Username"];
        let score = player["Score"];
        let playerElement = document.createElement("li");
        playerElement.innerHTML = username + " : " + score;
        document.getElementById("scoresList").appendChild(playerElement);
      }
    });
}

getScores();

// Événements
document.getElementById("submitGuess").addEventListener("click", submitGuess);
let unknowWord = "";
fetch("/api/word")
  .then((response) => response.json())
  .then((data) => {
    unknowWord = data.word;
    word = data.word;
    unknowWord = unknowWord.replace(/./g, "#");
    document.getElementById("userWord").innerHTML =
      "Votre mot est : " + unknowWord;
  });

document
  .getElementById("submitUsername")
  .addEventListener("click", submitUsername);

// Variable globale pour l'intervalle
let cooldownInterval;

function startCooldown() {
  document.getElementById("cooldown").innerHTML =
    "Il te reste : " + score + " secondes";

  cooldownInterval = setInterval(() => {
    score--;
    document.getElementById("cooldown").innerHTML =
      "Il te reste : " + score + " secondes";
    localStorage.setItem("score", score);
    if (score <= 0) {
      clearInterval(cooldownInterval);
      setDefeatUI();
      document.getElementById("gameDescription").innerHTML = "Trop tard !";
      localStorage.setItem("win", false);
    }
  }, 1000);
}

if (localStorage.getItem("win") === "true") {
  setAlreadyPlayedUI(true);
} else if (localStorage.getItem("win") === "false") {
  setAlreadyPlayedUI(false);
} else {
  startCooldown();
}

// Fonction pour gérer les guess
function submitGuess(event) {
  if (numberOfTries <= 0) {
    return;
  }
  event.preventDefault();
  let letter = document.getElementById("letterInput").value;

  fetch("/api/guess", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ word: letter, unknowWord: unknowWord }),
  })
    .then((response) => response.json())
    .then((data) => {
      unknowWord = data.guess.unknowWord;
      numberOfTries = data.guess.tries;
      changeUI(data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// Gestion de l'interface utilisateur en fonction des réponses
function changeUI(data) {
  if (!data.guess.guess) {
    updateTries();
    score -= malusScore;
  }
  if (numberOfTries > 0) {
    document.getElementById("userWord").innerHTML =
      "Votre mot est : " + data.guess.unknowWord;
    document.getElementById("letterInput").value = "";
  }

  if (data.guess.unknowWord === data.guess.word) {
    clearInterval(cooldownInterval);
    setVictoryUI();
    localStorage.setItem("win", true);
  }
}

// MAJ UI en fonction des essais
function updateTries() {
  document.getElementById("nbLeftTries").innerHTML =
    "Nombre de tentatives restantes : " + numberOfTries;
  if (numberOfTries <= 0) {
    clearInterval(cooldownInterval);
    setDefeatUI();
    localStorage.setItem("win", false);
  }
}

// Save le nom d'utilisateur et son score
async function submitUsername(event) {
  event.preventDefault();
  let username = document.getElementById("usernameInput").value;
  document.getElementById("cooldown").innerHTML =
    username + ", ton score est de : " + score;
  document.getElementById("usernameModal").classList.add("hidden");
  const res = await fetch("/api/scores", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: username, score: score }),
  });
  const data = await res.json();
  getScores();
}

// Écran de victoire
function setVictoryUI() {
  document.getElementById("nbLeftTries").innerHTML = "Et c'est gagné 🥳";
  document.getElementById("nbLeftTries").classList.add("text-green-500");
  document.getElementById("cooldown").classList.remove("text-red-500");

  document.getElementById("gameDescription").classList.add("hidden");
  document.getElementById("letterInput").classList.add("hidden");
  document.getElementById("submitGuess").classList.add("hidden");
  document.getElementById("gameEnd").classList.remove("hidden");
  document.getElementById("usernameModal").classList.remove("hidden");
}

// Écran de défaite
function setDefeatUI() {
  document.getElementById("cooldown").innerHTML = "Perdu nullos 🫵😂";
  document.getElementById("nbLeftTries").classList.add("hidden");
  document.getElementById("letterInput").classList.add("hidden");
  document.getElementById("submitGuess").classList.add("hidden");
  document.getElementById("gameDescription").classList.add("hidden");
  document.getElementById("userWord").innerHTML = "Le mot était : " + word;
}

// UI si déjà joué
function setAlreadyPlayedUI(win) {
  if (win) {
    document.getElementById("commeBackTomorrow").innerHTML = "Reviens demain !";
    document.getElementById("alreadyPlayed").innerHTML =
      "T'as déjà gagné aujourd'hui 🥳";
    document.getElementById("alreadyPlayed").classList.add("text-green-500");
  } else {
    document.getElementById("commeBackTomorrow").innerHTML =
      "T'auras peut-être plus de chance demain !";
    document.getElementById("alreadyPlayed").innerHTML =
      "T'as déjà perdu aujourd'hui 🫵😂";
    document.getElementById("alreadyPlayed").classList.add("text-red-500");
  }
  document.getElementById("letterInput").classList.add("hidden");
  document.getElementById("submitGuess").classList.add("hidden");
  document.getElementById("userWord").classList.add("hidden");
  document.getElementById("cooldown").classList.add("hidden");
  document.getElementById("gameDescription").classList.add("hidden");
  document.getElementById("nbLeftTries").classList.add("hidden");
}
