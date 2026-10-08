<!-- modules/settings/Settings.vue -->
<template>
  <div class="settings-page">
    <div class="settings-header">
      <i class="fas fa-cog"></i>
      <div>
        <h2>إعدادات النظام</h2>
        <p>تحكم كامل في كل جانب من جوانب صيدليتك</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i> جاري التحميل...
    </div>

    <div v-else class="settings-layout">
      <!-- Sidebar tabs -->
      <aside class="settings-sidebar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <i :class="tab.icon"></i>
          <div>
            <span class="tab-title">{{ tab.name }}</span>
            <span class="tab-sub">{{ tab.desc }}</span>
          </div>
        </button>
      </aside>

      <!-- Content -->
      <main class="settings-content">
        <component :is="currentComponent" :settings="groups" @save="saveGroup" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { API_BASE } from '../../src/js/config.js';

import GeneralSettings from './tabs/GeneralSettings.vue';
import PinSettings from './tabs/PinSettings.vue';
import PrintSettingsTab from './tabs/PrintSettingsTab.vue';
import SecuritySettings from './tabs/SecuritySettings.vue';
import BackupSettingsTab from './tabs/BackupSettingsTab.vue';
import { refreshSettings } from '../../src/js/settings.js';

const saveGroup = async (updatedSettings) => {
  try {
    const res = await axios.put(`${API_BASE}/settings`, { settings: updatedSettings });
    groups.value = res.data.groups || {};

    // ✅ أعد تحميل الوحدة العامة — لتحديث الاسم/الشعار في القائمة فوراً
    await refreshSettings();

    toast('✅ تم حفظ الإعدادات', 'success');
  } catch (e) {
    toast(e.response?.data?.message || 'تعذر الحفظ', 'error');
  }
};
const tabs = [
  { id: 'general',    name: 'عام',              desc: 'اسم الصيدلية، العملة',          icon: 'fas fa-store',          component: GeneralSettings },
  { id: 'pin',        name: 'نظام PIN',          desc: 'حماية عمليات الموظفين',         icon: 'fas fa-lock',           component: PinSettings },
  { id: 'print',      name: 'الطباعة',          desc: 'الفواتير والتقارير',             icon: 'fas fa-print',          component: PrintSettingsTab },
  { id: 'security',   name: 'الأمان',           desc: 'الجلسات، محاولات الدخول',        icon: 'fas fa-shield-alt',     component: SecuritySettings },
  { id: 'backup',     name: 'النسخ الاحتياطي',  desc: 'الجدولة، الاحتفاظ',             icon: 'fas fa-database',       component: BackupSettingsTab },
];

const activeTab = ref('general');
const loading = ref(true);
const groups = ref({});

const currentComponent = computed(() =>
  tabs.find(t => t.id === activeTab.value)?.component || GeneralSettings
);

const loadSettings = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE}/settings`);
    groups.value = res.data.groups || {};
  } catch (e) {
    console.error('Failed to load settings:', e);
    toast('تعذر تحميل الإعدادات', 'error');
  } finally {
    loading.value = false;
  }
};



const toast = (message, type = 'success') => {
  window.dispatchEvent(new CustomEvent('miraclepos:toast', {
    detail: { message, type },
  }));
};

onMounted(loadSettings);
</script>

<style scoped>
.settings-page { max-width: 1100px; margin: 0 auto; padding: 10px; }

.settings-header {
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 24px;
}
.settings-header > i {
  width: 56px; height: 56px; border-radius: 16px;
  background: linear-gradient(135deg, #0f5b7a, #1ba7c2);
  color: #fff; display: flex; align-items: center;
  justify-content: center; font-size: 22px;
}
.settings-header h2 { font-size: 22px; font-weight: 800; color: #1e293b; margin: 0; }
.settings-header p { color: #64748b; font-size: 13px; margin: 4px 0 0; }

.settings-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 24px;
  align-items: start;
}

.settings-sidebar {
  display: flex; flex-direction: column; gap: 6px;
  background: #fff; padding: 12px;
  border-radius: 16px; border: 1px solid #e2e8f0;
  position: sticky; top: 20px;
}

.tab-btn {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  border: none; background: transparent;
  border-radius: 12px;
  cursor: pointer; text-align: right;
  transition: all 0.2s;
  font-family: inherit;
}
.tab-btn:hover { background: #f8fafc; }
.tab-btn.active {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  box-shadow: inset 3px 0 0 #1ba7c2;
}
.tab-btn > i {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: #f1f5f9; color: #64748b;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
  transition: 0.2s;
}
.tab-btn.active > i {
  background: #1ba7c2; color: #fff;
}
.tab-btn > div { flex: 1; text-align: right; }
.tab-title { display: block; font-size: 14px; font-weight: 700; color: #1e293b; }
.tab-sub { display: block; font-size: 11px; color: #94a3b8; margin-top: 2px; }
.tab-btn.active .tab-title { color: #0f5b7a; }

.settings-content {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 16px; padding: 24px;
  min-height: 500px;
}

.loading-state {
  text-align: center; padding: 60px;
  color: #64748b; font-size: 15px;
}
.loading-state i { margin-left: 8px; }

@media (max-width: 900px) {
  .settings-layout { grid-template-columns: 1fr; }
  .settings-sidebar { position: static; flex-direction: row; overflow-x: auto; }
  .tab-btn { min-width: 160px; }
}
</style>