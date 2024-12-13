const csv = require('csv-parser');
const fs = require('fs');

class WordBank {
    constructor() {
        this.words = [];
        this.loaded = false;
    }

    async loadWords(filePath = 'words_fr.txt') {
        if (this.loaded) return; // Éviter de recharger si déjà chargé

        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    this.words.push(row.word.toLowerCase());
                })
                .on('end', () => {
                    this.loaded = true;
                    console.log('Words loaded successfully.');
                    resolve();
                })
                .on('error', (error) => {
                    console.error('Error loading words:', error);
                    reject(error);
                });
        });
    }

    getRandomWord() {
        if (this.words.length === 0) {
            throw new Error('No words available. Ensure words are loaded.');
        }
        const randomIndex = Math.floor(Math.random() * this.words.length);
        return this.words[randomIndex];
    }
}

module.exports = new WordBank(); // Exporter une seule instance (singleton)
