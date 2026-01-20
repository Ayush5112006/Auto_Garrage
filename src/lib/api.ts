const API_BASE = import.meta.env.VITE_PHP_API_ORIGIN ?? 'http://localhost';
const API_PREFIX = import.meta.env.VITE_PHP_API_PREFIX ?? '/php-api';

async function fetchJson(path: string, opts: any = {}) {
  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    ...opts,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw data;
  return data;
}

export async function registerAPI(payload: { name?: string; email: string; password: string }) {
  return fetchJson('/register.php', { method: 'POST', body: JSON.stringify(payload) });
}

export async function loginAPI(payload: { email: string; password: string }) {
  return fetchJson('/login.php', { method: 'POST', body: JSON.stringify(payload) });
}

export async function logoutAPI() {
  return fetchJson('/logout.php', { method: 'POST' });
}

export async function meAPI() {
  return fetchJson('/me.php', { method: 'GET' });
}
