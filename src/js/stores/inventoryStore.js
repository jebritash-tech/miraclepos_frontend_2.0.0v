// src/js/stores/inventoryStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config.js';
import InventoryService from '../services/inventoryService.js';

export const useInventoryStore = defineStore('inventory', () => {
  // --- State ---
  const inventories = ref([]);
  const loading = ref(false);
  const lastFetched = ref(0);
  
  const dashboard = ref({
    total_items: 0,
    low_stock: 0,
    out_stock: 0,
    last_inventory: '-'
  });

  const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20
  });

  // --- Actions ---
  const fetchInventories = async (params = {}, force = false) => {
    const now = Date.now();
    if (!force && (now - lastFetched.value) < 5000) {
      console.log('⏳ [InventoryStore] استخدام البيانات المخبأة (أقل من 5 ثوانٍ)');
      return;
    }

    loading.value = true;
    try {
      console.log('🔵 [InventoryStore] جلب المخزون من API (force:', force, ')...');
      
      const res = await InventoryService.getAll({
        ...params,
        _: now // منع التخزين المؤقت
      });
      
      console.log('✅ [InventoryStore] البيانات المستلمة:', res);
      
      inventories.value = res.data.data || [];
      pagination.value = {
        currentPage: res.data.current_page || 1,
        lastPage: res.data.last_page || 1,
        total: res.data.total || 0,
        perPage: res.data.per_page || 20
      };
      
      if (res.dashboard) {
        dashboard.value = res.dashboard;
      }
      
      lastFetched.value = now;
      console.log('✅ [InventoryStore] inventories.value بعد التحديث (العدد):', inventories.value.length);
    } catch (e) {
      console.error('❌ [InventoryStore] فشل جلب المخزون:', e);
    } finally {
      loading.value = false;
    }
  };

  const refreshInventories = (params = {}) => {
    console.log('🔄 [InventoryStore] استدعاء refreshInventories (force=true)...');
    return fetchInventories(params, true);
  };

  return {
    inventories,
    loading,
    dashboard,
    pagination,
    fetchInventories,
    refreshInventories
  };
});