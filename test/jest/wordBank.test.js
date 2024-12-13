const WordBank = require('../../wordBank');
const fs = require('fs');

jest.mock('fs'); // Mock de fs pour simuler les lectures de fichiers

describe('WordBank Singleton', () => {
    beforeEach(() => {
        WordBank.words = []; // Réinitialiser les mots avant chaque test
        WordBank.loaded = false;
    });

    test('should load words from a file', async () => {
        // Simuler le contenu du fichier CSV
        const mockCsvData = 'word\napple\nbanana\ncherry\n';
        fs.createReadStream = jest.fn(() => {
            const { Readable } = require('stream');
            const stream = new Readable();
            stream.push(mockCsvData);
            stream.push(null); // Fin du stream
            return stream;
        });

        await WordBank.loadWords();

        expect(WordBank.words).toEqual(['apple', 'banana', 'cherry']);
        expect(WordBank.loaded).toBe(true);
    });

    test('should throw an error if no words are loaded', () => {
        expect(() => WordBank.getRandomWord()).toThrow(
            'No words available. Ensure words are loaded.'
        );
    });

    test('should return a random word', async () => {
        WordBank.words = ['apple', 'banana', 'cherry'];
        const word = WordBank.getRandomWord();
        expect(['apple', 'banana', 'cherry']).toContain(word);
    });

    test('should not reload words if already loaded', async () => {
        WordBank.words = ['apple', 'banana'];
        WordBank.loaded = true;

        await WordBank.loadWords(); // Appel sans effet
        expect(WordBank.words).toEqual(['apple', 'banana']);
    });
});
