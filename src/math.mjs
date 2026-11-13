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
