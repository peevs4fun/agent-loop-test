import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { inRange } from '../src/math.mjs';

describe('inRange', () => {
  test('treats two-argument form as [0, start)', () => {
    assert.equal(inRange(3, 5), true);
    assert.equal(inRange(0.5, 1), true);
    assert.equal(inRange(0, 5), true);
    assert.equal(inRange(5, 5), false);
    assert.equal(inRange(-1, 5), false);
    assert.equal(inRange(6, 5), false);
    assert.equal(inRange(3, 5, undefined), true);
    assert.equal(inRange(5, 5, undefined), false);
  });

  test('supports negative start in two-argument form via endpoint swap [start, 0)', () => {
    assert.equal(inRange(-3, -5), true);
    assert.equal(inRange(-5, -5), true);
    assert.equal(inRange(0, -5), false);
    assert.equal(inRange(1, -5), false);
    assert.equal(inRange(-6, -5), false);
  });

  test('evaluates three-argument half-open interval [start, end)', () => {
    assert.equal(inRange(3, 1, 5), true);
    assert.equal(inRange(-2, -5, 0), true);
    assert.equal(inRange(0.25, 0.1, 0.5), true);
    assert.equal(inRange(0, 1, 5), false);
    assert.equal(inRange(6, 1, 5), false);
    assert.equal(inRange(-0, 0, 1), true);
    assert.equal(inRange(0, -0, 1), true);
  });

  test('includes left boundary and excludes right boundary', () => {
    assert.equal(inRange(1, 1, 5), true);
    assert.equal(inRange(5, 1, 5), false);
    assert.equal(inRange(-5, -5, -1), true);
    assert.equal(inRange(-1, -5, -1), false);
  });

  test('handles degenerate empty intervals where start equals end', () => {
    assert.equal(inRange(0, 0), false);
    assert.equal(inRange(5, 5, 5), false);
    assert.equal(inRange(-3, -3, -3), false);
  });

  test('swaps endpoints when start is greater than end', () => {
    assert.equal(inRange(3, 5, 1), true);
    assert.equal(inRange(1, 5, 1), true);
    assert.equal(inRange(5, 5, 1), false);
    assert.equal(inRange(0, 5, 1), false);
    assert.equal(inRange(6, 5, 1), false);
    assert.equal(inRange(-2, 2, -4), true);
    assert.equal(inRange(-4, 2, -4), true);
    assert.equal(inRange(2, 2, -4), false);
    assert.equal(inRange(-3, -1, -5), true);
    assert.equal(inRange(-5, -1, -5), true);
    assert.equal(inRange(-1, -1, -5), false);
  });

  test('throws TypeError when value is non-finite or non-numeric', () => {
    assert.throws(() => inRange(NaN, 5), TypeError);
    assert.throws(() => inRange(Infinity, 5), TypeError);
    assert.throws(() => inRange(-Infinity, 5), TypeError);
    assert.throws(() => inRange('3', 5), TypeError);
    assert.throws(() => inRange(null, 5), TypeError);
    assert.throws(() => inRange(undefined, 5), TypeError);
    assert.throws(() => inRange(true, 1, 5), TypeError);
    assert.throws(() => inRange({}, 1, 5), TypeError);
    assert.throws(() => inRange([], 1, 5), TypeError);
    assert.throws(() => inRange(3n, 1, 5), TypeError);
  });

  test('throws TypeError when start is non-finite or non-numeric', () => {
    assert.throws(() => inRange(1, NaN), TypeError);
    assert.throws(() => inRange(1, Infinity), TypeError);
    assert.throws(() => inRange(1, -Infinity), TypeError);
    assert.throws(() => inRange(1, '5'), TypeError);
    assert.throws(() => inRange(1, null), TypeError);
    assert.throws(() => inRange(1, undefined), TypeError);
    assert.throws(() => inRange(1, false, 5), TypeError);
    assert.throws(() => inRange(1, {}, 5), TypeError);
    assert.throws(() => inRange(1, [], 5), TypeError);
    assert.throws(() => inRange(1, 0n, 5), TypeError);
  });

  test('throws TypeError when end is provided and non-finite or non-numeric', () => {
    assert.throws(() => inRange(1, 0, NaN), TypeError);
    assert.throws(() => inRange(1, 0, Infinity), TypeError);
    assert.throws(() => inRange(1, 0, -Infinity), TypeError);
    assert.throws(() => inRange(1, 0, '5'), TypeError);
    assert.throws(() => inRange(1, 0, null), TypeError);
    assert.throws(() => inRange(1, 0, true), TypeError);
    assert.throws(() => inRange(1, 0, {}), TypeError);
    assert.throws(() => inRange(1, 0, []), TypeError);
    assert.throws(() => inRange(1, 0, 5n), TypeError);
  });

  test('throws TypeError on missing arguments', () => {
    assert.throws(() => inRange(), TypeError);
    assert.throws(() => inRange(1), TypeError);
  });
});
