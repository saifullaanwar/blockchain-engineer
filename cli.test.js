'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const SCRIPT = path.join(__dirname, '1_print_dattabot.js');

function run(args) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
  });
  return {
    stdout: (res.stdout || '').trim(),
    stderr: (res.stderr || '').trim(),
    exit: res.status,
  };
}

describe('CLI', () => {
  test('no args → Usage to stderr, exit 1', () => {
    const r = run([]);
    expect(r.exit).toBe(1);
    expect(r.stderr).toMatch(/Usage/);
    expect(r.stdout).toBe('');
  });

  test.each([
    ['abc', /not a positive integer/i],
    ['-5', /not a positive integer/i],
    ['0', /not a positive integer/i],
    ['1.5', /not a positive integer/i],
    ['', /not a positive integer/i],
    ['NaN', /not a positive integer/i],
  ])('input "%s" → error, exit 1', (arg, errPattern) => {
    const r = run([arg]);
    expect(r.exit).toBe(1);
    expect(r.stderr).toMatch(errPattern);
    expect(r.stdout).toBe('');
  });

  test('"15" → JSON array length 15, exit 0', () => {
    const r = run(['15']);
    expect(r.exit).toBe(0);
    const arr = JSON.parse(r.stdout);
    expect(arr).toHaveLength(15);
    expect(arr[0]).toBe(1);
    expect(arr[1]).toBe('dattabot');
  });

  test('"1" → [1], exit 0', () => {
    const r = run(['1']);
    expect(r.exit).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual([1]);
  });

  test('output adalah valid JSON (bukan default console.log format)', () => {
    const r = run(['5']);
    expect(r.exit).toBe(0);
    expect(() => JSON.parse(r.stdout)).not.toThrow();
  });
});
