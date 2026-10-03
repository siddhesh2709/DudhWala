// ═══════════════════════════════
// Data Store — localStorage
// ═══════════════════════════════
const KEY = 'dairy_react_v1';

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (!s.records) s.records = {};
      return s;
    }
  } catch {}
  return { profile: null, records: {} };
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

// Date helpers
export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

export function p2(n) {
  return String(n).padStart(2, '0');
}

export const MR_MONTHS = [
  'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
  'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
];

export function fmtDate(ds) {
  const d = new Date(ds + 'T00:00:00');
  return `${d.getDate()} ${MR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtMonth(d) {
  return `${MR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return '₹--';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export function fmtL(n) {
  if (n === undefined || n === null || isNaN(n)) return '-- L';
  return Number(n).toFixed(1) + ' L';
}

// Recalculate daily totals
export function recalcDay(records, dk) {
  const r = records[dk];
  if (!r) return records;
  const c = r.cow || {}, f = r.calf || {};
  return {
    ...records,
    [dk]: {
      ...r,
      totalMilk:    c.totalMilk    || 0,
      totalIncome:  c.milkIncome   || 0,
      totalExpense: (c.totalExpense || 0) + (f.totalExpense || 0),
      net:          (c.milkIncome  || 0) - ((c.totalExpense || 0) + (f.totalExpense || 0)),
    }
  };
}
