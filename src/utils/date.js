// Formats a Date using its LOCAL calendar fields — never use toISOString()
// for this, since that converts to UTC and rolls the date over at UTC
// midnight instead of the device's actual local midnight.
export function toLocalISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return toLocalISODate(new Date());
}

// Parses a "YYYY-MM-DD" string as a LOCAL date. Never pass such a string
// straight to `new Date(str)` — the spec parses date-only ISO strings as
// UTC midnight, which silently shifts by a day in most timezones.
export function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(iso) {
  if (!iso) return '';
  return parseLocalDate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(iso) {
  if (!iso) return '';
  return parseLocalDate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Days between today and target ISO date. Positive = future, negative = past.
export function daysUntil(iso) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseLocalDate(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

export function addInterval(iso, cycle) {
  const date = parseLocalDate(iso);
  if (cycle === 'annual' || cycle === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return toLocalISODate(date);
}

export function currency(n) {
  const num = Number(n) || 0;
  return num.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}
