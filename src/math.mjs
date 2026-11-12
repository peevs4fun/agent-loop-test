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
