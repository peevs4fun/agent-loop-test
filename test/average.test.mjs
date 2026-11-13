import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { average } from '../src/math.mjs';

describe('average', () => {
  test('computes arithmetic mean of positive, negative, and mixed numbers', () => {
    assert.equal(average([1, 2, 3, 4]), 2.5);
    assert.equal(average([-10, -20, -30]), -20);
    assert.equal(average([-5, 5]), 0);
    assert.equal(average([-4, 0, 10]), 2);
    assert.equal(average([0, 0, 0]), 0);
    assert.ok(Math.abs(average([0.1, 0.2, 0.3]) - 0.2) < 1e-10);
  });

  test('computes arithmetic mean for single-element arrays', () => {
    assert.equal(average([42]), 42);
    assert.equal(average([-7.5]), -7.5);
    assert.equal(average([0]), 0);
  });

  test('throws TypeError when nums is not an array', () => {
    assert.throws(() => average(), TypeError);
    assert.throws(() => average(null), TypeError);
    assert.throws(() => average(undefined), TypeError);
    assert.throws(() => average(123), TypeError);
    assert.throws(() => average('123'), TypeError);
    assert.throws(() => average({ 0: 1, length: 1 }), TypeError);
    assert.throws(() => average(new Set([1, 2])), TypeError);
  });

  test('throws RangeError when nums is an empty array', () => {
    assert.throws(() => average([]), RangeError);
  });

  test('throws TypeError when any element is non-finite or non-numeric', () => {
    assert.throws(() => average([NaN]), TypeError);
    assert.throws(() => average([1, NaN, 3]), TypeError);
    assert.throws(() => average([Infinity, 1]), TypeError);
    assert.throws(() => average([1, -Infinity]), TypeError);
    assert.throws(() => average([1, '2', 3]), TypeError);
    assert.throws(() => average([1, null]), TypeError);
    assert.throws(() => average([1, undefined]), TypeError);
    assert.throws(() => average([true, 1]), TypeError);
    assert.throws(() => average([1, {}]), TypeError);
    assert.throws(() => average([1, 10n]), TypeError);
    assert.throws(() => average(new Array(3)), TypeError);
  });
});
