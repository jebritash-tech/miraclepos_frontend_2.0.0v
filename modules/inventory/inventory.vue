<!-- modules/inventory/inventory.vue -->
<template>
  <div class="p-6 lg:p-8 space-y-8 bg-slate-50/50 min-h-screen" dir="rtl">

    <!-- Header -->
    <div class="flex flex-col lg:flex-row justify-between items-center bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-800">جرد المخزون</h2>
        <p class="text-sm text-slate-500 mt-1">متابعة المخزون وإجراء عمليات الجرد اليدوي.</p>
      </div>
      <button @click="refreshInventories" class="mt-4 lg:mt-0 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl shadow transition">
        تحديث
      </button>
    </div>

    <!-- Dashboard -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div class="text-xs text-slate-500">إجمالي الأصناف</div>
        <div class="text-3xl font-bold mt-2">{{ dashboard.total_items }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div class="text-xs text-slate-500">منخفض المخزون</div>
        <div class="text-3xl font-bold text-amber-600 mt-2">{{ dashboard.low_stock }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div class="text-xs text-slate-500">نفد المخزون</div>
        <div class="text-3xl font-bold text-red-600 mt-2">{{ dashboard.out_stock }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div class="text-xs text-slate-500">آخر جرد</div>
        <div class="text-lg font-bold mt-2">{{ dashboard.last_inventory }}</div>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5" id="inventory-filters-section">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div class="relative">
          <span class="absolute inset-y-0 right-3 flex items-center text-slate-400">
            <i class="fas fa-search"></i>
          </span>
          <input
            v-model="search"
            @input="onSearch"
            class="w-full border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            placeholder="بحث بالاسم أو الباركود"
          />
        </div>
        <select v-model="selectedBranch" @change="onFilterChange" class="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition bg-white">
          <option value="">كل الفروع</option>
          <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
        </select>
        <select v-model="status" @change="onFilterChange" class="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition bg-white">
          <option value="">كل الحالات</option>
          <option value="low">منخفض</option>
          <option value="out">نافد</option>
          <option value="expired">منتهي الصلاحية</option>
        </select>
        <button @click="applyFilters" class="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 font-medium transition">
          <i class="fas fa-search ml-2"></i> بحث
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-right text-sm" id="inventory-table">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <th class="p-4">#</th>
              <th class="p-4">رقم التشغيلة</th>
              <th class="p-4">الدواء</th>
              <th class="p-4">الوحدة</th>
              <th class="p-4">المخزون</th>
              <th class="p-4">الحد الأدنى</th>
              <th class="p-4">الحالة</th>
              <th class="p-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading && inventories.length === 0">
              <td colspan="8" class="p-8 text-center text-slate-400">جاري التحميل...</td>
            </tr>
            <tr v-else-if="!inventories || inventories.length === 0">
              <td colspan="8" class="p-8 text-center text-slate-400">لا توجد عناصر مخزون مطابقة للبحث</td>
            </tr>
            <tr v-for="item in inventories" :key="item.id" class="hover:bg-slate-50/60 transition">
              <td class="p-4 font-mono font-bold text-slate-700">{{ item.id }}</td>
              <td class="p-4 font-mono text-slate-600 text-xs">{{ item.medicine?.batches?.[0]?.batch_number || '-' }}</td>
              <td class="p-4 font-bold text-slate-800">{{ item.medicine?.name || '-' }}</td>
              <td class="p-4 font-semibold">{{ item.formatted_stock }}</td>
              <td class="p-4 font-semibold">{{ item.quantity }}</td>
              <td class="p-4">{{ item.minimum_quantity }}</td>
              <td class="p-4">
                <span :class="statusColor(item)" class="px-2.5 py-1 rounded-full text-xs font-bold">
                  {{ inventoryStatus(item) }}
                </span>
              </td>
              <td class="p-4 text-center whitespace-nowrap">
                <button
                  @click="openAdjustment(item)"
                  class="text-blue-600 hover:text-blue-800 text-xs font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition ml-1">
                  <i class="fas fa-edit ml-1"></i> تعديل
                </button>

                <!-- ✅ زر حذف الدفعة — يمرّر الدفعة الفعلية -->
                <button
                  @click="confirmDeleteBatch(item.medicine?.batches?.[0], item)"
                  :disabled="!item.medicine?.batches?.[0]"
                  :title="!item.medicine?.batches?.[0] ? 'لا توجد دفعة لهذا المخزون' : 'حذف الدفعة نهائياً'"
                  class="text-red-600 hover:text-red-800 text-xs font-semibold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed">
                  <i class="fas fa-trash ml-1"></i> حذف
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.total > 0" class="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-100">
        <div class="text-sm text-slate-500">
          عرض الصفحة <span class="font-bold text-slate-700">{{ pagination.currentPage }}</span> من <span class="font-bold text-slate-700">{{ pagination.lastPage }}</span>
          (الإجمالي: <span class="font-bold text-slate-700">{{ pagination.total }}</span>)
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="goToPage(pagination.currentPage - 1)"
            :disabled="pagination.currentPage <= 1"
            class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            السابق
          </button>
          <button
            @click="goToPage(pagination.currentPage + 1)"
            :disabled="pagination.currentPage >= pagination.lastPage"
            class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            التالي
          </button>
        </div>
      </div>
    </div>

    <!-- Adjustment Modal -->
    <div v-if="showAdjustmentModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div class="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
          <h3 class="text-xl font-bold text-slate-800">تعديل المخزون: {{ adjustment.medicine_name }}</h3>
          <button @click="closeAdjustment" class="text-slate-400 hover:text-slate-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">اسم الدواء</label>
              <input type="text" v-model="adjustment.medicine_name" disabled class="w-full border rounded-xl p-3 bg-slate-100 text-slate-600 text-sm">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">رقم التشغيلة (Batch)</label>
              <input type="text" v-model="adjustment.batch_number" disabled class="w-full border rounded-xl p-3 bg-slate-100 text-slate-600 text-sm">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">الكمية الحالية في النظام</label>
              <input type="number" v-model="adjustment.system_quantity" disabled class="w-full border rounded-xl p-3 bg-slate-100 text-slate-600 text-sm font-bold">
            </div>
            <div>
              <label class="block text-xs font-semibold text-emerald-700 mb-1">الكمية الفعلية الإجمالية</label>
              <input type="number" v-model="adjustment.actual_quantity" class="w-full border rounded-xl p-3 bg-emerald-50/50 border-emerald-300 font-bold text-emerald-700 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">الكمية المقاسة</label>
              <input type="number" v-model="adjustment.counted_packs" class="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500" placeholder="مثال: 10">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">معامل التحويل (Factor)</label>
              <input type="number" v-model="adjustment.factor" disabled class="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-600 cursor-not-allowed">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">الفرق</label>
            <input type="number" v-model="adjustment.difference" disabled class="w-full border rounded-xl p-3 bg-slate-100 font-bold text-sm" :class="adjustment.difference < 0 ? 'text-red-600' : 'text-emerald-600'">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">سبب التعديل</label>
            <select v-model="adjustment.reason" class="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500">
              <option value="inventory">جرد دوري</option>
              <option value="damage">تلف</option>
              <option value="loss">فقدان</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">ملاحظات</label>
            <textarea v-model="adjustment.notes" rows="2" class="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="أدخل أي ملاحظات إضافية هنا..."></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button @click="closeAdjustment" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition">إلغاء</button>
          <button @click="saveAdjustment" :disabled="saving" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2">
            <span v-if="saving">جاري الحفظ...</span>
            <span v-else><i class="fas fa-save ml-2"></i> حفظ</span>
          </button>
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
import { ref, reactive, watch, onMounted, onActivated } from 'vue';
import { useInventoryStore, useBranchStore } from '../../src/js/stores/index.js';
import { storeToRefs } from 'pinia';
import InventoryService from '../../src/js/services/inventoryService.js';
import { API_BASE } from '../../src/js/config.js';
import axios from 'axios';

// ===== Stores =====
const inventoryStore = useInventoryStore();
const branchStore = useBranchStore();
const { inventories, loading, dashboard, pagination } = storeToRefs(inventoryStore);
const { refreshInventories } = inventoryStore;
const { branches } = storeToRefs(branchStore);

// ===== Local State =====
const search = ref("");
const status = ref("");
const selectedBranch = ref("");

// ===== Adjustment State =====
const showAdjustmentModal = ref(false);
const saving = ref(false);

const adjustment = reactive({
  inventory_id: null,
  medicine_id: null,
  medicine_name: "",
  batch_number: "",
  unit_name: "",
  counted_packs: 0,
  factor: 1,
  system_quantity: 0,
  actual_quantity: 0,
  difference: 0,
  reason: "inventory",
  notes: ""
});

// ===== Toast =====
const toast = reactive({ show: false, message: '', type: 'success' });
const showToast = (message, type = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => toast.show = false, 4000);
};

// ===== Delete Batch =====
const confirmDeleteBatch = async (batch, item) => {
  // ✅ حماية: تحقق من وجود الدفعة
  if (!batch || !batch.id) {
    showToast('لا توجد دفعة مرتبطة بهذا المخزون', 'error');
    return;
  }

  try {
    // 1. فحص إمكانية الحذف
    const checkRes = await axios.get(`${API_BASE}/inventory/cleanup/batch/${batch.id}/check`);
    const check = checkRes.data;

    if (!check.can_delete) {
      showToast(
        check.reason === 'HAS_SALES'
          ? `لا يمكن الحذف — تم البيع من هذه الدفعة (${check.sales_count} عملية)`
          : `لا يمكن الحذف — توجد ${check.refunds_count} مرتجعات مرتبطة`,
        'error'
      );
      return;
    }

    // 2. تأكيد مزدوج
    const confirmed = confirm(
      `⚠️ تحذير: حذف نهائي\n\n` +
      `الدواء: ${check.batch.medicine}\n` +
      `الدفعة: ${check.batch.batch_number}\n` +
      `الكمية: ${check.batch.quantity}\n\n` +
      `سيتم حذف:\n` +
      `- الدفعة\n` +
      `- جميع الأسعار المرتبطة\n` +
      `- جميع سجلات المخزون\n\n` +
      `هل أنت متأكد؟`
    );

    if (!confirmed) return;

    // 3. تأكيد إضافي بالكتابة
    const typed = prompt(`اكتب "حذف" للتأكيد النهائي:`);
    if (typed !== 'حذف') {
      showToast('تم إلغاء العملية', 'info');
      return;
    }

    // 4. الحذف
    const res = await axios.post(`${API_BASE}/inventory/cleanup/batch/${batch.id}`);
    showToast(res.data.message || 'تم الحذف بنجاح', 'success');

    // ✅ إعادة تحميل المخزون
    await load();

  } catch (e) {
    console.error('Delete batch error:', e);
    showToast(e.response?.data?.message || 'تعذر الحذف', 'error');
  }
};

// ===== Computed for Filters =====
const buildParams = () => ({
  search: search.value,
  status: status.value,
  branch_id: selectedBranch.value,
  page: pagination.value.currentPage || 1
});

// ===== Methods =====
const load = async () => {
  await refreshInventories(buildParams());
};

const onSearch = () => {
  load();
};

const onFilterChange = () => {
  load();
};

const applyFilters = () => {
  load();
};

const goToPage = async (page) => {
  if (page < 1 || page > pagination.value.lastPage) return;
  await refreshInventories({ ...buildParams(), page });
};

// ===== Inventory Status =====
const inventoryStatus = (item) => {
  if (Number(item.quantity) <= 0) return "نافد";
  if (Number(item.quantity) <= Number(item.minimum_quantity)) return "منخفض";
  return "متوفر";
};

const statusColor = (item) => {
  if (Number(item.quantity) <= 0) return "bg-red-100 text-red-700";
  if (Number(item.quantity) <= Number(item.minimum_quantity)) return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
};

// ===== Adjustment Logic =====
watch(
  [() => adjustment.counted_packs, () => adjustment.factor],
  ([newPacks, newFactor]) => {
    adjustment.actual_quantity = Number(newPacks) * Number(newFactor);
  }
);

watch(
  () => adjustment.actual_quantity,
  (newVal) => {
    adjustment.difference = Number(newVal) - Number(adjustment.system_quantity);
  }
);

const openAdjustment = (item) => {
  const activeBatch = item.medicine?.batches?.[0] || {};
  const activeUnit = item.medicine?.units?.[0] || {};

  adjustment.inventory_id = item.id;
  adjustment.medicine_id = item.medicine_id;
  adjustment.medicine_name = item.medicine?.name || "";
  adjustment.batch_number = activeBatch.batch_number || "-";
  adjustment.factor = Number(activeUnit.factor) || 1;
  adjustment.system_quantity = Number(item.quantity);
  adjustment.counted_packs = 0;
  adjustment.actual_quantity = Number(item.quantity);
  adjustment.difference = 0;
  adjustment.reason = "inventory";
  adjustment.notes = "";

  showAdjustmentModal.value = true;
};

const closeAdjustment = () => {
  showAdjustmentModal.value = false;
};

const saveAdjustment = async () => {
  saving.value = true;
  try {
    await InventoryService.adjust({
      medicine_id: adjustment.medicine_id,
      branch_id: selectedBranch.value || 1,
      purchased_quantity: adjustment.actual_quantity,
      factor: adjustment.factor,
      type: 'adjustment',
      notes: adjustment.notes
    });
    closeAdjustment();
    await load();
    showToast('تم تحديث المخزون بنجاح', 'success');
  } catch (e) {
    showToast('حدث خطأ أثناء التعديل', 'error');
    console.error(e);
  } finally {
    saving.value = false;
  }
};

// ===== Lifecycle =====
onMounted(async () => {
  console.log('🟢 onMounted - جلب المخزون...');
  if (!branches.value.length) await branchStore.fetchBranches();
  await load();
  console.log('✅ onMounted - المخزون بعد الجلب:', inventories.value.length);
});

onActivated(async () => {
  console.log('🟢 onActivated - تحديث المخزون (force refresh)...');
  await load();
  console.log('✅ onActivated - المخزون بعد التحديث:', inventories.value.length);

  const searchData = localStorage.getItem('search_result_data');
  if (searchData) {
    try {
      const data = JSON.parse(searchData);
      if (data.type === 'دفعة (LOT)') {
        // ✅ التصحيح: استخدام search.value بدل filters.batch_number
        search.value = data.name;
        applyFilters();
        showToast(`تم العثور على الدفعة: ${data.name}`, 'success');
      }
    } catch (e) {
      console.error('Failed to parse search data:', e);
    }
    localStorage.removeItem('search_result_data');
  }
});
</script>

<style scoped>
/* أنماط إضافية حسب الحاجة */
</style>