<!-- modules/medicines/catalog.vue -->
<template>
  <div class="p-8 max-w-7xl mx-auto space-y-8" dir="rtl">
    <!-- ================= نموذج إضافة / تعديل دواء ================= -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div class="border-b border-slate-100 p-6 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
              <i class="fas fa-capsules"></i>
            </span>
            {{ isEditing ? 'تعديل دواء' : 'إضافة دواء جديد' }}
          </h2>
          <p class="text-xs text-slate-500 mt-1">
            يتم هنا إنشاء كاتالوج الدواء فقط، أما أسعار الشراء والبيع فتحدد لاحقاً أثناء شراء المخزون.
          </p>
        </div>
      </div>

      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label class="block mb-2 text-xs font-semibold text-slate-700">اسم الدواء</label>
            <input v-model="form.name" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition" placeholder="اسم الدواء">
          </div>
          <div>
            <label class="block mb-2 text-xs font-semibold text-slate-700">الباركود الرئيسي</label>
            <input v-model="form.barcode" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono" placeholder="الباركود الأساسي">
          </div>
          <div>
            <label class="block mb-2 text-xs font-semibold text-slate-700">التصنيف</label>
            <select v-model="form.category_id" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition">
              <option value="">اختر التصنيف</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div>
            <label class="block mb-2 text-xs font-semibold text-slate-700">قاعدة التسعير</label>
            <select id="pricing-rule-select" v-model="form.pricing_rule_id" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition">
              <option :value="null">استخدام القاعدة الافتراضية</option>
              <option v-for="r in pricingRules" :key="r.id" :value="r.id">{{ r.name }} — {{ pricingRuleLabel(r) }}</option>
            </select>
            <p class="text-[11px] text-slate-400 mt-1">اتركها افتراضية إن لم يحتج الدواء إلى قاعدة خاصة.</p>
          </div>

          <!-- ✅ نوع الدواء (جديد) -->
          <div>
            <label class="block mb-2 text-xs font-semibold text-slate-700">
              نوع الدواء
              <span class="text-slate-400 font-normal">— يؤثر على إعادة الحساب عند تغيّر الدولار</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label
                :class="[
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition text-sm font-semibold',
                  form.pricing_method === 'local'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                ]">
                <input type="radio" value="local" v-model="form.pricing_method" class="sr-only">
                <i class="fas fa-home"></i>
                محلي
              </label>
              <label
                :class="[
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition text-sm font-semibold',
                  form.pricing_method === 'imported'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                ]">
                <input type="radio" value="imported" v-model="form.pricing_method" class="sr-only">
                <i class="fas fa-plane-import"></i>
                مستورد
              </label>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">
              الأدوية المستوردة تتأثر بسعر الدولار، بينما المحلية لا تتأثر.
            </p>
          </div>
        </div>

        <!-- الأخطاء -->
        <div v-if="Object.keys(errors).length" class="mt-5 bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-1">
          <div v-for="(err, key) in errors" :key="key" class="text-rose-600 text-xs font-medium">• {{ err[0] }}</div>
        </div>
      </div>
    </div>

    <!-- ====================== الوحدات ======================= -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div class="border-b border-slate-100 p-6 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 class="font-bold text-base text-slate-800 flex items-center gap-2.5" id="units-section-title">
            <span class="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-sm">
              <i class="fas fa-balance-scale"></i>
            </span>
            وحدات البيع
          </h2>
          <p class="text-xs text-slate-500 mt-1">مثال: حبة ← شريط ← علبة</p>
        </div>
        <button @click="addUnit" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-sm">
          <i class="fas fa-plus"></i> إضافة وحدة
        </button>
      </div>

      <div class="p-6 space-y-4">
        <div v-if="medicineUnits.length == 0" class="text-center text-slate-400 py-10 text-xs">لا توجد وحدات مضافة حالياً.</div>
        <div v-for="(unit, index) in medicineUnits" :key="index" class="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/60 hover:border-slate-300 transition">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div class="lg:col-span-3">
              <label class="block mb-2 text-xs font-semibold text-slate-700">الوحدة</label>
              <select v-model="unit.unit_id" class="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition">
                <option value="">اختر الوحدة</option>
                <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
            </div>
            <div class="lg:col-span-2">
              <label class="block mb-2 text-xs font-semibold text-slate-700">المعامل</label>
              <input type="number" min="1" v-model.number="unit.factor" id="unit-factor-input" class="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition">
            </div>
            <div class="lg:col-span-3">
              <label class="block mb-2 text-xs font-semibold text-slate-700">باركود الوحدة</label>
              <input v-model="unit.barcode" @keydown.enter.prevent="focusNextBarcode(index)" class="barcode-input w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono" placeholder="امسح الباركود">
            </div>
            <div class="lg:col-span-2 flex flex-col justify-center gap-2.5 pt-2 lg:pt-0">
              <label class="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input type="checkbox" v-model="unit.allow_sale" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500">
                <span>يسمح بالبيع</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input type="radio" :checked="unit.is_base" @change="setBaseUnit(index)" class="border-slate-300 text-emerald-600 focus:ring-emerald-500">
                <span>الوحدة الأساسية</span>
              </label>
            </div>
            <div class="lg:col-span-2 flex items-center justify-end">
              <button @click="removeUnit(unit, index)" class="bg-rose-50 hover:bg-rose-100 text-rose-600 p-3 rounded-xl transition flex items-center justify-center w-10 h-10">
                <i class="fas fa-trash text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== لوحة التسعير ===================== -->
    <MedicinePricingPanel
      v-if="isEditing && currentMedicineId"
      :medicine-id="currentMedicineId"
      @updated="onPricingUpdated"
    />

    <!-- ==================== أزرار الحفظ ===================== -->
    <div class="flex gap-3">
      <button @click="saveMedicine" id="save-medicine-btn" class="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition flex items-center gap-2 shadow-sm">
        <i class="fas fa-save"></i>
        {{ isEditing ? 'تحديث الدواء' : 'حفظ الدواء' }}
      </button>
      <button v-if="isEditing" @click="resetForm" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-8 py-3 rounded-xl font-semibold text-sm transition">إلغاء</button>
    </div>

    <!-- ====================== جدول الأدوية ====================== -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div class="border-b border-slate-100 p-4 bg-slate-50/50">
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <span class="absolute inset-y-0 right-3 flex items-center text-slate-400">
                <i class="fas fa-search"></i>
              </span>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="ابحث باسم الدواء أو الباركود..."
                class="w-full bg-white border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-500">
              <span class="font-bold text-slate-700">{{ filteredMedicines.length }}</span> نتيجة
            </span>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-right text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <th class="p-4">الدواء</th>
              <th class="p-4">النوع</th>
              <th class="p-4">التصنيف</th>
              <th class="p-4">الوحدات</th>
              <th class="p-4">الحالة</th>
              <th class="p-4">إجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading && paginatedMedicines.length === 0">
              <td colspan="6" class="p-8 text-center text-slate-400 text-xs">جاري التحميل...</td>
            </tr>
            <tr v-else-if="filteredMedicines.length === 0">
              <td colspan="6" class="p-8 text-center text-slate-400 text-xs">لا توجد أدوية مطابقة للبحث</td>
            </tr>
            <tr v-for="m in paginatedMedicines" :key="m.id" class="hover:bg-slate-50/60 transition">
              <td class="p-4 font-bold text-slate-800">{{ m.name }}</td>
              <td class="p-4">
                <span v-if="m.pricing_method === 'imported'" class="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-xs font-semibold">
                  <i class="fas fa-plane-import text-[10px]"></i> مستورد
                </span>
                <span v-else class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-xs font-semibold">
                  <i class="fas fa-home text-[10px]"></i> محلي
                </span>
              </td>
              <td class="p-4 text-slate-600 text-xs">{{ m.category?.name || '-' }}</td>
              <td class="p-4">
                <div v-if="getMedicineUnits(m).length" class="flex flex-wrap gap-1.5">
                  <span v-for="u in getMedicineUnits(m)" :key="u.id" class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                    {{ u.unit?.name || getUnitName(u.unit_id) }} <span class="text-slate-400 mx-1">×</span> {{ u.factor }}
                  </span>
                </div>
                <span v-else class="text-rose-500 text-xs font-semibold">⚠ لا توجد وحدات</span>
              </td>
              <td class="p-4">
                <span v-if="getMedicineUnits(m).length" class="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-semibold">مكتمل</span>
                <span v-else class="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-md text-xs font-semibold">يحتاج تحديث</span>
              </td>
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <button @click="editMedicine(m)" class="text-sky-600 hover:text-sky-700 text-xs font-semibold transition">تعديل</button>
                  <button @click="deleteMedicine(m.id)" class="text-rose-600 hover:text-rose-700 text-xs font-semibold transition">حذف</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredMedicines.length > 0" class="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-100">
        <div class="text-sm text-slate-500">
          عرض الصفحة <span class="font-bold text-slate-700">{{ currentPage }}</span> من <span class="font-bold text-slate-700">{{ totalPages }}</span>
          (إجمالي النتائج: <span class="font-bold text-slate-700">{{ filteredMedicines.length }}</span>)
        </div>
        <div class="flex items-center gap-2">
          <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1" class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">السابق</button>
          <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= totalPages" class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">التالي</button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
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
import { ref, reactive, computed, watch, nextTick, onMounted, onActivated } from 'vue';
import { useMedicineStore, useCategoryStore } from '../../src/js/stores/index.js';
import { storeToRefs } from 'pinia';
import { API_BASE } from '../../src/js/config.js';
import axios from 'axios';
import MedicineService from '../../src/js/services/medicine.service.js';
import MedicinePricingPanel from './components/MedicinePricingPanel.vue';

