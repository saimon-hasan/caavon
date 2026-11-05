const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const publicPath = path.join(__dirname, '../public');

// Parse JSON requests.
app.use(express.json());

// Health check.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Serve public/index.html, styles.css, app.js, and products.json.
app.use(express.static(publicPath));

// Handle missing files and routes.
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Handle server errors.
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: 'Internal Server Error',
  });
});

// Start the server when this file is run directly.
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`CAAVON running at http://localhost:${PORT}`);
    console.log(`Serving files from: ${publicPath}`);
  });

  server.on('error', (err) => {
    console.error(`Could not start server: ${err.message}`);
    process.exitCode = 1;
  });
}

module.exports = app;