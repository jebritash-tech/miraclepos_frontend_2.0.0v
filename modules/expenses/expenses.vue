<!-- modules/expenses/expenses.vue -->
<template>
  <div class="p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen" dir="rtl">

    <!-- ============================================================
         Header
         ============================================================ -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">إدارة المصروفات</h2>
          <p class="text-sm text-slate-500 mt-0.5">
            مصروفات الورديات (تؤثر على الدرج) + مصروفات إدارية مستقلة.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button @click="refresh" :disabled="loading"
                class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-bold disabled:opacity-50">
          <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          تحديث
        </button>
        <button @click="openAddModal"
                class="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/25 transition-all flex items-center gap-2 text-xs font-bold">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          مصروف إداري جديد
        </button>
      </div>
    </div>

    <!-- ============================================================
         Global Stats Cards (غير مفلترة)
         ============================================================ -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">إجمالي المصروفات</span>
          <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <i class="fas fa-coins text-sm"></i>
          </div>
        </div>
        <div class="text-2xl font-extrabold text-rose-700 font-mono">{{ money(statsGlobal.total) }}</div>
        <div class="text-xs text-slate-400 mt-1">{{ statsGlobal.count }} مصروف</div>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">مصروفات الورديات</span>
          <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <i class="fas fa-cash-register text-sm"></i>
          </div>
        </div>
        <div class="text-2xl font-extrabold text-amber-700 font-mono">{{ money(statsGlobal.shift_total) }}</div>
        <div class="text-xs text-slate-400 mt-1">{{ statsGlobal.shift_count }} مصروف</div>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">مصروفات إدارية</span>
          <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <i class="fas fa-building text-sm"></i>
          </div>
        </div>
        <div class="text-2xl font-extrabold text-purple-700 font-mono">{{ money(statsGlobal.admin_total) }}</div>
        <div class="text-xs text-slate-400 mt-1">{{ statsGlobal.admin_count }} مصروف</div>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">نسبة الإداري</span>
          <div class="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
            <i class="fas fa-percent text-sm"></i>
          </div>
        </div>
        <div class="text-2xl font-extrabold text-slate-800 font-mono">
          {{ statsGlobal.total > 0 ? ((statsGlobal.admin_total / statsGlobal.total) * 100).toFixed(1) : '0.0' }}%
        </div>
        <div class="text-xs text-slate-400 mt-1">من إجمالي المصروفات</div>
      </div>
    </div>

    <!-- ============================================================
         Filters
         ============================================================ -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Type Tabs -->
        <div class="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            @click="setFilter('all')"
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all"
            :class="filterType === 'all'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'"
          >
            الكل ({{ statsGlobal.count }})
          </button>
          <button
            @click="setFilter('shift')"
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            :class="filterType === 'shift'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'"
          >
            <i class="fas fa-cash-register text-[10px]"></i>
            الورديات ({{ statsGlobal.shift_count }})
          </button>
          <button
            @click="setFilter('admin')"
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            :class="filterType === 'admin'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'"
          >
            <i class="fas fa-building text-[10px]"></i>
            إدارية ({{ statsGlobal.admin_count }})
          </button>
        </div>

        <!-- Search -->
        <div class="flex-1 min-w-[200px] relative">
          <span class="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
            <i class="fas fa-search text-sm"></i>
          </span>
          <input
            v-model="search"
            @input="debouncedSearch"
            type="text"
            placeholder="ابحث بالبيان أو المسؤول أو الملاحظات..."
            class="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          >
        </div>

        <!-- Filtered Total -->
        <div class="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
          <div class="text-[10px] text-slate-500 font-bold uppercase">المعروض</div>
          <div class="font-bold text-slate-800 font-mono text-sm">
            {{ money(stats.total) }}
            <span class="text-xs text-slate-400 font-normal">({{ stats.count }})</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================
         Table
         ============================================================ -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-right border-collapse">
          <thead>
            <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <th class="p-4">#</th>
              <th class="p-4">النوع</th>
              <th class="p-4">البيان</th>
              <th class="p-4">المبلغ</th>
              <th class="p-4">المسؤول</th>
              <th class="p-4">الوردية</th>
              <th class="p-4">التاريخ</th>
              <th class="p-4">ملاحظات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
            <tr v-if="loading && expenses.length === 0">
              <td colspan="8" class="text-center py-12 text-slate-400">
                <i class="fas fa-spinner fa-spin text-xl mb-2 block"></i>
                جاري التحميل...
              </td>
            </tr>
            <tr v-else-if="!expenses || expenses.length === 0">
              <td colspan="8" class="text-center py-12 text-slate-400">
                <i class="fas fa-inbox text-3xl mb-2 block text-slate-300"></i>
                لا توجد مصروفات مطابقة.
              </td>
            </tr>
            <tr v-for="expense in expenses" :key="expense.id" class="hover:bg-rose-50/30 transition-colors">
              <td class="p-4 font-mono font-bold text-slate-700 text-xs">{{ expense.id }}</td>

              <!-- Type badge -->
              <td class="p-4">
                <span v-if="expense.shift_id === null"
                      class="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                  <i class="fas fa-building text-[10px]"></i>
                  إداري
                </span>
                <span v-else
                      class="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                  <i class="fas fa-cash-register text-[10px]"></i>
                  وردية
                </span>
              </td>

              <td class="p-4 font-semibold text-slate-800">{{ expense.title }}</td>
              <td class="p-4 font-mono font-bold text-rose-600">
                {{ money(expense.amount) }}
                <span class="text-xs font-normal text-slate-400">ج.س</span>
              </td>
              <td class="p-4 text-slate-700 text-xs">{{ expense.user?.name || '---' }}</td>

              <!-- Shift # -->
              <td class="p-4">
                <span v-if="expense.shift_id" class="font-mono text-slate-600 text-xs">#{{ expense.shift_id }}</span>
                <span v-else class="text-slate-400 text-xs italic">—</span>
              </td>

              <td class="p-4 font-mono text-xs text-slate-500">
                {{ formatDate(expense.created_at) }}
              </td>
              <td class="p-4 text-xs text-slate-500 max-w-xs truncate">
                {{ expense.notes || '---' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================================
         Add Modal
         ============================================================ -->
    <div v-if="showModal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div class="flex justify-between items-center border-b border-slate-100 pb-4">
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i class="fas fa-building text-purple-600"></i>
            إضافة مصروف إداري
          </h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
        </div>

        <div class="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800 flex items-start gap-2">
          <i class="fas fa-info-circle mt-0.5"></i>
          <span>
            هذا المصروف <strong>إداري</strong> ولن يُسجَّل على أي وردية.
            بهذا لا يؤثر على تقارير الورديات.
          </span>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">البيان</label>
            <input type="text" v-model="form.title"
                   class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                   placeholder="مثال: إيجار، رواتب إدارية، صيانة...">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">المبلغ</label>
            <input type="number" v-model.number="form.amount" min="1"
                   class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-lg font-bold"
                   placeholder="أدخل المبلغ...">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">ملاحظات (اختياري)</label>
            <textarea v-model="form.notes" rows="3"
                      class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="ملاحظات إضافية..."></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button @click="showModal = false"
                  class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all">
            إلغاء
          </button>
          <button @click="submitExpense" :disabled="saving"
                  class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-all">
            {{ saving ? 'جاري الحفظ...' : 'حفظ المصروف' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================
         Toast
         ============================================================ -->
    <div v-if="toast.show"
         class="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-lg max-w-md"
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
        <span class="font-medium text-sm">{{ toast.message }}</span>
        <button @click="toast.show = false" class="mr-auto text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated } from 'vue';
import { useExpenseStore } from '../../src/js/stores/index.js';
import { storeToRefs } from 'pinia';
import { API_BASE } from '../../src/js/config.js';
import axios from 'axios';

/* ============================================================
   Store
   ============================================================ */
const expenseStore = useExpenseStore();
const { expenses, loading, stats, statsGlobal } = storeToRefs(expenseStore);

/* ============================================================
   Local State
   ============================================================ */
const filterType = ref('all');   // all | shift | admin
const search = ref('');

const showModal = ref(false);
const form = ref({ title: '', amount: '', notes: '' });
const saving = ref(false);

const toast = reactive({ show: false, message: '', type: 'success' });
const showToast = (message, type = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => toast.show = false, 4000);
};

/* ============================================================
   Helpers
   ============================================================ */
const money = (v) => Number(v || 0).toLocaleString('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hour = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${mins}`;
  } catch {
    return iso;
  }
};

/* ============================================================
   Fetch
   ============================================================ */
const buildParams = () => {
  const params = {};
  if (filterType.value !== 'all') params.type = filterType.value;
  if (search.value.trim()) params.search = search.value.trim();
  return params;
};

const fetchExpenses = async ({ force = false } = {}) => {
  await expenseStore.fetchExpenses(buildParams(), force);
};

const refresh = () => fetchExpenses({ force: true });

/* ============================================================
   Filters
   ============================================================ */
const setFilter = (type) => {
  if (filterType.value === type) return;
  filterType.value = type;
  fetchExpenses({ force: true });
};

let searchTimer = null;
const debouncedSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchExpenses({ force: true }), 400);
};

