<!-- modules/pricing-engine/pricing.vue -->
<template>
  <div class="space-y-6" dir="rtl">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">محرك الأسعار</h2>
        <p class="text-slate-500 text-sm mt-1">إدارة قواعد التسعير ومحاكاة الأسعار</p>
      </div>

      <button
        @click="showBulkRecalc = true"
        class="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 self-start md:self-auto">
        <i class="fas fa-bolt"></i>
        إعادة حساب شاملة للأسعار
      </button>
    </div>

    <!-- Rule Form -->
    <div class="bg-white rounded-xl shadow p-6">
      <h3 class="text-lg font-semibold text-slate-800 mb-4">
        {{ rule.id ? 'تعديل قاعدة' : 'إضافة قاعدة' }}
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div class="md:col-span-2">
          <label class="text-sm font-medium text-slate-600">اسم القاعدة</label>
          <input v-model="rule.name" class="w-full border rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
        </div>
        <div>
          <label class="text-sm font-medium text-slate-600">النوع</label>
          <select v-model="rule.type" class="w-full border rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
            <option value="percentage">نسبة %</option>
            <option value="fixed">مبلغ ثابت</option>
            <option value="multiply">ضرب</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-600">تطبق على</label>
          <select v-model="rule.apply_on" class="w-full border rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
            <option value="buy_price">سعر الشراء</option>
            <option value="sell_price">سعر البيع</option>
            <option value="profit">الربح</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-600">القيمة</label>
          <input type="number" v-model.number="rule.value" class="w-full border rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
        </div>
        <div>
          <label class="text-sm font-medium text-slate-600">الترتيب</label>
          <input type="number" v-model.number="rule.sort_order" class="w-full border rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
        </div>
      </div>

      <!-- Rounding -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div>
          <label class="text-sm font-medium text-slate-600">سياسة التقريب</label>
          <select v-model="rule.settings.rounding.mode" class="w-full border rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
            <option value="none">بدون تقريب</option>
            <option value="nearest">الأقرب</option>
            <option value="up">لأعلى</option>
            <option value="down">لأسفل</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-600">وحدة التقريب</label>
          <input type="number" min="0.01" step="0.01" v-model.number="rule.settings.rounding.unit" class="w-full border rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="أدخل قيمة" />
          <div class="flex flex-wrap gap-2 mt-2">
            <button v-for="value in roundingSuggestions" :key="value" type="button" @click="rule.settings.rounding.unit = value" class="px-3 py-1.5 rounded-lg border bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 text-xs transition">
              {{ value }}
            </button>
          </div>
        </div>
        <div class="flex items-end">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="rule.is_default" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            <span class="text-sm font-medium text-slate-600">قاعدة افتراضية</span>
          </label>
        </div>
      </div>

      <div class="flex justify-between mt-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="rule.is_active" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
          <span class="text-sm font-medium text-slate-600">مفعلة</span>
        </label>
        <div class="flex gap-2">
          <button @click="resetRule" class="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium transition">جديد</button>
          <button @click="saveRule" :disabled="saving" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium transition">
            {{ saving ? 'جاري الحفظ...' : 'حفظ' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Rules Table -->
    <div class="bg-white rounded-xl shadow overflow-hidden">
      <div class="p-4 border-b border-slate-100">
        <div class="flex flex-col md:flex-row gap-4 items-center">
          <div class="flex-1 w-full">
            <div class="relative">
              <i class="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
              <input
                v-model="searchRules"
                type="text"
                placeholder="ابحث في قواعد التسعير (الاسم، النوع، القيمة)..."
                class="w-full pr-10 pl-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
              />
            </div>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <button @click="refreshRules" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2">
              <i class="fas fa-sync-alt"></i> تحديث
            </button>
            <span class="text-xs text-slate-400 whitespace-nowrap">
              {{ filteredRules.length }} من {{ rules.length }} قاعدة
            </span>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50">
            <tr class="text-slate-600 text-xs font-bold uppercase tracking-wider">
              <th class="p-3 text-right">#</th>
              <th class="p-3 text-right">الاسم</th>
              <th class="p-3 text-right">النوع</th>
              <th class="p-3 text-right">التطبيق</th>
              <th class="p-3 text-right">القيمة</th>
              <th class="p-3 text-right">التقريب</th>
              <th class="p-3 text-right">الترتيب</th>
              <th class="p-3 text-right">الحالة</th>
              <th class="p-3 text-right">الافتراضية</th>
              <th class="p-3 text-center">العمليات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
            <tr v-if="loading && filteredRules.length === 0">
              <td colspan="10" class="text-center py-12 text-slate-400">جاري التحميل...</td>
            </tr>
            <tr v-else-if="filteredRules.length === 0">
              <td colspan="10" class="text-center py-12 text-slate-400">
                {{ searchRules ? 'لا توجد قواعد مطابقة للبحث' : 'لا توجد قواعد تسعير' }}
              </td>
            </tr>
            <tr v-for="item in filteredRules" :key="item.id" class="hover:bg-slate-50 transition">
              <td class="p-3 font-mono font-bold text-slate-700">{{ item.id }}</td>
              <td class="p-3 font-semibold text-slate-800">{{ item.name }}</td>
              <td class="p-3 text-slate-600">{{ item.type }}</td>
              <td class="p-3 text-slate-600">{{ item.apply_on }}</td>
              <td class="p-3 font-mono text-slate-700">{{ item.value }}</td>
              <td class="p-3 text-slate-600">{{ formatRounding(item) }}</td>
              <td class="p-3 text-slate-600">{{ item.sort_order }}</td>
              <td class="p-3">
                <span :class="item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'" class="px-2 py-1 rounded font-bold text-xs">
                  {{ item.is_active ? 'مفعلة' : 'متوقفة' }}
                </span>
              </td>
              <td class="p-3">
                <span v-if="item.is_default" class="px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs">افتراضية</span>
                <span v-else class="text-slate-400">—</span>
              </td>
              <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button @click="editRule(item)" class="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition" title="تعديل">✏️</button>
                  <button @click="toggleRule(item.id)" class="text-purple-600 hover:text-purple-800 p-1.5 rounded-lg hover:bg-purple-50 transition" title="تفعيل / إيقاف">🔄</button>
                  <button @click="deleteRule(item.id)" class="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition" title="حذف">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Medicine Pricing Rules -->
    <div class="bg-white rounded-xl shadow p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-slate-800">قواعد تسعير الأدوية</h3>
          <p class="text-sm text-slate-500">اختر قاعدة التسعير الخاصة بكل دواء.</p>
        </div>
        <button @click="refreshMedicines" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition text-sm">
          تحديث
        </button>
      </div>

      <div class="overflow-x-auto max-h-96 overflow-y-auto">
        <table class="w-full">
          <thead class="bg-slate-50 sticky top-0">
            <tr class="text-slate-600 text-xs font-bold uppercase tracking-wider">
              <th class="p-3 text-right">الدواء</th>
              <th class="p-3 text-right">النوع</th>
              <th class="p-3 text-right">القاعدة الحالية</th>
              <th class="p-3 text-right">قاعدة التسعير</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
            <tr v-if="loading && medicines.length === 0">
              <td colspan="4" class="text-center py-12 text-slate-400">جاري تحميل الأدوية...</td>
            </tr>
            <tr v-else-if="medicines.length === 0">
              <td colspan="4" class="text-center py-12 text-slate-400">لا توجد أدوية.</td>
            </tr>
            <tr v-for="medicine in medicines" :key="medicine.id" class="hover:bg-slate-50 transition">
              <td class="p-3 font-semibold text-slate-800">{{ medicine.name }}</td>
              <td class="p-3">
                <span v-if="medicine.pricing_method === 'imported'" class="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-xs font-semibold">
                  <i class="fas fa-plane-import text-[10px]"></i> مستورد
                </span>
                <span v-else class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-xs font-semibold">
                  <i class="fas fa-home text-[10px]"></i> محلي
                </span>
              </td>
              <td class="p-3 text-slate-500">{{ medicine.pricing_rule?.name || 'القاعدة الافتراضية' }}</td>
              <td class="p-3">
                <select :value="medicine.pricing_rule_id || ''" @change="assignMedicineRule(medicine, $event.target.value)" class="border rounded-xl p-2 min-w-[250px] focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                  <option value="">استخدام القاعدة الافتراضية</option>
                  <option v-for="item in activeRules" :key="item.id" :value="item.id">
                    {{ item.name }} — {{ item.value }}{{ item.type === 'percentage' ? '%' : '' }}
                  </option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Simulator -->
    <div class="bg-white rounded-xl shadow p-6">
      <h3 class="text-lg font-semibold text-slate-800 mb-4">محاكاة السعر</h3>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="md:col-span-2 relative">
          <label class="block text-sm font-medium text-slate-600 mb-1">الدواء</label>
          <div class="relative">
            <i class="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
            <input
              v-model="searchMedicines"
              type="text"
              placeholder="ابحث عن دواء (الاسم أو الباركود)..."
              class="w-full pr-10 pl-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
            />
          </div>

          <div v-if="searchMedicines && filteredMedicinesForSimulation.length > 0"
               class="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
            <div
              v-for="medicine in filteredMedicinesForSimulation.slice(0, 20)"
              :key="medicine.id"
              @click="selectMedicineForSimulation(medicine)"
              class="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer transition flex items-center justify-between border-b border-slate-50 last:border-0"
            >
              <span class="font-medium text-slate-800">{{ medicine.name }}</span>
              <span class="text-xs text-slate-400 font-mono">{{ medicine.barcode }}</span>
            </div>
          </div>
          <div v-else-if="searchMedicines && filteredMedicinesForSimulation.length === 0"
               class="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-center text-slate-400 text-sm">
            لا توجد نتائج مطابقة
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1">سعر الشراء</label>
          <input type="number" v-model.number="simulator.buy_price" class="w-full border rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
        </div>

        <div class="flex items-end">
          <button id="simulate-btn" @click="simulate" :disabled="loading" class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl px-4 py-2.5 font-medium transition">
            {{ loading ? 'جاري الحساب...' : 'تشغيل' }}
          </button>
        </div>
      </div>

      <div v-if="simulationResult" class="mt-6" id="simulation-results">
        <div v-if="simulationResult.rule_name" class="mb-4 p-3 rounded-xl bg-slate-50 text-slate-700">
          القاعدة: <strong>{{ simulationResult.rule_name }}</strong>
        </div>

        <div v-if="simulationResult.raw_sell_price !== undefined" class="border-b border-slate-100 py-2">
          <div class="font-semibold text-slate-700">السعر قبل التقريب</div>
          <div class="text-slate-500">{{ simulationResult.raw_sell_price }}</div>
        </div>

        <div v-for="(step, idx) in simulationResult.steps || []" :key="idx" class="border-b border-slate-100 py-2">
          <div class="font-semibold text-slate-700">{{ step.rule }}</div>
          <div class="text-slate-500">{{ step.before }} → {{ step.after }}</div>
        </div>

        <div class="mt-4 bg-blue-50 rounded-xl p-4 space-y-2">
          <div class="flex justify-between">
            <span class="text-slate-600">سعر البيع</span>
            <strong class="text-slate-800">{{ simulationResult.sell_price }}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">الربح</span>
            <strong class="text-emerald-600">{{ simulationResult.profit_amount }}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">النسبة</span>
            <strong class="text-blue-600">{{ simulationResult.profit_percent }}%</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Recalculate Modal -->
    <BulkRecalculateModal
      :show="showBulkRecalc"
      @close="showBulkRecalc = false"
      @completed="onBulkCompleted"
    />

    <!-- Toast -->
    <div v-if="toast.show" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-lg transition-all duration-300"
      :class="{
        'bg-emerald-50 border border-emerald-200 text-emerald-800': toast.type === 'success',
        'bg-red-50 border border-red-200 text-red-800': toast.type === 'error',
        'bg-amber-50 border border-amber-200 text-amber-800': toast.type === 'warning'
      }">
      <div class="flex items-center gap-3">
        <i :class="{
          'fas fa-check-circle text-emerald-500': toast.type === 'success',
          'fas fa-exclamation-circle text-red-500': toast.type === 'error',
          'fas fa-exclamation-triangle text-amber-500': toast.type === 'warning'
        }"></i>
        <span class="font-medium">{{ toast.message }}</span>
        <button @click="toast.show = false" class="mr-4 text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated } from 'vue';
