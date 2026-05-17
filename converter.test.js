'use strict';

const nock = require('nock');
const {
  convertToIdr,
  fetchCryptoUsd,
  fetchUsdToIdr,
  _cache,
} = require('./converter');

const COINGECKO_HOST = 'https://api.coingecko.com';
const COINGECKO_PATH = '/api/v3/simple/price';
const EXCHANGE_HOST = 'https://open.er-api.com';
const EXCHANGE_PATH = '/v6/latest/USD';

beforeAll(() => {
  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
  nock.restore();
});

beforeEach(() => {
  _cache.clear();
  nock.cleanAll();
});

function mockCoinGecko(id, usd) {
  return nock(COINGECKO_HOST)
    .get(COINGECKO_PATH)
    .query({ ids: id, vs_currencies: 'usd' })
    .reply(200, { [id]: { usd } });
}

function mockExchange(idr) {
  return nock(EXCHANGE_HOST)
    .get(EXCHANGE_PATH)
    .reply(200, { result: 'success', base_code: 'USD', rates: { IDR: idr } });
}

describe('convertToIdr — happy paths', () => {
  test('BTC 5 @ $100000, USD→IDR 16000 → 8_000_000_000', async () => {
    mockCoinGecko('bitcoin', 100_000);
    mockExchange(16_000);

    const r = await convertToIdr({ symbol: 'BTC', amount: 5 });
    expect(r).toEqual({ crypto: 'BTC', amount: 5, idr: 8_000_000_000 });
  });

  test('lowercase symbol diterima (eth)', async () => {
    mockCoinGecko('ethereum', 2_000);
    mockExchange(16_500);

    const r = await convertToIdr({ symbol: 'eth', amount: 0.5 });
    expect(r.crypto).toBe('ETH');
    expect(r.idr).toBe(Math.round(0.5 * 2000 * 16500));
  });

  test('amount=0 menghasilkan idr=0 (tetap valid)', async () => {
    mockCoinGecko('bitcoin', 100_000);
    mockExchange(16_000);

    const r = await convertToIdr({ symbol: 'BTC', amount: 0 });
    expect(r.idr).toBe(0);
  });

  test('Math.round dipakai untuk hindari floating-point noise', async () => {
    mockCoinGecko('dogecoin', 0.1);
    mockExchange(16_500.5);
    const r = await convertToIdr({ symbol: 'DOGE', amount: 0.1 });
    expect(Number.isInteger(r.idr)).toBe(true);
  });
});

describe('caching', () => {
  test('panggilan kedua tidak hit network (cache hit)', async () => {
    const cgScope = mockCoinGecko('bitcoin', 100_000);
    const fxScope = mockExchange(16_000);

    await convertToIdr({ symbol: 'BTC', amount: 1 });
    await convertToIdr({ symbol: 'BTC', amount: 2 });

    expect(cgScope.isDone()).toBe(true);
    expect(fxScope.isDone()).toBe(true);
    expect(nock.pendingMocks()).toEqual([]);
  });

  test('symbol berbeda → CoinGecko di-hit lagi, FX tetap cached', async () => {
    mockCoinGecko('bitcoin', 100_000);
    mockCoinGecko('ethereum', 2_000);
    mockExchange(16_000);

    await convertToIdr({ symbol: 'BTC', amount: 1 });
    await convertToIdr({ symbol: 'ETH', amount: 1 });

    expect(nock.pendingMocks()).toEqual([]);
  });
});

describe('validation & errors', () => {
  test('unsupported symbol → InputError', async () => {
    await expect(convertToIdr({ symbol: 'XRP', amount: 1 })).rejects.toThrow(
      /unsupported crypto symbol/i,
    );
  });

  test('symbol missing/empty', async () => {
    await expect(convertToIdr({ symbol: '', amount: 1 })).rejects.toThrow(
      /unsupported/i,
    );
    await expect(convertToIdr({ amount: 1 })).rejects.toThrow(/unsupported/i);
  });

  test.each([
    ['negative', -1],
    ['NaN', NaN],
    ['string', '5'],
    ['null', null],
    ['undefined', undefined],
    ['Infinity', Infinity],
  ])('amount %s ditolak sebelum API call', async (_label, amount) => {
    // nock.disableNetConnect akan throw kalau ada API call yang lolos
    await expect(convertToIdr({ symbol: 'BTC', amount })).rejects.toThrow(
      /amount must be/i,
    );
  });

  test('invalid CoinGecko response (missing usd field)', async () => {
    nock(COINGECKO_HOST)
      .get(COINGECKO_PATH)
      .query(true)
      .reply(200, { bitcoin: {} });

    await expect(fetchCryptoUsd('BTC')).rejects.toThrow(/invalid coingecko response/i);
  });

  test('invalid exchange response (missing rates.IDR)', async () => {
    nock(EXCHANGE_HOST).get(EXCHANGE_PATH).reply(200, { rates: { EUR: 0.9 } });

    await expect(fetchUsdToIdr()).rejects.toThrow(/invalid exchange-rate/i);
  });

  test('CoinGecko 500 → UpstreamError', async () => {
    nock(COINGECKO_HOST).get(COINGECKO_PATH).query(true).reply(500, 'oops');

    await expect(fetchCryptoUsd('BTC')).rejects.toThrow(/CoinGecko request failed/i);
  });

  test('exchange network error (replyWithError) → UpstreamError', async () => {
    nock(EXCHANGE_HOST)
      .get(EXCHANGE_PATH)
      .replyWithError({ code: 'ECONNREFUSED', message: 'connection refused' });

    await expect(fetchUsdToIdr()).rejects.toThrow(/exchange rate request failed/i);
  });
});
