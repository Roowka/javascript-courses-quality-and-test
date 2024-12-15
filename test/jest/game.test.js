const Game = require('../../game');
const WordBank = require('../../wordBank'); // Importer le singleton WordBank

jest.mock('../../wordBank', () => ({
    words: ['apple', 'banana', 'cherry'],
    getRandomWord: jest.fn(() => 'apple'), // Simule toujours le mot 'apple'
}));

describe('Game Class', () => {
    let game;

    beforeEach(() => {
        game = new Game();
        game.reset(); // Initialiser un mot
    });

    test('should be 5 tries at the beginning of the game', () => {
        expect(game.getNumberOfTries()).toBe(8);
    });

    test('test the try mechanic with a correct guess', () => {
        const result = game.guess('a'); // Deviner la lettre 'a'
        expect(result.result).toBe(true);
        expect(game.unknowWord).toContain('a');
    });

    test('test the try mechanic with an incorrect guess', () => {
        game.guess('z'); // Deviner une lettre incorrecte
        expect(game.getNumberOfTries()).toBe(7);
    });

    test('reset the game, so the number of tries should be 5', () => {
        game.reset();
        expect(game.getNumberOfTries()).toBe(8);
        expect(game.unknowWord).toEqual('#'.repeat(game.word.length));
    });

    test('should show only "a" letter', () => {
        game.word = 'banana';
        game.unknowWord = '######';
        const result = game.guess('a');
        expect(result.result).toBe(true);
        expect(game.unknowWord).toBe('#a#a#a');
    });

    test('should throw an error if no words are available in WordBank', () => {
        WordBank.getRandomWord.mockImplementationOnce(() => {
            throw new Error('No words available.');
        });
        expect(() => game.reset()).toThrow('No words available.');
    });
});
