// modules/sales/services/sales.service.js
import axios from 'axios';
import { API_BASE } from '../../../src/js/config.js';
import { db } from '../../../src/js/offline-db.js';

export const SalesService = {
  async fetchMedicines(branchId) {
    try {
      // التوكن سيتم إرساله تلقائياً لأننا ضبطناه في axios.defaults
      const response = await axios.get(`${API_BASE}/medicines`, {
        params: { branch_id: branchId, with_prices: true }
      });
      // تخزين في IndexedDB
      await db.medicine_cache.bulkPut(
        response.data.map(m => ({ ...m, branch_id: branchId, cached_at: new Date().toISOString() }))
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // إذا كان التوكن غير صالح، التوجيه إلى تسجيل الدخول
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        throw new Error('جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى.');
      }
      console.warn('⚠️ جلب الأدوية من الخادم فشل، جاري استخدام الكاش المحلي:', error);
      // محاولة جلب من الكاش المحلي
      return await db.medicine_cache.where('branch_id').equals(branchId).toArray();
    }
  },

  // جلب الوردية المفتوحة
  async getCurrentShift(userId) {
    try {
      const response = await axios.get(`${API_BASE}/shifts/current`, {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.warn('⚠️ لا يمكن جلب الوردية من الخادم:', error);
      const cached = await db.shifts?.where('status').equals('open').first();
      return cached || null;
    }
  },

  // حفظ فاتورة بيع
  async saveSale(saleData) {
    const isOnline = navigator.onLine;
    if (isOnline) {
      try {
        const response = await axios.post(`${API_BASE}/sales`, saleData);
        return { success: true, data: response.data, synced: true };
      } catch (error) {
        console.error('❌ فشل حفظ البيع عبر API، سيتم حفظه محلياً:', error);
        return await this.saveOffline(saleData);
      }
    } else {
      return await this.saveOffline(saleData);
    }
  },

  // حفظ البيع محلياً
  async saveOffline(saleData) {
    const offlineSale = {
      ...saleData,
      synced: false,
      created_at: new Date().toISOString(),
      local_id: 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
    };
    await db.sales_queue.add(offlineSale);
    return { success: true, data: offlineSale, synced: false };
  },

  // مزامنة المبيعات غير المتزامنة
  async syncPendingSales() {
    const pendingSales = await db.sales_queue.where('synced').equals(false).toArray();
    let syncedCount = 0;
    for (const sale of pendingSales) {
      try {
        const response = await axios.post(`${API_BASE}/sales`, sale);
        await db.sales_queue.update(sale.id, { synced: true, server_id: response.data.id });
        syncedCount++;
      } catch (error) {
        console.error('❌ فشل مزامنة الفاتورة:', sale.id, error);
      }
    }
    return syncedCount;
  },

  // جلب تفاصيل الدواء
  async getMedicineDetails(medicineId) {
    try {
      const response = await axios.get(`${API_BASE}/medicines/${medicineId}`);
      return response.data;
    } catch (error) {
      console.error('❌ فشل جلب تفاصيل الدواء:', error);
      return await db.medicine_cache.get(medicineId);
    }
  }
};