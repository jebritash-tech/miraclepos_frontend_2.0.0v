<!-- modules/medicines/components/MedicinePricingPanel.vue -->
<template>
  <div class="pricing-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-icon">
        <i class="fas fa-tags"></i>
      </div>
      <div class="header-text">
        <h3>التسعير</h3>
        <p>إدارة قواعد التسعير والدفعات</p>
      </div>
      <button class="btn-refresh" @click="load" :disabled="loading">
        <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>جاري تحميل معلومات التسعير...</p>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- القاعدة الحالية -->
      <div class="section">
        <h4 class="section-title">
          <i class="fas fa-calculator"></i>
          القاعدة الحالية
        </h4>

        <div v-if="pricingInfo.current_rule" class="rule-card">
          <div class="rule-header">
            <div class="rule-name">
              <strong>{{ pricingInfo.current_rule.name }}</strong>
              <span
                v-if="pricingInfo.current_rule.is_custom"
                class="badge badge-purple">
                <i class="fas fa-star"></i> مخصص لهذا الدواء
              </span>
              <span v-else class="badge badge-blue">
                <i class="fas fa-globe"></i> عام
              </span>
            </div>

            <button
              v-if="pricingInfo.current_rule.is_custom"
              @click="resetPricing"
              class="btn-reset"
              title="إعادة للقاعدة العامة">
              <i class="fas fa-undo"></i> إعادة تعيين
            </button>
          </div>

          <div class="rule-details">
            <div class="rule-detail">
              <span class="detail-label">النوع</span>
              <span class="detail-value">{{ typeLabel(pricingInfo.current_rule.type) }}</span>
            </div>
            <div class="rule-detail">
              <span class="detail-label">القيمة</span>
              <span class="detail-value">{{ pricingInfo.current_rule.value }}</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-card">
          <i class="fas fa-info-circle"></i>
          لا توجد قاعدة تسعير محددة — سيتم استخدام القاعدة الافتراضية
        </div>

        <!-- تخصيص جديد -->
        <button
          v-if="!pricingInfo.current_rule?.is_custom"
          @click="showCustomizeForm = !showCustomizeForm"
          class="btn-customize">
          <i class="fas fa-plus-circle"></i>
          تخصيص تسعير لهذا الدواء
        </button>

        <!-- نموذج التخصيص -->
        <div v-if="showCustomizeForm" class="customize-form">
          <h5><i class="fas fa-cog"></i> تخصيص تسعير مخصص</h5>

          <div class="form-grid">
            <div class="form-field">
              <label>النوع</label>
              <select v-model="customForm.type">
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (+)</option>
                <option value="multiply">معامل ضرب (×)</option>
              </select>
            </div>

            <div class="form-field">
              <label>القيمة</label>
              <input
                v-model.number="customForm.value"
                type="number"
                step="0.01"
                placeholder="مثال: 25">
            </div>

            <div class="form-field">
              <label>وضع التقريب</label>
              <select v-model="customForm.rounding_mode">
                <option value="none">بدون تقريب</option>
                <option value="nearest">أقرب</option>
                <option value="up">أعلى</option>
                <option value="down">أدنى</option>
              </select>
            </div>

            <div class="form-field">
              <label>وحدة التقريب</label>
              <input
                v-model.number="customForm.rounding_unit"
                type="number"
                step="1"
                placeholder="مثال: 100">
            </div>
          </div>

          <!-- معاينة مباشرة -->
          <div v-if="previewResult" class="preview-box">
            <i class="fas fa-eye"></i>
            <span>معاينة:</span>
            <strong>{{ previewResult.buy_price }} => {{ previewResult.sell_price }} ج.س</strong>
            <span class="profit">
              (ربح {{ previewResult.profit_percent }}%)
            </span>
          </div>

          <div class="form-actions">
            <button @click="showCustomizeForm = false" class="btn-cancel">
              إلغاء
            </button>
            <button
              @click="saveCustomPricing"
              :disabled="savingCustom"
              class="btn-save">
              <i :class="savingCustom ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
              {{ savingCustom ? 'جاري الحفظ...' : 'حفظ التخصيص' }}
            </button>
          </div>
        </div>
      </div>

      <!-- الدفعات -->
      <div class="section">
        <h4 class="section-title">
          <i class="fas fa-boxes"></i>
          الدفعات المتاحة
          <span class="count-badge">{{ pricingInfo.batches.length }}</span>
        </h4>

        <div v-if="pricingInfo.batches.length === 0" class="empty-card">
          <i class="fas fa-inbox"></i>
          لا توجد دفعات متاحة لهذا الدواء
        </div>

        <div v-else class="batches-list">
          <div
            v-for="batch in pricingInfo.batches"
            :key="batch.id"
            class="batch-row"
            :class="{ 'locked': batch.is_locked, 'overridden': batch.has_override }">

            <div class="batch-info">
              <div class="batch-header">
                <span class="batch-number">
                  <i class="fas fa-barcode"></i>
                  #{{ batch.batch_number || batch.id }}
                </span>
                <span v-if="batch.is_locked" class="badge badge-locked">
                  <i class="fas fa-lock"></i> مقفل يدوياً
                </span>
                <span v-else-if="batch.has_override" class="badge badge-purple">
                  <i class="fas fa-star"></i> مخصص
                </span>
                <span v-else class="badge badge-auto">
                  <i class="fas fa-magic"></i> تلقائي
                </span>
              </div>

              <div class="batch-details">
                <div class="detail">
                  <span class="detail-label">الشراء</span>
                  <span class="detail-value">{{ formatNum(batch.buy_price) }}</span>
                </div>
                <div class="detail">
                  <span class="detail-label">البيع</span>
                  <span class="detail-value price">{{ formatNum(batch.sell_price) }}</span>
                </div>
                <div class="detail">
                  <span class="detail-label">الصلاحية</span>
                  <span class="detail-value">{{ batch.expiry_date || '—' }}</span>
                </div>
              </div>
            </div>

            <div class="batch-actions">
              <button
                v-if="!batch.is_locked"
                @click="openLockModal(batch)"
                class="btn-icon btn-lock"
                :disabled="!batch.price_id"
                :title="!batch.price_id ? 'معرّف السعر غير متاح' : 'قفل السعر'">
                <i class="fas fa-lock"></i>
                </button>
              <button
                v-else
                @click="unlockPrice(batch)"
                class="btn-icon btn-unlock"
                title="فتح القفل">
                <i class="fas fa-unlock"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- مودال قفل السعر -->
    <div v-if="lockModal.show" class="modal-overlay" @click.self="closeLockModal">
      <div class="modal">
        <h3><i class="fas fa-lock"></i> قفل السعر</h3>
        <p class="modal-sub">
          الدفعة: <strong>#{{ lockModal.batch?.batch_number || lockModal.batch?.id }}</strong>
        </p>

        <div class="form-field">
          <label>السعر الجديد</label>
          <input
            v-model.number="lockModal.sell_price"
            type="number"
            step="0.01"
            class="input-lg">
        </div>

        <div class="form-field">
          <label>سبب القفل (إلزامي)</label>
          <textarea
            v-model="lockModal.reason"
            rows="2"
            placeholder="مثال: عرض رمضان، اتفاق مع عميل، ..."></textarea>
        </div>

        <div v-if="lockModal.error" class="modal-error">
          <i class="fas fa-exclamation-circle"></i>
          {{ lockModal.error }}
        </div>

        <div class="modal-actions">
          <button @click="closeLockModal" class="btn-cancel">إلغاء</button>
          <button @click="saveLock" :disabled="lockModal.saving" class="btn-save">
            {{ lockModal.saving ? 'جاري الحفظ...' : 'قفل السعر' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
      <i :class="{
        'fas fa-check-circle': toast.type === 'success',
        'fas fa-exclamation-circle': toast.type === 'error',
      }"></i>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import axios from 'axios';
import { API_BASE } from '../../../src/js/config.js';

/* ============================================================
   Props & Emits
   ============================================================ */
const props = defineProps({
  medicineId: {
    type: [Number, String],
    required: true,
  },
});

const emit = defineEmits(['updated']);

/* ============================================================
   State
   ============================================================ */
const pricingInfo = ref({
  current_rule: null,
  batches: [],
});
const loading = ref(false);

const showCustomizeForm = ref(false);
const savingCustom = ref(false);

const customForm = reactive({
  type: 'percentage',
  value: 25,
  rounding_mode: 'up',
  rounding_unit: 100,
});

const previewResult = ref(null);

const lockModal = reactive({
  show: false,
  batch: null,
  sell_price: 0,
  reason: '',
  saving: false,
  error: '',
});

const toast = reactive({
  show: false,
  message: '',
  type: 'success',
});

/* ============================================================
   Helpers
   ============================================================ */
const showToast = (message, type = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => { toast.show = false; }, 4000);
};

