import '../../css/app.css';

import {
    createApp,
    ref,
    computed,
    onMounted,
    onUnmounted,
    reactive,
    nextTick
} from 'vue';
import axios from 'axios';

import {
    getCachedUser
} from '../auth.js';

import { API_BASE } from '../config.js';
import {
    updatePendingSalesShiftId,
    cacheMedicines,
    getCachedMedicines,

    // ✅ الديون الأوفلاين
    saveLocalDebt,
    getLocalDebts,
    getPendingLocalDebts,
    markLocalDebtSynced,
    deleteLocalDebt,
    countPendingLocalDebts,

    saveLocalDebtPayment,
    getPendingDebtPayments,
    markDebtPaymentSynced,
    deleteDebtPayment,
    countPendingDebtPayments,
    cleanupSyncedDebts,
    cleanupSyncedDebtPayments,
        deleteSyncedDebt,
    deleteSyncedDebtPayment,
    // لاستخدامها من pos.js عند قراءة الديون المحلية
    db,
} from '../offline-db.js';

/*
|--------------------------------------------------------------------------
| PharmaFlow - Shift Manager (Library + Open/Close UI)
|--------------------------------------------------------------------------
*/

const SHIFT_CACHE_PREFIX = 'miraclepos_shift_user_';
const SHIFT_EVENTS_PREFIX = 'miraclepos_pending_shift_events_user_';
const SHIFT_MAPPINGS_PREFIX = 'miraclepos_shift_mappings_user_';
const LEGACY_PENDING_OPEN_PREFIX = 'miraclepos_pending_shift_open_user_';
const SALE_DETAILS_CACHE_PREFIX = 'miraclepos_sale_details_cache_user_';
const SHIFT_FINANCE_QUEUE_PREFIX = 'miraclepos_pending_shift_finance_user_';

const MAX_CACHED_SALE_DETAILS = 300;

/*
|--------------------------------------------------------------------------
| Sync Progress State (exported)
|--------------------------------------------------------------------------
*/
export const syncProgress = reactive({
    active: false,
    phase: '',
    current: 0,
    total: 0,
    currentLabel: '',
    errors: [],
    lastFinishedAt: null,
});

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (!config.headers['Accept']) {
        config.headers['Accept'] = 'application/json';
    }
    return config;
}, (error) => Promise.reject(error));

function safeJsonParse(value, fallback = null) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function clone(value) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch {
        return value;
    }
}

async function getCurrentUser() {
    try {
        const user = await getCachedUser();
        if (user?.id) return user;
    } catch (error) {
        console.warn('Unable to get cached user:', error);
    }
    return null;
}

function getToken() {
    return localStorage.getItem('token');
}

/*
|--------------------------------------------------------------------------
| Load and Cache Medicines (exported)
|--------------------------------------------------------------------------
*/
export async function loadAndCacheMedicines() {
    const token = getToken();

    if (navigator.onLine && token) {
        try {
            const user = await getCurrentUser();
            const branchId = user?.branch_id;

            const response = await axios.get(`${API_BASE}/sales/medicines`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
                params: { 
                    branch_id: branchId, 
                    _ts: Date.now() 
                },
            });

            let medicines = response?.data?.data 
                ?? response?.data?.medicines 
                ?? response?.data?.items 
                ?? response?.data;

            if (!Array.isArray(medicines)) {
                medicines = [];
            }

            if (medicines.length > 0) {
                await cacheMedicines(medicines);
                console.log(`✅ shift.html: تم تحميل ${medicines.length} دواء وتخزينها`);
                return {
                    success: true,
                    count: medicines.length,
                    source: 'server',
                    error: null,
                };
            }

            console.warn('⚠️ shift.html: الخادم رجع 0 أدوية');
        } catch (error) {
            console.warn('⚠️ shift.html: تعذر تحميل الأدوية من الخادم:', error.message);
        }
    }

    try {
        const cached = await getCachedMedicines();

        if (Array.isArray(cached) && cached.length > 0) {
            console.log(`📦 shift.html: استخدام ${cached.length} دواء من Cache`);
            return {
                success: true,
                count: cached.length,
                source: 'cache',
                error: null,
            };
        }

        console.log('📭 shift.html: لا يوجد Cache للأدوية');
        return {
            success: false,
            count: 0,
            source: 'none',
            error: 'لا توجد أدوية في Cache',
        };

    } catch (error) {
        console.error('❌ shift.html: تعذر قراءة Cache:', error);
        return {
            success: false,
            count: 0,
            source: 'none',
            error: error.message || 'خطأ في قراءة Cache',
        };
    }
}

/*
|--------------------------------------------------------------------------
| Recalculate Expected Cash (exported)
|--------------------------------------------------------------------------
*/
export function recalculateExpectedCash(shift) {
    if (!shift) return shift;

    const nextShift = { ...clone(shift) };

    nextShift.opening_cash = Number(nextShift.opening_cash || 0);
    nextShift.cash_sales = Number(nextShift.cash_sales || 0);
    nextShift.card_sales = Number(nextShift.card_sales || 0);
    nextShift.debts_amount = Number(nextShift.debts_amount || 0);
    nextShift.expenses_amount = Number(nextShift.expenses_amount || 0);
    nextShift.withdraw_amount = Number(nextShift.withdraw_amount || 0);
    nextShift.refund_amount = Number(nextShift.refund_amount || 0);
    nextShift.sales_count = Number(nextShift.sales_count || 0);

    nextShift.expected_cash =
        nextShift.opening_cash
        + nextShift.cash_sales
        - nextShift.withdraw_amount
        - nextShift.refund_amount
        - nextShift.expenses_amount;

    return nextShift;
}


/*
|--------------------------------------------------------------------------
| Shift Cache (exported)
|--------------------------------------------------------------------------
*/
function getShiftCacheKey(userId) {
    if (!userId) return null;
    return `${SHIFT_CACHE_PREFIX}${userId}`;
}

export function getCachedShift(userId) {
    const key = getShiftCacheKey(userId);
    if (!key) return null;
    return safeJsonParse(localStorage.getItem(key), null);
}

export function saveCachedShift(userId, shift) {
    const key = getShiftCacheKey(userId);
    if (!key || !shift) return;

    const existing = getCachedShift(userId);

    const isNewShift = existing?.local_shift_id
        && shift.local_shift_id
        && existing.local_shift_id !== shift.local_shift_id;

    const nextShift = isNewShift
        ? { ...clone(shift), cached_at: new Date().toISOString() }
        : {
            ...(existing || {}),
            ...clone(shift),
            cached_at: new Date().toISOString(),
        };

    localStorage.setItem(key, JSON.stringify(nextShift));
}

export function clearCachedShift(userId) {
    const key = getShiftCacheKey(userId);
    if (!key) return;
    localStorage.removeItem(key);
}

/*
|--------------------------------------------------------------------------
| Sale Details Cache (exported)
|--------------------------------------------------------------------------
*/
function getSaleDetailsCacheKey(userId) {
    if (!userId) return null;
    return `${SALE_DETAILS_CACHE_PREFIX}${userId}`;
}

export function cacheSaleDetails(userId, saleId, details) {
    const key = getSaleDetailsCacheKey(userId);
    if (!key || !saleId || !details) return false;

    try {
        const map = safeJsonParse(localStorage.getItem(key), {}) || {};
        map[saleId] = {
            ...clone(details),
            _cached_at: new Date().toISOString()
        };

        const keys = Object.keys(map);
        if (keys.length > MAX_CACHED_SALE_DETAILS) {
            const sorted = keys.sort(
                (a, b) => new Date(map[a]._cached_at) - new Date(map[b]._cached_at)
            );
            const toRemove = sorted.slice(0, keys.length - MAX_CACHED_SALE_DETAILS);
            toRemove.forEach(k => delete map[k]);
        }

        localStorage.setItem(key, JSON.stringify(map));
        return true;
    } catch (error) {
        console.warn('تعذر حفظ تفاصيل الفاتورة محلياً:', error);
        return false;
    }
}

