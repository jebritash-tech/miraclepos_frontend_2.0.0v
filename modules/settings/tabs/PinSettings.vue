<!-- modules/settings/tabs/PinSettings.vue -->
<template>
  <div class="pin-settings">
    <div class="tab-header">
      <i class="fas fa-lock"></i>
      <div>
        <h3>نظام PIN</h3>
        <p>حماية عمليات الموظفين بمطالبتهم برمز شخصي</p>
      </div>
    </div>

    <!-- Master switch -->
    <div class="card main-card" :class="{ active: bool('pin.enabled') }">
      <div class="card-row">
        <div>
          <h4>تفعيل نظام PIN</h4>
          <p>عند التفعيل، سيُطلب من الموظفين إدخال PIN في العمليات المحددة</p>
        </div>
        <label class="switch">
          <input type="checkbox" :checked="bool('pin.enabled')"
                 @change="update('pin.enabled', $event.target.checked)">
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Options (disabled if !enabled) -->
    <div :class="{ 'options-disabled': !bool('pin.enabled') }">

      <!-- Length -->
      <div class="card">
        <div class="card-row">
          <div>
            <h4>عدد الأرقام</h4>
            <p>عدد أرقام PIN المطلوب</p>
          </div>
          <div class="number-buttons">
            <button v-for="n in [4, 5, 6]" :key="n"
                    :class="{ active: int('pin.length') === n }"
                    @click="update('pin.length', n)">
              {{ n }}
            </button>
          </div>
        </div>
      </div>

      <!-- When required -->
      <div class="card">
        <h4 style="margin-bottom: 12px;">متى يُطلب PIN؟</h4>

        <div class="checkbox-list">
          <label class="check-row">
            <input type="checkbox" :checked="bool('pin.on_shift_open')"
                   @change="update('pin.on_shift_open', $event.target.checked)">
            <div>
              <span>عند فتح وردية جديدة</span>
              <small>مُوصى به بشدة</small>
            </div>
          </label>

          <label class="check-row">
            <input type="checkbox" :checked="bool('pin.on_shift_close')"
                   @change="update('pin.on_shift_close', $event.target.checked)">
            <div>
              <span>عند إغلاق وردية</span>
              <small>مُوصى به بشدة</small>
            </div>
          </label>

          <label class="check-row">
            <input type="checkbox" :checked="bool('pin.on_withdraw')"
                   @change="update('pin.on_withdraw', $event.target.checked)">
            <div>
              <span>عند السحب النقدي</span>
              <small>يمنع السحب غير المصرح به</small>
            </div>
          </label>

          <label class="check-row">
            <input type="checkbox" :checked="bool('pin.on_void_sale')"
                   @change="update('pin.on_void_sale', $event.target.checked)">
            <div>
              <span>عند إلغاء فاتورة</span>
              <small>يمنع الإلغاء العشوائي</small>
            </div>
          </label>

          <label class="check-row">
            <input type="checkbox" :checked="bool('pin.on_price_change')"
                   @change="update('pin.on_price_change', $event.target.checked)">
            <div>
              <span>عند تغيير سعر دواء</span>
              <small>حماية محرك الأسعار</small>
            </div>
          </label>
          <label class="check-row">
            <input type="checkbox" :checked="bool('pin.on_expense')"
                  @change="update('pin.on_expense', $event.target.checked)">
            <div>
              <span>عند إضافة مصروف</span>
              <small>يمنع تسجيل مصروفات وهمية</small>
            </div>
          </label>

          <label class="check-row">
            <input type="checkbox" :checked="bool('pin.on_debt_payment')"
                  @change="update('pin.on_debt_payment', $event.target.checked)">
            <div>
              <span>عند سداد دين</span>
              <small>يمنع إساءة استخدام سداد ديون العملاء</small>
            </div>
          </label>
          <label class="check-row danger">
            <input type="checkbox" :checked="bool('pin.on_every_sale')"
                   @change="update('pin.on_every_sale', $event.target.checked)">
            <div>
              <span>عند كل عملية بيع</span>
              <small>⚠️ قد يُبطئ العمل في الساعات المزدحمة</small>
            </div>
          </label>
        </div>
      </div>

      <!-- Lockout -->
      <div class="card">
        <h4 style="margin-bottom: 12px;">الحماية من التخمين</h4>
        <div class="grid-2">
          <div class="input-group">
            <label>الحد الأقصى للمحاولات</label>
            <input type="number" min="3" max="10"
                   :value="int('pin.max_attempts')"
                   @change="update('pin.max_attempts', parseInt($event.target.value))">
          </div>
          <div class="input-group">
            <label>مدة القفل (دقائق)</label>
            <input type="number" min="1" max="60"
                   :value="int('pin.lockout_minutes')"
                   @change="update('pin.lockout_minutes', parseInt($event.target.value))">
          </div>
        </div>
      </div>
    </div>

    <!-- Users PIN table -->
    <UsersPinTable />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import UsersPinTable from '../components/UsersPinTable.vue';