const formatNum = (v) => Number(v || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const TYPE_LABELS = {
  percentage: 'نسبة مئوية',
  fixed: 'مبلغ ثابت',
  multiply: 'معامل ضرب',
};
const typeLabel = (t) => TYPE_LABELS[t] || t;

/* ============================================================
   Load data
   ============================================================ */
const load = async () => {
  if (!props.medicineId) return;

  loading.value = true;
  try {
    const res = await axios.get(
      `${API_BASE}/medicines/${props.medicineId}/pricing-info`,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { _ts: Date.now() }  // ← cache buster
      }
    );
    pricingInfo.value = {
      current_rule: res.data?.current_rule || null,
      batches: Array.isArray(res.data?.batches) ? res.data.batches : [],
    };
  } catch (e) {
    console.error('Failed to load pricing info:', e);
    pricingInfo.value = { current_rule: null, batches: [] };
    showToast('تعذر تحميل معلومات التسعير', 'error');
  } finally {
    loading.value = false;
  }
};

/* ============================================================
   Preview (محلي — لا يحتاج طلب API)
   ============================================================ */
const computePreview = () => {
  if (!customForm.value || customForm.value <= 0) {
    previewResult.value = null;
    return;
  }

  // خذ أول دفعة لعرض المعاينة
  const batch = pricingInfo.value.batches[0];
  if (!batch) {
    previewResult.value = null;
    return;
  }

  const buy = Number(batch.buy_price || 0);
  let rawSell = buy;

  if (customForm.type === 'percentage') {
    rawSell = buy + (buy * (customForm.value / 100));
  } else if (customForm.type === 'fixed') {
    rawSell = buy + Number(customForm.value);
  } else if (customForm.type === 'multiply') {
    rawSell = buy * Number(customForm.value);
  }

  // rounding
  const unit = Number(customForm.rounding_unit || 0);
  let sell = rawSell;
  if (unit > 0 && customForm.rounding_mode !== 'none') {
    if (customForm.rounding_mode === 'up') {
      sell = Math.ceil(rawSell / unit) * unit;
    } else if (customForm.rounding_mode === 'down') {
      sell = Math.floor(rawSell / unit) * unit;
    } else if (customForm.rounding_mode === 'nearest') {
      sell = Math.round(rawSell / unit) * unit;
    }
  }

  const profit = sell - buy;
  const profitPct = buy > 0 ? (profit / buy) * 100 : 0;

  previewResult.value = {
    buy_price: formatNum(buy),
    sell_price: formatNum(sell),
    profit_percent: profitPct.toFixed(2),
  };
};

