<template>
  <div>
    <div class="tab-header">
      <i class="fas fa-store"></i>
      <div><h3>الإعدادات العامة</h3><p>معلومات صيدليتك الأساسية</p></div>
    </div>

    <div v-for="item in generalGroup" :key="item.key" class="field">
      <label>{{ item.label }}</label>
      <input
        :type="item.key.includes('logo') ? 'url' : 'text'"
        :value="item.value || ''"
        @change="update(item.key, $event.target.value)"
        :placeholder="item.key.includes('logo') ? 'https://...' : ''">
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({ settings: Object });
const emit = defineEmits(['save']);

const generalGroup = computed(() => props.settings.pharmacy || []);
const update = (key, value) => emit('save', { [key]: value });
</script>

<style scoped>
.tab-header {
  display: flex; align-items: center; gap: 14px;
  padding-bottom: 18px; border-bottom: 1px solid #f1f5f9;
  margin-bottom: 22px;
}
.tab-header > i {
  width: 48px; height: 48px; border-radius: 12px;
  background: linear-gradient(135deg, #0f5b7a, #1ba7c2);
  color: #fff; display: flex; align-items: center;
  justify-content: center; font-size: 20px;
}
.tab-header h3 { font-size: 18px; font-weight: 800; margin: 0; color: #1e293b; }
.tab-header p  { font-size: 12.5px; margin: 4px 0 0; color: #64748b; }
.field { margin-bottom: 16px; }
.field label {
  display: block; font-size: 13px; font-weight: 700;
  color: #475569; margin-bottom: 6px;
}
.field input {
  width: 100%; padding: 12px 14px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-family: inherit; font-size: 14px;
}
.field input:focus {
  outline: none; border-color: #1ba7c2;
  box-shadow: 0 0 0 3px rgba(27, 167, 194, 0.1);
}
</style>