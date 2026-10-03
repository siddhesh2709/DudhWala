// ════════════════════════════════════════════════════════════════════
// Cloud & Local Sync Manager
// Enables accessing full profile across devices using:
// (Farm Name + Owner Name + Password)
// ════════════════════════════════════════════════════════════════════

const API_BASE = 'https://api.restful-api.dev/objects';
const LOCAL_STORAGE_PREFIX = 'dudhwala_farm_data_';
const ACTIVE_KEY_STORAGE = 'dudhwala_active_key';
const INDEX_MAP_STORAGE = 'dudhwala_account_index_map';
const GLOBAL_INDEX_OBJECT_ID_KEY = 'dudhwala_global_index_obj_id';

function storageGet(key) {
  try {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  } catch (e) {}
  return null;
}

function storageSet(key, val) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, val);
  } catch (e) {}
}

function storageRemove(key) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch (e) {}
}

// Fixed initial master index object ID to bootstrap global sync across devices
let masterIndexObjectId = storageGet(GLOBAL_INDEX_OBJECT_ID_KEY) || 'ff808181a09d98f701a101daad8d6c00';

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

export function getActiveAccountKey() {
  return storageGet(ACTIVE_KEY_STORAGE) || null;
}

export function setActiveAccountKey(accountKey) {
  if (accountKey) {
    storageSet(ACTIVE_KEY_STORAGE, accountKey);
  } else {
    storageRemove(ACTIVE_KEY_STORAGE);
  }
}

// Local Index mapping (accountKey -> cloudObjectId)
function getLocalIndexMap() {
  try {
    const raw = storageGet(INDEX_MAP_STORAGE);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveLocalIndexMap(map) {
  try {
    storageSet(INDEX_MAP_STORAGE, JSON.stringify(map));
  } catch (e) {}
}

// Fetch Global Cloud Index Map
async function fetchCloudIndexMap() {
  const localMap = getLocalIndexMap();
  try {
    if (masterIndexObjectId) {
      const res = await fetch(`${API_BASE}/${masterIndexObjectId}`);
      if (res.ok) {
        const obj = await res.json();
        if (obj && obj.data) {
          const merged = { ...localMap, ...obj.data };
          saveLocalIndexMap(merged);
          return merged;
        }
      }
    }
  } catch (e) {
    console.warn('Could not fetch cloud index map:', e);
  }
  return localMap;
}

// Update Global Cloud Index Map with new account mapping
async function registerAccountInIndex(accountKey, cloudObjectId) {
  const currentMap = await fetchCloudIndexMap();
  currentMap[accountKey] = cloudObjectId;
  saveLocalIndexMap(currentMap);

  try {
    if (masterIndexObjectId) {
      await fetch(`${API_BASE}/${masterIndexObjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'dudhwala_global_index_v1', data: currentMap }),
      });
    } else {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'dudhwala_global_index_v1', data: currentMap }),
      });
      if (res.ok) {
        const created = await res.json();
        masterIndexObjectId = created.id;
        storageSet(GLOBAL_INDEX_OBJECT_ID_KEY, created.id);
      }
    }
  } catch (e) {
    console.warn('Failed to update cloud index map:', e);
  }
}

// Load state locally first for instant page load
export function loadLocalState(accountKey) {
  try {
    if (accountKey) {
      const raw = storageGet(`${LOCAL_STORAGE_PREFIX}${accountKey}`);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.profile && s.profile.farmName) {
          if (!s.records) s.records = {};
          return s;
        }
      }
    }

    // Fallback check legacy key
    const rawLegacy = storageGet('dairy_react_v1');
    if (rawLegacy) {
      const s = JSON.parse(rawLegacy);
      if (s && s.profile && s.profile.farmName) {
        if (!s.records) s.records = {};
        if (accountKey) {
          const legKey = makeAccountKey(s.profile.farmName, s.profile.ownerName, s.profile.password || '');
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
      storageSet(`${LOCAL_STORAGE_PREFIX}${accountKey}`, JSON.stringify(state));
    }
    storageSet('dairy_react_v1', JSON.stringify(state));
  } catch (e) {
    console.warn('Error saving local state:', e);
  }
}

// Fetch remote state from Cloud API for ANY device
export async function fetchRemoteState(accountKey) {
  if (!accountKey) return null;

  try {
    // 1. Get object ID for this account key from global index
    const indexMap = await fetchCloudIndexMap();
    const cloudObjectId = indexMap[accountKey];

    if (cloudObjectId) {
      const res = await fetch(`${API_BASE}/${cloudObjectId}`);
      if (res.ok) {
        const obj = await res.json();
        if (obj && obj.data && obj.data.profile) {
          if (!obj.data.records) obj.data.records = {};
          saveLocalState(accountKey, obj.data);
          return obj.data;
        }
      }
    }
  } catch (e) {
    console.warn('Online sync fetch error:', e);
  }

  // Check if local cache has it
  const local = loadLocalState(accountKey);
  if (local && local.profile && local.profile.farmName) {
    return local;
  }
  return null;
}

// Push state to Cloud API
export async function pushRemoteState(accountKey, state) {
  if (!accountKey || !state || !state.profile) return false;

  try {
    const indexMap = await fetchCloudIndexMap();
    let cloudObjectId = indexMap[accountKey];

    if (cloudObjectId) {
      // Update existing cloud object
      const res = await fetch(`${API_BASE}/${cloudObjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: accountKey, data: state }),
      });
      return res.ok;
    } else {
      // Create new cloud object for this account
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: accountKey, data: state }),
      });
      if (res.ok) {
        const created = await res.json();
        await registerAccountInIndex(accountKey, created.id);
        return true;
      }
    }
  } catch (e) {
    console.warn('Online sync push error:', e);
  }
  return false;
}