watch(customForm, computePreview, { deep: true });

/* ============================================================
   تخصيص التسعير
   ============================================================ */
const saveCustomPricing = async () => {
  if (!customForm.value || customForm.value <= 0) {
    showToast('أدخل قيمة صحيحة', 'error');
    return;
  }

  savingCustom.value = true;
  try {
    await axios.post(
      `${API_BASE}/medicines/${props.medicineId}/override-pricing`,

      {
        mode: 'custom',
        type: customForm.type,
        value: customForm.value,
        rounding_mode: customForm.rounding_mode,
        rounding_unit: customForm.rounding_unit,
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { _ts: Date.now() }  // ← cache buster
      }
    );

    showToast('تم تطبيق التسعير المخصص بنجاح', 'success');
    showCustomizeForm.value = false;
    await load();
    emit('updated');
  } catch (e) {
    console.error(e);
    showToast(e.response?.data?.message || 'تعذر الحفظ', 'error');
  } finally {
    savingCustom.value = false;
  }
};

const resetPricing = async () => {
  if (!confirm('هل تريد إعادة التسعير إلى القاعدة العامة؟')) return;

  try {
    await axios.post(
      `${API_BASE}/medicines/${props.medicineId}/override-pricing`,
      { mode: 'reset' },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { _ts: Date.now() }  // ← cache buster
      }
    );
    showToast('تم إعادة التعيين للقاعدة العامة', 'success');
    await load();
    emit('updated');
  } catch (e) {
    showToast(e.response?.data?.message || 'تعذر الإعادة', 'error');
  }
};