import { usePricingStore } from '../../src/js/stores/index.js';
import { storeToRefs } from 'pinia';
import PricingService from '../../src/js/services/pricing.service.js';
import BulkRecalculateModal from './components/BulkRecalculateModal.vue';

/* ===== Store ===== */
const pricingStore = usePricingStore();
const { rules, medicines, loading, simulationResult } = storeToRefs(pricingStore);
const { refreshRules, refreshMedicines, refreshAll, setSimulationResult } = pricingStore;

/* ===== Local State ===== */
const saving = ref(false);
const searchRules = ref('');
const searchMedicines = ref('');
const roundingSuggestions = ref([1, 5, 10, 25, 50, 100, 250, 500, 1000]);
const showBulkRecalc = ref(false);

/* ===== Toast ===== */
const toast = reactive({ show: false, message: '', type: 'success' });
const showToast = (message, type = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => toast.show = false, 4000);
};

/* ===== Bulk Recalc Handler ===== */
const onBulkCompleted = async (stats) => {
  await refreshMedicines();
  showToast(
    `✅ تمت إعادة حساب ${stats?.prices_updated || 0} سعر في ${stats?.batches_processed || 0} دفعة` +
    (stats?.batches_skipped ? ` (تجاوز ${stats.batches_skipped} مقفلة)` : ''),
    'success'
  );
};

