<template>
  <div v-if="show" class="bulk-modal-overlay" @click.self="close">
    <div class="bulk-modal" :class="{ 'modal-wide': step === 'review' }">

      <!-- ============================================================
           Header
           ============================================================ -->
      <div class="bm-header">
        <div class="bm-icon">
          <i class="fas" :class="step === 'review' ? 'fa-list-check' : 'fa-sync-alt'"></i>
        </div>
        <div class="bm-header-text">
          <h2>
            {{ step === 'review' ? 'مراجعة الأسعار قبل التطبيق' : 'إعادة حساب الأسعار' }}
          </h2>
          <p>
            {{ step === 'review'
              ? 'عدّل أي سعر يدوياً قبل الحفظ — التعديلات تُحفظ تلقائياً'
              : 'تحديث أسعار البيع بناءً على القواعد الحالية' }}
          </p>
        </div>
        <button class="bm-close" @click="close" :disabled="applying">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- ============================================================
           STEP 1: Setup
           ============================================================ -->
      <template v-if="step === 'setup'">

        <div class="bm-notice">
          <i class="fas fa-info-circle"></i>
          <p>
            استخدم هذه الميزة بعد تعديل قاعدة الربح لتطبيق القاعدة على كل الأسعار.
            <strong>الأسعار المقفلة يدوياً لن تُلمس.</strong>
          </p>
        </div>

        <div class="bm-section">
          <h3><i class="fas fa-bolt"></i> اختر نوع العملية</h3>

          <div class="bm-presets">
            <button
              @click="applyPreset('quick')"
              :class="['bm-preset', { active: activePreset === 'quick' }]">
              <i class="fas fa-bolt"></i>
              <div>
                <strong>تحديث سريع</strong>
                <small>الدفعات التي بها مخزون فقط</small>
              </div>
            </button>

            <button
              @click="applyPreset('imported')"
              :class="['bm-preset', { active: activePreset === 'imported' }]">
              <i class="fas fa-plane-import"></i>
              <div>
                <strong>المستورد فقط</strong>
                <small>لتغيّر سعر الدولار</small>
              </div>
            </button>

            <button
              @click="applyPreset('full')"
              :class="['bm-preset', { active: activePreset === 'full' }]">
              <i class="fas fa-globe"></i>
              <div>
                <strong>تحديث كامل</strong>
                <small>كل الدفعات، بدون قيود</small>
              </div>
            </button>
          </div>
        </div>

        <div class="bm-section">
          <h3><i class="fas fa-filter"></i> فلاتر متقدمة</h3>

          <label class="bm-check">
            <input type="checkbox" v-model="filters.only_imported">
            <div>
              <span>الأدوية المستوردة فقط</span>
              <small>تجاهل الأدوية المحلية</small>
            </div>
          </label>

          <label class="bm-check">
            <input type="checkbox" v-model="filters.only_with_stock">
            <div>
              <span>الدفعات التي بها مخزون فقط</span>
              <small>تجاهل الدفعات الفارغة</small>
            </div>
          </label>

          <label class="bm-check">
            <input type="checkbox" v-model="filters.skip_locked">
            <div>
              <span>تجاهل الأسعار المقفلة يدوياً</span>
              <small>احتفظ بالقرارات اليدوية للمدير</small>
            </div>
          </label>
        </div>

        <div class="bm-section">
          <h3>
            <i class="fas fa-edit"></i>
            سبب الإعادة
            <span class="required">إلزامي</span>
          </h3>
          <textarea
            v-model="filters.reason"
            rows="2"
            placeholder="مثال: ارتفاع سعر الدولار، تغيير القاعدة العامة..."></textarea>
        </div>

        <div class="bm-actions">
          <button class="bm-cancel" @click="close">إلغاء</button>
          <button
            class="bm-next"
            @click="loadDetails"
            :disabled="!canProceed || loadingDetails">
            <i :class="loadingDetails ? 'fas fa-spinner fa-spin' : 'fas fa-arrow-left'"></i>
            {{ loadingDetails ? 'جاري التحضير...' : 'متابعة للمراجعة' }}
          </button>
        </div>

      </template>

      <!-- ============================================================
           STEP 2: Review
           ============================================================ -->
      <template v-else-if="step === 'review'">

        <PriceReviewTable
          ref="reviewTableRef"
          :groups="details.groups"
          @update:overrides="onOverridesUpdate"
          @update:unlocks="onUnlocksUpdate" />

        <div class="bm-review-actions">
          <button class="bm-back" @click="backToSetup" :disabled="applying">
            <i class="fas fa-arrow-right"></i>
            رجوع
          </button>
          <button
            class="bm-apply-final"
            @click="applyFinal"
            :disabled="applying || details.total_items === 0">
            <i :class="applying ? 'fas fa-spinner fa-spin' : 'fas fa-check-circle'"></i>
            {{ applying ? 'جاري التطبيق...' : `تطبيق ${details.total_items} سعر` }}
          </button>
        </div>

      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import axios from 'axios';
