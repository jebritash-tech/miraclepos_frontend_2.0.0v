<!-- modules/settings/PrintSettings.vue -->
<template>
  <div class="print-settings">
    <div class="header">
      <div class="icon"><i class="fas fa-print"></i></div>
      <div>
        <h2>إعدادات الطباعة</h2>
        <p>تحكم في طباعة الفواتير والتقارير. إذا لم تكن تملك طابعة، أبقِ الخيار معطّلاً.</p>
      </div>
    </div>

    <!-- Master switch -->
    <div class="card main-card" :class="{ active: form.enabled }">
      <div class="card-row">
        <div>
          <h3>تفعيل الطباعة</h3>
          <p>عند التفعيل، يمكن طباعة الفواتير وتقارير الوردية</p>
        </div>
        <label class="switch">
          <input type="checkbox" v-model="form.enabled">
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Sub-options (disabled if !enabled) -->
    <div class="options" :class="{ disabled: !form.enabled }">

      <!-- Auto-print after sale -->
      <div class="card">
        <div class="card-row">
          <div>
            <h3>طباعة تلقائية بعد كل بيع</h3>
            <p>اطبع الفاتورة مباشرة دون الحاجة للضغط على أي زر</p>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="form.autoAfterSale" :disabled="!form.enabled">
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- Width -->
      <div class="card">
        <div class="card-row">
          <div>
            <h3>مقاس ورق الطابعة</h3>
            <p>اختر المقاس المناسب لطابعتك</p>
          </div>
          <div class="width-buttons">
            <button
              :class="{ active: form.defaultWidth === 80 }"
              @click="form.defaultWidth = 80"
              :disabled="!form.enabled">
              80mm
              <small>قياسي</small>
            </button>
            <button
              :class="{ active: form.defaultWidth === 58 }"
              @click="form.defaultWidth = 58"
              :disabled="!form.enabled">
              58mm
              <small>صغير</small>
            </button>
          </div>
        </div>
      </div>

      <!-- Reprint button -->
      <div class="card">
        <div class="card-row">
          <div>
            <h3>إظهار زر "إعادة طباعة"</h3>
            <p>يظهر داخل مودال تفاصيل الفاتورة</p>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="form.allowReprint" :disabled="!form.enabled">
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- Test button -->
      <div class="card test-card">
        <div class="card-row">
          <div>
            <h3>اختبار الطباعة</h3>
            <p>اطبع فاتورة تجريبية للتأكد من أن كل شيء يعمل</p>
          </div>
          <button
            class="btn-test"
            @click="testPrint"
            :disabled="!form.enabled">
            <i class="fas fa-vial"></i>
            اختبار الآن
          </button>
        </div>
      </div>
    </div>

    <!-- Save bar -->
    <div class="save-bar">
      <button class="btn-save" @click="save" :disabled="!dirty">
        <i class="fas fa-save"></i>
        حفظ الإعدادات
      </button>
      <button class="btn-reset" @click="reset" v-if="dirty">
        إلغاء التغييرات
      </button>
    </div>

    <!-- Info box -->
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      <div>
        <strong>لا تحتاج طابعة؟</strong>
        <p>أبقِ الخيار معطّلاً. سيعمل النظام عادي، ويمكنك دائماً حفظ الفواتير PDF من زر "إعادة طباعة" عند الحاجة.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import {
  getPrintSettings,
  savePrintSettings,
  printInvoice,
} from '../../src/js/utils/thermalPrinter.js';

const saved = getPrintSettings();
const form = reactive({ ...saved });
const original = ref(JSON.stringify(saved));

const dirty = computed(() => JSON.stringify(form) !== original.value);

const save = () => {
  const result = savePrintSettings(form);
  if (result) {
    original.value = JSON.stringify(result);
    // إشعار بسيط
    window.dispatchEvent(new CustomEvent('miraclepos:toast', {
      detail: { message: '✅ تم حفظ إعدادات الطباعة', type: 'success' },
    }));
  }
};

const reset = () => {
  Object.assign(form, JSON.parse(original.value));
};

