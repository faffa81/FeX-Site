const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { pool, init } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

// Middleware
app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: false }));
app.use(bodyParser.json({ limit: '100kb' }));

const limiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Ensure DB is ready
init().then(() => console.log('DB initialized')).catch((e) => {
  console.error('DB init failed:', e);
  process.exit(1);
});

// In-memory online count (ephemeral on restarts)
let onlinePlayers = 0;

// Helpers
function validString(s, min = 3, max = 32) {
  return typeof s === 'string' && s.length >= min && s.length <= max;
}

// Routes

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!validString(username) || !validString(password, 6, 72)) {
    return res.json({ success: false, message: 'Invalid credentials.' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hash]
    );
    res.json({ success: true, message: 'Registration successful.' });
  } catch (e) {
    // Unique violation or other error
    res.json({ success: false, message: 'Username already exists.' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!validString(username) || !validString(password, 6, 72)) {
    return res.json({ success: false, message: 'Invalid username or password.' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    const user = rows[0];
    if (!user) return res.json({ success: false, message: 'Invalid username or password.' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.json({ success: false, message: 'Invalid username or password.' });

    res.json({
      success: true,
      message: 'Login successful.',
      username: user.username,
      time: user.time,
      kills: user.kills,
      freezes: user.freezes,
      hooks: user.hooks,
      fires: user.fires
    });
  } catch (e) {
    res.json({ success: false, message: 'Login failed.' });
  }
});

// Update time
app.post('/update-time', async (req, res) => {
  const { username, time } = req.body || {};
  if (!validString(username) || typeof time !== 'number' || time < 0) {
    return res.json({ success: false, message: 'Invalid data.' });
  }
  try {
    const result = await pool.query(
      'UPDATE users SET time = $1 WHERE username = $2',
      [time, username]
    );
    if (result.rowCount === 0) return res.json({ success: false, message: 'User not found.' });
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, message: 'Failed to update time.' });
  }
});

// Get time
app.get('/time', async (req, res) => {
  const username = req.query.username;
  if (!validString(username)) return res.json({ success: false, message: 'Username required.' });
  try {
    const { rows } = await pool.query('SELECT time FROM users WHERE username = $1', [username]);
    const row = rows[0];
    if (!row) return res.json({ success: false, message: 'User not found.' });
    res.json({ success: true, time: row.time });
  } catch (e) {
    res.json({ success: false, message: 'Error fetching time.' });
  }
});

// Online count (ephemeral)
app.get('/online', (req, res) => {
  res.json({ online: onlinePlayers });
});
app.post('/online', (req, res) => {
  const { count } = req.body || {};
  if (typeof count === 'number' && count >= 0) {
    onlinePlayers = count;
    res.json({ success: true, online: onlinePlayers });
  } else {
    res.json({ success: false, message: 'Invalid count.' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