/* ============================================================
   Create Expense (إداري)
   ============================================================ */
const openAddModal = () => {
  form.value = { title: '', amount: '', notes: '' };
  showModal.value = true;
};

const submitExpense = async () => {
  if (!form.value.title || !form.value.amount || form.value.amount <= 0) {
    showToast('الرجاء إدخال البيان والمبلغ بشكل صحيح', 'warning');
    return;
  }

  saving.value = true;
  try {
    // ✅ لا نرسل shift_id → الأدمن يُنشئ مصروفاً إدارياً (بدون وردية)
    await axios.post(`${API_BASE}/expenses`, {
      title: form.value.title,
      amount: form.value.amount,
      notes: form.value.notes || null,
      // shift_id غير مُرسَل — Backend يعرف أن المستخدم admin
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      params: { _ts: Date.now() },
    });

    showModal.value = false;
    form.value = { title: '', amount: '', notes: '' };

    // refresh كامل
    await fetchExpenses({ force: true });

    showToast('تم تسجيل المصروف الإداري بنجاح', 'success');
  } catch (e) {
    console.error(e);
    showToast(e.response?.data?.message || 'تعذر حفظ المصروف', 'error');
  } finally {
    saving.value = false;
  }
};

/* ============================================================
   Lifecycle
   ============================================================ */
onMounted(async () => {
  await fetchExpenses({ force: true });
});

onActivated(async () => {
  await fetchExpenses({ force: true });
});
</script>

<style scoped>
/* لا حاجة لأنماط إضافية */
</style>