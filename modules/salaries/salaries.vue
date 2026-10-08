<!-- modules/salaries/salaries.vue -->
<template>
  <div class="space-y-6" dir="rtl">
    <!-- ================================= -->
    <!-- Header -->
    <!-- ================================= -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">إدارة الرواتب</h2>
        <p class="text-sm text-slate-500">إدارة رواتب الموظفين وصرفها.</p>
      </div>
      <div class="flex gap-2">
        <button @click="generateMonth" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition" id="generateSalariesBtn">
          إنشاء رواتب الشهر
        </button>
        <button @click="refreshSalaries" class="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-medium transition">
          تحديث
        </button>
      </div>
    </div>

    <!-- ================================= -->
    <!-- Dashboard -->
    <!-- ================================= -->
    <div class="grid grid-cols-4 gap-4" id="salary-stats-section">
      <div class="bg-white rounded-xl shadow p-4">
        <div class="text-slate-500 text-sm">إجمالي الرواتب</div>
        <div class="text-2xl font-bold text-slate-800">{{ dashboard.total }}</div>
      </div>
      <div class="bg-white rounded-xl shadow p-4">
        <div class="text-slate-500 text-sm">المدفوع</div>
        <div class="text-2xl font-bold text-emerald-600">{{ dashboard.paid }}</div>
      </div>
      <div class="bg-white rounded-xl shadow p-4">
        <div class="text-slate-500 text-sm">المتبقي</div>
        <div class="text-2xl font-bold text-rose-600">{{ dashboard.pending }}</div>
      </div>
      <div class="bg-white rounded-xl shadow p-4">
        <div class="text-slate-500 text-sm">عدد الرواتب</div>
        <div class="text-2xl font-bold text-slate-800">{{ salaries.length }}</div>
      </div>
    </div>

    <!-- ================================= -->
    <!-- Filters -->
    <!-- ================================= -->
    <div class="bg-white rounded-xl shadow p-4" id="salary-filters-section">
      <div class="grid grid-cols-4 gap-4">
        <select v-model="filters.month" class="border rounded-lg p-2">
          <option v-for="m in 12" :value="m">{{ m }}</option>
        </select>
        <input type="number" v-model="filters.year" class="border rounded-lg p-2" />
        <select v-model="filters.status" class="border rounded-lg p-2">
          <option value="">الكل</option>
          <option value="pending">غير مدفوع</option>
          <option value="paid">مدفوع</option>
        </select>
        <button @click="applyFilters" class="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition">
          بحث
        </button>
      </div>
    </div>

    <!-- ================================= -->
    <!-- Table -->
    <!-- ================================= -->
    <div class="bg-white rounded-xl shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50">
          <tr class="text-slate-600 text-xs font-bold uppercase tracking-wider">
            <th class="p-4 text-right">#</th>
            <th class="p-4 text-right">الموظف</th>
            <th class="p-4 text-right">الأساسي</th>
            <th class="p-4 text-right">الإضافات</th>
            <th class="p-4 text-right">الخصومات</th>
            <th class="p-4 text-right">الصافي</th>
            <th class="p-4 text-right">الحالة</th>
            <th class="p-4 text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-sm">
          <tr v-if="loading && salaries.length === 0">
            <td colspan="8" class="text-center py-12 text-slate-400">جاري التحميل...</td>
          </tr>
          <tr v-else-if="!salaries || salaries.length === 0">
            <td colspan="8" class="text-center py-12 text-slate-400">لا توجد رواتب مسجلة</td>
          </tr>
          <tr v-for="item in salaries" :key="item.id" @click="selected = item" class="cursor-pointer hover:bg-slate-50 transition">
            <td class="p-4 font-mono font-bold text-slate-700">{{ item.id }}</td>
            <td class="p-4 font-semibold text-slate-800">{{ item.user?.name }}</td>
            <td class="p-4 font-mono text-slate-600">{{ item.basic_salary }}</td>
            <td class="p-4 font-mono text-emerald-600">{{ item.allowances }}</td>
            <td class="p-4 font-mono text-rose-600">{{ item.deductions }}</td>
            <td class="p-4 font-mono font-bold text-slate-800">{{ item.net_salary }}</td>
            <td class="p-4">
              <span :class="item.status == 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'" class="px-2 py-1 rounded font-bold text-xs">
                {{ item.status == 'paid' ? 'مدفوع' : 'غير مدفوع' }}
              </span>
            </td>
            <td class="p-4 text-center">
              <button @click.stop="editSalary(item)" class="text-blue-600 hover:text-blue-800 px-2 py-1" id="salary-edit-btn">✏️</button>
              <button v-if="item.status == 'pending'" @click.stop="paySalary(item)" class="text-emerald-600 hover:text-emerald-800 px-2 py-1" id="salary-pay-btn" >💰</button>
              <button @click.stop="deleteSalary(item.id)" class="text-rose-600 hover:text-rose-800 px-2 py-1">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ================================= -->
    <!-- Details -->
    <!-- ================================= -->
    <div v-if="selected" class="bg-white rounded-xl shadow p-6">
      <h3 class="font-bold text-slate-800 text-lg mb-4">تفاصيل الراتب</h3>
      <div class="grid grid-cols-2 gap-4">
        <div class="text-slate-500">الموظف</div>
        <div class="font-semibold text-slate-800">{{ selected.user?.name }}</div>
        <div class="text-slate-500">الشهر</div>
        <div class="font-semibold text-slate-800">{{ selected.month }}/{{ selected.year }}</div>
        <div class="text-slate-500">الأساسي</div>
        <div class="font-semibold text-slate-800">{{ selected.basic_salary }}</div>
        <div class="text-slate-500">الإضافات</div>
        <div class="font-semibold text-emerald-600">{{ selected.allowances }}</div>
        <div class="text-slate-500">الخصومات</div>
        <div class="font-semibold text-rose-600">{{ selected.deductions }}</div>
        <div class="text-slate-500 font-bold">الصافي</div>
        <div class="font-bold text-slate-800">{{ selected.net_salary }}</div>
      </div>
    </div>

    <!-- ================================= -->
    <!-- Edit Salary Modal -->
    <!-- ================================= -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-xl">
        <div class="border-b p-4">
          <h3 class="font-bold text-lg text-slate-800">تعديل الراتب</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="text-sm text-slate-500">الراتب الأساسي</label>
            <input class="w-full border rounded-lg p-3 bg-slate-100" v-model="salary.basic_salary" disabled />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-slate-500">الإضافات</label>
              <input type="number" class="w-full border rounded-lg p-3" v-model.number="salary.allowances" />
            </div>
            <div>
              <label class="text-sm text-slate-500">الخصومات</label>
              <input type="number" class="w-full border rounded-lg p-3" v-model.number="salary.deductions" />
            </div>
          </div>
          <div>
            <label class="text-sm text-slate-500">الصافي</label>
            <input class="w-full border rounded-lg p-3 bg-slate-100" :value="Number(salary.basic_salary) + Number(salary.allowances) - Number(salary.deductions)" disabled />
          </div>
        </div>
        <div class="border-t p-4 flex justify-end gap-2">
          <button @click="showEditModal = false" class="px-5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">إلغاء</button>
          <button @click="saveSalary" :disabled="saving" class="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium transition">
            {{ saving ? 'جارٍ الحفظ...' : 'حفظ' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ================================= -->
    <!-- Pay Salary Modal -->
    <!-- ================================= -->
    <div v-if="showPaymentModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-xl">
        <div class="border-b p-4">
          <h3 class="font-bold text-lg text-slate-800">صرف الراتب</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="text-sm text-slate-500">طريقة الدفع</label>
            <select v-model="payment.payment_method" class="w-full border rounded-lg p-3">
              <option value="cash">نقدي</option>
              <option value="bank">بنكي</option>
            </select>
          </div>
          <template v-if="payment.payment_method == 'bank'">
            <div>
              <label class="text-sm text-slate-500">اسم البنك</label>
              <input class="w-full border rounded-lg p-3" v-model="payment.bank_name" />
            </div>
            <div>
              <label class="text-sm text-slate-500">رقم التحويل</label>
              <input class="w-full border rounded-lg p-3" v-model="payment.bank_reference" />
            </div>
          </template>
          <div>
            <label class="text-sm text-slate-500">ملاحظات</label>
            <textarea rows="3" class="w-full border rounded-lg p-3" v-model="payment.notes"></textarea>
          </div>
        </div>
        <div class="border-t p-4 flex justify-end gap-2">
          <button @click="showPaymentModal = false" class="px-5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">إلغاء</button>
          <button @click="savePayment" :disabled="saving" class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium transition">
            {{ saving ? 'جارٍ الصرف...' : 'صرف الراتب' }}
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
import { ref, reactive, onMounted, onActivated } from 'vue';
import { useSalaryStore } from '../../src/js/stores/index.js';
import { storeToRefs } from 'pinia';
import { API_BASE } from '../../src/js/config.js';
import SalaryService from '../../src/js/services/salaries.service.js';
import axios from 'axios';

// ===== Store =====
const salaryStore = useSalaryStore();
const { salaries, loading, dashboard, pagination } = storeToRefs(salaryStore);
const { refreshSalaries, refreshDashboard } = salaryStore;

// ===== Local State =====
const selected = ref(null);
const showEditModal = ref(false);
const showPaymentModal = ref(false);
const saving = ref(false);
const today = new Date();

const filters = reactive({
  month: today.getMonth() + 1,
  year: today.getFullYear(),
  status: ''
});

const salary = reactive({
  id: null,
  user_id: null,
  month: today.getMonth() + 1,
  year: today.getFullYear(),
  allowances: 0,
  deductions: 0,
  basic_salary: 0,
  net_salary: 0
});

const payment = reactive({
  salary_id: null,
  payment_method: 'cash',
  bank_name: '',
  bank_reference: '',
  notes: ''
});

// ===== Toast =====
const toast = reactive({ show: false, message: '', type: 'success' });
const showToast = (message, type = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => toast.show = false, 4000);
};

// ===== Methods =====
const applyFilters = async () => {
  console.log('🔵 تطبيق الفلاتر:', filters);
  await refreshSalaries(filters);
  console.log('✅ الرواتب بعد التصفية:', salaries.value);
};

// ===== تعديل دالة generateMonth =====
const generateMonth = async () => {
  if (!confirm('إنشاء رواتب هذا الشهر؟')) return;
  saving.value = true;
  try {
    await axios.post(`${API_BASE}/salaries/generate`, {
        month: filters.month,
        year: filters.year
      },
      {
        headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
        },
        params: { _ts: Date.now() }  // ← cache buster
    },
  );
    showToast('تم إنشاء رواتب الشهر بنجاح', 'success');
    
    // ✅ تحديث الجدول والإحصائيات بعد الإنشاء
    await refreshSalaries(filters);
    await refreshDashboard();
    
    console.log('✅ الرواتب بعد الإنشاء:', salaries.value);
    console.log('✅ الإحصائيات بعد الإنشاء:', dashboard.value);
  } catch (e) {
    showToast('حدث خطأ أثناء إنشاء الرواتب', 'error');
    console.error(e);
  } finally {
    saving.value = false;
  }
};

