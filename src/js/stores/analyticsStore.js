// src/js/stores/analyticsStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config.js';
import { computed } from 'vue';
export const useAnalyticsStore = defineStore('analytics', () => {
  // --- State ---
  const dashboard = ref(null);
  const branches = ref([]);
  const loading = ref(false);
  const selectedBranch = ref('all');
  const lastFetched = ref(0);

  // --- Actions ---
  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_BASE}/branches`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      branches.value = res.data || [];
    } catch (e) {
      console.error('❌ فشل جلب الفروع:', e);
    }
  };

  const fetchDashboard = async (branchId = null, force = false) => {
    const now = Date.now();
    if (!force && (now - lastFetched.value) < 10000) {
      console.log('⏳ [AnalyticsStore] استخدام البيانات المخبأة (أقل من 10 ثوانٍ)');
      return;
    }

    loading.value = true;
    try {
      const params = {
        branch_id: branchId || selectedBranch.value || 'all',
        _: now
      };
      
      console.log('🔵 [AnalyticsStore] جلب تحليلات لوحة القيادة...', params);
      const res = await axios.get(`${API_BASE}/analytics/dashboard`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params
      });
      
      dashboard.value = res.data;
      lastFetched.value = now;
      console.log('✅ [AnalyticsStore] تم جلب التحليلات بنجاح');
    } catch (e) {
      console.error('❌ [AnalyticsStore] فشل جلب التحليلات:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const refreshDashboard = (branchId = null) => {
    console.log('🔄 [AnalyticsStore] تحديث التحليلات (force=true)...');
    return fetchDashboard(branchId, true);
  };

  const setSelectedBranch = (branchId) => {
    selectedBranch.value = branchId;
  };

  // ===== Getters =====
  const kpis = computed(() => dashboard.value?.kpis || {});
  const inventory = computed(() => dashboard.value?.inventory || {});
  const forecast = computed(() => dashboard.value?.forecast || []);
  const topSelling = computed(() => dashboard.value?.top_selling || []);
  const topProfit = computed(() => dashboard.value?.top_profit_products || []);
  const recentSales = computed(() => dashboard.value?.recent_sales || []);
  const salesProfitChart = computed(() => dashboard.value?.sales_profit_chart || []);
  const growthChart = computed(() => dashboard.value?.growth_chart || []);
  const peakHours = computed(() => dashboard.value?.peak_hours || []);
  const suppliers = computed(() => dashboard.value?.suppliers || []);

  return {
    // State
    dashboard,
    branches,
    loading,
    selectedBranch,
    // Getters
    kpis,
    inventory,
    forecast,
    topSelling,
    topProfit,
    recentSales,
    salesProfitChart,
    growthChart,
    peakHours,
    suppliers,
    // Actions
    fetchBranches,
    fetchDashboard,
    refreshDashboard,
    setSelectedBranch
  };
});