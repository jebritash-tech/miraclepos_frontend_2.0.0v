<!-- modules/settings/tabs/BackupSettingsTab.vue -->
<template>
  <div class="backup-settings">
    <div class="tab-header">
      <i class="fas fa-database"></i>
      <div>
        <h3>النسخ الاحتياطي</h3>
        <p>حماية بيانات صيدليتك من الفقدان</p>
      </div>
    </div>

    <div class="card main-card" :class="{ active: bool('backup.auto_enabled') }">
      <div class="card-row">
        <div>
          <h4>نسخ احتياطي تلقائي</h4>
          <p>يُنشأ نسخة كاملة كل يوم الساعة 11:59 مساءً</p>
        </div>
        <label class="switch">
          <input type="checkbox" :checked="bool('backup.auto_enabled')"
                 @change="update('backup.auto_enabled', $event.target.checked)">
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <div :class="{ 'options-disabled': !bool('backup.auto_enabled') }">
      <div class="card">
        <div class="card-row">
          <div>
            <h4>مدة الاحتفاظ بالنسخ</h4>
            <p>يُحذف كل نسخة أقدم من هذه المدة تلقائياً</p>
          </div>
          <div class="number-buttons">
            <button v-for="n in [7, 30, 90]" :key="n"
                    :class="{ active: int('backup.keep_days') === n }"
                    @click="update('backup.keep_days', n)">
              {{ n }} <small>يوم</small>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="card action-card">
      <div class="card-row">
        <div>
          <h4>إجراءات سريعة</h4>
          <p>أنشئ نسخة الآن أو اذهب لصفحة إدارة النسخ</p>
        </div>
        <div class="action-buttons">
          <button class="btn-create" @click="createNow" :disabled="creating">
            <i :class="creating ? 'fas fa-spinner fa-spin' : 'fas fa-plus-circle'"></i>
            {{ creating ? 'جاري الإنشاء...' : 'إنشاء نسخة الآن' }}
          </button>
        </div>
      </div>
    </div>

    <div class="info-box">
      <i class="fas fa-shield-alt"></i>
      <div>
        <strong>استرجاع نسخة</strong>
        <p>لإدارة النسخ والتنزيل والاسترجاع، انتقل إلى صفحة <strong>النسخ الاحتياطي</strong> من قائمة لوحة التحكم.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { API_BASE } from '../../../src/js/config.js';

const props = defineProps({ settings: { type: Object, default: () => ({}) } });
const emit = defineEmits(['save']);

const creating = ref(false);

const backupGroup = computed(() => props.settings.backup || []);
const getVal = (key) => backupGroup.value.find(s => s.key === key)?.value;
const bool = (key) => Boolean(getVal(key));
const int  = (key) => parseInt(getVal(key) || 0);

const update = (key, value) => emit('save', { [key]: value });

const createNow = async () => {
  if (!confirm('إنشاء نسخة احتياطية الآن؟ قد يستغرق دقيقة.')) return;
  creating.value = true;
  try {
    const res = await axios.post(`${API_BASE}/backups/create`);
    window.dispatchEvent(new CustomEvent('miraclepos:toast', {
      detail: { message: `✅ ${res.data.message}`, type: 'success' },
    }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('miraclepos:toast', {
      detail: { message: e.response?.data?.message || 'تعذر إنشاء النسخة', type: 'error' },
    }));
  } finally {
    creating.value = false;
  }
};
</script>

<style scoped>
.tab-header {
  display: flex; align-items: center; gap: 14px;
  padding-bottom: 18px; border-bottom: 1px solid #f1f5f9;
  margin-bottom: 22px;
}
.tab-header > i {
  width: 48px; height: 48px; border-radius: 12px;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  color: #fff; display: flex; align-items: center;
  justify-content: center; font-size: 20px;
}
.tab-header h3 { font-size: 18px; font-weight: 800; margin: 0; color: #1e293b; }
.tab-header p  { font-size: 12.5px; margin: 4px 0 0; color: #64748b; }

.card {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 14px; padding: 18px 20px; margin-bottom: 12px;
}
.main-card { border-width: 2px; }
.main-card.active { border-color: #3b82f6; background: #eff6ff; }
.card-row { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.card h4 { font-size: 15px; font-weight: 800; color: #1e293b; margin: 0 0 4px; }
.card p  { font-size: 12.5px; color: #64748b; margin: 0; }
.options-disabled { opacity: 0.5; pointer-events: none; }

.switch { position: relative; display: inline-block; width: 50px; height: 28px; flex-shrink: 0; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer; inset: 0;
  background: #cbd5e1; border-radius: 28px; transition: 0.3s;
}
.slider::before {
  content: ''; position: absolute;
  height: 22px; width: 22px; left: 3px; bottom: 3px;
  background: #fff; border-radius: 50%; transition: 0.3s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
}
.switch input:checked + .slider { background: #3b82f6; }
.switch input:checked + .slider::before { transform: translateX(22px); }

.number-buttons { display: flex; gap: 8px; }
.number-buttons button {
  padding: 8px 16px; border: 2px solid #e2e8f0; background: #fff;
  border-radius: 10px; font-weight: 700; color: #475569;
  cursor: pointer; font-family: inherit; transition: 0.2s;
  display: flex; flex-direction: column; align-items: center; min-width: 70px;
}
.number-buttons button small { font-size: 10px; color: #94a3b8; font-weight: 500; }
.number-buttons button.active { border-color: #3b82f6; background: #eff6ff; color: #1e40af; }

.action-card { background: #f0fdf4; border-color: #bbf7d0; }
.action-buttons { display: flex; gap: 10px; }
.btn-create {
  padding: 12px 22px; background: linear-gradient(135deg, #1e40af, #3b82f6);
  color: #fff; border: none; border-radius: 12px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  font-family: inherit; transition: 0.2s;
}
.btn-create:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); }
.btn-create:disabled { opacity: 0.6; cursor: not-allowed; }

.info-box {
  display: flex; gap: 12px; margin-top: 20px;
  padding: 16px 20px; background: #eff6ff;
  border: 1px solid #bfdbfe; border-radius: 14px; color: #1e3a8a;
}
.info-box i { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
.info-box strong { font-size: 14px; font-weight: 800; }
.info-box p { font-size: 13px; margin: 4px 0 0; line-height: 1.5; }
</style>