const editSalary = (item) => {
  Object.assign(salary, JSON.parse(JSON.stringify(item)));
  showEditModal.value = true;
};

const saveSalary = async () => {
  saving.value = true;
  try {
    await SalaryService.update(salary.id, salary);
    showEditModal.value = false;
    await refreshSalaries(filters);
    await refreshDashboard();
    showToast('تم تحديث الراتب', 'success');
  } catch (e) {
    showToast('حدث خطأ أثناء تحديث الراتب', 'error');
    console.error(e);
  } finally {
    saving.value = false;
  }
};

const paySalary = (item) => {
  payment.salary_id = item.id;
  payment.payment_method = 'cash';
  payment.bank_name = '';
  payment.bank_reference = '';
  payment.notes = '';
  showPaymentModal.value = true;
};

const savePayment = async () => {
  saving.value = true;
  try {
    await SalaryService.pay(payment.salary_id, payment);
    showPaymentModal.value = false;
    await refreshSalaries(filters);
    await refreshDashboard();
    showToast('تم صرف الراتب', 'success');
  } catch (e) {
    showToast('حدث خطأ أثناء صرف الراتب', 'error');
    console.error(e);
  } finally {
    saving.value = false;
  }
};

const deleteSalary = async (id) => {
  if (!confirm('حذف الراتب؟')) return;
  try {
    await SalaryService.delete(id);
    await refreshSalaries(filters);
    await refreshDashboard();
    showToast('تم حذف الراتب', 'success');
  } catch (e) {
    showToast('حدث خطأ أثناء الحذف', 'error');
    console.error(e);
  }
};

// ===== Lifecycle =====
onMounted(async () => {
  console.log('🟢 onMounted - جلب الرواتب...');
  await refreshSalaries(filters);
  await refreshDashboard();
  console.log('✅ onMounted - الرواتب بعد الجلب:', salaries.value);
});

onActivated(async () => {
  console.log('🟢 onActivated - جلب الرواتب (force refresh)...');
  await refreshSalaries(filters);
  await refreshDashboard();
  console.log('✅ onActivated - الرواتب بعد الجلب:', salaries.value);
});
</script>