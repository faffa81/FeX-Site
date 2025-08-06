const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    time INTEGER DEFAULT 0,
    kills INTEGER DEFAULT 0,
    freezes INTEGER DEFAULT 0,
    hooks INTEGER DEFAULT 0,
    fires INTEGER DEFAULT 0
  )`);
});

db.close();
