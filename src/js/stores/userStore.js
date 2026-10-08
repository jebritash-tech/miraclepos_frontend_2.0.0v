// src/js/stores/userStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config.js';

export const useUserStore = defineStore('user', () => {
  // --- State ---
  const users = ref([]);
  const loading = ref(false);
  const lastFetched = ref(0);

  // --- Actions ---
  const fetchUsers = async (force = false) => {
    const now = Date.now();
    if (!force && (now - lastFetched.value) < 5000) {
      console.log('⏳ [UserStore] استخدام البيانات المخبأة (أقل من 5 ثوانٍ)');
      return;
    }

    loading.value = true;
    try {
      console.log('🔵 [UserStore] جلب المستخدمين من API (force:', force, ')...');
      const res = await axios.get(`${API_BASE}/users`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { _: now }
      });
      console.log('✅ [UserStore] البيانات المستلمة:', res.data);
      users.value = res.data;
      lastFetched.value = now;
      console.log('✅ [UserStore] users.value بعد التحديث:', users.value);
    } catch (e) {
      console.error('❌ [UserStore] فشل جلب المستخدمين:', e);
    } finally {
      loading.value = false;
    }
  };

  const refreshUsers = () => {
    console.log('🔄 [UserStore] استدعاء refreshUsers (force=true)...');
    return fetchUsers(true);
  };

  return {
    users,
    loading,
    fetchUsers,
    refreshUsers
  };
});