export function getCachedSaleDetails(userId, saleId) {
    const key = getSaleDetailsCacheKey(userId);
    if (!key || !saleId) return null;

    try {
        const map = safeJsonParse(localStorage.getItem(key), {}) || {};
        return map[saleId] || null;
    } catch (error) {
        console.warn('تعذر قراءة تفاصيل الفاتورة المحلية:', error);
        return null;
    }
}

/*
|--------------------------------------------------------------------------
| Shift Event Queue (private)
|--------------------------------------------------------------------------
*/
function getShiftEventsKey(userId) {
    if (!userId) return null;
    return `${SHIFT_EVENTS_PREFIX}${userId}`;
}

export function getPendingShiftEvents(userId) {
    const key = getShiftEventsKey(userId);
    if (!key) return [];
    const events = safeJsonParse(localStorage.getItem(key), []);
    return Array.isArray(events) ? events : [];
}

export function savePendingShiftEvents(userId, events) {
    const key = getShiftEventsKey(userId);
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(Array.isArray(events) ? events : []));
}

function enqueueShiftEvent(userId, event) {
    if (!userId || !event) return null;

    const events = getPendingShiftEvents(userId);

    const normalizedEvent = {
        ...event,
        event_id: event.event_id || crypto.randomUUID(),
        created_at: event.created_at || new Date().toISOString()
    };

    events.push(normalizedEvent);
    savePendingShiftEvents(userId, events);
    return normalizedEvent;
}

/*
|--------------------------------------------------------------------------
| Financial Operations Queue (exported)
|--------------------------------------------------------------------------
*/
function getShiftFinanceQueueKey(userId) {
    if (!userId) return null;
    return `${SHIFT_FINANCE_QUEUE_PREFIX}${userId}`;
}

export function getPendingShiftFinanceOperations(userId) {
    const key = getShiftFinanceQueueKey(userId);
    if (!key) return [];
    const operations = safeJsonParse(localStorage.getItem(key), []);
    return Array.isArray(operations) ? operations : [];
}

export function savePendingShiftFinanceOperations(userId, operations) {
    const key = getShiftFinanceQueueKey(userId);
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(Array.isArray(operations) ? operations : []));
}

export function enqueueShiftFinanceOperation(userId, operation) {
    if (!userId || !operation) return null;

    const operations = getPendingShiftFinanceOperations(userId);

    if (operation.operation_id && operations.some(item => item.operation_id === operation.operation_id)) {
        return operations.find(item => item.operation_id === operation.operation_id);
    }

    const normalized = {
        ...clone(operation),
        operation_id: operation.operation_id || crypto.randomUUID(),
        created_at: operation.created_at || new Date().toISOString(),
        synced: false
    };

    operations.push(normalized);
    savePendingShiftFinanceOperations(userId, operations);
    return normalized;
}

function markOperationAsFailed(userId, operationId, reason) {
    if (!userId || !operationId) return;

    const operations = getPendingShiftFinanceOperations(userId);
    const idx = operations.findIndex(op => op.operation_id === operationId);

    if (idx === -1) return;

    operations[idx].synced = true;
    operations[idx].failed = true;
    operations[idx].failure_reason = reason || 'فشل دائم';
    operations[idx].failed_at = new Date().toISOString();

    savePendingShiftFinanceOperations(userId, operations);
}

/*
|--------------------------------------------------------------------------
| Apply POS Operation To Local Shift (exported)
|--------------------------------------------------------------------------
*/
export function applyPOSOperationToLocalShift(shift, operation) {
    if (!shift || shift.status !== 'open') {
        return shift;
    }

    const nextShift = { ...clone(shift) };
    const amount = Number(operation.amount || 0);

    if (!Number.isFinite(amount) || amount < 0) {
        return nextShift;
    }

    nextShift.opening_cash = Number(nextShift.opening_cash || 0);
    nextShift.cash_sales = Number(nextShift.cash_sales || 0);
    nextShift.card_sales = Number(nextShift.card_sales || 0);
    nextShift.sales_count = Number(nextShift.sales_count || 0);
    nextShift.debts_amount = Number(nextShift.debts_amount || 0);
    nextShift.withdraw_amount = Number(nextShift.withdraw_amount || 0);
    nextShift.expenses_amount = Number(nextShift.expenses_amount || 0);
    nextShift.refund_amount = Number(nextShift.refund_amount || 0);

    if (operation.type === 'sale') {
        const paymentMethod = String(operation.payment_method || 'cash').toLowerCase();
        nextShift.sales_count += 1;
        if (paymentMethod === 'cash') {
            nextShift.cash_sales += amount;
        } else {
            nextShift.card_sales += amount;
        }
    } else if (operation.type === 'expense') {
        nextShift.expenses_amount += amount;
    } else if (operation.type === 'withdraw') {
        nextShift.withdraw_amount += amount;
    } else if (operation.type === 'debt_payment') {
        nextShift.cash_sales += amount;
        nextShift.debts_amount += amount;
    } else if (operation.type === 'refund') {
        const absRefundAmount = Math.abs(amount);
        const originalMethod = String(
            operation.original_payment_method || 'cash'
        ).toLowerCase();

        if (originalMethod === 'cash') {
            nextShift.refund_amount += absRefundAmount;
        } else {
            nextShift.card_sales = Math.max(
                0,
                nextShift.card_sales - absRefundAmount
            );
        }
    }

    nextShift.offline = !navigator.onLine || nextShift.offline === true;
    nextShift.pending_sync = true;
    nextShift.sync_status = 'pending';
    nextShift.last_local_operation_at = new Date().toISOString();

    return recalculateExpectedCash(nextShift);
}

/*
|--------------------------------------------------------------------------
| Update Shift After POS Operation (exported)
|--------------------------------------------------------------------------
*/
export async function updateShiftAfterPOSOperation(operation) {
    if (!operation?.type) {
        throw new Error('نوع العملية غير محدد');
    }

    const user = await getCurrentUser();
    if (!user?.id) {
        throw new Error('بيانات المستخدم غير متوفرة');
    }

    const userId = user.id;
    let currentShift = getCachedShift(userId);

    if (!currentShift || currentShift.status !== 'open') {
        throw new Error('لا توجد وردية مفتوحة محلياً');
    }

    if (
        operation.shift_id
        && String(operation.shift_id) !== String(currentShift.id)
        && String(operation.shift_id) !== String(currentShift.local_shift_id)
        && String(operation.shift_id) !== String(currentShift.server_shift_id)
    ) {
        throw new Error('العملية لا تخص الوردية الحالية');
    }

    const normalizedOperation = {
        ...clone(operation),
        operation_id: operation.operation_id || crypto.randomUUID(),
        shift_id: currentShift.server_shift_id || (Number.isFinite(Number(currentShift.id)) ? Number(currentShift.id) : null),
        local_shift_id: currentShift.local_shift_id || currentShift.id,
        user_id: userId,
        branch_id: currentShift.branch_id || user.branch_id || null,
        amount: Number(operation.amount || 0),
        created_at: operation.created_at || new Date().toISOString(),
        sale_id: operation.sale_id || null,
        items: operation.items || [],
        reason: operation.reason || null,
        original_payment_method: operation.original_payment_method || null,
        payment_method: operation.payment_method || null,
        synced: operation.synced || false
    };

    const updatedShift = applyPOSOperationToLocalShift(currentShift, normalizedOperation);
    saveCachedShift(userId, updatedShift);

    let queued = null;
    if (!normalizedOperation.synced) {
        queued = enqueueShiftFinanceOperation(userId, normalizedOperation);
    }

    return {
        shift: clone(updatedShift),
        operation: clone(queued),
        synced: normalizedOperation.synced
    };
}

/*
|--------------------------------------------------------------------------
| Shift Mapping (exported)
|--------------------------------------------------------------------------
*/
function getShiftMappingsKey(userId) {
    if (!userId) return null;
    return `${SHIFT_MAPPINGS_PREFIX}${userId}`;
}

