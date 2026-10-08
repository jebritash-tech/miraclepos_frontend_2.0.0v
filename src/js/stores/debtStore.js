// src/js/stores/debtStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config.js';

export const useDebtStore = defineStore('debt', () => {
  const debts = ref([]);
  const loading = ref(false);
  const lastFetched = ref(0);
  const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 5
  });

  const fetchDebts = async (page = 1, force = false) => {
    const now = Date.now();
    // إزالة شرط التخزين المؤقت مؤقتاً للاختبار
    // if (!force && (now - lastFetched.value) < 5000) return;

    loading.value = true;
    try {
      console.log('🔵 [DebtStore] جلب الديون من API (force:', force, ', page:', page, ')...');
      const res = await axios.get(`${API_BASE}/debts?page=${page}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { _: now }
      });
      console.log('✅ [DebtStore] البيانات المستلمة:', res.data);
      
      // تحديث المصفوفة بالقيمة الجديدة
      debts.value = res.data.data || [];
      pagination.value = {
        currentPage: res.data.current_page || 1,
        lastPage: res.data.last_page || 1,
        total: res.data.total || 0,
        perPage: res.data.per_page || 5
      };
      lastFetched.value = now;
      console.log('✅ [DebtStore] debts.value بعد التحديث:', debts.value);
    } catch (e) {
      console.error('❌ [DebtStore] فشل جلب الديون:', e);
    } finally {
      loading.value = false;
    }
  };

  const refreshDebts = (page) => {
    console.log('🔄 [DebtStore] استدعاء refreshDebts (force=true)...');
    return fetchDebts(page || pagination.value.currentPage, true);
  };

  const goToPage = (page) => {
    if (page < 1 || page > pagination.value.lastPage) return;
    return fetchDebts(page, true);
  };

  return {
    debts,
    loading,
    pagination,
    fetchDebts,
    refreshDebts,
    goToPage
  };
});