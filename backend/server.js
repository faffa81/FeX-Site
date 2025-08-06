const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = './users.db';

app.use(cors());
app.use(bodyParser.json());

// Connect to existing database (already initialized via init-db.js)
const db = new sqlite3.Database(DB_PATH);

// Global online player count
let onlinePlayers = 0;

// Register endpoint
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, message: "Missing credentials." });

  const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
  stmt.run(username, password, function (err) {
    if (err) {
      res.json({ success: false, message: "Username already exists." });
    } else {
      res.json({ success: true, message: "Registration successful." });
    }
  });
  stmt.finalize();
});

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (err || !row) {
      res.json({ success: false, message: "Invalid username or password." });
    } else {
      res.json({
        success: true,
        message: "Login successful.",
        username: row.username,
        time: row.time,
        kills: row.kills,
        freezes: row.freezes,
        hooks: row.hooks,
        fires: row.fires
      });
    }
  });
});

// Update time endpoint
app.post('/update-time', (req, res) => {
  const { username, time } = req.body;
  if (!username || typeof time !== 'number') {
    return res.json({ success: false, message: "Invalid data." });
  }

  db.run("UPDATE users SET time = ? WHERE username = ?", [time, username], function (err) {
    if (err) {
      res.json({ success: false, message: "Failed to update time." });
    } else {
      res.json({ success: true });
    }
  });
});

// Get time for a user
app.get('/time', (req, res) => {
  const username = req.query.username;
  if (!username) return res.json({ success: false, message: "Username required." });

  db.get("SELECT time FROM users WHERE username = ?", [username], (err, row) => {
    if (err || !row) {
      res.json({ success: false, message: "User not found." });
    } else {
      res.json({ success: true, time: row.time });
    }
  });
});

// Get online player count
app.get('/online', (req, res) => {
  res.json({ online: onlinePlayers });
});

// Update online player count
app.post('/online', (req, res) => {
  const { count } = req.body;
  if (typeof count === 'number') {
    onlinePlayers = count;
    res.json({ success: true, online: onlinePlayers });
  } else {
    res.json({ success: false, message: "Invalid count." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
