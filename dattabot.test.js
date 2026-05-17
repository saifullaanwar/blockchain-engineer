'use strict';

const { isPrime, isFibonacci, printDattabot } = require('./1_print_dattabot');

// Expected output di-derive dari rules prime/fibonacci murni (bukan dari contoh PDF
// yang tampak inkonsisten dengan rules tertulis).

describe('isPrime', () => {
  test.each([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47])(
    '%i is prime', (n) => expect(isPrime(n)).toBe(true),
  );
  test.each([0, 1, 4, 6, 8, 9, 15, 21, 25, 49, -7, 1.5])(
    '%s is not prime', (n) => expect(isPrime(n)).toBe(false),
  );
});

describe('isFibonacci', () => {
  test.each([1, 2, 3, 5, 8, 13, 21, 34, 55, 89])(
    '%i is fibonacci', (n) => expect(isFibonacci(n)).toBe(true),
  );
  test.each([4, 6, 7, 9, 10, 14, 22, 35, 50, 0, -5, 2.5])(
    '%s is not fibonacci', (n) => expect(isFibonacci(n)).toBe(false),
  );
});

describe('printDattabot', () => {
  test('n=1 → [1] (special case)', () => {
    expect(printDattabot(1)).toEqual([1]);
  });

  test('n=15', () => {
    expect(printDattabot(15)).toEqual([
      1, 'dattabot', 'dattabot', 4, 'dattabot', 6, 'datta', 'bot',
      9, 10, 'datta', 12, 'dattabot', 14, 15,
    ]);
  });

  test('n=30', () => {
    expect(printDattabot(30)).toEqual([
      1, 'dattabot', 'dattabot', 4, 'dattabot', 6, 'datta', 'bot', 9, 10,
      'datta', 12, 'dattabot', 14, 15, 16, 'datta', 18, 'datta', 20,
      'bot', 22, 'datta', 24, 25, 26, 27, 28, 'datta', 30,
    ]);
  });

  test('n=50', () => {
    expect(printDattabot(50)).toEqual([
      1, 'dattabot', 'dattabot', 4, 'dattabot', 6, 'datta', 'bot', 9, 10,
      'datta', 12, 'dattabot', 14, 15, 16, 'datta', 18, 'datta', 20,
      'bot', 22, 'datta', 24, 25, 26, 27, 28, 'datta', 30,
      'datta', 32, 33, 'bot', 35, 36, 'datta', 38, 39, 40,
      'datta', 42, 'datta', 44, 45, 46, 'datta', 48, 49, 50,
    ]);
  });

  test('panjang output sama dengan n', () => {
    expect(printDattabot(50)).toHaveLength(50);
    expect(printDattabot(100)).toHaveLength(100);
  });

  test('throw untuk input invalid', () => {
    expect(() => printDattabot(0)).toThrow(TypeError);
    expect(() => printDattabot(-3)).toThrow(TypeError);
    expect(() => printDattabot(1.5)).toThrow(TypeError);
    expect(() => printDattabot('5')).toThrow(TypeError);
    expect(() => printDattabot(null)).toThrow(TypeError);
  });
});