/* ===== Rule Form ===== */
const rule = reactive({
  id: null,
  name: '',
  type: 'percentage',
  apply_on: 'buy_price',
  value: 40,
  sort_order: 1,
  is_active: true,
  is_default: false,
  settings: {
    rounding: { mode: 'none', unit: 1 },
  },
});

/* ===== Simulator ===== */
const simulator = reactive({
  medicine_id: null,
  buy_price: 100,
});

/* ===== Computed ===== */
const filteredRules = computed(() => {
  if (!searchRules.value) return rules.value;
  const q = searchRules.value.toLowerCase().trim();
  return rules.value.filter(r =>
    r.name?.toLowerCase().includes(q) ||
    r.type?.toLowerCase().includes(q) ||
    String(r.value).includes(q)
  );
});

const filteredMedicinesForSimulation = computed(() => {
  if (!searchMedicines.value) return medicines.value;
  const q = searchMedicines.value.toLowerCase().trim();
  return medicines.value.filter(m =>
    m.name?.toLowerCase().includes(q) ||
    m.barcode?.toLowerCase().includes(q)
  );
});

const activeRules = computed(() => rules.value.filter(r => r.is_active));

/* ===== Methods ===== */
const formatRounding = (item) => {
  const mode = item.settings?.rounding?.mode || 'none';
  const unit = Number(item.settings?.rounding?.unit || 1);
  const labels = {
    none: 'بدون تقريب',
    nearest: `الأقرب ${unit}`,
    up: `لأعلى ${unit}`,
    down: `لأسفل ${unit}`,
  };
  return labels[mode] || 'بدون تقريب';
};

