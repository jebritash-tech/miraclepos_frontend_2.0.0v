// src/js/stores/pricingStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config.js';

export const usePricingStore = defineStore('pricing', () => {
  // --- State ---
  const rules = ref([]);
  const medicines = ref([]);
  const loading = ref(false);
  const lastFetched = ref(0);
  const simulationResult = ref(null);

  // --- Actions ---
  const fetchRules = async (force = false) => {
    const now = Date.now();
    if (!force && (now - lastFetched.value) < 5000) {
      console.log('⏳ [PricingStore] استخدام البيانات المخبأة لقواعد التسعير (أقل من 5 ثوانٍ)');
      return;
    }

    loading.value = true;
    try {
      console.log('🔵 [PricingStore] جلب قواعد التسعير من API (force:', force, ')...');
      const res = await axios.get(`${API_BASE}/price-engine/rules`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { _: now }
      });
      console.log('✅ [PricingStore] البيانات المستلمة:', res.data);
      rules.value = res.data.data || res.data || [];
      lastFetched.value = now;
      console.log('✅ [PricingStore] rules.value بعد التحديث:', rules.value);
    } catch (e) {
      console.error('❌ [PricingStore] فشل جلب قواعد التسعير:', e);
    } finally {
      loading.value = false;
    }
  };

  const fetchMedicines = async (force = false) => {
    const now = Date.now();
    if (!force && (now - lastFetched.value) < 5000) {
      console.log('⏳ [PricingStore] استخدام البيانات المخبأة للأدوية (أقل من 5 ثوانٍ)');
      return;
    }

    try {
      console.log('🔵 [PricingStore] جلب الأدوية من API (force:', force, ')...');
      const res = await axios.get(`${API_BASE}/medicines`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { _: now, with_pricing_rule: 1 }
      });
      console.log('✅ [PricingStore] البيانات المستلمة:', res.data);
      medicines.value = res.data || [];
      console.log('✅ [PricingStore] medicines.value بعد التحديث:', medicines.value);
    } catch (e) {
      console.error('❌ [PricingStore] فشل جلب الأدوية:', e);
    }
  };

  const refreshRules = () => {
    console.log('🔄 [PricingStore] استدعاء refreshRules (force=true)...');
    return fetchRules(true);
  };

  const refreshMedicines = () => {
    console.log('🔄 [PricingStore] استدعاء refreshMedicines (force=true)...');
    return fetchMedicines(true);
  };

  const refreshAll = async () => {
    await Promise.all([refreshRules(), refreshMedicines()]);
  };

  const setSimulationResult = (result) => {
    simulationResult.value = result;
  };

  return {
    rules,
    medicines,
    loading,
    simulationResult,
    fetchRules,
    fetchMedicines,
    refreshRules,
    refreshMedicines,
    refreshAll,
    setSimulationResult
  };
});