// src/js/stores/supplierStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config.js';

export const useSupplierStore = defineStore('supplier', () => {
  // --- State ---
  const suppliers = ref([]);
  const loading = ref(false);
  const lastFetched = ref(0); // لتتبع آخر وقت تم فيه الجلب

  // --- Actions ---
  const fetchSuppliers = async (force = false) => {
    // إذا لم يكن force محدداً ولم تمر 5 ثوانٍ منذ آخر جلب، لا نعيد الجلب
    const now = Date.now();
    if (!force && (now - lastFetched.value) < 5000) {
      console.log('⏳ [SupplierStore] استخدام البيانات المخبأة (أقل من 5 ثوانٍ)');
      return;
    }

    loading.value = true;
    try {
      console.log('🔵 [SupplierStore] جلب الموردين من API (force:', force, ')...');
      const res = await axios.get(`${API_BASE}/suppliers`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: {
          _: now // منع التخزين المؤقت
        }
      });
      console.log('✅ [SupplierStore] البيانات المستلمة:', res.data);
      suppliers.value = res.data;
      lastFetched.value = now;
      console.log('✅ [SupplierStore] suppliers.value بعد التحديث:', suppliers.value);
    } catch (e) {
      console.error('❌ [SupplierStore] فشل جلب الموردين:', e);
    } finally {
      loading.value = false;
    }
  };

  // دالة التحديث (تستدعي fetchSuppliers مع force = true)
  const refreshSuppliers = () => {
    console.log('🔄 [SupplierStore] استدعاء refreshSuppliers (force=true)...');
    return fetchSuppliers(true);
  };

  return {
    suppliers,
    loading,
    fetchSuppliers,
    refreshSuppliers
  };
});