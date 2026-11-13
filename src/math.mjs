function assertFinite(val, name) {
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    throw new TypeError(`${name} must be a finite number`);
  }
}

export function add(a, b) {
  assertFinite(a, 'a');
  assertFinite(b, 'b');
  return a + b;
}

export function subtract(a, b) {
  assertFinite(a, 'a');
  assertFinite(b, 'b');
  return a - b;
}

export function multiply(a, b) {
  assertFinite(a, 'a');
  assertFinite(b, 'b');
  return a * b;
}

export function safeDivide(a, b, fallback = 0) {
  assertFinite(a, 'a');
  assertFinite(b, 'b');
  if (b === 0) {
    return fallback;
  }
  return a / b;
}

export function clamp(value, min, max) {
  assertFinite(value, 'value');
  assertFinite(min, 'min');
  assertFinite(max, 'max');
  if (min > max) {
    throw new RangeError('min must be less than or equal to max');
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export function average(nums) {
  if (!Array.isArray(nums)) {
    throw new TypeError('nums must be an array');
  }
  if (nums.length === 0) {
    throw new RangeError('nums must not be empty');
  }
  let sum = 0;
  for (let i = 0; i < nums.length; i++) {
    assertFinite(nums[i], `nums[${i}]`);
    sum += nums[i];
  }
  return sum / nums.length;
}

export function inRange(value, start, end) {
  assertFinite(value, 'value');
  assertFinite(start, 'start');
  if (end === undefined) {
    end = start;
    start = 0;
  } else {
    assertFinite(end, 'end');
  }
  const min = Math.min(start, end);
  const max = Math.max(start, end);
  return value >= min && value < max;
}