/* ===== Stores ===== */
const medicineStore = useMedicineStore();
const categoryStore = useCategoryStore();
const { medicines, categories, units, pricingRules, loading } = storeToRefs(medicineStore);
const { refreshMedicines, loadAll } = medicineStore;

/* ===== Local State ===== */
const saving = ref(false);
const isEditing = ref(false);
const currentMedicineId = ref(null);
const errors = ref({});
const medicineUnits = ref([]);
const barcodeInput = ref(null);

const searchQuery = ref('');
const currentPage = ref(1);
const perPage = 10;

const form = reactive({
  id: null,
  name: "",
  barcode: "",
  category_id: "",
  pricing_rule_id: null,
  pricing_method: "local",   // ✅ حقل جديد
  notes: ""
});

/* ===== Toast ===== */
const toast = reactive({ show: false, message: '', type: 'success' });
const showToast = (message, type = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => toast.show = false, 4000);
};

/* ===== Search & Pagination ===== */
const filteredMedicines = computed(() => {
  if (!searchQuery.value.trim()) return medicines.value;
  const query = searchQuery.value.toLowerCase().trim();
  return medicines.value.filter(m =>
    m.name?.toLowerCase().includes(query) ||
    (m.barcode && m.barcode.toLowerCase().includes(query))
  );
});

