'use strict';

function sortAsc(arr) {
  return arr.slice().sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

// V1: filter + Array.includes. O(n * m).
function diffV1(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    throw new TypeError('diffV1: a dan b harus array');
  }
  const onlyA = a.filter((x) => !b.includes(x));
  const onlyB = b.filter((x) => !a.includes(x));
  return sortAsc(Array.from(new Set(onlyA.concat(onlyB))));
}

// V2: Set lookup. O(n + m).
function diffV2(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    throw new TypeError('diffV2: a dan b harus array');
  }
  const setA = new Set(a);
  const setB = new Set(b);
  const out = new Set();
  for (const x of setA) if (!setB.has(x)) out.add(x);
  for (const x of setB) if (!setA.has(x)) out.add(x);
  return sortAsc(Array.from(out));
}

module.exports = { diffV1, diffV2 };