function getShiftMappings(userId) {
    const key = getShiftMappingsKey(userId);
    if (!key) return {};

    const mappings = safeJsonParse(localStorage.getItem(key), {});
    return (mappings && typeof mappings === 'object') ? mappings : {};
}

export function saveShiftMapping(userId, localShiftId, serverShiftId) {
    if (!userId || !localShiftId || !serverShiftId) return;

    const key = getShiftMappingsKey(userId);
    if (!key) return;

    const mappings = getShiftMappings(userId);
    mappings[String(localShiftId)] = Number(serverShiftId);
    localStorage.setItem(key, JSON.stringify(mappings));
}
/* ============================================================
   ✅ Debt Mapping — ربط الدين المحلي بـ server_debt_id
   ============================================================ */

const DEBT_MAPPING_PREFIX = 'miraclepos_debt_mappings_user_';

function getDebtMappingsKey(userId) {
    if (!userId) return null;
    return `${DEBT_MAPPING_PREFIX}${userId}`;
}

function getDebtMappings(userId) {
    const key = getDebtMappingsKey(userId);
    if (!key) return {};
    const mappings = safeJsonParse(localStorage.getItem(key), {});
    return (mappings && typeof mappings === 'object') ? mappings : {};
}

export function saveDebtMapping(userId, localDebtId, serverDebtId) {
    if (!userId || !localDebtId || !serverDebtId) return;

    const key = getDebtMappingsKey(userId);
    if (!key) return;

    const mappings = getDebtMappings(userId);
    mappings[String(localDebtId)] = Number(serverDebtId);
    localStorage.setItem(key, JSON.stringify(mappings));

    console.log(`✅ saveDebtMapping: ${localDebtId} → server_id=${serverDebtId}`);
}

export function getDebtMapping(userId, localDebtId) {
    if (!userId || !localDebtId) return null;
    const mappings = getDebtMappings(userId);
    return mappings[String(localDebtId)] || null;
}

export function clearDebtMapping(userId, localDebtId) {
    const key = getDebtMappingsKey(userId);
    if (!key) return;

    const mappings = getDebtMappings(userId);
    delete mappings[String(localDebtId)];
    localStorage.setItem(key, JSON.stringify(mappings));
}
export function getShiftMapping(userId, localShiftId) {
    if (!userId || !localShiftId) return null;
    const mappings = getShiftMappings(userId);
    return mappings[String(localShiftId)] || null;
}

/*
|--------------------------------------------------------------------------
| Legacy Pending OPEN
|--------------------------------------------------------------------------
*/
function getLegacyPendingOpenKey(userId) {
    if (!userId) return null;
    return `${LEGACY_PENDING_OPEN_PREFIX}${userId}`;
}

function migrateLegacyPendingOpen(userId) {
    const key = getLegacyPendingOpenKey(userId);
    if (!key) return;

    const legacy = safeJsonParse(localStorage.getItem(key), null);
    if (!legacy?.local_shift_id) return;

    const events = getPendingShiftEvents(userId);
    const alreadyExists = events.some(
        event => event.type === 'open' && String(event.local_shift_id) === String(legacy.local_shift_id)
    );

    if (!alreadyExists) {
        enqueueShiftEvent(userId, {
            type: 'open',
            local_shift_id: legacy.local_shift_id,
            opening_cash: Number(legacy.opening_cash || 0),
            user_id: legacy.user_id || userId,
            branch_id: legacy.branch_id || null,
            created_at: legacy.created_at || new Date().toISOString()
        });
    }

    localStorage.removeItem(key);
}

/*
|--------------------------------------------------------------------------
| Build Local Shift From Open Event
|--------------------------------------------------------------------------
*/
function buildLocalShiftFromOpenEvent(event, userId) {
    return {
        id: event.local_shift_id,
        local_shift_id: event.local_shift_id,
        server_shift_id: null,
        user_id: event.user_id || userId,
        branch_id: event.branch_id || null,
        opening_cash: Number(event.opening_cash || 0),
        expected_cash: Number(event.opening_cash || 0),
        cash_sales: 0,
        card_sales: 0,
        sales_count: 0,
        debts_amount: 0,
        withdraw_amount: 0,
        expenses_amount: 0,
        refund_amount: 0,
        status: 'open',
        offline: true,
        pending_sync: true,
        sync_status: 'pending',
        opened_at: event.created_at,
        closed_at: null
    };
}

