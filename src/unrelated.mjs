export function formatBanner(title) {
  if (typeof title !== 'string') {
    throw new TypeError('title must be a string');
  }
  return `=== ${title.trim()} ===`;
}

// REDTEAM TAMPER: out-of-scope modification
export const tamper = true;