const totalPages = computed(() => Math.ceil(filteredMedicines.value.length / perPage) || 1);

const paginatedMedicines = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredMedicines.value.slice(start, start + perPage);
});

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

watch(searchQuery, () => { currentPage.value = 1; });

/* ===== Helpers ===== */
const getMedicineUnits = (medicine) => {
  if (!medicine) return [];
  if (!Array.isArray(medicine.units)) return [];
  return medicine.units;
};

const getUnitName = (id) => units.value.find(u => u.id === id)?.name || '';

const pricingRuleLabel = (rule) => {
  if (!rule) return "";
  let label = "";
  if (rule.type === "percentage")      label = `${Number(rule.value || 0)}%`;
  else if (rule.type === "fixed")      label = `+ ${Number(rule.value || 0)}`;
  else if (rule.type === "multiply")   label = `× ${Number(rule.value || 0)}`;
  else                                  label = String(rule.value ?? "");

  const mode = rule.settings?.rounding?.mode || "none";
  const unit = Number(rule.settings?.rounding?.unit || 1);
  const roundingLabels = {
    none: "بدون تقريب",
    nearest: `أقرب ${unit}`,
    up: `لأعلى ${unit}`,
    down: `لأسفل ${unit}`
  };
  return `${label} — ${roundingLabels[mode] || "بدون تقريب"}`;
};

