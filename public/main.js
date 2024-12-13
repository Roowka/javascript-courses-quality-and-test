// Constantes
const DEFAULT_TRIES = 5;
const SCORE_DECREMENT = 10;
const SCORE_INTERVAL_MS = 1000;
const BORDER_TRANSITION_MS = 500;
const FONT_SIZE_TRANSITION_MS = 500;
const INITIAL_SCORE = 120;

// Initialisation des variables globales
let numberOfTries = parseInt(localStorage.getItem('numberOfTries'), 10);
if (isNaN(numberOfTries)) {
    numberOfTries = DEFAULT_TRIES;
    localStorage.setItem('numberOfTries', numberOfTries);
}

const currentDate = new Date().toISOString().split('T')[0];
const lastDate = localStorage.getItem('lastDate');
const isNewDay = !lastDate || currentDate !== lastDate;

let unknownWord = localStorage.getItem('unknownWord') || '';
let usedLetters = JSON.parse(localStorage.getItem('usedLetters')) || [];
let score = parseInt(localStorage.getItem('score'), 10);
if (isNaN(score)) {
    score = INITIAL_SCORE;
    localStorage.setItem('score', score);
}

if (isNewDay) {
    resetForNewDay();
}

// DOM Elements
const numberOfTriesDom = document.querySelector('#numberOfTries');
numberOfTriesDom.textContent = numberOfTries;

const inputWord = document.querySelector('input[name="word"]');
const currentWordDom = document.querySelector('#current-word');
const scoreDom = document.getElementById('score');
scoreDom.textContent = score;

// Démarrage du décrément du score
startScoreDecrement();

// Événements
inputWord.addEventListener('focus', function (e) {
    e.preventDefault();
    this.blur();
});

document.querySelectorAll('.btn-letter').forEach(button => {
    button.addEventListener('click', function () {
        selectLetter(this.textContent);
    });
});

// Charger le mot si nouveau jour ou si pas défini
if (isNewDay || !unknownWord) {
    fetchCurrentWordFromServer();
} else {
    displayWord(unknownWord);
    disableUsedLetters();
}

// Définition des fonctions
function resetForNewDay() {
    localStorage.setItem('numberOfTries', DEFAULT_TRIES);
    localStorage.setItem('lastDate', currentDate);
    localStorage.removeItem('unknownWord');
    localStorage.removeItem('currentWord');
    localStorage.removeItem('usedLetters');
    localStorage.removeItem('score');
    numberOfTries = DEFAULT_TRIES;
    usedLetters = [];
    score = INITIAL_SCORE;
}

function startScoreDecrement() {
    scoreInterval = setInterval(() => {
        if (score > 0) {
            score--;
            scoreDom.textContent = score;
            localStorage.setItem('score', score);
        }
    }, SCORE_INTERVAL_MS);
}

function stopScoreDecrement() {
    clearInterval(scoreInterval);
}

function disableUsedLetters() {
    usedLetters.forEach(letter => {
        const button = document.querySelector(`button[onclick="selectLetter('${letter}')"]`);
        if (button) {
            button.disabled = true;
            button.classList.add('bg-gray-400');
        }
    });
}

function fetchCurrentWordFromServer() {
    fetch('/api/current-word')
        .then(response => response.json())
        .then(data => {
            const currentWord = data.currentWord;
            const maskedWord = currentWord.replace(/./g, '#');
            unknownWord = maskedWord;
            localStorage.setItem('unknownWord', unknownWord);
            localStorage.setItem('currentWord', currentWord);
            usedLetters = [];
            localStorage.setItem('usedLetters', JSON.stringify(usedLetters));
            displayWord(unknownWord);
        })
        .catch(err => console.error('Erreur fetchCurrentWord :', err));
}

function displayWord(word) {
    currentWordDom.innerHTML = word.split('').map(letter =>
        `<span class="w-11 h-11 text-3xl px-2 py-1 border rounded-lg text-gray-700 text-center inline-block">${letter.toUpperCase()}</span>`
    ).join('');
}

function selectLetter(letter) {
    inputWord.value = letter;
    validateLetter();
}

function validateLetter() {
    const letter = inputWord.value;
    const currentUnknownWord = localStorage.getItem('unknownWord') || '';
    const tries = parseInt(localStorage.getItem('numberOfTries'), 10) || 0;
    const score = parseInt(localStorage.getItem('score'), 10) || 0;

    fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter, unknowWord: currentUnknownWord, tries, score })
    })
        .then(response => response.json())
        .then(data => {
            handleGuessResponse(data, letter);
        })
        .catch(error => console.error('Erreur validateLetter :', error));
}

function handleGuessResponse(data, letter) {
    const serverResult = data.result;
    unknownWord = serverResult.unknowWord;
    localStorage.setItem('unknownWord', unknownWord);

    displayWord(unknownWord);

    usedLetters.push(letter.toUpperCase());
    localStorage.setItem('usedLetters', JSON.stringify(usedLetters));
    disableUsedLetters();

    // Redirection si victoire ou défaite
    if (data.redirectTo) {
        clearLocalStorageForGame();
        window.location.href = data.redirectTo;
        return;
    }

    // Sinon, continuer la partie
    if (!serverResult.result) {
        handleIncorrectGuess();
    } else {
        handleCorrectGuess();
    }
}

function handleCorrectGuess() {
    displayWord(unknownWord);
}

function handleIncorrectGuess() {
    numberOfTries--;
    localStorage.setItem('numberOfTries', numberOfTries);
    numberOfTriesDom.textContent = numberOfTries;

    animateIncorrectGuess();

    score -= SCORE_DECREMENT;
    if (score < 0) score = 0;
    scoreDom.textContent = score;
    localStorage.setItem('score', score);

    if (numberOfTries <= 0) {
        endGame();
    }
}

function animateIncorrectGuess() {
    const input = inputWord;

    input.style.transition = `border ${BORDER_TRANSITION_MS}ms ease-in-out`;
    input.style.border = '2px solid red';
    setTimeout(() => {
        input.style.border = '2px solid #3b82f6';
    }, BORDER_TRANSITION_MS);

    scoreDom.style.transition = `font-size ${FONT_SIZE_TRANSITION_MS}ms ease-in-out`;
    scoreDom.style.fontSize = '1.5rem';
    setTimeout(() => {
        scoreDom.style.fontSize = '1rem';
    }, FONT_SIZE_TRANSITION_MS);
}

function endGame() {
    stopScoreDecrement();
    clearLocalStorageForGame();
    location.reload();
}

function clearLocalStorageForGame() {
    localStorage.removeItem('unknownWord');
    localStorage.removeItem('currentWord');
    localStorage.removeItem('usedLetters');
    localStorage.removeItem('numberOfTries');
    localStorage.removeItem('score');
}
