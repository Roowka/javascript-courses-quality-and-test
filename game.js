const tools = require('./tools.js');
const csv = require('csv-parser');
const fs = require('fs');

class Game {
    constructor() {
        this.listOfWords = [];
    }

    loadWords() {
        return new Promise((resolve, reject) => {
            fs.createReadStream('words_fr.txt')
                .pipe(csv())
                .on('data', (row) => {
                    this.listOfWords.push(row.word.toLowerCase());
                })
                .on('end', () => {
                    this.chooseWord();
                    while (this.word.length < 5 || this.word.length > 8) {
                        this.chooseWord();
                    }
                    resolve();
                })
                .on('error', reject);
        });
    }

    chooseWord() {
        if (this.listOfWords.length > 0) {
            this.word = this.listOfWords[tools.getRandomInt(this.listOfWords.length)];
            this.unknowWord = this.word.replace(/./g, '#');
        } else {
            throw new Error("No words available.");
        }
    }

    guess(oneLetter, unknowWord) {
        oneLetter = oneLetter.toLowerCase();
        if (!this.word) {
            throw new Error("No word set.");
        }
        if (this.word.includes(oneLetter)) {
            for (let i = 0; i < this.word.length; i++) {
                if (this.word[i] === oneLetter) {
                    unknowWord = unknowWord.substring(0, i) + this.word[i] + unknowWord.substring(i + 1);
                }
            }
            return { unknowWord: unknowWord, result: true };
        }
        return { unknowWord: unknowWord, result: false };
    }

    reset() {
        this.chooseWord();
        while (this.word.length < 5 || this.word.length > 8) {
            this.chooseWord();
        }
    }
}

module.exports = Game;
