import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { multiply, clamp } from '../src/math.mjs';

describe('multiply', () => {
  test('multiplies two finite numbers correctly', () => {
    assert.equal(multiply(2, 3), 6);
    assert.equal(multiply(-2, 3), -6);
    assert.equal(multiply(-2, -3), 6);
    assert.equal(multiply(0, 5), 0);
    assert.equal(multiply(5, 0), 0);
    assert.equal(multiply(0, 0), 0);
    assert.equal(multiply(2.5, 4), 10);
    assert.ok(Math.abs(multiply(0.1, 0.2) - 0.02) < 1e-10);
  });

  test('handles boundary finite numbers', () => {
    assert.equal(multiply(Number.MAX_SAFE_INTEGER, 1), Number.MAX_SAFE_INTEGER);
    assert.equal(multiply(Number.MIN_SAFE_INTEGER, 1), Number.MIN_SAFE_INTEGER);
  });

  test('throws TypeError on non-finite or invalid numeric inputs for a', () => {
    assert.throws(() => multiply('2', 3), TypeError);
    assert.throws(() => multiply(NaN, 3), TypeError);
    assert.throws(() => multiply(Infinity, 3), TypeError);
    assert.throws(() => multiply(-Infinity, 3), TypeError);
    assert.throws(() => multiply(null, 3), TypeError);
    assert.throws(() => multiply(undefined, 3), TypeError);
    assert.throws(() => multiply(true, 3), TypeError);
    assert.throws(() => multiply({}, 3), TypeError);
    assert.throws(() => multiply([], 3), TypeError);
    assert.throws(() => multiply(10n, 3), TypeError);
  });

  test('throws TypeError on non-finite or invalid numeric inputs for b', () => {
    assert.throws(() => multiply(2, '3'), TypeError);
    assert.throws(() => multiply(2, NaN), TypeError);
    assert.throws(() => multiply(2, Infinity), TypeError);
    assert.throws(() => multiply(2, -Infinity), TypeError);
    assert.throws(() => multiply(2, null), TypeError);
    assert.throws(() => multiply(2, undefined), TypeError);
    assert.throws(() => multiply(2, false), TypeError);
    assert.throws(() => multiply(2, {}), TypeError);
    assert.throws(() => multiply(2, []), TypeError);
    assert.throws(() => multiply(2, 10n), TypeError);
  });

  test('throws TypeError on missing arguments', () => {
    assert.throws(() => multiply(), TypeError);
    assert.throws(() => multiply(1), TypeError);
  });
});

describe('clamp', () => {
  test('clamps values within [min, max] range', () => {
    assert.equal(clamp(5, 0, 10), 5);
    assert.equal(clamp(-5, 0, 10), 0);
    assert.equal(clamp(15, 0, 10), 10);
    assert.equal(clamp(-15, -20, -10), -15);
    assert.equal(clamp(-25, -20, -10), -20);
    assert.equal(clamp(0, -20, -10), -10);
    assert.equal(clamp(1.5, 1.2, 1.8), 1.5);
    assert.equal(clamp(1.0, 1.2, 1.8), 1.2);
    assert.equal(clamp(2.0, 1.2, 1.8), 1.8);
  });

  test('handles boundary values at min and max', () => {
    assert.equal(clamp(0, 0, 10), 0);
    assert.equal(clamp(10, 0, 10), 10);
    assert.equal(clamp(-20, -20, -10), -20);
    assert.equal(clamp(-10, -20, -10), -10);
  });

  test('handles degenerate range where min equals max', () => {
    assert.equal(clamp(5, 5, 5), 5);
    assert.equal(clamp(2, 5, 5), 5);
    assert.equal(clamp(8, 5, 5), 5);
  });

  test('throws RangeError when min is greater than max', () => {
    assert.throws(() => clamp(5, 10, 0), RangeError);
    assert.throws(() => clamp(0, 1, -1), RangeError);
    assert.throws(() => clamp(-5, -2, -3), RangeError);
    assert.throws(() => clamp(0, 0.0001, 0), RangeError);
  });

  test('throws TypeError when any parameter is non-finite or non-numeric', () => {
    assert.throws(() => clamp(NaN, 0, 10), TypeError);
    assert.throws(() => clamp(0, NaN, 10), TypeError);
    assert.throws(() => clamp(0, 0, NaN), TypeError);

    assert.throws(() => clamp(Infinity, 0, 10), TypeError);
    assert.throws(() => clamp(-Infinity, 0, 10), TypeError);
    assert.throws(() => clamp(0, Infinity, 10), TypeError);
    assert.throws(() => clamp(0, 0, Infinity), TypeError);

    assert.throws(() => clamp('5', 0, 10), TypeError);
    assert.throws(() => clamp(5, '0', 10), TypeError);
    assert.throws(() => clamp(5, 0, '10'), TypeError);

    assert.throws(() => clamp(null, 0, 10), TypeError);
    assert.throws(() => clamp(5, null, 10), TypeError);
    assert.throws(() => clamp(5, 0, null), TypeError);

    assert.throws(() => clamp(undefined, 0, 10), TypeError);
    assert.throws(() => clamp(5, undefined, 10), TypeError);
    assert.throws(() => clamp(5, 0, undefined), TypeError);

    assert.throws(() => clamp(true, 0, 10), TypeError);
    assert.throws(() => clamp(5, false, 10), TypeError);
    assert.throws(() => clamp(5, 0, true), TypeError);
  });

  test('evaluates type errors prior to range errors', () => {
    assert.throws(() => clamp(NaN, 10, 5), TypeError);
    assert.throws(() => clamp('invalid', 10, 5), TypeError);
  });

  test('throws TypeError on missing arguments', () => {
    assert.throws(() => clamp(), TypeError);
    assert.throws(() => clamp(1), TypeError);
    assert.throws(() => clamp(1, 2), TypeError);
  });
});
