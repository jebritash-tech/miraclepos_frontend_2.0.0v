<!-- modules/settings/tabs/PrintSettingsTab.vue -->
<template>
  <div class="print-settings">
    <div class="tab-header">
      <i class="fas fa-print"></i>
      <div>
        <h3>إعدادات الطباعة</h3>
        <p>تحكم في طباعة الفواتير وتقارير الوردية</p>
      </div>
    </div>

    <!-- Master switch -->
    <div class="card main-card" :class="{ active: bool('print.enabled') }">
      <div class="card-row">
        <div>
          <h4>تفعيل الطباعة</h4>
          <p>عند التفعيل، يمكن طباعة الفواتير والتقارير</p>
        </div>
        <label class="switch">
          <input type="checkbox" :checked="bool('print.enabled')"
                 @change="update('print.enabled', $event.target.checked)">
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Options -->
    <div :class="{ 'options-disabled': !bool('print.enabled') }">

      <div class="card">
        <div class="card-row">
          <div>
            <h4>طباعة تلقائية بعد كل بيع</h4>
            <p>اطبع الفاتورة مباشرة دون الحاجة للضغط على أي زر</p>
          </div>
          <label class="switch">
            <input type="checkbox" :checked="bool('print.auto_after_sale')"
                   @change="update('print.auto_after_sale', $event.target.checked)">
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="card">
        <div class="card-row">
          <div>
            <h4>عرض الورق</h4>
            <p>اختر مقاس ورق الطابعة</p>
          </div>
          <div class="number-buttons">
            <button :class="{ active: int('print.width') === 80 }"
                    @click="update('print.width', 80)">
              80mm <small>قياسي</small>
            </button>
            <button :class="{ active: int('print.width') === 58 }"
                    @click="update('print.width', 58)">
              58mm <small>صغير</small>
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-row">
          <div>
            <h4>السماح بإعادة الطباعة</h4>
            <p>يظهر زر "إعادة طباعة" في تفاصيل الفاتورة</p>
          </div>
          <label class="switch">
            <input type="checkbox" :checked="bool('print.allow_reprint')"
                   @change="update('print.allow_reprint', $event.target.checked)">
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="card">
        <div class="card-row">
          <div>
            <h4>طباعة تقرير إغلاق الوردية</h4>
            <p>يُطبع تلقائياً عند إغلاق الوردية</p>
          </div>
          <label class="switch">
            <input type="checkbox" :checked="bool('print.auto_close_shift')"
                   @change="update('print.auto_close_shift', $event.target.checked)">
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="card test-card">
        <div class="card-row">
          <div>
            <h4>اختبار الطباعة</h4>
            <p>اطبع فاتورة تجريبية للتأكد من أن كل شيء يعمل</p>
          </div>
          <button class="btn-test" @click="testPrint" :disabled="!bool('print.enabled')">
            <i class="fas fa-vial"></i> اختبار الآن
          </button>
        </div>
      </div>
    </div>

    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      <div>
        <strong>لا تحتاج طابعة؟</strong>
        <p>أبقِ الخيار معطّلاً. يعمل النظام عادي، ويمكنك حفظ الفواتير PDF من زر "إعادة طباعة" عند الحاجة.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { printInvoice } from '../../../src/js/utils/thermalPrinter.js';

const props = defineProps({ settings: { type: Object, default: () => ({}) } });
const emit = defineEmits(['save']);

const printGroup = computed(() => props.settings.print || []);
const getVal = (key) => printGroup.value.find(s => s.key === key)?.value;
const bool = (key) => Boolean(getVal(key));
const int  = (key) => parseInt(getVal(key) || 0);

const update = (key, value) => emit('save', { [key]: value });

const testPrint = () => {
  printInvoice({
    id: 'TEST-' + Date.now().toString().slice(-6),
    created_at: new Date().toISOString(),
    total_amount: 12500,
    total_refunded: 0,
    payment_method: 'cash',
    user: { name: 'اختبار' },
    items: [
      { quantity: 2, price: 1500, unit: 'box', batch: { medicine: { name: 'Panadol' } } },
      { quantity: 3, price: 2900, unit: 'strip', batch: { medicine: { name: 'Azimax' } } },
      { quantity: 1, price: 1000, unit: 'piece', batch: { medicine: { name: 'Vitamin C' } } },
    ],
  }, { autoPrint: true, width: int('print.width') || 80 });
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
  background: linear-gradient(135deg, #0f5b7a, #1ba7c2);
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
.main-card.active { border-color: #1ba7c2; background: #f0f9ff; }
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
.switch input:checked + .slider { background: #1ba7c2; }
.switch input:checked + .slider::before { transform: translateX(22px); }

.number-buttons { display: flex; gap: 8px; }
.number-buttons button {
  padding: 8px 16px; border: 2px solid #e2e8f0; background: #fff;
  border-radius: 10px; font-weight: 700; color: #475569;
  cursor: pointer; font-family: inherit; transition: 0.2s;
  display: flex; flex-direction: column; align-items: center; min-width: 70px;
}
.number-buttons button small { font-size: 10px; color: #94a3b8; font-weight: 500; }
.number-buttons button.active { border-color: #1ba7c2; background: #f0f9ff; color: #0f5b7a; }

.test-card { background: #f0fdf4; border-color: #bbf7d0; }
.btn-test {
  padding: 10px 20px; background: linear-gradient(135deg, #10b981, #059669);
  color: #fff; border: none; border-radius: 10px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  font-family: inherit; transition: 0.2s;
}
.btn-test:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3); }
.btn-test:disabled { opacity: 0.5; cursor: not-allowed; }

.info-box {
  display: flex; gap: 12px; margin-top: 20px;
  padding: 16px 20px; background: #eff6ff;
  border: 1px solid #bfdbfe; border-radius: 14px; color: #1e3a8a;
}
.info-box i { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
.info-box strong { font-size: 14px; font-weight: 800; }
.info-box p { font-size: 13px; margin: 4px 0 0; line-height: 1.5; }
</style>