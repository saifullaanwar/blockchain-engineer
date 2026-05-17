'use strict';

const path = require('path');
const express = require('express');
const { convertToIdr, SYMBOL_MAP } = require('./converter');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/symbols', (req, res) => {
    res.json({ symbols: Object.keys(SYMBOL_MAP) });
  });

  app.post('/convert', async (req, res) => {
    const { symbol, amount } = req.body || {};
    try {
      const result = await convertToIdr({ symbol, amount });
      res.json(result);
    } catch (err) {
      const status = err.code === 'INPUT' ? 400 : 502;
      res.status(status).json({ error: err.message });
    }
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    return res.status(500).json({ error: 'Internal error' });
  });

  return app;
}

module.exports = { createApp };

if (require.main === module) {
  require('dotenv').config();
  const port = Number(process.env.PORT) || 3001;
  createApp().listen(port, () => {
    console.log(`crypto-to-idr server on http://localhost:${port}`);
  });
}
