// src/js/offline-db.js
import Dexie from 'dexie';

const db = new Dexie('MiraclePOSDB_Sundos_Dve_Mode');

// ✅ الإصدار 6 — يضيف جداول الديون المحلية
db.version(6).stores({
    // ═══════════════════════════════════════════════════════════
    // الجداول القديمة
    // ═══════════════════════════════════════════════════════════
    pending_sales: 'id, synced, shift_id, created_at',
    pending_refunds: 'id, synced, sale_id, created_at',
    cached_medicines: 'id, name, barcode',
    cached_user: 'id',

    // ═══════════════════════════════════════════════════════════
    // ✅ جداول جديدة — الديون الأوفلاين
    // ═══════════════════════════════════════════════════════════
    // local_debts: ديون أُنشئت أوفلاين (سحوبات، ديون مخصصة)
    local_debts: 'id, user_id, status, created_at, synced, local_id, source',
    // local_debt_payments: دفعات السداد على ديون محلية أو على ديون السيرفر
    local_debt_payments: 'id, local_debt_id, server_debt_id, synced, created_at',
});

db.open()
    .then(() => console.log('✅ DB open v6'))
    .catch(e => console.error('❌ DB error:', e));

function safeTable(name) {
    try { return db.table(name); } catch { return null; }
}

/* ============================================================
   pending_sales
   ============================================================ */
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

/* ============================================================
   pending_refunds
   ============================================================ */
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

/* ============================================================
   cached_medicines
   ============================================================ */
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

/* ============================================================
   cached_user
   ============================================================ */
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

/* ============================================================
   ✅ local_debts — الديون المُنشأة أوفلاين
   ============================================================
   
   الاستخدام:
     • عند سداد دين أوفلاين، أو عند سحب نقدي أوفلاين،
       نحفظ العملية في هذا الجدول مع local_id مؤقت.
     • عند عودة الإنترنت، تُزامَن مع السيرفر ويُستبدل
       local_id بمعرف السيرفر الحقيقي (في markLocalDebtSynced).
   ============================================================ */

export async function saveLocalDebt(debt) {
    const t = safeTable('local_debts');
    if (!t) return null;

    try {
        const localId = debt.local_id || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const record = {
            id: localId,
            local_id: localId,
            server_id: null,

            // نوع العملية: admin | withdrawal | employee | sale
            source: debt.source || 'admin',

            // بيانات مالية
            user_id: Number(debt.user_id),
            branch_id: debt.branch_id ? Number(debt.branch_id) : null,
            total_amount: Number(debt.total_amount || 0),
            paid_amount: Number(debt.paid_amount || 0),
            remaining_amount: Number(debt.remaining_amount || 0),

            // حالة
            status: debt.status || 'pending',

            // نص حر
            notes: debt.notes || null,
            reason: debt.reason || null,

            // ربط بالوردية المحلية
            shift_id: debt.shift_id || null,
            local_shift_id: debt.local_shift_id || null,

            // مزامنة
            synced: false,
            created_at: debt.created_at || new Date().toISOString(),
        };

        await t.put(record);
        return record;
    } catch (e) {
        console.error('❌ saveLocalDebt error:', e);
        return null;
    }
}

