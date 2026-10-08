// src/js/stores/medicineStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config.js';
import MedicineService from '../services/medicine.service.js';

export const useMedicineStore = defineStore('medicine', () => {
  
  // --- State ---
  const medicines = ref([]);
  const categories = ref([]);
  const units = ref([]);
  const pricingRules = ref([]);
  const loading = ref(false);

 
  const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10
  });
  const searchQuery = ref('');

  // --- Actions ---
  const fetchMedicines = async (params = {}) => {
    loading.value = true;
    try {
      const now = Date.now();
      const defaultParams = {
        page: pagination.value.currentPage,
        per_page: pagination.value.perPage,
        search: searchQuery.value,
        with_units: 1,
        ...params,
        _: now
      };
      
      const res = await axios.get(`${API_BASE}/medicines`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: defaultParams
      });
      
      console.log('✅ [MedicineStore] البيانات المستلمة:', res.data);
      
      // التعامل مع استجابة Laravel paginate
      if (res.data.data) {
        medicines.value = res.data.data;
        pagination.value = {
          currentPage: res.data.current_page || 1,
          lastPage: res.data.last_page || 1,
          total: res.data.total || 0,
          perPage: res.data.per_page || 10
        };
      } else {
        medicines.value = res.data || [];
      }
    } catch (e) {
      console.error('❌ [MedicineStore] فشل جلب الأدوية:', e);
    } finally {
      loading.value = false;
    }
  };

  const refreshMedicines = async (params = {}) => {
    console.log('🔄 [MedicineStore] استدعاء refreshMedicines...');
    await fetchMedicines(params);
    return medicines.value;
  };

  const goToPage = async (page) => {
    if (page < 1 || page > pagination.value.lastPage) return;
    pagination.value.currentPage = page;
    await fetchMedicines();
  };

  const setSearchQuery = async (query) => {
    searchQuery.value = query;
    pagination.value.currentPage = 1; // إعادة تعيين الصفحة إلى الأولى عند البحث
    await fetchMedicines();
  };
  
  // --- Actions ---
 
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      categories.value = Array.isArray(res.data) ? res.data : res.data.data || [];
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await axios.get(`${API_BASE}/units`);
      units.value = Array.isArray(res.data) ? res.data : res.data.data || [];
    } catch (e) {
      console.error('Failed to fetch units:', e);
    }
  };

  const fetchPricingRules = async () => {
    try {
      const res = await axios.get(`${API_BASE}/price-engine/rules`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.rules || []);
      pricingRules.value = list.filter(rule => rule.is_active);
    } catch (e) {
      console.error('Failed to fetch pricing rules:', e);
    }
  };

  const loadAll = async () => {
    await Promise.all([
      fetchMedicines(),
      fetchCategories(),
      fetchUnits(),
      fetchPricingRules()
    ]);
  };


  return {
    // State
    medicines,
    categories,
    units,
    pricingRules,
    loading,
    pagination,
    searchQuery,

    // Actions
    fetchMedicines,
    fetchCategories,
    fetchUnits,
    fetchPricingRules,
    loadAll,
    refreshMedicines,
    goToPage,
    setSearchQuery,
  };
});