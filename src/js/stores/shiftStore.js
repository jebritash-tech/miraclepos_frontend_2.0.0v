// src/js/stores/shiftStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config.js';

export const useShiftStore = defineStore('shift', () => {
  // --- State ---
  const shifts = ref([]);
  const loading = ref(false);
  const lastFetched = ref(0);
  const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 5
  });

  // --- Actions ---
  const fetchShifts = async (params = {}, force = false) => {
    const now = Date.now();
    if (!force && (now - lastFetched.value) < 5000) {
      console.log('⏳ [ShiftStore] استخدام البيانات المخبأة (أقل من 5 ثوانٍ)');
      return;
    }

    loading.value = true;
    try {
      console.log('🔵 [ShiftStore] جلب الورديات من API (force:', force, ')...');
      
      // بناء query string من params
      const query = new URLSearchParams(params).toString();
      const url = query ? `${API_BASE}/shifts?${query}` : `${API_BASE}/shifts`;
      
      const res = await axios.get(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { _: now }
      });
      
      console.log('✅ [ShiftStore] البيانات المستلمة:', res.data);
      
      // التعامل مع البيانات إذا كانت paginated
      if (res.data.data) {
        shifts.value = res.data.data;
        pagination.value = {
          currentPage: res.data.current_page || 1,
          lastPage: res.data.last_page || 1,
          total: res.data.total || 0,
          perPage: res.data.per_page || 5
        };
      } else {
        shifts.value = res.data;
        pagination.value = {
          currentPage: 1,
          lastPage: 1,
          total: shifts.value.length,
          perPage: shifts.value.length || 5
        };
      }
      
      lastFetched.value = now;
      console.log('✅ [ShiftStore] shifts.value بعد التحديث:', shifts.value);
    } catch (e) {
      console.error('❌ [ShiftStore] فشل جلب الورديات:', e);
    } finally {
      loading.value = false;
    }
  };

  const refreshShifts = (params = {}) => {
    console.log('🔄 [ShiftStore] استدعاء refreshShifts (force=true)...');
    return fetchShifts(params, true);
  };

  return {
    shifts,
    loading,
    pagination,
    fetchShifts,
    refreshShifts
  };
});