<!-- modules/shifts/shifts.vue -->
<template>
  <div class="p-6 lg:p-8 space-y-8 bg-slate-50/50 min-h-screen" dir="rtl">

    <!-- ================= Header & Stats ================= -->
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">إدارة الورديات</h2>
          <p class="text-sm text-slate-500 mt-0.5">متابعة ورديات العمل، الحركة النقدية، والأداء العام.</p>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <div class="text-slate-400 text-xs font-bold uppercase tracking-wider">الورديات المفتوحة</div>
            <div class="text-3xl font-extrabold text-emerald-600 font-mono">{{ stats.open }}</div>
          </div>
          <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <div class="text-slate-400 text-xs font-bold uppercase tracking-wider">الورديات المغلقة</div>
            <div class="text-3xl font-extrabold text-slate-800 font-mono">{{ stats.closed }}</div>
          </div>
          <div class="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <div class="text-slate-400 text-xs font-bold uppercase tracking-wider">المبيعات النقدية</div>
            <div class="text-3xl font-extrabold text-emerald-600 font-mono">{{ money(stats.cashSales) }}</div>
          </div>
          <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <div class="text-slate-400 text-xs font-bold uppercase tracking-wider">الرصيد المتوقع</div>
            <div class="text-3xl font-extrabold text-blue-600 font-mono">{{ money(stats.expectedCash) }}</div>
          </div>
          <div class="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= Filters ================= -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6" id="shifts-filters-section">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">بحث</label>
          <input v-model="filters.search" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" placeholder="اسم الموظف...">
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">الحالة</label>
          <select v-model="filters.status" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
            <option value="">كل الحالات</option>
            <option value="open">مفتوحة</option>
            <option value="closed">مغلقة</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">من تاريخ</label>
          <input type="date" v-model="filters.from" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">إلى تاريخ</label>
          <input type="date" v-model="filters.to" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
        </div>
        <div class="flex items-end">
          <button @click="applyFilters" class="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-150 flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            تحديث البيانات
          </button>
        </div>
      </div>
    </div>

    <!-- ================= Shifts Table ================= -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" >
      <div class="overflow-x-auto">
        <table class="w-full text-right border-collapse" id="shifts-table">
          <thead>
            <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <th class="p-4.5">#</th>
              <th class="p-4.5">الموظف</th>
              <th class="p-4.5">الفرع</th>
              <th class="p-4.5">فتح</th>
              <th class="p-4.5">إغلاق</th>
              <th class="p-4.5">نقدي</th>
              <th class="p-4.5">بطاقات</th>
              <th class="p-4.5">المتوقع</th>
              <th class="p-4.5">الفرق</th>
              <th class="p-4.5">الحالة</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
            <tr v-if="loading && shifts.length === 0">
              <td colspan="10" class="text-center py-12 text-slate-400">جاري التحميل...</td>
            </tr>
            <tr v-else-if="!shifts || shifts.length === 0">
              <td colspan="10" class="text-center py-12 text-slate-400">لا توجد ورديات متاحة للعرض.</td>
            </tr>
            <tr v-for="shift in filteredShifts" :key="shift.id" @click="selectShift(shift)" class="hover:bg-emerald-50/40 cursor-pointer transition-colors group" :class="selectedShiftId == shift.id ? 'bg-emerald-50/80' : ''">
              <td class="p-4.5 font-mono font-bold text-slate-700">{{ shift.id }}</td>
              <td class="p-4.5 font-semibold text-slate-800">{{ shift.user?.name }}</td>
              <td class="p-4.5 text-slate-600">{{ shift.branch?.name }}</td>
              <td class="p-4.5 font-mono text-xs text-slate-500">{{ formatDate(shift.opened_at) }}</td>
              <td class="p-4.5 font-mono text-xs text-slate-500">{{ shift.closed_at ? formatDate(shift.closed_at) : '-' }}</td>
              <td class="p-4.5 font-mono font-semibold text-emerald-600">{{ money(shift.cash_sales) }}</td>
              <td class="p-4.5 font-mono font-semibold text-blue-600">{{ money(shift.card_sales) }}</td>
              <td class="p-4.5 font-mono text-slate-700">{{ money(shift.expected_cash) }}</td>
              <td class="p-4.5 font-mono font-bold" :class="{
                'text-rose-600': shift.difference < 0,
                'text-emerald-600': shift.difference > 0,
                'text-slate-500': shift.difference == 0 || !shift.difference
              }">
                {{ shift.difference ?? '-' }}
              </td>
              <td class="p-4.5">
                <span v-if="shift.status == 'open'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  مفتوحة
                </span>
                <span v-else class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                  مغلقة
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex justify-between items-center p-4.5 border-t border-slate-100 bg-slate-50/50">
        <button class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-all" @click="goToPage(pagination.currentPage - 1)" :disabled="pagination.currentPage == 1">
          ◀ السابق
        </button>
        <div class="text-sm font-semibold text-slate-600">
          صفحة <span class="text-emerald-600">{{ pagination.currentPage }}</span> من {{ pagination.lastPage }}
        </div>
        <button class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-all" @click="goToPage(pagination.currentPage + 1)" :disabled="pagination.currentPage == pagination.lastPage">
          التالي ▶
        </button>
      </div>
    </div>

    <!-- ================= Selected Shift Details ================= -->
    <div v-if="selectedShift" class="space-y-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6 lg:p-8" id="shift-details-section">
      <div class="bg-gradient-to-l from-emerald-600 to-emerald-700 text-white px-6 py-5 rounded-2xl flex justify-between items-center shadow-lg shadow-emerald-600/10">
        <div>
          <h3 class="text-xl font-extrabold tracking-tight">الوردية #{{ selectedShift.id }}</h3>
          <div class="text-xs text-emerald-100/90 font-medium">{{ selectedShift.user?.name }} &bull; {{ selectedShift.branch?.name }}</div>
        </div>
        <button @click="selectedShift = null" class="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10">✕</button>
      </div>

      <!-- Shift Metrics Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-slate-50/70 border border-slate-100 rounded-2xl p-5">
          <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">الرصيد الافتتاحي</div>
          <div class="text-xl font-extrabold text-slate-800 font-mono">{{ money(selectedShift.opening_cash) }}</div>
        </div>
        <div class="bg-emerald-50/60 border border-emerald-100/60 rounded-2xl p-5">
          <div class="text-emerald-600/80 text-xs font-bold uppercase tracking-wider mb-1">المبيعات النقدية</div>
          <div class="text-xl font-extrabold text-emerald-700 font-mono">{{ money(selectedShift.cash_sales) }}</div>
        </div>
        <div class="bg-blue-50/60 border border-blue-100/60 rounded-2xl p-5">
          <div class="text-blue-600/80 text-xs font-bold uppercase tracking-wider mb-1">مبيعات البطاقات</div>
          <div class="text-xl font-extrabold text-blue-700 font-mono">{{ money(selectedShift.card_sales) }}</div>
        </div>
        <div class="bg-amber-50/60 border border-amber-100/60 rounded-2xl p-5">
          <div class="text-amber-600/80 text-xs font-bold uppercase tracking-wider mb-1">عدد الفواتير</div>
          <div class="text-xl font-extrabold text-amber-800 font-mono">{{ selectedShift.sales_count }}</div>
        </div>
        <div class="bg-rose-50/60 border border-rose-100/60 rounded-2xl p-5">
          <div class="text-rose-600/80 text-xs font-bold uppercase tracking-wider mb-1">المصروفات</div>
          <div class="text-xl font-extrabold text-rose-600 font-mono">{{ money(selectedShift.expenses_amount) }}</div>
        </div>
        <div class="bg-yellow-50/60 border border-yellow-100/60 rounded-2xl p-5">
          <div class="text-yellow-600/80 text-xs font-bold uppercase tracking-wider mb-1">السحوبات</div>
          <div class="text-xl font-extrabold text-yellow-700 font-mono">{{ money(selectedShift.withdraw_amount) }}</div>
        </div>
        <div class="bg-purple-50/60 border border-purple-100/60 rounded-2xl p-5">
          <div class="text-purple-600/80 text-xs font-bold uppercase tracking-wider mb-1">سداد الديون</div>
          <div class="text-xl font-extrabold text-purple-700 font-mono">{{ money(selectedShift.debts_amount) }}</div>
        </div>
        <div class="bg-cyan-50/60 border border-cyan-100/60 rounded-2xl p-5">
          <div class="text-cyan-600/80 text-xs font-bold uppercase tracking-wider mb-1">المرتجعات</div>
          <div class="text-xl font-extrabold text-cyan-800 font-mono">{{ money(selectedShift.refund_amount) }}</div>
        </div>
      </div>

      <!-- Balances Summary -->
      <div class="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-right">
          <div>
            <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">الرصيد المتوقع</div>
            <div class="text-2xl font-extrabold text-slate-800 font-mono">{{ money(selectedShift.expected_cash) }}</div>
          </div>
          <div class="p-3 border-y md:border-y-0 md:border-x border-slate-200/60">
            <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">الرصيد الفعلي</div>
            <div class="text-2xl font-extrabold text-slate-800 font-mono">{{ money(selectedShift.closing_cash) }}</div>
          </div>
          <div>
            <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">الفرق النهائي</div>
            <div class="text-2xl font-extrabold font-mono" :class="{
              'text-rose-600': selectedShift.difference < 0,
              'text-emerald-600': selectedShift.difference > 0,
              'text-slate-700': selectedShift.difference == 0 || !selectedShift.difference
            }">
              {{ money(selectedShift.difference) }}
            </div>
          </div>
        </div>
      </div>
    </div>

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
    import { useShiftStore, useBranchStore } from '../../src/js/stores/index.js';
    import { storeToRefs } from 'pinia';
    import { API_BASE } from '../../src/js/config.js';
    import ShiftService from '../../src/js/services/shift.service.js';
    import axios from 'axios';
   
    // ===== Stores =====
    const shiftStore = useShiftStore();
    const branchStore = useBranchStore();
    const { shifts, loading, pagination } = storeToRefs(shiftStore);
    const { refreshShifts } = shiftStore;
    const { branches } = storeToRefs(branchStore);

    // ===== Local State =====
    const selectedShift = ref(null);
    const selectedShiftId = ref(null);
    const activities = ref([]);
    const loadingDetails = ref(false);


   // ===== Toast =====
    const toast = reactive({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => {
    toast.message = message;
    toast.type = type;
    toast.show = true;
    setTimeout(() => toast.show = false, 4000);
    };

   
    const selectedDebt= ref(null);
    const debtPayments=ref([]);
    const debtSearch=ref("");
    const debtStatus=ref("");
   
    
   
   
   
    const debts=ref([]);
    const pricingPreview = ref(0);
    const pricingCost = ref(1000);

    // ===== Computed Stats =====
    const stats = computed(() => {
    const data = shifts.value;
    return {
        open: data.filter(s => s.status === 'open').length,
        closed: data.filter(s => s.status === 'closed').length,
        cashSales: data.reduce((sum, s) => sum + Number(s.cash_sales || 0), 0),
        expectedCash: data.reduce((sum, s) => sum + Number(s.expected_cash || 0), 0)
    };
    });


    const activityIcon = (type)=>{

        switch(type){

            case "open":

                return "🟢";

            case "sale":

                return "💊";

            case "expense":

                return "💸";

            case "withdraw":

                return "👤";

            case "debt_payment":

                return "💵";

            case "refund":

                return "↩️";

            case "close":

                return "🔴";

            default:

                return "📌";

        }

    };

    const money = (value) => Number(value || 0).toLocaleString();

    const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('ar');
    };

    const applyFilters = async () => {
        console.log('🔵 تطبيق الفلاتر:', filters);
        await refreshShifts(filters);
        console.log('✅ الورديات بعد التصفية:', shifts.value);
    };

    const goToPage = async (page) => {
        if (page < 1 || page > pagination.value.lastPage) return;
        await refreshShifts({ ...filters, page });
    };

    const selectShift = async (shift) => {
        selectedShiftId.value = shift.id;
        loadingDetails.value = true;
        try {
            const res = await ShiftService.show(shift.id);
            selectedShift.value = res.shift;
            activities.value = Array.isArray(res.activities) ? res.activities : [];
        } catch (e) {
            showToast('حدث خطأ أثناء تحميل تفاصيل الوردية', 'error');
            console.error(e);
        } finally {
            loadingDetails.value = false;
        }
    };
    
    const loadShifts = async()=>{

        loading.value = true;

        try{

            const res = await ShiftService.getAll(filters);

            shifts.value = res.data;

            pagination.value = {

                current_page:res.current_page,

                last_page:res.last_page,

                total:res.total,

                per_page:res.per_page

            };

        }
        catch (e) {
            console.error(e);
            showToast('حدث خطأ أثناء تحميل الورديات', 'error');
        }

        finally{

            loading.value = false;

        }

    };
    const filters = reactive({
    search: '',
    status: '',
    branch: '',
    from: '',
    to: ''
    });
    // ===== Filtered Shifts =====
    const filteredShifts = computed(() => {
    return shifts.value.filter(shift => {
        if (filters.search && !String(shift.user?.name || '').toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
        }
        if (filters.status && shift.status !== filters.status) {
        return false;
        }
        if (filters.branch && Number(shift.branch_id) !== Number(filters.branch)) {
        return false;
        }
        if (filters.from && shift.opened_at < filters.from) {
        return false;
        }
        if (filters.to && shift.opened_at > filters.to + ' 23:59:59') {
        return false;
        }
        return true;
    });
    });
    
    
    
    const parseDescription = (activity)=>{

        if(!activity.description)

            return null;

        try{

            return JSON.parse(activity.description);

        }

        catch{

            return activity.description;

        }

    };


    
    const debtFilters=reactive({

    search:"",

    status:""

    });
    const pricing = ref({

        exchange_rate:0,

        profit_percent:0,

        extra_cost:0,

        round_to:0

    });

    
    const loadDebts=async()=>{

        const res = await DebtService.getAll();

        debts.value = res.data;

    };
    
    const selectDebt=async(debt)=>{

        const res=await DebtService.show(

        debt.id

        );

        selectedDebt.value=res;

        debtPayments.value=res.payments;

    };

    const payDebt=async()=>{

        await DebtService.pay(

        selectedDebt.value.id,

        paymentAmount.value

        );

        await selectDebt(

        selectedDebt.value

        );

        await loadDebts();

    };
    const loadPricing = async () => {

        return;

    };
    const loadData = () => { loadShifts(); };

    // ===== Lifecycle =====
    onMounted(async () => {
    console.log('🟢 onMounted - جلب الورديات...');
    if (!branches.value.length) await branchStore.fetchBranches();
    await refreshShifts();
    console.log('✅ onMounted - الورديات بعد الجلب:', shifts.value);
    });

    onActivated(async () => {
    console.log('🟢 onActivated - جلب الورديات (force refresh)...');
    await refreshShifts();
    console.log('✅ onActivated - الورديات بعد الجلب:', shifts.value);
    const searchData = localStorage.getItem('search_result_data');
      if (searchData) {
        try {
          const data = JSON.parse(searchData);
          if (data.type === 'فاتورة بيع') {
            // البحث عن الوردية التي تحتوي على هذه الفاتورة
            // أو فتح تفاصيل الفاتورة مباشرة إذا كان لدينا نقطة نهاية
            showToast(`تم العثور على فاتورة بيع #${data.id}`, 'success');
            // يمكن إضافة منطق لعرض الفاتورة في نافذة منبثقة
          }
        } catch(e) {}
        localStorage.removeItem('search_result_data');
      }
    });
    
</script>
// End Shifts ==============//

