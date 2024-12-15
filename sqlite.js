const sqlite3 = require("sqlite3").verbose();

function createDatabase(db) {
  return new sqlite3.Database(db, (err) => {
    if (err) {
      console.error("Failed to connect to the database:", err.message);
      throw err;
    }
  });
}

const db = createDatabase("./hangman.db");

function connect() {
  const sql_create = `CREATE TABLE IF NOT EXISTS Players (
    Player_id INTEGER PRIMARY KEY AUTOINCREMENT,
    Username VARCHAR(100) NOT NULL,
    Score INTEGER(100) NOT NULL,
    Date DATE
  );`;

  db.run(sql_create, (err) => {
    if (err) {
      console.error("Failed to create the Players table:", err.message);
      throw err;
    }
  });
}

function insertPlayer(username, score, date) {
  return new Promise((resolve, reject) => {
    const sql_insert = `INSERT INTO Players (Username, Score, Date) VALUES (?, ?, ?);`;
    db.run(sql_insert, [username, score, date], (err) => {
      if (err) {
        console.error("Failed to insert player:", err.message);
        return reject(err);
      }
      resolve();
    });
  });
}

function getPlayers() {
  return new Promise((resolve, reject) => {
    const today = new Date().toISOString().split("T")[0];

    const sql_select = `
      SELECT * 
      FROM Players 
      WHERE DATE(Date) = DATE(?) 
      ORDER BY Score DESC 
      LIMIT 1000;
    `;

    db.all(sql_select, [today], (err, rows) => {
      if (err) {
        console.error("Failed to fetch players:", err.message);
        return reject(err);
      }

      if (!rows || rows.length === 0) {
        console.log("No players found for the given date.");
        return resolve([]);
      }

      console.log("Players fetched successfully:", rows);
      resolve(rows);
    });
  });
}

module.exports = {
  createDatabase,
  insertPlayer,
  getPlayers,
  connect,
};
