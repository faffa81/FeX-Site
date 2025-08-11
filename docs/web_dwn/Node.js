const express = require('express');
const path = require('path');
const app = express();

// Serve static files (HTML, JS, CSS, etc.) from the "public" directory.
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to download the latest version.
// When a user goes to /download/latest, this route sends the file.
app.get('/download/latest', (req, res) => {
  // Construct the absolute path to latest.zip
  const latestFilePath = path.join(__dirname, 'public', 'downloads', 'latest.zip');

  // Use res.download() to trigger the download.
  res.download(latestFilePath, 'latest.zip', (err) => {
    if (err) {
      console.error('Error sending file', err);
      res.status(500).send('Error downloading the latest version.');
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}.`);
});
