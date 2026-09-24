// offline-db.js
import Dexie from 'dexie';
const db = new Dexie('MiraclePOSDB_Altelal');

db.version(6).stores({
    pending_sales: 'id, synced, shift_id, created_at',
    pending_refunds: 'id, synced, sale_id, created_at',
    cached_medicines: 'id, name, barcode',
    cached_user: 'id'
});

db.open()
    .then(() => console.log('✅ DB open'))
    .catch(e => console.error('❌ DB error:', e));

function safeTable(name) {
    try { return db.table(name); } catch { return null; }
}

// ========== pending_sales ==========
export async function getPendingSales() {
    const t = safeTable('pending_sales');
    if (!t) return [];
    try {
        const all = await t.toArray();
        return all.filter(item => item.synced === false);
    } catch { return []; }
}
export async function saveOfflineSale(data) {
    const t = safeTable('pending_sales');
    if (!t) return false;
    try { await t.add(data); return true; } catch { return false; }
}
export async function removeOfflineSale(id) {
    const t = safeTable('pending_sales');
    if (!t) return false;
    try { await t.delete(id); return true; } catch { return false; }
}
export async function countPendingSales() {
    const pending = await getPendingSales();
    return pending.length;
}
export async function updatePendingSalesShiftId(localShiftId, serverShiftId) {
    const t = safeTable('pending_sales');
    if (!t) return 0;
    try {
        const all = await t.toArray();
        let count = 0;
        for (const sale of all) {
            if (String(sale.shift_id) === String(localShiftId) || String(sale.local_shift_id) === String(localShiftId)) {
                await t.update(sale.id, { shift_id: serverShiftId, local_shift_id: localShiftId });
                count++;
            }
        }
        return count;
    } catch { return 0; }
}

// ========== pending_refunds ==========
export async function getPendingRefunds() {
    const t = safeTable('pending_refunds');
    if (!t) return [];
    try {
        const all = await t.toArray();
        return all.filter(item => item.synced === false);
    } catch { return []; }
}
export async function saveOfflineRefund(data) {
    const t = safeTable('pending_refunds');
    if (!t) return false;
    try { await t.add(data); return true; } catch { return false; }
}
export async function removeOfflineRefund(id) {
    const t = safeTable('pending_refunds');
    if (!t) return false;
    try { await t.delete(id); return true; } catch { return false; }
}
export async function countPendingRefunds() {
    const pending = await getPendingRefunds();
    return pending.length;
}
export const saveRefundOffline = saveOfflineRefund;

// ========== cached_medicines ==========
export async function cacheMedicines(medicines) {
    const t = safeTable('cached_medicines');
    if (!t) return false;
    try {
        await t.clear();
        if (medicines && medicines.length) await t.bulkAdd(medicines);
        return true;
    } catch { return false; }
}
export async function getCachedMedicines() {
    const t = safeTable('cached_medicines');
    if (!t) return [];
    try { return await t.toArray(); } catch { return []; }
}
export async function reduceMedicineStock(medicineId, quantity) {
    const t = safeTable('cached_medicines');
    if (!t) return false;
    try {
        const med = await t.get(medicineId);
        if (!med) return false;
        med.quantity = (med.quantity || 0) - quantity;
        await t.update(medicineId, { quantity: med.quantity });
        return true;
    } catch { return false; }
}

// ========== cached_user ==========
export async function cacheUser(user) {
    const t = safeTable('cached_user');
    if (!t) return false;
    try { await t.clear(); await t.add(user); return true; } catch { return false; }
}
export async function getCachedUser() {
    const t = safeTable('cached_user');
    if (!t) return null;
    try { const users = await t.toArray(); return users[0] || null; } catch { return null; }
}

export { db };
