import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { add, subtract } from '../src/math.mjs';

describe('math module', () => {
  test('add adds two finite numbers correctly', () => {
    assert.equal(add(2, 3), 5);
    assert.equal(add(-1, 1), 0);
  });

  test('add throws TypeError on invalid or non-finite numbers', () => {
    assert.throws(() => add('1', 2), TypeError);
    assert.throws(() => add(NaN, 2), TypeError);
    assert.throws(() => add(Infinity, 2), TypeError);
  });

  test('subtract subtracts two finite numbers correctly', () => {
    assert.equal(subtract(5, 2), 3);
    assert.equal(subtract(2, 5), -3);
  });

  test('subtract throws TypeError on invalid or non-finite numbers', () => {
    assert.throws(() => subtract(5, '2'), TypeError);
    assert.throws(() => subtract(5, NaN), TypeError);
    assert.throws(() => subtract(-Infinity, 2), TypeError);
  });
});
