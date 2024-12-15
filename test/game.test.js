const Game = require("../game.js");
const tools = require("../tools.js");

jest.mock("../tools.js");

// Sans ça replaceAt me renvoie undefined mais seulement en test
tools.replaceAt = jest.fn((str, index, char) => {
  return str.substring(0, index) + char + str.substring(index + 1);
});

let game;

beforeEach(async () => {
  game = new Game();
  await game.loadWords("words_fr.txt");
  game.word = "damien";
  game.unknowWord = "######";
});

describe("Game Tests", () => {
  test("should load words and select a word", async () => {
    tools.getRandomInt.mockReturnValue(0); // Simulation du choix d'un mot
    game.listOfWords = ["damien", "lucas"];
    game.chooseWord();

    expect(game.word).toBe("damien");
    expect(game.listOfWords).toContain("damien");
  });

  test("should throw an error if no words are available", () => {
    game.listOfWords = [];
    expect(() => game.chooseWord()).toThrow(
      "No words available to choose from."
    );
  });

  test("should return the current word", () => {
    expect(game.returnWord()).toBe("damien");
  });

  test("should correctly guess a letter in the word", () => {
    const result = game.guess("a", game.unknowWord);

    expect(result).toEqual({
      word: "damien",
      tries: 5,
      unknowWord: "#a####",
      guess: true,
    });
  });

  test("should not update unknowWord on incorrect guess", () => {
    const result = game.guess("z", game.unknowWord);

    expect(result).toEqual({
      word: "damien",
      tries: 4,
      unknowWord: "######",
      guess: false,
    });
  });

  test("should throw an error if the word has not been set", () => {
    game.word = null;
    expect(() => game.guess("a", game.unknowWord)).toThrow(
      "The word has not been set. Please ensure that the game has been initialized properly."
    );
  });

  test("should reset the game and set 5 tries", () => {
    game.listOfWords = ["damien", "lucas"];
    game.reset(true);
    expect(game.numberOfTries).toBe(5);
  });

  test("should print the current unknowWord", () => {
    game.unknowWord = "#a####";
    expect(game.print()).toBe("#a####");
  });

  test("should decrement tries on incorrect guess", () => {
    game.guess("z", game.unknowWord);

    expect(game.numberOfTries).toBe(4);
  });

  test("should not decrement tries on correct guess", () => {
    game.guess("a", game.unknowWord);

    expect(game.numberOfTries).toBe(5);
  });

  test("should return the number of tries left", () => {
    expect(game.getNumberOfTries()).toBe(5);
  });
});