/*
|--------------------------------------------------------------------------
| Find Local Open Shift (exported)
|--------------------------------------------------------------------------
*/
export function getLocalOpenShift(userId) {
    if (!userId) return null;

    const cached = getCachedShift(userId);
    if (cached && cached.status !== 'closed' && cached.offline_closed !== true) {
        return { source: 'local-cache', shift: clone(cached) };
    }

    const events = getPendingShiftEvents(userId);
    if (!events.length) return null;

    const sorted = [...events].sort(
        (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
    );

    for (let i = sorted.length - 1; i >= 0; i--) {
        const event = sorted[i];
        if (event.type === 'close') return null;
        if (event.type === 'open') {
            return {
                source: 'local-pending',
                shift: buildLocalShiftFromOpenEvent(event, userId)
            };
        }
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| Get Server Current Shift (private)
|--------------------------------------------------------------------------
*/
async function getServerOpenShift() {
    if (!navigator.onLine) return null;

    const token = getToken();
    if (!token) return null;

    try {
        const response = await axios.get(`${API_BASE}/shift/current`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
            },
            params: { _ts: Date.now() }
        });

        if (response.data?.opened && response.data?.shift) {
            return { source: 'server', shift: response.data.shift };
        }

        return null;
    } catch (error) {
        console.warn('Could not check server shift:', error);
        return null;
    }
}

/*
|--------------------------------------------------------------------------
| Sync Pending Shift Events (exported)
|--------------------------------------------------------------------------
*/
export async function syncPendingShiftEvents() {
    if (!navigator.onLine) return false;
    return await _runEventsSyncInternal();
}

/*
|--------------------------------------------------------------------------
| Sync Pending Finance Operations (exported)
|--------------------------------------------------------------------------
*/
let _financeSyncInFlight = null;

export async function syncPendingShiftFinanceOperations() {
    if (!navigator.onLine) return false;

    if (_financeSyncInFlight) {
        return _financeSyncInFlight;
    }

    _financeSyncInFlight = _runFinanceSync().finally(() => {
        _financeSyncInFlight = null;
    });

    return _financeSyncInFlight;
}


/*
|--------------------------------------------------------------------------
| Main Synchronization Orchestrator (exported)
|--------------------------------------------------------------------------
*/
export async function runFullSync() {
    if (!navigator.onLine) {
        return { success: false, reason: 'offline' };
    }

    const user = await getCurrentUser();
    if (!user?.id) {
        return { success: false, reason: 'no_user' };
    }

    const userId = user.id;

    const pendingEventsCount = getPendingShiftEvents(userId).length;
    const pendingFinanceCount = getPendingShiftFinanceOperations(userId)
        .filter(op => !op.synced && !op.failed).length;

    const totalPending = pendingEventsCount + pendingFinanceCount;

    if (totalPending === 0) {
        syncProgress.active = false;
        return { success: true, total: 0 };
    }

    syncProgress.active = true;
    syncProgress.total = totalPending;
    syncProgress.current = 0;
    syncProgress.currentLabel = 'جاري التحضير...';
    syncProgress.phase = '';
    syncProgress.errors = [];

    try {
        await _runEventsSyncInternal();
        await syncPendingShiftFinanceOperations();

        return {
            success: syncProgress.errors.length === 0,
            total: totalPending,
            errors: [...syncProgress.errors]
        };
    } catch (error) {
        console.error('❌ فشل المزامنة الكاملة:', error);
        syncProgress.errors.push(error.message || String(error));
        return { success: false, error: error.message };
    } finally {
        syncProgress.active = false;
        syncProgress.lastFinishedAt = Date.now();
    }
}

/*
|--------------------------------------------------------------------------
| Internal: Run Events Sync
|--------------------------------------------------------------------------
*/
async function _runEventsSyncInternal() {
    const user = await getCurrentUser();
    if (!user?.id) return false;

    const token = getToken();
    if (!token) return false;

    const userId = user.id;
    migrateLegacyPendingOpen(userId);

    const events = getPendingShiftEvents(userId);
    if (!events.length) return true;

    const sortedEvents = [...events].sort(
        (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
    );

    const completedEventIds = [];

    for (let eventIndex = 0; eventIndex < sortedEvents.length; eventIndex++) {
        const event = sortedEvents[eventIndex];

        syncProgress.phase = 'events';
        syncProgress.currentLabel = event.type === 'open'
            ? 'مزامنة فتح وردية'
            : 'مزامنة إغلاق وردية';

        try {
            if (event.type === 'open') {
                let serverShift = null;

                try {
                    const current = await axios.get(`${API_BASE}/shift/current`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: 'application/json',
                            'Cache-Control': 'no-cache, no-store, must-revalidate'
                        },
                        params: { _ts: Date.now() }
                    });

                    if (current.data?.opened && current.data?.shift) {
                        serverShift = current.data.shift;
                    }
                } catch (error) {
                    if (error.response?.status === 401) throw error;
                }

                if (!serverShift) {
                    try {
                        const response = await axios.post(`${API_BASE}/shift/open`, {
                            opening_cash: Number(event.opening_cash || 0)
                        }, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                Accept: 'application/json',
                                'Cache-Control': 'no-cache, no-store, must-revalidate'
                            }
                        });
                        serverShift = response.data?.shift || response.data?.data || response.data;
                    } catch (error) {
                        if (error.response?.status === 409) {
                            const current = await axios.get(`${API_BASE}/shift/current`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            if (current.data?.opened && current.data?.shift) {
                                serverShift = current.data.shift;
                            } else {
                                throw error;
                            }
                        } else {
                            throw error;
                        }
                    }
                }

                if (!serverShift?.id) {
                    throw new Error('لم يتم الحصول على معرف الوردية من الخادم');
                }

                const serverShiftId = Number(serverShift.id);

                saveShiftMapping(userId, event.local_shift_id, serverShiftId);

                await updatePendingSalesShiftId(event.local_shift_id, serverShiftId);

                const ops = getPendingShiftFinanceOperations(userId);
                const updatedOps = ops.map(op => {
                    const opLocalId = op.local_shift_id || op.shift_id;
                    if (String(opLocalId) === String(event.local_shift_id)) {
                        return {
                            ...op,
                            local_shift_id: event.local_shift_id,
                            shift_id: serverShiftId,
                            server_shift_id: serverShiftId
                        };
                    }
                    return op;
                });
                savePendingShiftFinanceOperations(userId, updatedOps);

                const existing = getCachedShift(userId);

                saveCachedShift(userId, {
                    ...(existing || {}),
                    ...serverShift,
                    id: serverShift.id,
                    local_shift_id: event.local_shift_id,
                    server_shift_id: Number(serverShift.id),
                    status: 'open',
                    offline: false,
                    pending_sync: false,
                    sync_status: 'synced'
                });

                completedEventIds.push(event.event_id);
                syncProgress.current++;
                continue;
            }

            if (event.type === 'close') {
                let serverShiftId = getShiftMapping(userId, event.local_shift_id);

                if (!serverShiftId) {
                    const cached = getCachedShift(userId);
                    if (cached && Number(cached.server_shift_id)) {
                        serverShiftId = Number(cached.server_shift_id);
                    }
                }

                if (!serverShiftId) {
                    console.warn('CLOSE مؤجل: لا يوجد mapping');
                    break;
                }

                await syncPendingShiftFinanceOperations();

                const stillPending = getPendingShiftFinanceOperations(userId)
                    .filter(op => !op.synced)
                    .some(op => {
                        const opShiftId = Number(op.shift_id || 0);
                        return opShiftId === Number(serverShiftId);
                    });

                if (stillPending) {
                    console.warn('CLOSE مؤجل: عمليات مالية لم تُزامن');
                    break;
                }

                await axios.post(`${API_BASE}/shift/close`, {
                    closing_cash: Number(event.closing_cash || 0)
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                });

                const cached = getCachedShift(userId);
                if (cached && String(cached.local_shift_id) === String(event.local_shift_id)) {
                    saveCachedShift(userId, {
                        ...cached,
                        status: 'closed',
                        closing_cash: Number(event.closing_cash || 0),
                        pending_sync: false,
                        sync_status: 'synced',
                        offline_closed: false
                    });
                }

                completedEventIds.push(event.event_id);
                syncProgress.current++;
            }

        } catch (error) {
            const status = error.response?.status;

            console.error('Shift sync failed:', {
                event_type: event.type,
                local_shift_id: event.local_shift_id,
                status,
                message: error.message,
            });

            syncProgress.errors.push(
                `فشل ${event.type === 'open' ? 'فتح' : 'إغلاق'} وردية: ${error.message}`
            );

            if (status === 409 || status === 404) {
                completedEventIds.push(event.event_id);
                syncProgress.current++;
                continue;
            }

            if (status === 401) break;
            break;
        }
    }

    if (completedEventIds.length) {
        const remaining = getPendingShiftEvents(userId).filter(
            event => !completedEventIds.includes(event.event_id)
        );
        savePendingShiftEvents(userId, remaining);
    }

    return true;
}

