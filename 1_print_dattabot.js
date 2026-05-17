'use strict';

function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

function isPerfectSquare(x) {
  if (x < 0) return false;
  const s = Math.floor(Math.sqrt(x));
  return s * s === x;
}

// N adalah fibonacci iff (5N^2 + 4) atau (5N^2 - 4) perfect square.
function isFibonacci(n) {
  if (!Number.isInteger(n) || n < 1) return false;
  const k = 5 * n * n;
  return isPerfectSquare(k + 4) || isPerfectSquare(k - 4);
}

function printDattabot(n) {
  if (!Number.isInteger(n) || n < 1) {
    throw new TypeError('printDattabot: n harus integer positif');
  }
  const out = new Array(n);
  for (let i = 1; i <= n; i++) {
    if (i === 1) { out[0] = 1; continue; }
    const p = isPrime(i);
    const f = isFibonacci(i);
    if (p && f) out[i - 1] = 'dattabot';
    else if (p) out[i - 1] = 'datta';
    else if (f) out[i - 1] = 'bot';
    else out[i - 1] = i;
  }
  return out;
}

module.exports = { isPrime, isFibonacci, printDattabot };

if (require.main === module) {
  const raw = process.argv[2];
  if (raw === undefined) {
    console.error('Usage: node 1_print_dattabot.js <n>');
    console.error('  where n is a positive integer >= 1');
    process.exit(1);
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    console.error(`Error: "${raw}" is not a positive integer >= 1`);
    console.error('Usage: node 1_print_dattabot.js <n>');
    process.exit(1);
  }
  console.log(JSON.stringify(printDattabot(n)));
}
