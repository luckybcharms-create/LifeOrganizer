export const AUTH_KEY = 'lo_auth';
export const SESSION_KEY = 'lo_session_unlocked';

export async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getAccount() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAccount(email, passwordHash) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ email, passwordHash }));
}
