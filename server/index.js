// -------------------------------------------------------------
// SHADOW ASCENSION - BACKEND SERVER ENTRY POINT
// -------------------------------------------------------------

import path from 'node:path';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { apiApp } from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;

// Mount API routes
app.use(apiApp);

// In production, serve static frontend assets from dist/
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(DIST_DIR));
  app.use((req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.resolve(DIST_DIR, 'index.html'));
    } else {
      res.status(404).json({ success: false, message: 'Endpoint not found.' });
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Shadow Ascension Server] Listening on http://localhost:${PORT}`);
});

export default app;