/* ============================================================
   قفل / فتح سعر دفعة
   ============================================================ */
const openLockModal = (batch) => {
    if (!batch.price_id) {
        showToast('معرّف السعر غير متاح — أعد تحميل الصفحة', 'error');
        return;
    }
    lockModal.show = true;
    lockModal.batch = batch;
    lockModal.sell_price = Number(batch.sell_price || 0);
    lockModal.reason = '';
    lockModal.error = '';
};

const closeLockModal = () => {
  lockModal.show = false;
  lockModal.batch = null;
  lockModal.reason = '';
  lockModal.error = '';
};

const saveLock = async () => {
  if (!lockModal.reason.trim()) {
    lockModal.error = 'يجب إدخال سبب القفل';
    return;
  }
  if (lockModal.sell_price <= 0) {
    lockModal.error = 'أدخل سعراً صحيحاً';
    return;
  }

  lockModal.saving = true;
  lockModal.error = '';

  try {
    // نحتاج ID الخاص بـ medicine_price
    const priceId = lockModal.batch?.price_id;
    if (!priceId) {
      // fallback: نطلب من السيرفر الحصول على ID السعر
      lockModal.error = 'لا يمكن تحديد معرّف السعر. أعد تحميل الصفحة.';
      return;
    }

    await axios.post(`${API_BASE}/medicine-prices/${priceId}/lock`, 
    {
      sell_price: lockModal.sell_price,
      reason: lockModal.reason,
    },
    {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { _ts: Date.now() }  // ← cache buster
      }
  );

    showToast('تم قفل السعر بنجاح', 'success');
    closeLockModal();
    await load();
    emit('updated');
  } catch (e) {
    console.error(e);
    lockModal.error = e.response?.data?.message || 'تعذر القفل';
  } finally {
    lockModal.saving = false;
  }
};

const unlockPrice = async (batch) => {
  if (!confirm('هل تريد فتح القفل وإعادة الحساب التلقائي؟')) return;

  try {
    const priceId = batch?.price_id;
    if (!priceId) {
      showToast('معرّف السعر غير متاح', 'error');
      return;
    }

    await axios.post(`${API_BASE}/medicine-prices/${priceId}/unlock`,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { _ts: Date.now() }  // ← cache buster
      }
    );
    showToast('تم فتح القفل وإعادة الحساب', 'success');
    await load();
    emit('updated');
  } catch (e) {
    showToast(e.response?.data?.message || 'تعذر فتح القفل', 'error');
  }
};

/* ============================================================
   Lifecycle
   ============================================================ */
onMounted(() => {
  load();
  computePreview();
});

watch(() => props.medicineId, () => {
  if (props.medicineId) load();
});
</script>

