// src/js/stores/salaryStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config.js';

export const useSalaryStore = defineStore('salary', () => {
  // --- State ---
  const salaries = ref([]);
  const loading = ref(false);
  const lastFetched = ref(0);
  const dashboard = ref({
    total: 0,
    paid: 0,
    pending: 0
  });
  const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20
  });

  // --- Actions ---
  const fetchSalaries = async (params = {}, force = false) => {
    const now = Date.now();
    if (!force && (now - lastFetched.value) < 5000) {
      console.log('⏳ [SalaryStore] استخدام البيانات المخبأة (أقل من 5 ثوانٍ)');
      return;
    }

    loading.value = true;
    try {
      console.log('🔵 [SalaryStore] جلب الرواتب من API (force:', force, ')...');
      const query = new URLSearchParams(params).toString();
      const url = query ? `${API_BASE}/salaries?${query}` : `${API_BASE}/salaries`;
      
      const res = await axios.get(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { _: now }
      });
      
      console.log('✅ [SalaryStore] البيانات المستلمة:', res.data);
      
      salaries.value = res.data.data || [];
      pagination.value = {
        currentPage: res.data.current_page || 1,
        lastPage: res.data.last_page || 1,
        total: res.data.total || 0,
        perPage: res.data.per_page || 20
      };
      
      // جلب لوحة التحكم (إحصائيات الرواتب)
      const dashRes = await axios.get(`${API_BASE}/salaries/dashboard`, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        params: { _: now }
      });
      dashboard.value = dashRes.data;
      
      lastFetched.value = now;
      console.log('✅ [SalaryStore] salaries.value بعد التحديث:', salaries.value);
    } catch (e) {
      console.error('❌ [SalaryStore] فشل جلب الرواتب:', e);
    } finally {
      loading.value = false;
    }
  };

  const refreshSalaries = (params = {}) => {
    console.log('🔄 [SalaryStore] استدعاء refreshSalaries (force=true)...');
    return fetchSalaries(params, true);
  };

  const refreshDashboard = async () => {
    try {
      const res = await axios.get(`${API_BASE}/salaries/dashboard`, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      dashboard.value = res.data;
    } catch (e) {
      console.error('❌ فشل جلب إحصائيات الرواتب:', e);
    }
  };

  return {
    salaries,
    loading,
    dashboard,
    pagination,
    fetchSalaries,
    refreshSalaries,
    refreshDashboard
  };
});