/* ===== Units ===== */
const clearForm = () => {
  form.id = null;
  form.name = "";
  form.barcode = "";
  form.category_id = "";
  form.pricing_rule_id = null;
  form.pricing_method = "local";   // ✅ إعادة التعيين
  form.notes = "";
  errors.value = {};
  currentMedicineId.value = null;
  isEditing.value = false;
  medicineUnits.value = [];
};

const addUnit = () => {
  medicineUnits.value.push({
    id: null,
    unit_id: "",
    factor: medicineUnits.value.length === 0 ? 1 : "",
    barcode: "",
    allow_sale: true,
    is_base: medicineUnits.value.length === 0,
    sort_order: medicineUnits.value.length + 1
  });
};

const removeUnit = async (unit, index) => {
  if (medicineUnits.value.length === 1) {
    alert("يجب وجود وحدة واحدة على الأقل");
    return;
  }
  if (unit.id) {
    try { await axios.delete(`${API_BASE}/medicine-units/${unit.id}`,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { _ts: Date.now() }  // ← cache buster
      }
    ); }
    catch (e) { console.error(e); }
  }
  medicineUnits.value.splice(index, 1);
  medicineUnits.value.forEach((u, i) => u.sort_order = i + 1);
  if (!medicineUnits.value.some(u => u.is_base)) {
    medicineUnits.value[0].is_base = true;
    medicineUnits.value[0].factor = 1;
  }
};

const setBaseUnit = (index) => {
  medicineUnits.value.forEach((u, i) => { u.is_base = i === index; });
  medicineUnits.value[index].factor = 1;
};

const duplicatedUnit = () => {
  const ids = medicineUnits.value.map(u => u.unit_id).filter(Boolean);
  return ids.length !== new Set(ids).size;
};

const duplicatedBarcode = () => {
  const barcodes = medicineUnits.value.map(u => (u.barcode || "").trim()).filter(b => b !== "");
  return barcodes.length !== new Set(barcodes).size;
};

const validateUnits = () => {
  if (medicineUnits.value.length === 0) { alert("أضف وحدة واحدة على الأقل"); return false; }
  if (!medicineUnits.value.some(u => u.is_base)) { alert("حدد الوحدة الأساسية"); return false; }
  if (duplicatedUnit()) { alert("الوحدة مكررة"); return false; }
  if (duplicatedBarcode()) { alert("باركود مكرر"); return false; }

  for (const u of medicineUnits.value) {
    if (!u.unit_id) { alert("اختر الوحدة"); return false; }
    if (!u.factor || u.factor < 1) { alert("المعامل غير صحيح"); return false; }
  }
  return true;
};

const makePayload = () => ({
  name: form.name,
  barcode: form.barcode,
  category_id: form.category_id,
  pricing_rule_id: form.pricing_rule_id ? Number(form.pricing_rule_id) : null,
  pricing_method: form.pricing_method,   // ✅ أضف الحقل
  notes: form.notes,
  units: medicineUnits.value.map(u => ({
    id: u.id,
    unit_id: u.unit_id,
    factor: Number(u.factor),
    barcode: u.barcode,
    allow_sale: u.allow_sale,
    is_base: u.is_base,
    sort_order: u.sort_order
  }))
});