export async function getLocalDebts(userId = null) {
    const t = safeTable('local_debts');
    if (!t) return [];

    try {
        let all = await t.toArray();
        if (userId) {
            all = all.filter(d => Number(d.user_id) === Number(userId));
        }
        // الأحدث أولاً
        return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch { return []; }
}

export async function getPendingLocalDebts(userId = null) {
    const all = await getLocalDebts(userId);
    return all.filter(d => !d.synced && d.status !== 'paid');
}

export async function markLocalDebtSynced(localId, serverId = null) {
    const t = safeTable('local_debts');
    if (!t) {
        console.error('❌ markLocalDebtSynced: table not available');
        return false;
    }

    try {
        const record = await t.get(localId);
        if (!record) {
            console.warn(`⚠️ markLocalDebtSynced: السجل ${localId} غير موجود`);
            return false;
        }

        await t.update(localId, {
            synced: true,
            server_id: serverId ? Number(serverId) : record.server_id,
            synced_at: new Date().toISOString(),
        });

        const verify = await t.get(localId);
        if (!verify || verify.synced !== true) {
            console.error('❌ markLocalDebtSynced: فشل التحقق من التحديث');
            return false;
        }

        console.log(`✅ markLocalDebtSynced: ${localId} → server_id=${serverId}`);
        return true;
    } catch (e) {
        console.error('❌ markLocalDebtSynced error:', e);
        return false;
    }
}
export async function deleteLocalDebt(localId) {
    const t = safeTable('local_debts');
    if (!t) return false;
    try { await t.delete(localId); return true; } catch { return false; }
}

export async function countPendingLocalDebts() {
    const pending = await getPendingLocalDebts();
    return pending.length;
}

/* ============================================================
   ✅ local_debt_payments — دفعات السداد
   ============================================================
   
   الاستخدام:
     • عند سداد جزء من دين (محلي أو من السيرفر) أوفلاين،
       نحفظ الدفعة هنا.
     • عند عودة الإنترنت، تُزامَن الدفعة مع السيرفر.
   ============================================================ */

export async function saveLocalDebtPayment(payment) {
    const t = safeTable('local_debt_payments');
    if (!t) return null;

    try {
        const id = payment.id || `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const record = {
            id,
            local_debt_id: payment.local_debt_id || null,   // ← إن كان الدين محلياً
            server_debt_id: payment.server_debt_id || null, // ← إن كان الدين على السيرفر
            amount: Number(payment.amount || 0),
            user_id: Number(payment.user_id),
            notes: payment.notes || null,
            created_at: payment.created_at || new Date().toISOString(),
            synced: false,
        };

        await t.put(record);
        return record;
    } catch (e) {
        console.error('❌ saveLocalDebtPayment error:', e);
        return null;
    }
}

export async function getPendingDebtPayments() {
    const t = safeTable('local_debt_payments');
    if (!t) return [];

    try {
        const all = await t.toArray();
        return all
            .filter(p => !p.synced)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } catch { return []; }
}

export async function markDebtPaymentSynced(paymentId) {
    const t = safeTable('local_debt_payments');
    if (!t) return false;

    try {
        const record = await t.get(paymentId);
        if (!record) {
            console.warn(`⚠️ markDebtPaymentSynced: ${paymentId} غير موجود`);
            return false;
        }

        await t.update(paymentId, {
            synced: true,
            synced_at: new Date().toISOString(),
        });

        const verify = await t.get(paymentId);
        if (!verify || verify.synced !== true) {
            console.error('❌ markDebtPaymentSynced: فشل التحقق');
            return false;
        }

        console.log(`✅ markDebtPaymentSynced: ${paymentId}`);
        return true;
    } catch (e) {
        console.error('❌ markDebtPaymentSynced error:', e);
        return false;
    }
}
export async function deleteDebtPayment(paymentId) {
    const t = safeTable('local_debt_payments');
    if (!t) return false;
    try { await t.delete(paymentId); return true; } catch { return false; }
}

export async function countPendingDebtPayments() {
    const t = safeTable('local_debt_payments');
    if (!t) return 0;
    try {
        const all = await t.toArray();
        return all.filter(p => !p.synced).length;
    } catch { return 0; }
}

/* ============================================================
   ✅ getPaymentsForDebt — جلب الدفعات المعلّقة على دين معين
   ============================================================
   يُستخدم لتعديل المتبقي محلياً عند عرض الديون:
   - الدفعات على ديون السيرفر (server_debt_id)
   - الدفعات على ديون محلية (local_debt_id)
   ============================================================ */
export async function getPendingPaymentsForServerDebt(serverDebtId) {
    const t = safeTable('local_debt_payments');
    if (!t) return [];
    try {
        const all = await t.toArray();
        return all.filter(p =>
            !p.synced && Number(p.server_debt_id) === Number(serverDebtId)
        );
    } catch { return []; }
}

export async function getPendingPaymentsForLocalDebt(localDebtId) {
    const t = safeTable('local_debt_payments');
    if (!t) return [];
    try {
        const all = await t.toArray();
        return all.filter(p =>
            !p.synced && p.local_debt_id === localDebtId
        );
    } catch { return []; }
}

/**
 * ✅ حساب مجموع الدفعات المعلّقة (غير المُزامَنة) لجميع الديون
 * @returns {Object} map: "server_X" or "local_Y" → total_pending_amount
 */
export async function getPendingPaymentsMap() {
    const t = safeTable('local_debt_payments');
    if (!t) return {};
    try {
        const all = await t.toArray();
        const map = {};

        for (const p of all) {
            if (p.synced) continue;

            const key = p.server_debt_id
                ? `server_${p.server_debt_id}`
                : `local_${p.local_debt_id}`;

            map[key] = (map[key] || 0) + Number(p.amount || 0);
        }

        return map;
    } catch { return {}; }
}
/* ============================================================
   ✅ تنظيف الديون المُزامَنة القديمة (لتفادي تضخم IndexedDB)
   ============================================================
   - احتفظ بالديون المُزامَنة لمدة X يوم ثم احذفها
   - الافتراضي: 7 أيام
   ============================================================ */
export async function cleanupSyncedDebts(keepDays = 7) {
    const t = safeTable('local_debts');
    if (!t) return 0;

    try {
        const all = await t.toArray();
        const now = Date.now();
        const cutoff = now - (keepDays * 24 * 60 * 60 * 1000);
        let deleted = 0;

        for (const debt of all) {
            if (!debt.synced) continue;

            const syncedAt = debt.synced_at
                ? new Date(debt.synced_at).getTime()
                : new Date(debt.created_at).getTime();

            if (syncedAt < cutoff) {
                await t.delete(debt.local_id);
                deleted++;
            }
        }

        if (deleted > 0) {
            console.log(`🧹 cleanupSyncedDebts: حذف ${deleted} دين قديم`);
        }
        return deleted;
    } catch (e) {
        console.error('❌ cleanupSyncedDebts error:', e);
        return 0;
    }
}

/* ============================================================
   ✅ تنظيف دفعات السداد المُزامَنة
   ============================================================ */
export async function cleanupSyncedDebtPayments(keepDays = 7) {
    const t = safeTable('local_debt_payments');
    if (!t) return 0;

    try {
        const all = await t.toArray();
        const now = Date.now();
        const cutoff = now - (keepDays * 24 * 60 * 60 * 1000);
        let deleted = 0;

        for (const p of all) {
            if (!p.synced) continue;

            const syncedAt = p.synced_at
                ? new Date(p.synced_at).getTime()
                : new Date(p.created_at).getTime();

            if (syncedAt < cutoff) {
                await t.delete(p.id);
                deleted++;
            }
        }

        if (deleted > 0) {
            console.log(`🧹 cleanupSyncedDebtPayments: حذف ${deleted} دفعة قديمة`);
        }
        return deleted;
    } catch (e) {
        console.error('❌ cleanupSyncedDebtPayments error:', e);
        return 0;
    }
}

/* ============================================================
   ✅ حذف كل الديون المُزامَنة فوراً (تنظيف يدوي)
   ============================================================ */
export async function purgeSyncedDebts() {
    const t = safeTable('local_debts');
    if (!t) return 0;

    try {
        const all = await t.toArray();
        let deleted = 0;

        for (const debt of all) {
            if (debt.synced) {
                await t.delete(debt.local_id);
                deleted++;
            }
        }

        return deleted;
    } catch (e) {
        return 0;
    }
}

export async function purgeSyncedDebtPayments() {
    const t = safeTable('local_debt_payments');
    if (!t) return 0;

    try {
        const all = await t.toArray();
        let deleted = 0;

        for (const p of all) {
            if (p.synced) {
                await t.delete(p.id);
                deleted++;
            }
        }

        return deleted;
    } catch (e) {
        return 0;
    }
}
/* ============================================================
   ✅ deleteSyncedDebt — حذف نهائي لسجل محلي (بعد نجاح المزامنة)
   ============================================================ */
export async function deleteSyncedDebt(localId) {
    const t = safeTable('local_debts');
    if (!t) return false;

    try {
        const record = await t.get(localId);
        if (!record) return true; // نعتبره نجاحاً (حُذف مسبقاً)

        await t.delete(localId);

        const verify = await t.get(localId);
        if (verify) {
            console.error('❌ deleteSyncedDebt: فشل الحذف');
            return false;
        }

        console.log(`✅ deleteSyncedDebt: تم حذف ${localId}`);
        return true;
    } catch (e) {
        console.error('❌ deleteSyncedDebt error:', e);
        return false;
    }
}

/* ============================================================
   ✅ deleteSyncedDebtPayment — حذف دفعة بعد نجاح المزامنة
   ============================================================ */
export async function deleteSyncedDebtPayment(paymentId) {
    const t = safeTable('local_debt_payments');
    if (!t) return false;

    try {
        const record = await t.get(paymentId);
        if (!record) return true;

        await t.delete(paymentId);

        const verify = await t.get(paymentId);
        if (verify) {
            console.error('❌ deleteSyncedDebtPayment: فشل الحذف');
            return false;
        }

        console.log(`✅ deleteSyncedDebtPayment: تم حذف ${paymentId}`);
        return true;
    } catch (e) {
        console.error('❌ deleteSyncedDebtPayment error:', e);
        return false;
    }
}
export { db ,};