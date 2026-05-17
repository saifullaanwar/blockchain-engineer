'use strict';

class TTLCache {
  constructor(ttlMs) {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new TypeError('TTLCache: ttlMs must be a positive finite number');
    }
    this.ttl = ttlMs;
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttl });
    return value;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  clear() {
    this.store.clear();
  }

  get size() {
    return this.store.size;
  }
}

module.exports = { TTLCache };
