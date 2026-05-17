'use strict';

const { diffV1, diffV2 } = require('./2_array_diff_function');

describe.each([
  ['diffV1', diffV1],
  ['diffV2', diffV2],
])('%s', (_label, diff) => {
  test('contoh soal: [1,3,5,7,9] vs [1,2,3,4] → [2,4,5,7,9]', () => {
    expect(diff([1, 3, 5, 7, 9], [1, 2, 3, 4])).toEqual([2, 4, 5, 7, 9]);
  });

  test('duplikat dibuang seluruhnya: [1,1,2] vs [1,3] → [2,3]', () => {
    expect(diff([1, 1, 2], [1, 3])).toEqual([2, 3]);
  });

  test('a kosong → unique(b)', () => {
    expect(diff([], [1, 2, 2, 3])).toEqual([1, 2, 3]);
  });

  test('b kosong → unique(a)', () => {
    expect(diff([1, 2, 2, 3], [])).toEqual([1, 2, 3]);
  });

  test('keduanya kosong → []', () => {
    expect(diff([], [])).toEqual([]);
  });

  test('array identik (urutan beda) → []', () => {
    expect(diff([1, 2, 3], [3, 2, 1])).toEqual([]);
  });

  test('string values', () => {
    expect(diff(['a', 'b', 'c'], ['b', 'd'])).toEqual(['a', 'c', 'd']);
  });

  test('campuran number/string (sort stable)', () => {
    expect(diff([1, 2, 'a'], [2, 'b'])).toEqual([1, 'a', 'b']);
  });

  test('throw TypeError untuk non-array', () => {
    expect(() => diff(null, [])).toThrow(TypeError);
    expect(() => diff([], 'x')).toThrow(TypeError);
    expect(() => diff(undefined, undefined)).toThrow(TypeError);
  });
});

describe('V1 ≡ V2 parity (random fuzz)', () => {
  function randomArr(maxLen = 20, maxVal = 12) {
    const len = Math.floor(Math.random() * maxLen);
    return Array.from({ length: len }, () =>
      Math.floor(Math.random() * maxVal),
    );
  }

  test('20 random cases: diffV1 dan diffV2 menghasilkan output identik', () => {
    for (let i = 0; i < 20; i++) {
      const a = randomArr();
      const b = randomArr();
      expect(diffV1(a, b)).toEqual(diffV2(a, b));
    }
  });
});
