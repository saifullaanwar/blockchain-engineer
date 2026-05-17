'use strict';

const axios = require('axios');
const { TTLCache } = require('./cache');

const SYMBOL_MAP = Object.freeze({
  BTC: 'bitcoin',
  ETH: 'ethereum',
  DOGE: 'dogecoin',
  BNB: 'binancecoin',
  SOL: 'solana',
});

const COINGECKO_URL =
  process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3/simple/price';
const EXCHANGE_URL =
  process.env.EXCHANGE_API_URL || 'https://open.er-api.com/v6/latest/USD';
const TIMEOUT_MS = Number(process.env.HTTP_TIMEOUT_MS) || 5000;
const TTL_MS = Number(process.env.CACHE_TTL_MS) || 60_000;

const cache = new TTLCache(TTL_MS);

class InputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InputError';
    this.code = 'INPUT';
  }
}

class UpstreamError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UpstreamError';
    this.code = 'UPSTREAM';
  }
}

async function fetchCryptoUsd(symbol) {
  const upper = String(symbol || '').toUpperCase();
  const id = SYMBOL_MAP[upper];
  if (!id) {
    const supported = Object.keys(SYMBOL_MAP).join(', ');
    throw new InputError(
      `Unsupported crypto symbol: "${symbol}". Supported: ${supported}`,
    );
  }

  const cacheKey = `crypto:${id}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  let res;
  try {
    res = await axios.get(COINGECKO_URL, {
      params: { ids: id, vs_currencies: 'usd' },
      timeout: TIMEOUT_MS,
    });
  } catch (err) {
    throw new UpstreamError(`CoinGecko request failed: ${err.message}`);
  }

  const price = res && res.data && res.data[id] && res.data[id].usd;
  if (typeof price !== 'number' || !Number.isFinite(price)) {
    throw new UpstreamError(
      `Invalid CoinGecko response for ${id}: expected data.${id}.usd to be a number`,
    );
  }

  cache.set(cacheKey, price);
  return price;
}

async function fetchUsdToIdr() {
  const cacheKey = 'fx:USD-IDR';
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  let res;
  try {
    res = await axios.get(EXCHANGE_URL, { timeout: TIMEOUT_MS });
  } catch (err) {
    throw new UpstreamError(`Exchange rate request failed: ${err.message}`);
  }

  const rate = res && res.data && res.data.rates && res.data.rates.IDR;
  if (typeof rate !== 'number' || !Number.isFinite(rate)) {
    throw new UpstreamError(
      'Invalid exchange-rate response: expected rates.IDR to be a number',
    );
  }

  cache.set(cacheKey, rate);
  return rate;
}

async function convertToIdr({ symbol, amount } = {}) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    throw new InputError('amount must be a non-negative finite number');
  }

  const [usdPrice, idrRate] = await Promise.all([
    fetchCryptoUsd(symbol),
    fetchUsdToIdr(),
  ]);

  const idr = Math.round(amount * usdPrice * idrRate);
  return {
    crypto: String(symbol).toUpperCase(),
    amount,
    idr,
  };
}

module.exports = {
  fetchCryptoUsd,
  fetchUsdToIdr,
  convertToIdr,
  SYMBOL_MAP,
  InputError,
  UpstreamError,
  _cache: cache,
};
