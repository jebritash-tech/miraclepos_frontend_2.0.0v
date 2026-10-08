<!-- modules/settings/tabs/SecuritySettings.vue -->
<template>
  <div class="security-settings">
    <div class="tab-header">
      <i class="fas fa-shield-alt"></i>
      <div>
        <h3>إعدادات الأمان</h3>
        <p>حماية الجلسات وكلمات المرور</p>
      </div>
    </div>

    <div class="card">
      <div class="field">
        <label>مدة انتهاء الجلسة (دقائق)</label>
        <p class="hint">بعد هذه المدة من عدم النشاط، يُطلب تسجيل الدخول من جديد</p>
        <input type="number" min="15" max="1440"
               :value="int('security.session_timeout_minutes')"
               @change="update('security.session_timeout_minutes', parseInt($event.target.value))">
      </div>
    </div>

    <div class="card">
      <div class="field">
        <label>إلزام تغيير كلمة المرور كل (أيام)</label>
        <p class="hint">0 = لا إلزام. مثلاً 90 يعني كل 3 أشهر</p>
        <input type="number" min="0" max="365"
               :value="int('security.require_password_change_days')"
               @change="update('security.require_password_change_days', parseInt($event.target.value))">
      </div>
    </div>

    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      <div>
        <strong>ملاحظة</strong>
        <p>هذه الإعدادات تُطبَّق حالياً على الواجهة فقط. لمنع الاختراق الكامل، يجب تطبيقها على السيرفر أيضاً.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({ settings: { type: Object, default: () => ({}) } });
const emit = defineEmits(['save']);

const secGroup = computed(() => props.settings.security || []);
const getVal = (key) => secGroup.value.find(s => s.key === key)?.value;
const int = (key) => parseInt(getVal(key) || 0);
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
  background: linear-gradient(135deg, #dc2626, #f87171);
  color: #fff; display: flex; align-items: center;
  justify-content: center; font-size: 20px;
}
.tab-header h3 { font-size: 18px; font-weight: 800; margin: 0; color: #1e293b; }
.tab-header p  { font-size: 12.5px; margin: 4px 0 0; color: #64748b; }

.card {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 14px; padding: 18px 20px; margin-bottom: 12px;
}
.field label {
  display: block; font-size: 14px; font-weight: 700;
  color: #1e293b; margin-bottom: 4px;
}
.hint { font-size: 12px; color: #94a3b8; margin: 0 0 10px; }
.field input {
  width: 100%; max-width: 240px; padding: 10px 14px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-family: inherit; font-size: 15px; font-weight: 700; text-align: center;
}
.field input:focus { outline: none; border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }

.info-box {
  display: flex; gap: 12px; margin-top: 20px;
  padding: 16px 20px; background: #fef3c7;
  border: 1px solid #fde68a; border-radius: 14px; color: #78350f;
}
.info-box i { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
.info-box strong { font-size: 14px; font-weight: 800; }
.info-box p { font-size: 13px; margin: 4px 0 0; line-height: 1.5; }
</style>