<style scoped>
.pricing-panel {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  font-family: inherit;
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 20px;
}
.header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.header-text { flex: 1; }
.header-text h3 { font-size: 18px; font-weight: 800; margin: 0; color: #1e293b; }
.header-text p { font-size: 12px; margin: 2px 0 0; color: #64748b; }
.btn-refresh {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #7c3aed;
  cursor: pointer;
  transition: 0.2s;
}
.btn-refresh:hover:not(:disabled) {
  background: #f5f3ff;
  border-color: #7c3aed;
}

/* Sections */
.section { margin-bottom: 24px; }
.section-title {
  font-size: 14px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-title i { color: #7c3aed; font-size: 13px; }
.count-badge {
  background: #ede9fe;
  color: #6d28d9;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  margin-right: auto;
}

/* Rule card */
.rule-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}
.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.rule-name { flex: 1; }
.rule-name strong {
  display: block;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 6px;
}
.rule-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.rule-detail {
  background: #fff;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}
.detail-label {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  margin-bottom: 2px;
}
.detail-value {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: #1e293b;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}
.badge i { font-size: 9px; }
.badge-purple { background: #ede9fe; color: #6d28d9; }
.badge-blue   { background: #dbeafe; color: #1e40af; }
.badge-auto   { background: #d1fae5; color: #065f46; }
.badge-locked { background: #fee2e2; color: #991b1b; }

/* Empty */
.empty-card {
  text-align: center;
  padding: 24px;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 12px;
  color: #94a3b8;
  font-size: 13px;
}
.empty-card i {
  display: block;
  font-size: 24px;
  margin-bottom: 8px;
  color: #cbd5e1;
}

/* Buttons */
.btn-customize {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  background: #f5f3ff;
  border: 1px dashed #a78bfa;
  border-radius: 10px;
  color: #6d28d9;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  transition: 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-customize:hover {
  background: #ede9fe;
  border-style: solid;
}

.btn-reset {
  padding: 6px 12px;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}
.btn-reset:hover { background: #fecaca; }

/* Customize form */
.customize-form {
  margin-top: 14px;
  padding: 16px;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 12px;
}
.customize-form h5 {
  font-size: 13px;
  font-weight: 800;
  color: #6d28d9;
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}
.form-field label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 4px;
}
.form-field select,
.form-field input,
.form-field textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  background: #fff;
}
.form-field select:focus,
.form-field input:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

/* Preview */
.preview-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 12px;
}
.preview-box i { color: #059669; }
.preview-box strong { color: #059669; font-weight: 800; }
.preview-box .profit { color: #64748b; font-size: 12px; }

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.btn-cancel, .btn-save {
  padding: 9px 20px;
  border-radius: 9px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: 0.15s;
}
.btn-cancel { background: #e2e8f0; color: #475569; }
.btn-cancel:hover { background: #cbd5e1; }
.btn-save {
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(124, 58, 237, 0.25);
}
.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Batches */
.batches-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.batch-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: 0.15s;
}
.batch-row:hover { border-color: #cbd5e1; }
.batch-row.locked {
  background: #fef2f2;
  border-color: #fecaca;
}
.batch-row.overridden {
  background: #faf5ff;
  border-color: #ddd6fe;
}

.batch-info { flex: 1; }
.batch-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.batch-number {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: monospace;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 6px;
}
.batch-number i { font-size: 10px; }

.batch-details {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
  gap: 12px;
}
.detail {
  font-size: 12px;
}
.detail .price { color: #059669; font-size: 14px; }

.batch-actions {
  display: flex;
  gap: 6px;
}
.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  transition: 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-lock { background: #fee2e2; color: #dc2626; }
.btn-lock:hover { background: #fecaca; }
.btn-unlock { background: #d1fae5; color: #059669; }
.btn-unlock:hover { background: #a7f3d0; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(11, 26, 46, 0.65);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal {
  background: #fff;
  border-radius: 18px;
  padding: 24px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3);
}
.modal h3 {
  font-size: 17px;
  font-weight: 800;
  margin: 0 0 6px;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}
.modal h3 i { color: #7c3aed; }
.modal-sub {
  font-size: 12.5px;
  color: #64748b;
  margin: 0 0 16px;
}
.modal .form-field { margin-bottom: 12px; }
.input-lg {
  font-size: 16px !important;
  font-weight: 800 !important;
  text-align: center;
}
.modal-error {
  background: #fee2e2;
  color: #dc2626;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
.modal-actions .btn-cancel,
.modal-actions .btn-save {
  flex: 1;
  padding: 12px;
}

/* Toast */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  animation: toastIn 0.3s ease;
}
@keyframes toastIn {
  from { transform: translate(-50%, -20px); opacity: 0; }
  to   { transform: translate(-50%, 0);     opacity: 1; }
}
.toast-success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}
.toast-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .batch-details { grid-template-columns: 1fr 1fr; }
  .rule-details { grid-template-columns: 1fr; }
}
</style>