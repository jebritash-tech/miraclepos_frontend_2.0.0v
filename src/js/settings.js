// src/js/settings.js
import { ref, computed } from 'vue';
import axios from 'axios';
import { API_BASE } from './config.js';

const CACHE_KEY = 'miraclepos_settings_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 دقائق

/* ============================================================
   القيم الافتراضية — إذا لم يحمّلها السرفر
   ============================================================ */
const DEFAULTS = {
  'pharmacy.name':       'صيدليتي',
  'pharmacy.phone':      '',
  'pharmacy.address':    '',
  'pharmacy.tax_number': '',
  'pharmacy.currency':   'ج.س',
  'pharmacy.logo_url':   '',

  'print.enabled':         false,
  'print.auto_after_sale': false,
  'print.width':           80,
  'print.allow_reprint':   true,
  'print.auto_close_shift':true,

  'pin.enabled':          false,
  'pin.length':           4,
  'pin.on_shift_open':    true,
  'pin.on_shift_close':   true,
  'pin.on_withdraw':      true,
  'pin.on_void_sale':     true,
  'pin.on_price_change':  false,
  'pin.on_every_sale':    false,
  'pin.on_expense':       true,
  'pin.on_debt_payment':  true,
};

/* ============================================================
   Reactive state — مشترك بين كل التطبيق
   ============================================================ */
export const settings        = ref({ ...DEFAULTS });
export const settingsLoaded  = ref(false);
export const settingsLoading = ref(false);

/* ============================================================
   Helpers — للقراءة الآمنة
   ============================================================ */
const toBool = (v) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number')  return v === 1;
  if (typeof v === 'string')  return v === '1' || v.toLowerCase() === 'true';
  return false;
};

export function getSetting(key, fallback = null) {
  const v = settings.value[key];
  if (v === undefined || v === null || v === '') {
    return fallback !== null ? fallback : (DEFAULTS[key] ?? null);
  }
  return v;
}

export function getBool(key) {
  return toBool(getSetting(key));
}

export function getInt(key, fallback = 0) {
  const v = parseInt(getSetting(key, fallback));
  return isNaN(v) ? fallback : v;
}

/* ============================================================
   Cache (localStorage)
   ============================================================ */
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.data && typeof parsed.data === 'object') return parsed;
  } catch (e) {}
  return null;
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      cached_at: Date.now(),
    }));
  } catch (e) {}
}

function cacheIsFresh() {
  const c = readCache();
  if (!c || !c.cached_at) return false;
  return (Date.now() - c.cached_at) < CACHE_TTL_MS;
}

/* ============================================================
   التحميل الرئيسي
   ============================================================ */
export async function loadSettings({ force = false } = {}) {
  if (settingsLoading.value) return settings.value;

  // 1. طبّق الكاش أولاً لرسم فوري
  if (!settingsLoaded.value) {
    const cached = readCache();
    if (cached) {
      settings.value = { ...DEFAULTS, ...cached.data };
      settingsLoaded.value = true;
    }
  }

  // 2. إذا الكاش طازج ولا يوجد force → لا نطلب من الشبكة
  if (!force && settingsLoaded.value && cacheIsFresh()) {
    return settings.value;
  }

  // 3. اطلب من الشبكة
  settingsLoading.value = true;
  try {
    const res = await axios.get(`${API_BASE}/settings/public`, {
      params: { _ts: Date.now() },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    const data = res.data || {};
    settings.value = { ...DEFAULTS, ...data };
    settingsLoaded.value = true;
    writeCache(data);
    return settings.value;

  } catch (e) {
    console.warn('⚠️ Failed to load settings from server:', e);
    if (!settingsLoaded.value) settingsLoaded.value = true;
    return settings.value;

  } finally {
    settingsLoading.value = false;
  }
}

export function refreshSettings() {
  return loadSettings({ force: true });
}

export function clearSettingsCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
  settings.value = { ...DEFAULTS };
  settingsLoaded.value = false;
}

/* ============================================================
   Computed helpers (للاستخدام المباشر في SFC)
   ============================================================ */
export const pharmacyName     = computed(() => getSetting('pharmacy.name', 'صيدليتي'));
export const pharmacyLogo     = computed(() => getSetting('pharmacy.logo_url', ''));
export const pharmacyAddress  = computed(() => getSetting('pharmacy.address', ''));
export const pharmacyPhone    = computed(() => getSetting('pharmacy.phone', ''));
export const pharmacyCurrency = computed(() => getSetting('pharmacy.currency', 'ج.س'));