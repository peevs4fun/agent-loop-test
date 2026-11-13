import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { safeDivide } from '../src/math.mjs';

describe('safeDivide', () => {
  test('divides finite numbers correctly', () => {
    assert.equal(safeDivide(10, 2), 5);
    assert.equal(safeDivide(-9, 3), -3);
    assert.equal(safeDivide(9, -3), -3);
    assert.equal(safeDivide(-9, -3), 3);
    assert.equal(safeDivide(0, 5), 0);
    assert.equal(safeDivide(0, -5), -0);
  });

  test('preserves floating-point division results', () => {
    assert.equal(safeDivide(7.5, 2.5), 3);
    assert.equal(safeDivide(1, 4), 0.25);
    assert.ok(Math.abs(safeDivide(0.3, 0.1) - 3) < 1e-10);
  });

  test('returns the default fallback when the divisor is zero', () => {
    assert.equal(safeDivide(5, 0), 0);
    assert.equal(safeDivide(-5, 0), 0);
    assert.equal(safeDivide(0, 0), 0);
    assert.equal(safeDivide(5, -0), 0);
  });

  test('returns a custom fallback when the divisor is zero', () => {
    assert.equal(safeDivide(5, 0, 42), 42);
    assert.equal(safeDivide(-5, 0, -1), -1);
    assert.equal(safeDivide(0, 0, 99.5), 99.5);
    assert.equal(safeDivide(5, -0, 7), 7);
  });

  test('throws TypeError when the dividend is invalid or non-finite', () => {
    assert.throws(() => safeDivide(NaN, 2), TypeError);
    assert.throws(() => safeDivide(Infinity, 2), TypeError);
    assert.throws(() => safeDivide(-Infinity, 2), TypeError);
    assert.throws(() => safeDivide('10', 2), TypeError);
    assert.throws(() => safeDivide(null, 2), TypeError);
    assert.throws(() => safeDivide(undefined, 2), TypeError);
    assert.throws(() => safeDivide(true, 2), TypeError);
    assert.throws(() => safeDivide({}, 2), TypeError);
    assert.throws(() => safeDivide([], 2), TypeError);
    assert.throws(() => safeDivide(10n, 2), TypeError);
  });

  test('throws TypeError when the divisor is invalid or non-finite', () => {
    assert.throws(() => safeDivide(2, NaN), TypeError);
    assert.throws(() => safeDivide(2, Infinity), TypeError);
    assert.throws(() => safeDivide(2, -Infinity), TypeError);
    assert.throws(() => safeDivide(2, '2'), TypeError);
    assert.throws(() => safeDivide(2, null), TypeError);
    assert.throws(() => safeDivide(2, undefined), TypeError);
    assert.throws(() => safeDivide(2, false), TypeError);
    assert.throws(() => safeDivide(2, {}), TypeError);
    assert.throws(() => safeDivide(2, []), TypeError);
    assert.throws(() => safeDivide(2, 10n), TypeError);
  });

  test('throws TypeError on missing arguments', () => {
    assert.throws(() => safeDivide(), TypeError);
    assert.throws(() => safeDivide(1), TypeError);
  });

  test('validates both operands before returning the fallback', () => {
    assert.throws(() => safeDivide(NaN, 0, 42), TypeError);
    assert.throws(() => safeDivide(Infinity, 0, 42), TypeError);
    assert.throws(() => safeDivide(1, NaN, 42), TypeError);
    assert.throws(() => safeDivide(1, Infinity, 42), TypeError);
  });
});