const props = defineProps({ settings: { type: Object, default: () => ({}) } });
const emit = defineEmits(['save']);

const pinGroup = computed(() => props.settings.pin || []);

const getVal = (key) => {
  const item = pinGroup.value.find(s => s.key === key);
  return item?.value;
};

const bool = (key) => Boolean(getVal(key));
const int  = (key) => parseInt(getVal(key) || 0);

const update = (key, value) => {
  emit('save', { [key]: value });
};
</script>

<style scoped>
.pin-settings { }
.tab-header {
  display: flex; align-items: center; gap: 14px;
  padding-bottom: 18px; border-bottom: 1px solid #f1f5f9;
  margin-bottom: 22px;
}
.tab-header > i {
  width: 48px; height: 48px; border-radius: 12px;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff; display: flex; align-items: center;
  justify-content: center; font-size: 20px;
}
.tab-header h3 { font-size: 18px; font-weight: 800; color: #1e293b; margin: 0; }
.tab-header p  { font-size: 12.5px; color: #64748b; margin: 4px 0 0; }

.card {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 14px; padding: 18px 20px;
  margin-bottom: 12px;
}
.main-card { border-width: 2px; }
.main-card.active { border-color: #a855f7; background: #faf5ff; }

.card-row {
  display: flex; justify-content: space-between;
  align-items: center; gap: 20px;
}
.card h4 { font-size: 15px; font-weight: 800; color: #1e293b; margin: 0 0 4px; }
.card p  { font-size: 12.5px; color: #64748b; margin: 0; }

.options-disabled { opacity: 0.5; pointer-events: none; }

/* Switch */
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
.switch input:checked + .slider { background: #a855f7; }
.switch input:checked + .slider::before { transform: translateX(22px); }

/* Number buttons */
.number-buttons { display: flex; gap: 8px; }
.number-buttons button {
  width: 52px; height: 44px;
  border: 2px solid #e2e8f0; background: #fff;
  border-radius: 10px; font-size: 16px; font-weight: 800;
  color: #475569; cursor: pointer; font-family: inherit;
  transition: 0.2s;
}
.number-buttons button.active {
  border-color: #a855f7; background: #faf5ff; color: #7c3aed;
}

/* Checkbox list */
.checkbox-list { display: flex; flex-direction: column; gap: 4px; }
.check-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 10px;
  cursor: pointer; transition: 0.15s;
}
.check-row:hover { background: #f8fafc; }
.check-row input[type="checkbox"] {
  width: 20px; height: 20px; cursor: pointer;
  accent-color: #a855f7; flex-shrink: 0;
}
.check-row div { flex: 1; }
.check-row span { display: block; font-weight: 700; color: #1e293b; font-size: 13.5px; }
.check-row small { display: block; font-size: 11px; color: #94a3b8; margin-top: 1px; }
.check-row.danger small { color: #dc2626; }

/* Grid 2 */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.input-group label {
  display: block; font-size: 12.5px; font-weight: 700;
  color: #475569; margin-bottom: 6px;
}
.input-group input {
  width: 100%; padding: 10px 12px;
  border: 1px solid #e2e8f0; border-radius: 10px;
  font-family: inherit; font-size: 14px; font-weight: 700;
  text-align: center;
}
.input-group input:focus {
  outline: none; border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}
</style>