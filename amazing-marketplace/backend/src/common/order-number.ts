const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Human-readable order number, e.g. AMZ-20261106-K7QX */
export function createOrderNumber(date = new Date()): string {
  const d = date.toISOString().slice(0, 10).replace(/-/g, '');
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  return `AMZ-${d}-${suffix}`;
}
