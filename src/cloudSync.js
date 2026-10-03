// ════════════════════════════════════════════════════════════════════
// Cloud & Local Sync Manager
// Enables accessing full profile across devices using:
// (Farm Name + Owner Name + Password)
// ════════════════════════════════════════════════════════════════════

export function makeAccountKey(farmName = '', ownerName = '', password = '') {
  if (!farmName || !ownerName || !password) return null;

  const sanitize = (str) =>
    String(str)
      .trim()
      .toLowerCase()
      .replace(/[\s\/\#\$\.\[\]]+/g, '_');

  const f = sanitize(farmName);
  const o = sanitize(ownerName);
  const p = String(password).trim();

  if (!f || !o || !p) return null;
  return `dudhwala_${encodeURIComponent(f)}_${encodeURIComponent(o)}_${encodeURIComponent(p)}`;
}

// Storage Keys
const LOCAL_STORAGE_PREFIX = 'dudhwala_farm_data_';
const ACTIVE_KEY_STORAGE = 'dudhwala_active_key';

// Remote Endpoint — Cloud Key-Value API (Firebase Open REST)
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
    // 1. Check account specific key
    if (accountKey) {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${accountKey}`);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.profile && s.profile.farmName) {
          if (!s.records) s.records = {};
          return s;
        }
      }
    }

    // 2. Fallback check legacy key
    const rawLegacy = localStorage.getItem('dairy_react_v1');
    if (rawLegacy) {
      const s = JSON.parse(rawLegacy);
      if (s && s.profile && s.profile.farmName) {
        if (!s.records) s.records = {};
        if (accountKey) {
          // If legacy matches requested credentials (or password was newly added)
          const legacyPass = s.profile.password || '';
          const legKey = makeAccountKey(s.profile.farmName, s.profile.ownerName, legacyPass);
          if (!accountKey || legKey === accountKey || !s.profile.password) {
            saveLocalState(accountKey, s);
            return s;
          }
        } else {
          return s;
        }
      }
    }
  } catch (e) {
    console.warn('Error loading local state:', e);
  }
  return { profile: null, records: {} };
}

// Save state locally
export function saveLocalState(accountKey, state) {
  try {
    if (accountKey) {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${accountKey}`, JSON.stringify(state));
    }
    // Also save legacy key for active state fast load
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
      if (data && data.profile && data.profile.farmName) {
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