const resetRule = () => {
  rule.id = null;
  rule.name = '';
  rule.type = 'percentage';
  rule.apply_on = 'buy_price';
  rule.value = 40;
  rule.sort_order = rules.value.length + 1;
  rule.is_active = true;
  rule.is_default = false;
  rule.settings = { rounding: { mode: 'none', unit: 1 } };
};

const editRule = (item) => {
  rule.id = item.id;
  rule.name = item.name || '';
  rule.type = item.type || 'percentage';
  rule.apply_on = item.apply_on || 'buy_price';
  rule.value = Number(item.value || 0);
  rule.sort_order = Number(item.sort_order || 1);
  rule.is_active = Boolean(item.is_active);
  rule.is_default = Boolean(item.is_default);
  rule.settings = {
    rounding: {
      mode: item.settings?.rounding?.mode || 'none',
      unit: Number(item.settings?.rounding?.unit || 1),
    },
  };
};

const saveRule = async () => {
  saving.value = true;
  try {
    const payload = {
      id: rule.id,
      name: rule.name,
      type: rule.type,
      apply_on: rule.apply_on,
      value: Number(rule.value),
      sort_order: Number(rule.sort_order),
      is_active: Boolean(rule.is_active),
      is_default: Boolean(rule.is_default),
      settings: {
        rounding: {
          mode: rule.settings.rounding.mode || 'none',
          unit: Number(rule.settings.rounding.unit || 1),
        },
      },
    };

    if (rule.id) {
      await PricingService.updateRule(rule.id, payload);
      showToast('تم تحديث قاعدة التسعير', 'success');
    } else {
      delete payload.id;
      await PricingService.createRule(payload);
      showToast('تم إضافة قاعدة التسعير', 'success');
    }
    await refreshRules();
    resetRule();
    if (confirm('✅ تم حفظ القاعدة. هل تريد إعادة حساب الأسعار لتطبيقها فوراً؟')) {
      showBulkRecalc.value = true;
    }
  } catch (e) {
    showToast('تعذر حفظ قاعدة التسعير', 'error');
    console.error(e);
  } finally {
    saving.value = false;
  }
};

