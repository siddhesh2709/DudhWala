// ════════════════════════════════════════════════════════════════════
// Cloud & Local Sync Manager
// Enables accessing full profile across devices using:
// (Farm Name + Owner Name + Password)
// ════════════════════════════════════════════════════════════════════

export function makeAccountKey(farmName = '', ownerName = '', password = '') {
  const norm = (str) =>
    String(str)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');

  const f = norm(farmName);
  const o = norm(ownerName);
  const p = String(password).trim();

  if (!f || !o || !p) return null;
  return `dudhwala_${f}_${o}_${p}`;
}

// Storage Keys
const LOCAL_STORAGE_PREFIX = 'dudhwala_farm_data_';
const ACTIVE_KEY_STORAGE = 'dudhwala_active_key';

// Remote Endpoint — Cloud Key-Value API (Firebase Open REST / KV Storage)
const CLOUD_ENDPOINT = 'https://dairy-farm-sync-default-rtdb.asia-southeast1.firebasedatabase.app/farms';

export function getActiveAccountKey() {
  return localStorage.getItem(ACTIVE_KEY_STORAGE) || null;
}

export function setActiveAccountKey(accountKey) {
  if (accountKey) {
    localStorage.setItem(ACTIVE_KEY_STORAGE, accountKey);
  } else {
    localStorage.removeItem(ACTIVE_KEY_STORAGE);
  }
}

// Load state locally first for speed
export function loadLocalState(accountKey) {
  try {
    const key = accountKey ? `${LOCAL_STORAGE_PREFIX}${accountKey}` : 'dairy_react_v1';
    const raw = localStorage.getItem(key);
    if (raw) {
      const s = JSON.parse(raw);
      if (!s.records) s.records = {};
      return s;
    }
  } catch (e) {
    console.warn('Error loading local state:', e);
  }
  return { profile: null, records: {} };
}

// Save state locally
export function saveLocalState(accountKey, state) {
  try {
    const key = accountKey ? `${LOCAL_STORAGE_PREFIX}${accountKey}` : 'dairy_react_v1';
    localStorage.setItem(key, JSON.stringify(state));
    // Also save legacy key for backward compatibility
    localStorage.setItem('dairy_react_v1', JSON.stringify(state));
  } catch (e) {
    console.warn('Error saving local state:', e);
  }
}

// Fetch remote state from Cloud API
export async function fetchRemoteState(accountKey) {
  if (!accountKey) return null;
  try {
    const res = await fetch(`${CLOUD_ENDPOINT}/${accountKey}.json`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.profile) {
        if (!data.records) data.records = {};
        // Cache locally
        saveLocalState(accountKey, data);
        return data;
      }
    }
  } catch (e) {
    console.warn('Online sync fetch offline/error:', e);
  }
  return null;
}

// Push state to Cloud API
export async function pushRemoteState(accountKey, state) {
  if (!accountKey || !state || !state.profile) return false;
  try {
    const res = await fetch(`${CLOUD_ENDPOINT}/${accountKey}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    return res.ok;
  } catch (e) {
    console.warn('Online sync push offline/error:', e);
    return false;
  }
}
