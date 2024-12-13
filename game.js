const wordBank = require('./wordBank');

class Game {
    constructor() {
        this.word = null; // Défini après `chooseWord`
        this.unknowWord = null;
        this.numberOfTries = 5;
    }

    reset() {
        // Utiliser le WordBank pour choisir un mot
        this.word = wordBank.getRandomWord();
        this.unknowWord = this.word.replace(/./g, '#');
        this.numberOfTries = 5;
    }

    guess(oneLetter) {
        oneLetter = oneLetter.toLowerCase();

        if (!this.word) {
            throw new Error("No word set.");
        }

        let updatedUnknowWord = this.unknowWord;
        if (this.word.includes(oneLetter)) {
            // Remplacer les caractères masqués
            for (let i = 0; i < this.word.length; i++) {
                if (this.word[i] === oneLetter) {
                    updatedUnknowWord = updatedUnknowWord.substring(0, i) + this.word[i] + updatedUnknowWord.substring(i + 1);
                }
            }
            this.unknowWord = updatedUnknowWord; // Mettre à jour unknowWord
            return { unknowWord: this.unknowWord, result: true };
        }

        // Décrémenter les essais si la lettre n'est pas dans le mot
        this.numberOfTries--;
        return { unknowWord: this.unknowWord, result: false };
    }

    getNumberOfTries() {
        return this.numberOfTries;
    }
}

module.exports = Game;
