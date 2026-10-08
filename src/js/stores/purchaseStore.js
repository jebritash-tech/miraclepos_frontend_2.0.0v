// src/js/stores/purchaseStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config.js';

export const usePurchaseStore = defineStore('purchase', () => {
  // --- State ---
  const purchases = ref([]);
  const loading = ref(false);
  const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10
  });

  // --- Actions ---
  const fetchPurchases = async (page = 1) => {
    loading.value = true;
    try {
      console.log('🔵 [PurchaseStore] جلب المشتريات من API...');
      const now = Date.now();
      const res = await axios.get(`${API_BASE}/purchases`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: {
          page: page,
          _: now
        }
      });
      
      // دعم كل من paginate و get
      if (res.data.data) {
        purchases.value = res.data.data;
        pagination.value = {
          currentPage: res.data.current_page || 1,
          lastPage: res.data.last_page || 1,
          total: res.data.total || 0,
          perPage: res.data.per_page || 10
        };
      } else {
        purchases.value = res.data;
      }
      
      console.log('✅ [PurchaseStore] عدد المشتريات:', purchases.value.length);
    } catch (e) {
      console.error('❌ [PurchaseStore] فشل جلب المشتريات:', e);
    } finally {
      loading.value = false;
    }
  };

  const refreshPurchases = (page) => {
    console.log('🔄 [PurchaseStore] استدعاء refreshPurchases...');
    return fetchPurchases(page || pagination.value.currentPage);
  };

  return {
    purchases,
    loading,
    pagination,
    fetchPurchases,
    refreshPurchases
  };
});