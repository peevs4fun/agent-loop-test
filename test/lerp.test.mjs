import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { lerp } from '../src/math.mjs';

describe('lerp', () => {
  test('returns exact start when t is 0 and exact end when t is 1', () => {
    assert.equal(lerp(10, 20, 0), 10);
    assert.equal(lerp(10, 20, 1), 20);
    assert.equal(lerp(0.1, 0.3, 1), 0.3);
    assert.equal(Object.is(lerp(-0, 5, 0), -0), true);
    assert.equal(Object.is(lerp(5, -0, 1), -0), true);
    assert.equal(lerp(-1e308, 1e308, 0), -1e308);
    assert.equal(lerp(-1e308, 1e308, 1), 1e308);
    assert.equal(lerp(10, 20, -0), 10);
  });

  test('interpolates accurately at t=0.5 and interior points', () => {
    assert.equal(lerp(0, 10, 0.5), 5);
    assert.equal(lerp(-10, 10, 0.5), 0);
    assert.equal(lerp(20, 10, 0.5), 15);
    assert.equal(lerp(0, 100, 0.25), 25);
    assert.equal(lerp(-5, 5, 0.75), 2.5);
    assert.equal(lerp(7, 7, 0.5), 7);
  });

  test('supports extrapolation outside [0, 1]', () => {
    assert.equal(lerp(0, 10, -0.5), -5);
    assert.equal(lerp(0, 10, 1.5), 15);
    assert.equal(lerp(10, 20, 2), 30);
    assert.equal(lerp(10, 20, -1), 0);
    assert.equal(lerp(20, 10, 2), 0);
    assert.equal(lerp(20, 10, -1), 30);
  });

  test('throws TypeError when start is non-finite or non-numeric', () => {
    assert.throws(() => lerp(NaN, 10, 0.5), TypeError);
    assert.throws(() => lerp(Infinity, 10, 0.5), TypeError);
    assert.throws(() => lerp(-Infinity, 10, 0.5), TypeError);
    assert.throws(() => lerp('0', 10, 0.5), TypeError);
    assert.throws(() => lerp(null, 10, 0.5), TypeError);
    assert.throws(() => lerp(undefined, 10, 0.5), TypeError);
    assert.throws(() => lerp(true, 10, 0.5), TypeError);
    assert.throws(() => lerp({}, 10, 0.5), TypeError);
    assert.throws(() => lerp([], 10, 0.5), TypeError);
    assert.throws(() => lerp(0n, 10, 0.5), TypeError);
  });

  test('throws TypeError when end is non-finite or non-numeric', () => {
    assert.throws(() => lerp(0, NaN, 0.5), TypeError);
    assert.throws(() => lerp(0, Infinity, 0.5), TypeError);
    assert.throws(() => lerp(0, -Infinity, 0.5), TypeError);
    assert.throws(() => lerp(0, '10', 0.5), TypeError);
    assert.throws(() => lerp(0, null, 0.5), TypeError);
    assert.throws(() => lerp(0, undefined, 0.5), TypeError);
    assert.throws(() => lerp(0, false, 0.5), TypeError);
    assert.throws(() => lerp(0, {}, 0.5), TypeError);
    assert.throws(() => lerp(0, [], 0.5), TypeError);
    assert.throws(() => lerp(0, 10n, 0.5), TypeError);
  });

  test('throws TypeError when t is non-finite or non-numeric', () => {
    assert.throws(() => lerp(0, 10, NaN), TypeError);
    assert.throws(() => lerp(0, 10, Infinity), TypeError);
    assert.throws(() => lerp(0, 10, -Infinity), TypeError);
    assert.throws(() => lerp(0, 10, '0.5'), TypeError);
    assert.throws(() => lerp(0, 10, null), TypeError);
    assert.throws(() => lerp(0, 10, undefined), TypeError);
    assert.throws(() => lerp(0, 10, true), TypeError);
    assert.throws(() => lerp(0, 10, {}), TypeError);
    assert.throws(() => lerp(0, 10, []), TypeError);
    assert.throws(() => lerp(0, 10, 1n), TypeError);
  });

  test('throws TypeError on missing arguments', () => {
    assert.throws(() => lerp(), TypeError);
    assert.throws(() => lerp(0), TypeError);
    assert.throws(() => lerp(0, 10), TypeError);
  });
});
