// src/js/stores/expenseStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config.js';

export const useExpenseStore = defineStore('expense', () => {
  // --- State ---
  const expenses = ref([]);
  const loading = ref(false);
  const lastFetched = ref(0);

  const stats = ref({
    total: 0,
    count: 0,
    admin_total: 0,
    admin_count: 0,
    shift_total: 0,
    shift_count: 0,
  });

  const statsGlobal = ref({
    total: 0,
    count: 0,
    admin_total: 0,
    admin_count: 0,
    shift_total: 0,
    shift_count: 0,
  });

  // --- Actions ---
  const fetchExpenses = async (params = {}, force = false) => {
    const now = Date.now();
    if (!force && (now - lastFetched.value) < 5000) {
      return;
    }

    loading.value = true;
    try {
      const res = await axios.get(`${API_BASE}/expenses`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        params: { ...params, _: now },
      });

      // ✅ دعم كل الأشكال
      expenses.value = res.data?.data || res.data || [];
      stats.value = res.data?.stats || stats.value;
      statsGlobal.value = res.data?.stats_global || statsGlobal.value;

      lastFetched.value = now;
    } catch (e) {
      console.error('❌ [ExpenseStore] فشل جلب المصروفات:', e);
      expenses.value = [];
    } finally {
      loading.value = false;
    }
  };

  const refreshExpenses = (params = {}) => {
    return fetchExpenses(params, true);
  };

  return {
    // State
    expenses,
    loading,
    stats,
    statsGlobal,
    // Actions
    fetchExpenses,
    refreshExpenses,
  };
});