// src/js/stores/categoryStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config.js';

export const useCategoryStore = defineStore('category', () => {
  // --- State ---
  const categories = ref([]);
  const loading = ref(false);
  const lastFetched = ref(0);

  // --- Actions ---
  const fetchCategories = async (force = false) => {
    const now = Date.now();
    if (!force && (now - lastFetched.value) < 5000) {
      console.log('⏳ [CategoryStore] استخدام البيانات المخبأة (أقل من 5 ثوانٍ)');
      return;
    }

    loading.value = true;
    try {
      console.log('🔵 [CategoryStore] جلب التصنيفات من API (force:', force, ')...');
      const res = await axios.get(`${API_BASE}/categories`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { _: now }
      });
      console.log('✅ [CategoryStore] البيانات المستلمة:', res.data);
      categories.value = res.data;
      lastFetched.value = now;
      console.log('✅ [CategoryStore] categories.value بعد التحديث:', categories.value);
    } catch (e) {
      console.error('❌ [CategoryStore] فشل جلب التصنيفات:', e);
    } finally {
      loading.value = false;
    }
  };

  const refreshCategories = () => {
    console.log('🔄 [CategoryStore] استدعاء refreshCategories (force=true)...');
    return fetchCategories(true);
  };

  return {
    categories,
    loading,
    fetchCategories,
    refreshCategories
  };
});