const testPrint = () => {
  printInvoice({
    id: 'TEST-' + Date.now().toString().slice(-6),
    created_at: new Date().toISOString(),
    total_amount: 12500,
    total_refunded: 0,
    payment_method: 'cash',
    user: { name: 'اختبار' },
    items: [
      { quantity: 2, price: 1500, unit: 'box',
        batch: { medicine: { name: 'Panadol' } } },
      { quantity: 3, price: 2900, unit: 'strip',
        batch: { medicine: { name: 'Azimax' } } },
      { quantity: 1, price: 1000, unit: 'piece',
        batch: { medicine: { name: 'Vitamin C' } } },
    ],
  }, { autoPrint: true, width: form.defaultWidth });
};
</script>

<style scoped>
.print-settings {
  max-width: 720px;
  margin: 0 auto;
  padding: 10px;
}

.header {
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 24px;
}
.header .icon {
  width: 56px; height: 56px; border-radius: 16px;
  background: linear-gradient(135deg, #0f5b7a, #1ba7c2);
  color: #fff; display: flex; align-items: center;
  justify-content: center; font-size: 22px;
}
.header h2 { font-size: 22px; font-weight: 800; color: #1e293b; margin: 0; }
.header p  { color: #64748b; font-size: 13px; margin: 4px 0 0; }

.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 12px;
  transition: all 0.25s;
}
.card.main-card {
  border-width: 2px;
}
.card.main-card.active {
  border-color: #1ba7c2;
  background: #f0f9ff;
  box-shadow: 0 4px 16px rgba(27, 167, 194, 0.12);
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}
.card-row h3 {
  font-size: 15px; font-weight: 700; color: #1e293b;
  margin: 0 0 4px;
}
.card-row p {
  font-size: 12.5px; color: #64748b; margin: 0;
}

/* Switch */
.switch { position: relative; display: inline-block; width: 50px; height: 28px; flex-shrink: 0; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer;
  inset: 0;
  background: #cbd5e1;
  border-radius: 28px;
  transition: 0.3s;
}
.slider::before {
  content: '';
  position: absolute;
  height: 22px; width: 22px;
  left: 3px; bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
}
.switch input:checked + .slider { background: #1ba7c2; }
.switch input:checked + .slider::before { transform: translateX(22px); }
.switch input:disabled + .slider { opacity: 0.5; cursor: not-allowed; }

/* Options disabled state */
.options.disabled { opacity: 0.5; pointer-events: none; }

/* Width buttons */
.width-buttons { display: flex; gap: 8px; }
.width-buttons button {
  padding: 8px 16px;
  border: 2px solid #e2e8f0;
  background: #fff;
  border-radius: 10px;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: 0.2s;
  font-family: inherit;
  display: flex; flex-direction: column; align-items: center;
  min-width: 70px;
}
.width-buttons button small { font-size: 10px; color: #94a3b8; font-weight: 500; }
.width-buttons button.active {
  border-color: #1ba7c2;
  background: #f0f9ff;
  color: #0f5b7a;
}
.width-buttons button:disabled { cursor: not-allowed; }

/* Test button */
.btn-test {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  transition: 0.2s;
  font-family: inherit;
}
.btn-test:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3); }
.btn-test:disabled { opacity: 0.5; cursor: not-allowed; }

.test-card { background: #f0fdf4; border-color: #bbf7d0; }

/* Save bar */
.save-bar {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}
.btn-save {
  padding: 12px 28px;
  background: linear-gradient(135deg, #0f5b7a, #1ba7c2);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  font-family: inherit;
  transition: 0.2s;
}
.btn-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15, 91, 122, 0.3); }
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.btn-reset {
  padding: 12px 20px;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

/* Info */
.info-box {
  display: flex; gap: 12px;
  margin-top: 24px;
  padding: 16px 20px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 14px;
  color: #78350f;
}
.info-box i { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
.info-box strong { font-size: 14px; font-weight: 800; }
.info-box p { font-size: 13px; margin: 4px 0 0; line-height: 1.5; }
</style>