import { API_BASE } from '../../../src/js/config.js';
import PriceReviewTable from './PriceReviewTable.vue';

const props = defineProps({
  show: { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'completed']);

const PRESETS = {
  quick:    { only_imported: false, only_with_stock: true,  skip_locked: true  },
  imported: { only_imported: true,  only_with_stock: true,  skip_locked: true  },
  full:     { only_imported: false, only_with_stock: false, skip_locked: false }, // ← full: skip_locked=false
};

const activePreset = ref('quick');

const filters = reactive({
  ...PRESETS.quick,
  reason: '',
});

const step = ref('setup');
const details = ref({ groups: [], total_items: 0, total_batches: 0, locked_items: 0 });
const overrides = ref([]);
const unlocks = ref([]); // ← جديد
const loadingDetails = ref(false);
const applying = ref(false);
const reviewTableRef = ref(null);

watch(
  () => [filters.only_imported, filters.only_with_stock, filters.skip_locked],
  () => {
    const current = {
      only_imported:   filters.only_imported,
      only_with_stock: filters.only_with_stock,
      skip_locked:     filters.skip_locked,
    };
    const match = Object.entries(PRESETS).find(
      ([, preset]) => JSON.stringify(preset) === JSON.stringify(current)
    );
    activePreset.value = match ? match[0] : null;
  },
  { deep: true }
);

const canProceed = computed(() => filters.reason.trim().length >= 3);

const applyPreset = (name) => {
  activePreset.value = name;
  Object.assign(filters, PRESETS[name]);
};

const loadDetails = async () => {
  if (!canProceed.value) return;

  loadingDetails.value = true;
  try {
    const res = await axios.post(
      `${API_BASE}/pricing/bulk-recalculate/details`,
      {
        only_imported:   filters.only_imported,
        only_with_stock: filters.only_with_stock,
        skip_locked:     filters.skip_locked,
      },
      {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        params: { _ts: Date.now() },
      }
    );

    details.value = {
      groups: res.data.groups || [],
      total_items: res.data.total_items || 0,
      total_batches: res.data.total_batches || 0,
      locked_items: res.data.locked_items || 0,
    };

    overrides.value = [];
    unlocks.value = [];
    step.value = 'review';
    await nextTick();
  } catch (e) {
    console.error('Details load failed:', e);
    alert(e.response?.data?.message || 'تعذر تحميل تفاصيل الأسعار');
  } finally {
    loadingDetails.value = false;
  }
};

const backToSetup = () => {
  if (applying.value) return;
  if (overrides.value.length > 0 || unlocks.value.length > 0) {
    const total = overrides.value.length + unlocks.value.length;
    if (!confirm(`لديك ${total} تغيير. الرجوع سيلغيها. هل أنت متأكد؟`)) return;
  }
  step.value = 'setup';
  overrides.value = [];
  unlocks.value = [];
  if (reviewTableRef.value) reviewTableRef.value.reset();
};

const onOverridesUpdate = (newOverrides) => {
  overrides.value = newOverrides;
};

const onUnlocksUpdate = (newUnlocks) => {
  unlocks.value = newUnlocks;
};

const applyFinal = async () => {
  if (applying.value) return;

  const count = details.value.total_items;
  const overridesCount = overrides.value.length;
  const unlocksCount = unlocks.value.length;

  let msg = `سيتم تطبيق ${count} سعر.`;
  if (overridesCount > 0) msg += `\n${overridesCount} معدّل يدوياً.`;
  if (unlocksCount > 0) msg += `\n${unlocksCount} سعر مقفل سيُفتح.`;
  msg += `\n\nالسبب: ${filters.reason}\n\nهل أنت متأكد؟`;

  if (!confirm(msg)) return;

  applying.value = true;

  try {
    const res = await axios.post(
      `${API_BASE}/pricing/bulk-recalculate/apply-custom`,
      {
        only_imported:   filters.only_imported,
        only_with_stock: filters.only_with_stock,
        skip_locked:     filters.skip_locked,
        reason:          filters.reason.trim(),
        overrides:       overrides.value,
        unlock_price_ids: unlocks.value, // ← جديد
      },
      {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        params: { _ts: Date.now() },
      }
    );

    emit('completed', res.data.stats);

    setTimeout(() => {
      step.value = 'setup';
      overrides.value = [];
      unlocks.value = [];
      filters.reason = '';
      emit('close');
    }, 500);

  } catch (e) {
    console.error('Apply failed:', e);
    alert(e.response?.data?.message || 'تعذر تطبيق الأسعار');
  } finally {
    applying.value = false;
  }
};

const close = () => {
  if (applying.value) return;
  const total = overrides.value.length + unlocks.value.length;
  if (step.value === 'review' && total > 0) {
    if (!confirm(`لديك ${total} تغيير. الإغلاق سيلغيها. هل أنت متأكد؟`)) return;
  }
  step.value = 'setup';
  overrides.value = [];
  unlocks.value = [];
  details.value = { groups: [], total_items: 0, total_batches: 0, locked_items: 0 };
  emit('close');
};

watch(() => props.show, (visible) => {
  if (visible) {
    step.value = 'setup';
    overrides.value = [];
    unlocks.value = [];
    details.value = { groups: [], total_items: 0, total_batches: 0, locked_items: 0 };
  }
});
</script>
<style scoped>
.bulk-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(11, 26, 46, 0.7);
  backdrop-filter: blur(6px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: bulkFadeIn 0.2s;
}
@keyframes bulkFadeIn { from { opacity: 0; } to { opacity: 1; } }

.bulk-modal {
  background: #fff;
  width: 100%;
  max-width: 640px;
  max-height: 92vh;
  overflow-y: auto;
  border-radius: 22px;
  padding: 28px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
  animation: bulkSlideUp 0.3s ease;
  transition: max-width 0.3s ease;
}
.bulk-modal.modal-wide {
  max-width: 1200px;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 92vh;
}
@keyframes bulkSlideUp {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* Header */
.bm-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.modal-wide .bm-header {
  padding: 20px 24px 16px;
  margin-bottom: 0;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  flex-shrink: 0;
}

.bm-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.modal-wide .bm-icon {
  width: 46px;
  height: 46px;
  font-size: 20px;
}

.bm-header-text { flex: 1; }
.bm-header-text h2 {
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}
.modal-wide .bm-header-text h2 { font-size: 17px; }
.bm-header-text p {
  font-size: 13px;
  color: #64748b;
  margin: 3px 0 0;
}
.modal-wide .bm-header-text p { font-size: 12px; }

.bm-close {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  transition: 0.2s;
  flex-shrink: 0;
}
.bm-close:hover:not(:disabled) { background: #e2e8f0; transform: rotate(90deg); }
.bm-close:disabled { opacity: 0.5; cursor: not-allowed; }

/* Notice */
.bm-notice {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  margin-bottom: 20px;
  color: #1e40af;
  font-size: 12.5px;
}
.bm-notice i { flex-shrink: 0; margin-top: 2px; }
.bm-notice p { margin: 0; line-height: 1.5; }

/* Sections */
.bm-section { margin-bottom: 20px; }
.bm-section h3 {
  font-size: 13.5px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.bm-section h3 i { color: #3b82f6; }
.required {
  background: #fee2e2;
  color: #991b1b;
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 10.5px;
  font-weight: 700;
}

/* Presets */
.bm-presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.bm-preset {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;
  border: 2px solid #e2e8f0;
  background: #fff;
  border-radius: 12px;
  cursor: pointer;
  font-family: inherit;
  text-align: right;
  transition: 0.2s;
}
.bm-preset:hover { border-color: #93c5fd; background: #f0f9ff; }
.bm-preset.active {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.bm-preset i {
  font-size: 18px;
  color: #64748b;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}
.bm-preset.active i { color: #1d4ed8; }
.bm-preset > div { flex: 1; min-width: 0; }
.bm-preset strong {
  display: block;
  font-size: 12.5px;
  color: #1e293b;
  font-weight: 800;
}
.bm-preset small {
  display: block;
  font-size: 10.5px;
  color: #94a3b8;
  margin-top: 2px;
}
.bm-preset.active strong { color: #1d4ed8; }

/* Checkboxes */
.bm-check {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.15s;
  border: 1px solid transparent;
}
.bm-check:hover { background: #f8fafc; border-color: #e2e8f0; }
.bm-check input[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: #3b82f6;
  cursor: pointer;
  flex-shrink: 0;
}
.bm-check span {
  display: block;
  font-weight: 700;
  color: #1e293b;
  font-size: 13.5px;
}
.bm-check small {
  display: block;
  color: #94a3b8;
  font-size: 11.5px;
  margin-top: 2px;
}

/* Textarea */
.bm-section textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-family: inherit;
  font-size: 13.5px;
  resize: vertical;
  transition: 0.15s;
}
.bm-section textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Actions */
.bm-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #e2e8f0;
}
.bm-cancel, .bm-next {
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  font-family: inherit;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.bm-cancel { background: #f1f5f9; color: #475569; }
.bm-cancel:hover:not(:disabled) { background: #e2e8f0; }
.bm-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.bm-next {
  flex: 1;
  justify-content: center;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  color: #fff;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
}
.bm-next:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.4);
}
.bm-next:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* Review actions */
.bm-review-actions {
  display: flex;
  gap: 10px;
  padding: 14px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.bm-back {
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  background: #f1f5f9;
  color: #475569;
  font-family: inherit;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.bm-back:hover:not(:disabled) { background: #e2e8f0; }
.bm-back:disabled { opacity: 0.5; cursor: not-allowed; }

.bm-apply-final {
  flex: 1;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff;
  font-family: inherit;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}
.bm-apply-final:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.4);
}
.bm-apply-final:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

@media (max-width: 640px) {
  .bm-presets { grid-template-columns: 1fr; }
  .bulk-modal { padding: 20px; border-radius: 16px; }
  .modal-wide { padding: 0; }
}
</style>