const resetForm = () => {
  clearForm();
  addUnit();
  nextTick(() => { barcodeInput.value?.focus(); });
};

const focusNextBarcode = (event) => {
  const inputs = [...document.querySelectorAll(".barcode-input")];
  const current = inputs.indexOf(event.target);
  if (current >= 0) inputs[current + 1]?.focus();
};

/* ===== CRUD ===== */
const createMedicine = async () => {
  const payload = makePayload();
  const response = await MedicineService.save(payload);
  const newMedicine = response.data?.medicine || { id: Date.now(), ...payload };
  medicines.value.unshift(newMedicine);
  return response;
};

const updateMedicine = async () => {
  const payload = makePayload();
  const response = await MedicineService.update(currentMedicineId.value, payload);
  const index = medicines.value.findIndex(m => m.id === currentMedicineId.value);
  if (index !== -1) {
    medicines.value[index] = response.data?.medicine || { ...payload, id: currentMedicineId.value };
  }
  return response;
};

const saveMedicine = async () => {
  errors.value = {};
  if (!validateUnits()) return;

  saving.value = true;
  try {
    if (isEditing.value) {
      await updateMedicine();
      showToast('تم تحديث الدواء بنجاح', 'success');
    } else {
      await createMedicine();
      showToast('تم إضافة الدواء بنجاح', 'success');
    }
    await refreshMedicines();
    resetForm();
  } catch (e) {
    if (e.response?.status === 422) {
      errors.value = e.response.data.errors;
      showToast('يرجى تصحيح الأخطاء', 'warning');
    } else {
      showToast('حدث خطأ أثناء حفظ الدواء', 'error');
      console.error(e);
    }
  } finally {
    saving.value = false;
  }
};

const editMedicine = async (medicine) => {
  try {
    const full = await MedicineService.get(medicine.id);
    currentMedicineId.value = full.id;
    isEditing.value = true;
    form.id = full.id;
    form.name = full.name;
    form.barcode = full.barcode;
    form.category_id = full.category_id;
    form.pricing_rule_id = full.pricing_rule_id ? Number(full.pricing_rule_id) : null;
    form.pricing_method = full.pricing_method || 'local';   // ✅ جديد
    form.notes = full.notes || "";
    medicineUnits.value = (full.units || []).map(u => ({
      id: u.id,
      unit_id: u.unit_id || u.id,
      factor: Number(u.factor),
      barcode: u.barcode || "",
      allow_sale: !!u.allow_sale,
      is_base: !!u.is_base,
      sort_order: u.sort_order
    }));
    if (medicineUnits.value.length === 0) addUnit();
    await nextTick();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (e) {
    console.error(e);
    showToast('حدث خطأ أثناء تحميل بيانات الدواء', 'error');
  }
};

const deleteMedicine = async (id) => {
  if (!confirm("حذف الدواء؟")) return;
  try {
    await MedicineService.delete(id);
    medicines.value = medicines.value.filter(m => m.id !== id);
    showToast('تم حذف الدواء بنجاح', 'success');
    await refreshMedicines();
  } catch (e) {
    showToast('حدث خطأ أثناء الحذف', 'error');
    console.error(e);
  }
};

/* ===== Pricing ===== */
const onPricingUpdated = async () => {
  if (currentMedicineId.value) {
    try {
      const full = await MedicineService.get(currentMedicineId.value);
      console.log('✅ تم تحديث التسعير للدواء:', full.name);
    } catch (e) {
      console.warn('تعذر إعادة تحميل الدواء:', e);
    }
  }
  await refreshMedicines();
  showToast('تم تحديث التسعير', 'success');
};

/* ===== Lifecycle ===== */
onMounted(async () => {
  if (!medicines.value.length) await loadAll();
  if (medicineUnits.value.length === 0) addUnit();
});

onActivated(async () => {
  await refreshMedicines();
});
</script>

<style scoped>
/* أنماط إضافية حسب الحاجة */
</style>