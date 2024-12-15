const sqlite3 = require("sqlite3").verbose();
const {
  createDatabase,
  insertPlayer,
  getPlayers,
  connect,
} = require("../sqlite");

jest.mock("sqlite3", () => {
  const runMock = jest.fn();
  const allMock = jest.fn();
  const DatabaseMock = jest.fn((dbPath, callback) => {
    if (dbPath === "./test.db") callback(null);
    return { run: runMock, all: allMock };
  });

  return {
    verbose: jest.fn(() => ({ Database: DatabaseMock })),
    __mocks__: { DatabaseMock, runMock, allMock },
  };
});

describe("Database Module", () => {
  let mockDb;

  beforeEach(() => {
    const sqlite3Mock = require("sqlite3").__mocks__;
    mockDb = new sqlite3Mock.DatabaseMock();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createDatabase", () => {
    it("should create a new database without errors", () => {
      expect(() => createDatabase("./test.db")).not.toThrow();
      expect(sqlite3.Database).toHaveBeenCalledWith(
        "./test.db",
        expect.any(Function)
      );
    });

    it("should throw an error if database connection fails", () => {
      const sqlite3Mock = require("sqlite3").__mocks__;
      sqlite3Mock.DatabaseMock.mockImplementationOnce((_, callback) =>
        callback(new Error("Connection error"))
      );

      expect(() => createDatabase("./test.db")).toThrow("Connection error");
    });
  });

  describe("connect", () => {
    it("should execute SQL to create the Players table without errors", () => {
      mockDb.run.mockImplementationOnce((_, callback) => callback(null));
      connect("./test.db");

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS Players"),
        expect.any(Function)
      );
    });

    it("should throw an error when table creation fails", () => {
      mockDb.run.mockImplementationOnce((_, callback) =>
        callback(new Error("Table creation failed"))
      );

      expect(() => connect("./test.db")).toThrow("Table creation failed");
    });
  });

  describe("insertPlayer", () => {
    it("should insert a player without errors", async () => {
      mockDb.run.mockImplementation((_, __, callback) => callback(null));

      await expect(
        insertPlayer("Alice", 100, "2024-01-01")
      ).resolves.not.toThrow();
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Players"),
        ["Alice", 100, "2024-01-01"],
        expect.any(Function)
      );
    });

    it("should reject the promise if insertion fails", async () => {
      mockDb.run.mockImplementation((_, __, callback) =>
        callback(new Error("Insertion failed"))
      );

      await expect(insertPlayer("Bob", 200, "2024-02-01")).rejects.toThrow(
        "Insertion failed"
      );
    });
  });

  describe("getPlayers", () => {
    it("should fetch players without errors", async () => {
      const mockRows = [
        { Player_id: 1, Username: "Alice", Score: 100, Date: "2024-01-01" },
      ];
      mockDb.all.mockImplementation((_, __, callback) =>
        callback(null, mockRows)
      );

      await expect(getPlayers()).resolves.toEqual(mockRows);
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining(`
      SELECT * 
      FROM Players 
      WHERE DATE(Date) = DATE(?) 
      ORDER BY Score DESC 
      LIMIT 1000;
    `),
        [expect.any(String)],
        expect.any(Function)
      );
    });

    it("should resolve to an empty array if no players exist", async () => {
      mockDb.all.mockImplementation((_, __, callback) => callback(null, []));

      await expect(getPlayers()).resolves.toEqual([]);
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining(`
      SELECT * 
      FROM Players 
      WHERE DATE(Date) = DATE(?) 
      ORDER BY Score DESC 
      LIMIT 1000;
    `),
        [expect.any(String)],
        expect.any(Function)
      );
    });

    it("should log a message if no players are found", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      mockDb.all.mockImplementation((_, __, callback) => callback(null, []));

      await getPlayers();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "No players found for the given date."
      );

      consoleLogSpy.mockRestore();
    });

    it("should log a message if players are fetched successfully", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      const mockRows = [
        { Player_id: 1, Username: "Alice", Score: 100, Date: "2024-01-01" },
      ];

      mockDb.all.mockImplementation((_, __, callback) =>
        callback(null, mockRows)
      );

      await getPlayers();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Players fetched successfully:",
        mockRows
      );

      consoleLogSpy.mockRestore();
    });

    it("should reject the promise if fetching fails", async () => {
      mockDb.all.mockImplementation((_, __, callback) =>
        callback(new Error("Fetch failed"))
      );

      await expect(getPlayers()).rejects.toThrow("Fetch failed");
    });

    it("should handle unexpected results from db.all gracefully", async () => {
      mockDb.all.mockImplementation((_, __, callback) => callback(null, null));

      await expect(getPlayers()).resolves.toEqual([]);
    });
  });
});