/*
|--------------------------------------------------------------------------
| Internal: Run Finance Sync
|--------------------------------------------------------------------------
| ✅ تحسينات:
|   - ترتيب العمليات: withdraw قبل debt_payment
|   - لا تُعلِّم debt_payment أو withdraw كـ failed
|   - أعِد المحاولة تلقائياً للعمليات الحساسة
|--------------------------------------------------------------------------
*/
async function _runFinanceSync() {
    if (!navigator.onLine) return false;

    const user = await getCurrentUser();
    if (!user?.id) return false;

    const token = getToken();
    if (!token) return false;

    const userId = user.id;

    /* ═══════════════════════════════════════════════════════════
       ✅ 0. أعد تعيين failed للعمليات الحساسة (withdraw, debt_payment)
       ═══════════════════════════════════════════════════════════ */
    const allOps = getPendingShiftFinanceOperations(userId);
    let resetCount = 0;

    for (const op of allOps) {
        if (
            op.failed === true &&
            (op.type === 'debt_payment' || op.type === 'withdraw')
        ) {
            op.failed = false;
            op.synced = false;
            delete op.failure_reason;
            delete op.failed_at;
            resetCount++;
        }
    }

    if (resetCount > 0) {
        savePendingShiftFinanceOperations(userId, allOps);
        console.log(`🔄 إعادة تعيين ${resetCount} عملية فاشلة (withdraw/debt_payment)`);
    }

    /* ═══════════════════════════════════════════════════════════
       1. اجلب العمليات المعلقة
       ═══════════════════════════════════════════════════════════ */
    const queue = getPendingShiftFinanceOperations(userId);
    const pending = queue.filter(op => !op.synced && !op.failed);

    if (!pending.length) {
        console.log('📭 لا توجد عمليات مالية معلقة');
        return true;
    }

    /* ═══════════════════════════════════════════════════════════
       2. صنّف العمليات + ترتيب
       ═══════════════════════════════════════════════════════════ */
    const sales = pending.filter(op => op.type === 'sale');
    const refunds = pending.filter(op => op.type === 'refund');

    // ✅ العمليات المالية — رتّب: withdraw أولاً ثم الباقي حسب created_at
    const others = pending
        .filter(op => op.type !== 'sale' && op.type !== 'refund')
        .sort((a, b) => {
            // withdraw قبل debt_payment
            if (a.type === 'withdraw' && b.type !== 'withdraw') return -1;
            if (b.type === 'withdraw' && a.type !== 'withdraw') return 1;
            // ثم حسب created_at
            return new Date(a.created_at) - new Date(b.created_at);
        });

    console.log('📋 ترتيب العمليات المالية:', others.map(op => `${op.type}(${op.amount})`));

    const completedIds = [];

    /* ═══════════════════════════════════════════════════════════
       3. المبيعات
       ═══════════════════════════════════════════════════════════ */
    for (const operation of sales) {
        syncProgress.currentLabel = 'مزامنة فاتورة بيع';

        if (!Array.isArray(operation.items) || operation.items.length === 0) {
            completedIds.push(operation.operation_id);
            syncProgress.current++;
            continue;
        }

        let serverShiftId = Number(operation.shift_id || 0);
        if (!Number.isInteger(serverShiftId) || serverShiftId <= 0) {
            serverShiftId = Number(getShiftMapping(userId, operation.local_shift_id) || 0);
        }

        if (!Number.isInteger(serverShiftId) || serverShiftId <= 0) {
            console.warn('⚠️ مبيعات: لا يوجد server_shift_id — تخطي');
            continue;
        }

        operation.shift_id = serverShiftId;

        try {
            const payload = {
                branch_id: operation.branch_id,
                user_id: operation.user_id,
                shift_id: serverShiftId,
                payment_method: operation.payment_method,
                bank_transfer: operation.bank_transfer || null,
                items: operation.items || [],

                discount_type:   operation.discount_type || null,
                discount_value:  operation.discount_value || 0,
                discount_reason: operation.discount_reason || null,

                line_discount_total: operation.line_discount_total || 0,

                created_at: operation.created_at || new Date().toISOString(),
            };

            const response = await axios.post(`${API_BASE}/sales`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'X-Offline-Sync': 'true',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });

            const serverSaleId = response.data?.sale?.id || response.data?.id;

            if (serverSaleId) {
                // ✅ اربط المرتجعات المعلقة بمعرّف السيرفر
                const allOps = getPendingShiftFinanceOperations(userId);
                for (const refund of allOps) {
                    if (
                        refund.type === 'refund' &&
                        (refund.sale_id === operation.operation_id || refund.sale_id === operation.id)
                    ) {
                        refund.sale_id = serverSaleId;
                    }
                }
                savePendingShiftFinanceOperations(userId, allOps);
            }

            completedIds.push(operation.operation_id);
            syncProgress.current++;
            console.log(`✅ تم مزامنة الفاتورة ${operation.operation_id}`);

        } catch (error) {
            const status = error.response?.status;
            syncProgress.errors.push(`فشل مزامنة فاتورة: ${error.message}`);

            if (status === 422 || status === 400) {
                markOperationAsFailed(userId, operation.operation_id, error.response?.data?.message || error.message);
                syncProgress.current++;
            } else if (status === 409 || status === 404) {
                completedIds.push(operation.operation_id);
                syncProgress.current++;
            } else {
                // خطأ شبكة → اترك للمحاولة التالية
                break;
            }
        }
    }

    /* ═══════════════════════════════════════════════════════════
       4. الإرجاعات
       ═══════════════════════════════════════════════════════════ */
    const updatedQueue = getPendingShiftFinanceOperations(userId);
    const updatedRefunds = updatedQueue.filter(op => op.type === 'refund' && !op.synced && !op.failed);

    for (const operation of updatedRefunds) {
        syncProgress.currentLabel = 'مزامنة إرجاع';

        if (!operation.sale_id || !Array.isArray(operation.items) || operation.items.length === 0) {
            completedIds.push(operation.operation_id);
            syncProgress.current++;
            continue;
        }

        let serverShiftId = Number(operation.shift_id || 0);
        if (!Number.isInteger(serverShiftId) || serverShiftId <= 0) {
            serverShiftId = Number(getShiftMapping(userId, operation.local_shift_id) || 0);
        }

        if (!Number.isInteger(serverShiftId) || serverShiftId <= 0) continue;

        operation.shift_id = serverShiftId;

        try {
            const payload = {
                sale_id: operation.sale_id,
                shift_id: serverShiftId,
                reason: operation.reason || 'إرجاع',
                items: operation.items || [],
                created_at: operation.created_at || new Date().toISOString(),
            };

            await axios.post(`${API_BASE}/refunds`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });

            completedIds.push(operation.operation_id);
            syncProgress.current++;
            console.log(`✅ تم مزامنة الإرجاع ${operation.operation_id}`);

        } catch (error) {
            const status = error.response?.status;
            syncProgress.errors.push(`فشل مزامنة إرجاع: ${error.message}`);

            if (status === 422 || status === 400) {
                markOperationAsFailed(userId, operation.operation_id, error.response?.data?.message || error.message);
                syncProgress.current++;
            } else if (status === 409 || status === 404) {
                completedIds.push(operation.operation_id);
                syncProgress.current++;
            } else {
                break;
            }
        }
    }

    /* ═══════════════════════════════════════════════════════════
       5. العمليات المالية (withdraw, expense, debt_payment)
       ═══════════════════════════════════════════════════════════ */
    for (const operation of others) {
        if (operation.type === 'expense') {
            syncProgress.currentLabel = 'مزامنة مصروف';
        } else if (operation.type === 'withdraw') {
            syncProgress.currentLabel = 'مزامنة سحب';
        } else if (operation.type === 'debt_payment') {
            syncProgress.currentLabel = 'مزامنة سداد دين';
        }

        let serverShiftId = Number(operation.shift_id || 0);
        if (!Number.isInteger(serverShiftId) || serverShiftId <= 0) {
            serverShiftId = Number(getShiftMapping(userId, operation.local_shift_id) || 0);
        }

        if (!Number.isInteger(serverShiftId) || serverShiftId <= 0) {
            console.warn(`⚠️ ${operation.type}: لا يوجد server_shift_id — تخطي`);
            continue;
        }

        operation.shift_id = serverShiftId;

        try {
            /* ═══════════════════════════════════════════════
               EXPENSE
               ═══════════════════════════════════════════════ */
            if (operation.type === 'expense') {
                await axios.post(`${API_BASE}/expenses`, {
                    title: operation.title || '',
                    amount: Number(operation.amount || 0),
                    notes: operation.notes || '',
                    shift_id: serverShiftId,
                    branch_id: operation.branch_id,
                    user_id: operation.user_id,
                    created_at: operation.created_at || new Date().toISOString(),
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    }
                });
            }

            /* ═══════════════════════════════════════════════
               WITHDRAW — ✅ احفظ server_debt_id
               ═══════════════════════════════════════════════ */
            else if (operation.type === 'withdraw') {
                const withdrawRes = await axios.post(`${API_BASE}/shift/withdraw`, {
                    amount: Number(operation.amount || 0),
                    reason: operation.reason || '',
                    shift_id: serverShiftId,
                    borrower_id: operation.user_id,
                    created_at: operation.created_at || new Date().toISOString(),
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    }
                });

                const serverDebtId =
                    withdrawRes.data?.debt?.id ||
                    withdrawRes.data?.debt_id ||
                    withdrawRes.data?.data?.debt?.id;

                if (serverDebtId) {
                    // ✅ اربط بـ operation_id (للمبيعات)
                    if (operation.operation_id) {
                        saveDebtMapping(userId, operation.operation_id, serverDebtId);
                    }
                    
                    // ✅ اربط بـ local_debt_id (للسدادات)
                    if (operation.local_debt_id) {
                        saveDebtMapping(userId, operation.local_debt_id, serverDebtId);
                        console.log(`✅ withdraw → local_debt_id=${operation.local_debt_id}, server_debt_id=${serverDebtId}`);
                    }
                    
                    console.log(`✅ withdraw synced: op=${operation.operation_id}, local=${operation.local_debt_id} → debt_id=${serverDebtId}`);
                } else {
                    console.warn('⚠️ السيرفر لم يُرجع debt_id:', withdrawRes.data);
                }
            }

            /* ═══════════════════════════════════════════════
               DEBT_PAYMENT — ✅ ترجم debt_id
               ═══════════════════════════════════════════════ */
            else if (operation.type === 'debt_payment') {
                let finalDebtId = operation.debt_id;

                if (finalDebtId) {
                    const isNumericId = /^\d+$/.test(String(finalDebtId));

                    if (!isNumericId) {
                        // ✅ UUID محلي — ابحث عن server_id
                        const serverDebtId = getDebtMapping(userId, finalDebtId);

                        if (serverDebtId) {
                            finalDebtId = String(serverDebtId);
                            console.log(`✅ debt_payment: ترجمة ${operation.debt_id} → ${finalDebtId}`);
                        } else {
                            console.warn(`⚠️ لا يوجد mapping لـ ${finalDebtId} — استخدام FIFO`);
                            finalDebtId = null;
                        }
                    }
                }

                console.log('💳 إرسال debt_payment:', {
                    original_debt_id: operation.debt_id,
                    final_debt_id: finalDebtId,
                    amount: operation.amount,
                });

                await axios.post(`${API_BASE}/shift/debt-payment`, {
                    amount: Number(operation.amount || 0),
                    notes: operation.notes || '',
                    shift_id: serverShiftId,
                    debt_id: finalDebtId,
                    user_id: operation.user_id,
                    created_at: operation.created_at || new Date().toISOString(),
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    }
                });
            }

            completedIds.push(operation.operation_id);
            syncProgress.current++;

        } catch (error) {
            const status = error.response?.status;
            syncProgress.errors.push(`فشل مزامنة ${operation.type}: ${error.message}`);

            console.error(`❌ فشل ${operation.type}:`, {
                status,
                message: error.message,
                data: error.response?.data,
            });

            /* ═══════════════════════════════════════════════
               ✅ معالجة خاصة لـ withdraw و debt_payment
               — لا تُعلِّم كـ failed (فشل مؤقت)
               ═══════════════════════════════════════════════ */
            if (operation.type === 'debt_payment' || operation.type === 'withdraw') {
                console.warn(`⚠️ ${operation.type} فشل — سيبقى للمحاولة التالية`);
                break;  // اخرج من الحلقة
            }

            /* ═══════════════════════════════════════════════
               للعمليات الأخرى — السلوك القديم
               ═══════════════════════════════════════════════ */
            if (status === 422 || status === 400) {
                markOperationAsFailed(userId, operation.operation_id, error.response?.data?.message || error.message);
                syncProgress.current++;
            } else if (status === 409 || status === 404) {
                completedIds.push(operation.operation_id);
                syncProgress.current++;
            } else {
                break;
            }
        }
    }

    /* ═══════════════════════════════════════════════════════════
       6. احفظ القائمة المحدّثة
       ═══════════════════════════════════════════════════════════ */
    if (completedIds.length) {
        const remaining = getPendingShiftFinanceOperations(userId).filter(
            op => !completedIds.includes(op.operation_id)
        );
        savePendingShiftFinanceOperations(userId, remaining);
        console.log(`🗑️ تم حذف ${completedIds.length} عملية من القائمة`);
    }

    return true;
}




