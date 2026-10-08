// src/js/stores/branchStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config.js';

export const useBranchStore = defineStore('branch', () => {
  // --- State ---
  const branches = ref([]);
  const loading = ref(false);
  const lastFetched = ref(0);

  // --- Actions ---
  const fetchBranches = async (force = false) => {
    const now = Date.now();
    if (!force && (now - lastFetched.value) < 5000) {
      console.log('⏳ [BranchStore] استخدام البيانات المخبأة (أقل من 5 ثوانٍ)');
      return;
    }

    loading.value = true;
    try {
      console.log('🔵 [BranchStore] جلب الفروع من API (force:', force, ')...');
      const res = await axios.get(`${API_BASE}/branches`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { _: now }
      });
      console.log('✅ [BranchStore] البيانات المستلمة:', res.data);
      branches.value = res.data;
      lastFetched.value = now;
      console.log('✅ [BranchStore] branches.value بعد التحديث:', branches.value);
    } catch (e) {
      console.error('❌ [BranchStore] فشل جلب الفروع:', e);
    } finally {
      loading.value = false;
    }
  };

  const refreshBranches = () => {
    console.log('🔄 [BranchStore] استدعاء refreshBranches (force=true)...');
    return fetchBranches(true);
  };

  return {
    branches,
    loading,
    fetchBranches,
    refreshBranches
  };
});