const deleteRule = async (id) => {
  if (!confirm('هل تريد حذف قاعدة التسعير؟')) return;
  try {
    await PricingService.deleteRule(id);
    await refreshRules();
    showToast('تم حذف القاعدة', 'success');
  } catch (e) {
    showToast('تعذر حذف قاعدة التسعير', 'error');
    console.error(e);
  }
};

const toggleRule = async (id) => {
  try {
    await PricingService.toggleRule(id);
    await refreshRules();
  } catch (e) {
    showToast('تعذر تغيير حالة القاعدة', 'error');
    console.error(e);
  }
};

const assignMedicineRule = async (medicine, pricingRuleId) => {
  try {
    const id = pricingRuleId ? Number(pricingRuleId) : null;
    await PricingService.assignRule(medicine.id, id);
    await refreshMedicines();
    showToast('تم تحديث قاعدة تسعير الدواء', 'success');
  } catch (e) {
    showToast('تعذر تحديث قاعدة التسعير', 'error');
    console.error(e);
    await refreshMedicines();
  }
};

const simulate = async () => {
  if (!simulator.medicine_id) {
    showToast('اختر الدواء أولاً', 'warning');
    return;
  }
  if (Number(simulator.buy_price) < 0) {
    showToast('أدخل سعر شراء صحيح', 'warning');
    return;
  }

  loading.value = true;
  try {
    const result = await PricingService.simulate({
      medicine_id: Number(simulator.medicine_id),
      buy_price: Number(simulator.buy_price),
    });
    setSimulationResult(result);
  } catch (e) {
    setSimulationResult(null);
    showToast('تعذر تنفيذ المحاكاة', 'error');
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const selectMedicineForSimulation = (medicine) => {
  simulator.medicine_id = medicine.id;
  searchMedicines.value = medicine.name;
};

/* ===== Lifecycle ===== */
onMounted(async () => {
  await refreshAll();
});

onActivated(async () => {
  await refreshAll();
});
</script>