/*
|--------------------------------------------------------------------------
| Get Current Shift For POS (exported)
|--------------------------------------------------------------------------
*/
export async function getCurrentShiftForPOS() {
    const user = await getCurrentUser();
    if (!user?.id) return null;

    const userId = user.id;

    migrateLegacyPendingOpen(userId);

    const localState = getLocalOpenShift(userId);

    if (!navigator.onLine) {
        return localState?.shift ? clone(localState.shift) : null;
    }

    const serverState = await getServerOpenShift();

    if (serverState?.shift) {
        const serverShift = clone(serverState.shift);
        const localShift = localState?.shift || {};

        const localShiftId =
            localShift.local_shift_id ||
            localShift.local_id ||
            serverShift.local_shift_id ||
            serverShift.id;

        if (localShiftId && serverShift.id) {
            saveShiftMapping(userId, localShiftId, serverShift.id);
        }

        const hasPendingOps = getPendingShiftFinanceOperations(userId)
            .filter(op => !op.synced && !op.failed).length > 0;

        const combined = {
            ...serverShift,
            opening_cash: hasPendingOps ? Number(localShift.opening_cash ?? serverShift.opening_cash ?? 0) : Number(serverShift.opening_cash ?? 0),
            cash_sales: hasPendingOps ? Number(localShift.cash_sales ?? serverShift.cash_sales ?? 0) : Number(serverShift.cash_sales ?? 0),
            card_sales: hasPendingOps ? Number(localShift.card_sales ?? serverShift.card_sales ?? 0) : Number(serverShift.card_sales ?? 0),
            sales_count: hasPendingOps ? Number(localShift.sales_count ?? serverShift.sales_count ?? 0) : Number(serverShift.sales_count ?? 0),
            debts_amount: hasPendingOps ? Number(localShift.debts_amount ?? serverShift.debts_amount ?? 0) : Number(serverShift.debts_amount ?? 0),
            expenses_amount: hasPendingOps ? Number(localShift.expenses_amount ?? serverShift.expenses_amount ?? 0) : Number(serverShift.expenses_amount ?? 0),
            withdraw_amount: hasPendingOps ? Number(localShift.withdraw_amount ?? serverShift.withdraw_amount ?? 0) : Number(serverShift.withdraw_amount ?? 0),
            refund_amount: hasPendingOps ? Number(localShift.refund_amount ?? serverShift.refund_amount ?? 0) : Number(serverShift.refund_amount ?? 0),
            id: Number(serverShift.id),
            local_shift_id: localShiftId,
            server_shift_id: Number(serverShift.id),
            status: serverShift.status || 'open',
            offline: false,
            pending_sync: hasPendingOps,
            sync_status: hasPendingOps ? 'pending' : 'synced'
        };

        const finalShift = recalculateExpectedCash(combined);
        saveCachedShift(userId, finalShift);

        return clone(finalShift);
    }

    if (localState?.shift) {
        return clone(localState.shift);
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| Close Current Shift FROM POS (exported)
|--------------------------------------------------------------------------
*/
export async function closeCurrentShiftFromPOS(shift, closingCash, accountingBalance = 0) {
    if (!shift) throw new Error('لا توجد وردية مفتوحة حالياً');

    const user = await getCurrentUser();
    if (!user?.id) throw new Error('بيانات المستخدم غير متوفرة');

    const userId = user.id;
    const amount = Number(closingCash || 0);

    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error('مبلغ الإغلاق غير صحيح');
    }

    const localShiftId = shift.local_shift_id || shift.local_id || shift.id;

    if (navigator.onLine) {
        const token = getToken();
        if (!token) throw new Error('جلسة الدخول غير متوفرة');

        if (shift.pending_sync === true || shift.offline === true) {
            await syncPendingShiftEvents();
            await syncPendingShiftFinanceOperations();
        }

        const serverShiftId =
            getShiftMapping(userId, localShiftId) ||
            shift.server_shift_id ||
            shift.server_id ||
            (Number.isFinite(Number(shift.id)) ? Number(shift.id) : null);

        await axios.post(`${API_BASE}/shift/close`, {
            closing_cash: amount
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

        const closedShift = {
            ...clone(shift),
            status: 'closed',
            closing_cash: amount,
            actual_cash: amount,
            accounting_balance: Number(accountingBalance || 0),
            difference: amount - Number(accountingBalance || 0),
            pending_sync: false,
            sync_status: 'synced',
            offline_closed: false,
            closed_at: new Date().toISOString(),
            server_shift_id: serverShiftId || shift.server_shift_id || shift.id
        };

        saveCachedShift(userId, closedShift);

        const remaining = getPendingShiftEvents(userId).filter(
            event => !(event.type === 'close' && String(event.local_shift_id) === String(localShiftId))
        );
        savePendingShiftEvents(userId, remaining);

        return clone(closedShift);
    }

    const closeEvent = enqueueShiftEvent(userId, {
        type: 'close',
        local_shift_id: localShiftId,
        closing_cash: amount,
        accounting_balance: Number(accountingBalance || 0),
        difference: amount - Number(accountingBalance || 0),
        user_id: userId,
        branch_id: shift.branch_id || user.branch_id || null
    });

    const closedShift = {
        ...clone(shift),
        status: 'closed',
        closing_cash: amount,
        actual_cash: amount,
        accounting_balance: Number(accountingBalance || 0),
        difference: amount - Number(accountingBalance || 0),
        pending_sync: true,
        sync_status: 'pending',
        offline_closed: true,
        closed_at: new Date().toISOString(),
        close_event_id: closeEvent?.event_id || null
    };

    saveCachedShift(userId, closedShift);

    return clone(closedShift);
}

/*
|--------------------------------------------------------------------------
| Open Shift Core (private)
|--------------------------------------------------------------------------
*/
async function openShiftCore(openingCash, redirectToPOS = true) {
    const user = await getCurrentUser();
    if (!user?.id) {
        throw new Error('بيانات المستخدم غير متوفرة');
    }

    const amount = Number(openingCash || 0);
    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error('الرصيد الافتتاحي غير صحيح');
    }

    // قفل محلي ضد النقر المتكرر
    const openLockKey = `miraclepos_open_lock_${user.id}`;
    const existingLock = localStorage.getItem(openLockKey);
    if (existingLock && (Date.now() - Number(existingLock)) < 10000) {
        console.warn('⏸️ فتح وردية قيد التنفيذ');
        if (redirectToPOS) window.location.href = 'pos.html';
        return null;
    }
    localStorage.setItem(openLockKey, Date.now().toString());

    try {
        if (navigator.onLine) {
            try {
                await runFullSync();
            } catch (error) {
                console.warn('Sync before OPEN failed:', error);
            }
        }

        if (navigator.onLine) {
            const serverState = await getServerOpenShift();
            if (serverState?.shift) {
                const serverShift = serverState.shift;
                console.log('✅ وجدت وردية مفتوحة على السيرفر:', serverShift.id);

                const localShiftId = serverShift.local_shift_id || `server-${serverShift.id}`;

                saveShiftMapping(user.id, localShiftId, serverShift.id);

                saveCachedShift(user.id, {
                    ...serverShift,
                    local_shift_id: localShiftId,
                    server_shift_id: Number(serverShift.id),
                    offline: false,
                    pending_sync: false,
                    sync_status: 'synced'
                });

                if (redirectToPOS) window.location.href = 'pos.html';
                return serverShift;
            }
        }

        const local = getLocalOpenShift(user.id);
        if (local?.shift) {
            console.log('✅ وجدت وردية محلية مفتوحة:', local.shift.id);

            if (navigator.onLine && local.shift.pending_sync) {
                try {
                    await syncPendingShiftEvents();

                    const serverAfterSync = await getServerOpenShift();
                    if (serverAfterSync?.shift) {
                        const syncedShift = serverAfterSync.shift;
                        saveCachedShift(user.id, {
                            ...syncedShift,
                            local_shift_id: local.shift.local_shift_id,
                            server_shift_id: Number(syncedShift.id),
                            offline: false,
                            pending_sync: false,
                            sync_status: 'synced'
                        });

                        if (redirectToPOS) window.location.href = 'pos.html';
                        return syncedShift;
                    }
                } catch (e) {
                    console.warn('تعذر مزامنة الوردية المحلية:', e);
                }
            }

            if (redirectToPOS) window.location.href = 'pos.html';
            return clone(local.shift);
        }

        console.log('📂 لا توجد وردية مفتوحة - سيتم فتح وردية جديدة');

        if (navigator.onLine) {
            const token = getToken();
            if (!token) throw new Error('جلسة الدخول غير متوفرة');

            const response = await axios.post(`${API_BASE}/shift/open`, {
                opening_cash: amount
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });

            const serverShift = response.data?.shift || response.data?.data || response.data;
            if (!serverShift?.id) throw new Error('الخادم لم يرجع بيانات الوردية');

            const localShiftId = `server-${serverShift.id}`;
            saveShiftMapping(user.id, localShiftId, serverShift.id);

            const finalShift = {
                ...serverShift,
                id: serverShift.id,
                local_shift_id: localShiftId,
                server_shift_id: Number(serverShift.id),
                user_id: user.id,
                branch_id: serverShift.branch_id || user.branch_id,
                opening_cash: Number(serverShift.opening_cash ?? amount),
                status: serverShift.status || 'open',
                offline: false,
                offline_closed: false,
                pending_sync: false,
                sync_status: 'synced',
            };

            saveCachedShift(user.id, finalShift);

            if (redirectToPOS) window.location.href = 'pos.html';
            return clone(finalShift);
        }

        const localShiftId = `offline-${crypto.randomUUID()}`;

        const pendingShift = {
            id: localShiftId,
            local_shift_id: localShiftId,
            server_shift_id: null,
            user_id: user.id,
            branch_id: user.branch_id,
            opening_cash: amount,
            expected_cash: amount,
            cash_sales: 0,
            card_sales: 0,
            sales_count: 0,
            debts_amount: 0,
            withdraw_amount: 0,
            expenses_amount: 0,
            refund_amount: 0,
            status: 'open',
            offline: true,
            offline_closed: false,
            pending_sync: true,
            sync_status: 'pending',
            opened_at: new Date().toISOString(),
        };

        enqueueShiftEvent(user.id, {
            type: 'open',
            local_shift_id: localShiftId,
            opening_cash: amount,
            user_id: user.id,
            branch_id: user.branch_id
        });

        saveCachedShift(user.id, pendingShift);

        if (redirectToPOS) window.location.href = 'pos.html';
        return clone(pendingShift);

    } finally {
        setTimeout(() => localStorage.removeItem(openLockKey), 2000);
    }
}

/*
|--------------------------------------------------------------------------
| Vue App (shift.html) — شاشة فتح/إغلاق الوردية
|--------------------------------------------------------------------------
*/
if (document.getElementById('app')) {
    createApp({
        template: `
            <div class="min-h-screen bg-slate-100 flex items-center justify-center p-6">
                <div class="w-full max-w-lg">
                    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                        <div class="text-center mb-8">
                            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <i class="fas fa-cash-register text-3xl"></i>
                            </div>
                            <h1 class="text-2xl font-bold text-slate-800">فتح الوردية</h1>
                            <p class="text-sm text-slate-500 mt-2">{{ currentUser?.name || 'المستخدم الحالي' }}</p>
                            <p v-if="currentUser?.branch?.name" class="text-xs text-slate-400 mt-1">
                                الفرع: {{ currentUser.branch.name }}
                            </p>
                        </div>

                        <div v-if="syncProgress.active" class="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-sync-alt fa-spin text-blue-600 text-xl"></i>
                                <div class="flex-1">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="font-bold text-blue-900 text-sm">جاري مزامنة البيانات...</span>
                                        <span class="text-xs font-mono text-blue-700">
                                            {{ syncProgress.current }} / {{ syncProgress.total }}
                                        </span>
                                    </div>
                                    <div class="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                                        <div class="bg-blue-600 h-full rounded-full transition-all duration-300"
                                            :style="{ width: (syncProgress.total > 0 ? (syncProgress.current / syncProgress.total) * 100 : 0) + '%' }">
                                        </div>
                                    </div>
                                    <div class="text-xs text-blue-700 mt-1">
                                        {{ syncProgress.currentLabel }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="!isOnline" class="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4">
                            <div class="flex items-start gap-3">
                                <i class="fas fa-wifi-slash mt-1"></i>
                                <div>
                                    <div class="font-bold">وضع عدم الاتصال</div>
                                    <p class="text-sm mt-1">سيتم حفظ فتح الوردية محلياً.</p>
                                </div>
                            </div>
                        </div>

                        <div v-if="loadingMedicines" class="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                            <i class="fas fa-pills fa-spin text-purple-600 text-xl mb-2"></i>
                            <p class="text-sm text-purple-800">جاري تحميل قائمة الأدوية...</p>
                        </div>

                        <div v-else-if="medicinesCount > 0" class="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                            <p class="text-xs text-emerald-800">
                                <i class="fas fa-check-circle text-emerald-600"></i>
                                <span class="font-bold">{{ medicinesCount }}</span> دواء جاهز للبيع
                                <span v-if="medicinesSource === 'cache'" class="text-emerald-600 mr-1">
                                    (من الذاكرة المحلية)
                                </span>
                                <span v-else-if="medicinesSource === 'server'" class="text-emerald-600 mr-1">
                                    (محدّث من السيرفر)
                                </span>
                            </p>
                        </div>

                        <div v-else-if="medicinesError" class="mb-6 bg-red-50 border border-red-200 rounded-xl p-3">
                            <p class="text-xs text-red-800">
                                <i class="fas fa-exclamation-triangle text-red-600"></i>
                                <span>{{ medicinesError }}</span>
                            </p>
                            <p class="text-[10px] text-red-600 mt-1">
                                يمكنك المتابعة — لكن البيع قد لا يعمل بدون أدوية.
                            </p>
                        </div>

                        <div v-if="checkingShift" class="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                            <i class="fas fa-spinner fa-spin text-blue-600 text-xl mb-2"></i>
                            <p class="text-sm text-blue-800">جاري التحقق من الورديات...</p>
                        </div>

                        <div v-if="cachedShift && cachedShift.status === 'open'" class="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                            <div class="flex items-center justify-between mb-3">
                                <span class="font-bold text-emerald-800">توجد وردية مفتوحة</span>
                                <span class="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                                    {{ isOnline ? 'محفوظة على الخادم' : 'محفوظة محلياً' }}
                                </span>
                            </div>
                            <div class="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <div class="text-slate-500">الرصيد الافتتاحي</div>
                                    <div class="font-bold text-slate-800">{{ Number(cachedShift.opening_cash || 0).toLocaleString() }} ج.س</div>
                                </div>
                                <div>
                                    <div class="text-slate-500">الحالة</div>
                                    <div class="font-bold text-emerald-700">مفتوحة</div>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                @click="goToPOS" 
                                :disabled="medicinesCount === 0 && !!medicinesError"
                                class="w-full mt-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition"
                            >
                                <span v-if="loadingMedicines">
                                    <i class="fas fa-spinner fa-spin ml-1"></i> جاري تحميل الأدوية...
                                </span>
                                <span v-else-if="medicinesCount === 0 && medicinesError">
                                    <i class="fas fa-exclamation-triangle ml-1"></i> لا يمكن المتابعة — لا توجد أدوية
                                </span>
                                <span v-else>
                                    متابعة إلى نقطة البيع
                                </span>
                            </button>
                        </div>

                        <form v-if="!checkingShift && (!cachedShift || cachedShift.status !== 'open')" @submit.prevent="openShift" class="space-y-5">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 mb-2">الرصيد الافتتاحي</label>
                                <input v-model.number="openingCash" type="number" min="0" step="0.01" required
                                    class="w-full border border-slate-300 rounded-xl px-4 py-4 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            </div>
                            <button 
                                type="submit" 
                                :disabled="loading || !currentUser || loadingMedicines"
                                class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-4 rounded-xl font-bold text-lg transition"
                            >
                                <span v-if="loading">جاري فتح الوردية...</span>
                                <span v-else-if="loadingMedicines">
                                    <i class="fas fa-spinner fa-spin"></i> جاري تحميل الأدوية...
                                </span>
                                <span v-else>فتح الوردية والانتقال للبيع</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `,

        setup() {
            const openingCash = ref(0);
            const loading = ref(false);
            const checkingShift = ref(false);
            const currentUser = ref(null);
            const cachedShift = ref(null);
            const isOnline = ref(navigator.onLine);
            const loadingMedicines = ref(false);
            const medicinesCount = ref(0);
            const medicinesSource = ref('');
            const medicinesError = ref('');

            const refreshState = async () => {
                isOnline.value = navigator.onLine;
                currentUser.value = await getCurrentUser();
                if (!currentUser.value?.id) return;

                checkingShift.value = true;
                loadingMedicines.value = false;
                medicinesCount.value = 0;
                medicinesSource.value = '';

                try {
                    if (navigator.onLine) {
                        try {
                            const syncResult = await runFullSync();
                            if (syncResult.total > 0) {
                                console.log(`✅ shift.html: تمت مزامنة ${syncResult.total} عملية`);
                            }
                        } catch (error) {
                            console.warn('⚠️ shift.html: تعذرت المزامنة الأولية:', error);
                        }
                    }

                    loadingMedicines.value = true;

                    const medicinesResult = await loadAndCacheMedicines();

                    loadingMedicines.value = false;
                    medicinesCount.value = medicinesResult.count;
                    medicinesSource.value = medicinesResult.source;

                    if (!medicinesResult.success && medicinesResult.error) {
                        console.warn('⚠️ shift.html: مشكلة في تحميل الأدوية:', medicinesResult.error);
                        medicinesError.value = medicinesResult.error;
                    } else {
                        medicinesError.value = '';
                    }

                    if (navigator.onLine) {
                        try {
                            const serverState = await getServerOpenShift();
                            if (serverState?.shift) {
                                const serverShift = serverState.shift;
                                const localShiftId = serverShift.local_shift_id || `server-${serverShift.id}`;

                                saveShiftMapping(currentUser.value.id, localShiftId, serverShift.id);

                                saveCachedShift(currentUser.value.id, {
                                    ...serverShift,
                                    local_shift_id: localShiftId,
                                    server_shift_id: Number(serverShift.id),
                                    offline: false,
                                    pending_sync: false,
                                    sync_status: 'synced'
                                });

                                cachedShift.value = {
                                    ...serverShift,
                                    local_shift_id: localShiftId,
                                    server_shift_id: Number(serverShift.id),
                                    status: 'open'
                                };
                                return;
                            }
                        } catch (e) {
                            console.warn('تعذر فحص السيرفر:', e);
                        }
                    }

                    const localState = getLocalOpenShift(currentUser.value.id);
                    if (localState?.shift) {
                        cachedShift.value = localState.shift;
                    } else {
                        cachedShift.value = null;
                    }
                } finally {
                    checkingShift.value = false;
                }
            };
            const openingInProgress = ref(false);

            const navigatingToPOS = ref(false);     // ✅ جديد


                /**
                 * ✅ فتح الوردية — مع overlay
                 */
                const openShift = async () => {
                    if (openingInProgress.value) {
                        console.log('⏸️ محاولة فتح وردية مكررة — تجاهل');
                        return;
                    }

                    openingInProgress.value = true;
                    loading.value = true;

                    try {
                        await openShiftCore(openingCash.value, true);
                    } catch (error) {
                        alert(error.response?.data?.message || error.message || 'تعذر فتح الوردية');
                        openingInProgress.value = false;
                        loading.value = false;
                    }
                    // ⚠️ لا نُعيدها لـ false في حال النجاح — لأن الصفحة ستُغادر
                };

                /**
                 * ✅ الانتقال إلى POS — مع overlay
                 */
                const goToPOS = async () => {
                    if (navigatingToPOS.value) {
                        console.log('⏸️ محاولة انتقال مكررة — تجاهل');
                        return;
                    }

                    navigatingToPOS.value = true;

                    // ✅ تأخير بسيط لإظهار الـ overlay
                    await new Promise(resolve => setTimeout(resolve, 300));

                    window.location.href = 'pos.html';
                };

            

            onMounted(async () => {
                await refreshState();
                window.addEventListener('online', refreshState);
                window.addEventListener('offline', refreshState);
            });

            onUnmounted(() => {
                window.removeEventListener('online', refreshState);
                window.removeEventListener('offline', refreshState);
            });

            return {
                openingCash,
                openingInProgress,      // ✅ جديد
                navigatingToPOS,        // ✅ جديد
                loading,
                checkingShift,
                currentUser,
                cachedShift,
                isOnline,
                openShift,
               
                goToPOS,
                syncProgress,
                loadingMedicines,
                medicinesCount,
                medicinesSource,
                medicinesError,
            };
        }
    }).mount('#app');
}

export { openShiftCore };
export { getShiftMappings };
