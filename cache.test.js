'use strict';

const { TTLCache } = require('./cache');

describe('TTLCache', () => {
  test('get returns set value within TTL', () => {
    const c = new TTLCache(1000);
    c.set('k', 42);
    expect(c.get('k')).toBe(42);
  });

  test('get returns undefined for missing key', () => {
    const c = new TTLCache(1000);
    expect(c.get('missing')).toBeUndefined();
  });

  test('value expires after TTL', () => {
    jest.useFakeTimers();
    const c = new TTLCache(100);
    c.set('k', 'v');
    jest.advanceTimersByTime(50);
    expect(c.get('k')).toBe('v');
    jest.advanceTimersByTime(60);
    expect(c.get('k')).toBeUndefined();
    jest.useRealTimers();
  });

  test('expired entry is removed from store', () => {
    jest.useFakeTimers();
    const c = new TTLCache(100);
    c.set('k', 'v');
    jest.advanceTimersByTime(200);
    c.get('k');
    expect(c.size).toBe(0);
    jest.useRealTimers();
  });

  test('clear removes all entries', () => {
    const c = new TTLCache(1000);
    c.set('a', 1);
    c.set('b', 2);
    c.clear();
    expect(c.size).toBe(0);
    expect(c.get('a')).toBeUndefined();
  });

  test('throws on invalid TTL', () => {
    expect(() => new TTLCache(0)).toThrow(TypeError);
    expect(() => new TTLCache(-100)).toThrow(TypeError);
    expect(() => new TTLCache(NaN)).toThrow(TypeError);
    expect(() => new TTLCache('60')).toThrow(TypeError);
  });
});
