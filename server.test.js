'use strict';

const request = require('supertest');
const nock = require('nock');
const { createApp } = require('./server');
const { _cache } = require('./converter');

const app = createApp();

beforeAll(() => {
  nock.disableNetConnect();
  // supertest talks to in-memory Express app via 127.0.0.1 ephemeral port —
  // allow localhost but keep external HTTP (CoinGecko, exchange) blocked.
  nock.enableNetConnect('127.0.0.1');
});
afterAll(() => {
  nock.enableNetConnect();
  nock.restore();
});
beforeEach(() => {
  _cache.clear();
  nock.cleanAll();
});

describe('GET /symbols', () => {
  test('returns list of supported symbols', async () => {
    const res = await request(app).get('/symbols');
    expect(res.status).toBe(200);
    expect(res.body.symbols).toEqual(
      expect.arrayContaining(['BTC', 'ETH', 'DOGE', 'BNB', 'SOL']),
    );
  });
});

describe('POST /convert', () => {
  test('200 happy path BTC', async () => {
    nock('https://api.coingecko.com')
      .get('/api/v3/simple/price')
      .query({ ids: 'bitcoin', vs_currencies: 'usd' })
      .reply(200, { bitcoin: { usd: 100_000 } });
    nock('https://open.er-api.com')
      .get('/v6/latest/USD')
      .reply(200, { rates: { IDR: 16_000 } });

    const res = await request(app)
      .post('/convert')
      .send({ symbol: 'BTC', amount: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ crypto: 'BTC', amount: 1, idr: 1_600_000_000 });
  });

  test('400 unsupported symbol (InputError)', async () => {
    const res = await request(app)
      .post('/convert')
      .send({ symbol: 'XRP', amount: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unsupported/i);
  });

  test('400 invalid amount', async () => {
    const res = await request(app)
      .post('/convert')
      .send({ symbol: 'BTC', amount: -5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/amount must/i);
  });

  test('502 upstream API down', async () => {
    nock('https://api.coingecko.com')
      .get('/api/v3/simple/price')
      .query(true)
      .reply(500);
    nock('https://open.er-api.com')
      .get('/v6/latest/USD')
      .reply(200, { rates: { IDR: 16_000 } });

    const res = await request(app)
      .post('/convert')
      .send({ symbol: 'BTC', amount: 1 });
    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/CoinGecko/);
  });

  test('400 body bukan JSON valid', async () => {
    const res = await request(app)
      .post('/convert')
      .set('Content-Type', 'application/json')
      .send('{broken');
    expect(res.status).toBe(400);
  });
});
