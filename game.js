const tools = require("./tools.js");
const csv = require("csv-parser");
const fs = require("fs");

class Game {
  constructor() {
    this.listOfWords = [];
    this.scores = [];
    this.numberOfTries = 5;
    this.currentWordDate = null;
  }

  loadWords(filename) {
    return new Promise((resolve, reject) => {
      fs.createReadStream(filename)
        .pipe(csv())
        .on("data", (row) => {
          this.listOfWords.push(row.word.toLowerCase());
        })
        .on("end", () => {
          this.chooseWord();
          resolve();
        })
        .on("error", reject);
    });
  }

  chooseWord(reset = false) {
    const today = new Date().toISOString().split("T")[0];

    if (this.listOfWords.length > 0) {
      if (this.currentWordDate !== today || reset) {
        this.word =
          this.listOfWords[tools.getRandomInt(this.listOfWords.length)];
        this.currentWordDate = today;
      }
    } else {
      throw new Error("No words available to choose from.");
    }
  }

  returnWord() {
    return this.word;
  }

  guess(oneLetter, unknowWord) {
    if (!this.word) {
      throw new Error(
        "The word has not been set. Please ensure that the game has been initialized properly."
      );
    }

    if (this.word.includes(oneLetter)) {
      let updatedUnknowWord = unknowWord;

      for (let i = 0; i < this.word.length; i++) {
        if (this.word[i] === oneLetter) {
          updatedUnknowWord = tools.replaceAt(updatedUnknowWord, i, oneLetter);
        }
      }

      return {
        word: this.word,
        unknowWord: updatedUnknowWord,
        guess: true,
        tries: this.numberOfTries,
      };
    }

    this.numberOfTries -= 1;
    return {
      word: this.word,
      unknowWord: unknowWord,
      guess: false,
      tries: this.numberOfTries,
    };
  }

  getNumberOfTries() {
    return this.numberOfTries;
  }

  print() {
    return this.unknowWord;
  }

  reset() {
    this.numberOfTries = 5;
    this.chooseWord();
    return this.numberOfTries;
  }
}

module.exports = Game;
