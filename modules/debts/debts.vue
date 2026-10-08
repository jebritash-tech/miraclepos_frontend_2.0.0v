<!-- modules/debts/debts.vue -->
<template>
  <div class="p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen" dir="rtl">

    <!-- ============================================================
         Header
         ============================================================ -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">إدارة الديون</h2>
          <p class="text-sm text-slate-500 mt-0.5">جميع الديون من الورديات + الديون المخصصة + سحوبات الموظفين.</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button @click="fetchDebts(currentPage)" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-bold">
          <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          تحديث
        </button>
        <button @click="openCreateDebtModal" class="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          تسجيل دين جديد
        </button>
      </div>
    </div>

    <!-- ============================================================
         Stats Cards
         ============================================================ -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">إجمالي المتبقي</span>
          <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <i class="fas fa-exclamation-circle text-sm"></i>
          </div>
        </div>
        <div class="text-2xl font-extrabold text-rose-700 font-mono">{{ money(stats.total_remaining) }}</div>
        <div class="text-xs text-slate-400 mt-1">{{ stats.count_pending }} دين نشط</div>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">إجمالي المسدّد</span>
          <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i class="fas fa-check-circle text-sm"></i>
          </div>
        </div>
        <div class="text-2xl font-extrabold text-emerald-700 font-mono">{{ money(stats.total_paid) }}</div>
        <div class="text-xs text-slate-400 mt-1">{{ stats.count_paid }} دين مكتمل</div>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">عدد الديون</span>
          <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <i class="fas fa-list text-sm"></i>
          </div>
        </div>
        <div class="text-2xl font-extrabold text-slate-800 font-mono">{{ stats.count_all }}</div>
        <div class="text-xs text-slate-400 mt-1">إجمالي السجلات</div>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">إجمالي المبالغ</span>
          <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <i class="fas fa-coins text-sm"></i>
          </div>
        </div>
        <div class="text-2xl font-extrabold text-slate-800 font-mono">{{ money(stats.total_amount) }}</div>
        <div class="text-xs text-slate-400 mt-1">مجموع كل الديون</div>
      </div>
    </div>

    <!-- ============================================================
         Filters Bar
         ============================================================ -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
        <!-- البحث -->
        <div class="md:col-span-4">
          <div class="relative">
            <span class="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
              <i class="fas fa-search text-sm"></i>
            </span>
            <input
              v-model="filters.search"
              @input="debouncedFetch"
              type="text"
              placeholder="ابحث برقم الدين / الاسم / الملاحظات..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
          </div>
        </div>

        <!-- الحالة -->
        <div class="md:col-span-3">
          <select
            v-model="filters.status"
            @change="fetchDebts(1)"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          >
            <option value="all">كل الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="partial">سداد جزئي</option>
            <option value="paid">مسدّد بالكامل</option>
          </select>
        </div>

        <!-- المصدر -->
        <div class="md:col-span-3">
          <select
            v-model="filters.source"
            @change="fetchDebts(1)"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          >
            <option value="all">كل المصادر</option>
            <option value="admin">ديون مخصصة</option>
            <option value="withdrawal">سحب من الدرج</option>
            <option value="sale">دين فاتورة</option>
            <option value="employee">سحب موظف</option>
          </select>
        </div>

        <!-- الفرع -->
        <div class="md:col-span-2">
          <select
            v-model="filters.branch_id"
            @change="fetchDebts(1)"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          >
            <option value="all">كل الفروع</option>
            <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
      </div>

      <!-- Active filters badges -->
      <div v-if="hasActiveFilters" class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
        <span class="text-xs text-slate-500 font-bold">الفلاتر النشطة:</span>
        <span v-if="filters.status !== 'all'" class="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold">
          الحالة: {{ statusLabel(filters.status) }}
        </span>
        <span v-if="filters.source !== 'all'" class="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold">
          المصدر: {{ sourceLabel(filters.source) }}
        </span>
        <span v-if="filters.branch_id !== 'all'" class="text-xs px-2 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold">
          الفرع: {{ branches.find(b => b.id === filters.branch_id)?.name || '—' }}
        </span>
        <span v-if="filters.search" class="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">
          بحث: "{{ filters.search }}"
        </span>
        <button @click="clearFilters" class="text-xs text-rose-600 hover:text-rose-700 font-bold mr-auto">
          مسح الكل
        </button>
      </div>
    </div>

    <!-- ============================================================
         Debts Table
         ============================================================ -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-right border-collapse">
          <thead>
            <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <th class="p-4">#</th>
              <th class="p-4">العميل / الموظف</th>
              <th class="p-4">المصدر</th>
              <th class="p-4">الإجمالي</th>
              <th class="p-4">المدفوع</th>
              <th class="p-4">المتبقي</th>
              <th class="p-4">الحالة</th>
              <th class="p-4">التاريخ</th>
              <th class="p-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
            <tr v-if="loading && debts.length === 0">
              <td colspan="9" class="text-center py-12 text-slate-400">
                <i class="fas fa-spinner fa-spin text-xl mb-2 block"></i>
                جاري التحميل...
              </td>
            </tr>
            <tr v-else-if="!debts || debts.length === 0">
              <td colspan="9" class="text-center py-12 text-slate-400">
                <i class="fas fa-inbox text-3xl mb-2 block text-slate-300"></i>
                لا توجد ديون مطابقة.
              </td>
            </tr>
            <tr v-for="debt in debts" :key="debt.id" class="hover:bg-emerald-50/30 transition-colors group">
              <td class="p-4 font-mono font-bold text-slate-700 text-xs">{{ debt.id }}</td>
              <td class="p-4">
                <div class="font-semibold text-slate-800">{{ debt.user?.name || '—' }}</div>
                <div v-if="debt.branch?.name" class="text-xs text-slate-400">{{ debt.branch.name }}</div>
              </td>
              <td class="p-4">
                <span :class="sourceBadgeClass(debt.source_color)" class="px-2.5 py-1 rounded-lg text-xs font-bold border">
                  {{ debt.source_label }}
                </span>
              </td>
              <td class="p-4 font-mono text-slate-700">{{ money(debt.total_amount) }}</td>
              <td class="p-4 font-mono font-semibold text-emerald-600">{{ money(debt.paid_amount) }}</td>
              <td class="p-4 font-mono font-semibold text-rose-600">{{ money(debt.remaining_amount) }}</td>
              <td class="p-4">
                <span :class="statusColor(debt.status)" class="px-3 py-1 rounded-full text-xs font-bold border">
                  {{ statusLabel(debt.status) }}
                </span>
              </td>
              <td class="p-4 text-xs text-slate-500 font-mono">
                {{ formatDate(debt.created_at) }}
              </td>
              <td class="p-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button @click="selectDebt(debt)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all">
                    <i class="fas fa-eye text-[10px]"></i>
                    عرض
                  </button>
                  <button
                    v-if="debt.status !== 'paid' && debt.source !== 'employee'"
                    @click="openPaymentModal(debt)"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all"
                  >
                    <i class="fas fa-hand-holding-usd text-[10px]"></i>
                    سداد
                  </button>
                  <span
                    v-else-if="debt.source === 'employee' && debt.status !== 'paid'"
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold"
                    title="سحوبات الموظفين تُسدد من واجهة الرواتب"
                  >
                    <i class="fas fa-info-circle"></i>
                    من الرواتب
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="total > 0" class="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-100">
        <div class="text-sm text-slate-500">
          عرض الصفحة <span class="font-bold text-slate-700">{{ currentPage }}</span> من <span class="font-bold text-slate-700">{{ lastPage }}</span>
          (الإجمالي: <span class="font-bold text-slate-700">{{ total }}</span>)
        </div>
        <div class="flex items-center gap-2">
          <button @click="fetchDebts(currentPage - 1)" :disabled="currentPage <= 1" class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            السابق
          </button>
          <button @click="fetchDebts(currentPage + 1)" :disabled="currentPage >= lastPage" class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            التالي
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================
         Selected Debt Details
         ============================================================ -->
    <div v-if="selectedDebt" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8 space-y-6">
      <div class="flex justify-between items-center border-b border-slate-100 pb-5">
        <h3 class="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <i class="fas fa-file-invoice-dollar text-emerald-600"></i>
          تفاصيل الدين #{{ selectedDebt.id }}
          <span :class="sourceBadgeClass(selectedDebt.source_color)" class="px-2.5 py-1 rounded-lg text-xs font-bold border">
            {{ selectedDebt.source_label }}
          </span>
        </h3>
        <button @click="selectedDebt = null" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-slate-50/70 border border-slate-100 rounded-2xl p-5">
          <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">العميل / الموظف</div>
          <div class="text-base font-extrabold text-slate-800">{{ selectedDebt.user?.name || '—' }}</div>
        </div>
        <div class="bg-slate-50/70 border border-slate-100 rounded-2xl p-5">
          <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">الفرع</div>
          <div class="text-base font-extrabold text-slate-800">{{ selectedDebt.branch?.name || '—' }}</div>
        </div>
        <div class="bg-emerald-50/60 border border-emerald-100/60 rounded-2xl p-5">
          <div class="text-emerald-600/80 text-xs font-bold uppercase tracking-wider mb-1">الإجمالي</div>
          <div class="text-xl font-extrabold text-emerald-700 font-mono">{{ money(selectedDebt.total_amount) }}</div>
        </div>
        <div class="bg-rose-50/60 border border-rose-100/60 rounded-2xl p-5">
          <div class="text-rose-600/80 text-xs font-bold uppercase tracking-wider mb-1">المتبقي</div>
          <div class="text-xl font-extrabold text-rose-700 font-mono">{{ money(selectedDebt.remaining_amount) }}</div>
        </div>
      </div>

      <div v-if="selectedDebt.notes" class="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
        <div class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">ملاحظات</div>
        <div class="text-sm text-amber-900">{{ selectedDebt.notes }}</div>
      </div>

      <!-- Payment History -->
      <div v-if="selectedDebt.source !== 'employee'" class="space-y-4 pt-4">
        <div class="flex justify-between items-center">
          <h4 class="font-bold text-slate-800 text-base flex items-center gap-2">
            <i class="fas fa-history text-slate-400"></i>
            سجل السداد
          </h4>
          <button v-if="selectedDebt.status !== 'paid'" @click="openPaymentModal(selectedDebt)" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20">
            <i class="fas fa-plus"></i>
            إضافة دفعة
          </button>
        </div>

        <div class="border border-slate-100 rounded-2xl overflow-hidden bg-white">
          <table class="w-full text-right border-collapse">
            <thead>
              <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th class="p-4">التاريخ</th>
                <th class="p-4">الموظف</th>
                <th class="p-4">المبلغ</th>
                <th class="p-4">ملاحظات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
              <tr v-for="payment in selectedDebt.payments" :key="payment.id" class="hover:bg-slate-50/50">
                <td class="p-4 font-mono text-xs text-slate-500">{{ formatDate(payment.created_at) }}</td>
                <td class="p-4 font-semibold text-slate-800">{{ payment.user?.name || '—' }}</td>
                <td class="p-4 font-mono font-bold text-emerald-600">{{ money(payment.amount) }}</td>
                <td class="p-4 text-xs text-slate-500">{{ payment.notes || '—' }}</td>
              </tr>
              <tr v-if="!selectedDebt.payments || !selectedDebt.payments.length">
                <td colspan="4" class="text-center py-8 text-slate-400">
                  <i class="fas fa-inbox text-2xl mb-2 block text-slate-300"></i>
                  لا توجد مدفوعات مسجّلة.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-2">
        <i class="fas fa-info-circle mt-0.5"></i>
        <div>
          هذا سجل سحب موظف. يتم تسويته من خلال واجهة الرواتب أو تسجيل دفعة جديدة من الإدارة.
        </div>
      </div>
    </div>

    <!-- ============================================================
         Create Debt Modal
         ============================================================ -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div class="flex justify-between items-center border-b border-slate-100 pb-4">
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i class="fas fa-plus-circle text-blue-600"></i>
            إضافة دين جديد
          </h3>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">الفرع</label>
            <select v-model.number="newDebtForm.branch_id" class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
              <option :value="null">اختر الفرع...</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">إجمالي المبلغ</label>
            <input type="number" v-model.number="newDebtForm.total_amount" min="1" class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg font-bold" placeholder="أدخل إجمالي الدين...">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">تاريخ الاستحقاق (اختياري)</label>
            <input type="date" v-model="newDebtForm.due_date" class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">ملاحظات</label>
            <textarea v-model="newDebtForm.notes" rows="2" class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="مثال: دين عميل أحمد..."></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button @click="showCreateModal = false" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all">إلغاء</button>
          <button @click="submitCreateDebt" :disabled="saving" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all">
            {{ saving ? 'جاري الحفظ...' : 'حفظ الدين' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================
         Payment Modal
         ============================================================ -->
    <div v-if="showPaymentModal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div class="flex justify-between items-center border-b border-slate-100 pb-4">
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i class="fas fa-hand-holding-usd text-emerald-600"></i>
            سداد دين: {{ activeDebt?.user?.name }}
          </h3>
          <button @click="showPaymentModal = false" class="text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
        </div>

        <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm">
          <div class="flex justify-between items-center">
            <span class="text-emerald-800">المتبقي:</span>
            <span class="font-bold text-emerald-900 font-mono">{{ money(activeDebt?.remaining_amount || 0) }}</span>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">المبلغ المراد سداده</label>
            <input type="number" v-model.number="paymentAmount" :max="activeDebt?.remaining_amount" min="0.01" class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-lg font-bold" placeholder="أدخل المبلغ...">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">ملاحظات (اختياري)</label>
            <textarea v-model="paymentNotes" rows="2" class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button @click="showPaymentModal = false" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all">إلغاء</button>
          <button @click="submitPayment" :disabled="saving" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all">
            {{ saving ? 'جاري الحفظ...' : 'حفظ السداد' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================
         Toast
         ============================================================ -->
    <div v-if="toast.show" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 max-w-md"
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
import { useBranchStore } from '../../src/js/stores/index.js';
import { storeToRefs } from 'pinia';
import { API_BASE } from '../../src/js/config.js';
import axios from 'axios';

/* ============================================================
   Stores
   ============================================================ */
const branchStore = useBranchStore();
const { branches } = storeToRefs(branchStore);

/* ============================================================
   State
   ============================================================ */
const debts = ref([]);
const loading = ref(false);
const saving = ref(false);

const currentPage = ref(1);
const lastPage = ref(1);
const total = ref(0);
const perPage = ref(15);

const stats = ref({
  total_remaining: 0,
  total_paid: 0,
  total_amount: 0,
  count_pending: 0,
  count_paid: 0,
  count_all: 0,
  count_admin: 0,
  count_withdrawal: 0,
  count_sale: 0,
  count_employee: 0,
});

const filters = reactive({
  status: 'all',
  source: 'all',
  branch_id: 'all',
  search: '',
});

const hasActiveFilters = computed(() => {
  return filters.status !== 'all'
      || filters.source !== 'all'
      || filters.branch_id !== 'all'
      || filters.search.trim() !== '';
});

/* Modals */
const selectedDebt = ref(null);
const showPaymentModal = ref(false);
const showCreateModal = ref(false);
const activeDebt = ref(null);
const paymentAmount = ref(0);
const paymentNotes = ref('');

const newDebtForm = reactive({
  branch_id: null,
  total_amount: null,
  due_date: '',
  notes: '',
});

/* Toast */
const toast = reactive({ show: false, message: '', type: 'success' });
const showToast = (message, type = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => toast.show = false, 4000);
};

/* ============================================================
   Debounced search
   ============================================================ */
let searchTimer = null;
const debouncedFetch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchDebts(1), 400);
};

/* ============================================================
   Fetch
   ============================================================ */
const fetchDebts = async (page = 1) => {
  if (page < 1) page = 1;
  if (lastPage.value > 1 && page > lastPage.value) page = lastPage.value;

  loading.value = true;
  try {
    const params = {
      page,
      per_page: perPage.value,
      _ts: Date.now(),
    };

    if (filters.status !== 'all')    params.status = filters.status;
    if (filters.source !== 'all')    params.source = filters.source;
    if (filters.branch_id !== 'all') params.branch_id = filters.branch_id;
    if (filters.search.trim())       params.search = filters.search.trim();

    const res = await axios.get(`${API_BASE}/debts`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      params,
    });

    debts.value    = res.data.data || [];
    currentPage.value = res.data.meta?.current_page || 1;
    lastPage.value    = res.data.meta?.last_page    || 1;
    total.value       = res.data.meta?.total        || 0;
    stats.value       = res.data.stats || stats.value;

    /* إذا كان الدين المحدد موجوداً في الصفحة، أعد جلبه لضمان حداثته */
    if (selectedDebt.value) {
      const stillExists = debts.value.find(d => d.id === selectedDebt.value.id);
      if (stillExists) {
        await refreshSelectedDebt();
      } else {
        // اختفى من الفلتر → أغلقه
        selectedDebt.value = null;
      }
    }
  } catch (e) {
    console.error('فشل جلب الديون:', e);
    showToast('تعذّر جلب قائمة الديون', 'error');
  } finally {
    loading.value = false;
  }
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
    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year  = d.getFullYear();
    const hour  = String(d.getHours()).padStart(2, '0');
    const mins  = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} - ${hour}:${mins}`;
  } catch {
    return iso;
  }
};

const statusColor = (s) => {
  switch (s) {
    case 'paid':    return 'bg-green-100 text-green-700 border-green-200';
    case 'partial': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default:        return 'bg-red-100 text-red-700 border-red-200';
  }
};

const statusLabel = (s) => {
  switch (s) {
    case 'paid':    return 'مسدّد بالكامل';
    case 'partial': return 'سداد جزئي';
    default:        return 'قيد الانتظار';
  }
};

const sourceLabel = (src) => {
  switch (src) {
    case 'admin':      return 'دين مخصص';
    case 'withdrawal': return 'سحب من الدرج';
    case 'sale':       return 'دين فاتورة';
    case 'employee':   return 'سحب موظف';
    default:           return src;
  }
};

const sourceBadgeClass = (color) => {
  switch (color) {
    case 'blue':   return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'amber':  return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'purple': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'rose':   return 'bg-rose-50 text-rose-700 border-rose-200';
    default:       return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const clearFilters = () => {
  filters.status = 'all';
  filters.source = 'all';
  filters.branch_id = 'all';
  filters.search = '';
  fetchDebts(1);
};

/* ============================================================
   Selected Debt
   ============================================================ */
const selectDebt = async (debt) => {
  try {
    const res = await axios.get(`${API_BASE}/debts/${debt.id}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      params: { _ts: Date.now() },
    });
    selectedDebt.value = res.data;
  } catch (e) {
    console.error(e);
    showToast('تعذّر تحميل تفاصيل الدين', 'error');
  }
};

const refreshSelectedDebt = async () => {
  if (!selectedDebt.value) return;
  try {
    const res = await axios.get(`${API_BASE}/debts/${selectedDebt.value.id}`, {
      headers: { 'Cache-Control': 'no-cache' },
      params: { _ts: Date.now() },
    });
    selectedDebt.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

/* ============================================================
   Payment
   ============================================================ */
const openPaymentModal = (debt) => {
  if (debt.source === 'employee') {
    showToast('سحوبات الموظفين تُسدد من واجهة الرواتب', 'warning');
    return;
  }

  activeDebt.value = debt;
  paymentAmount.value = debt.remaining_amount;
  paymentNotes.value = '';
  showPaymentModal.value = true;
};

const submitPayment = async () => {
  if (!paymentAmount.value || paymentAmount.value <= 0) {
    showToast('أدخل مبلغاً صحيحاً', 'warning');
    return;
  }
  if (paymentAmount.value > activeDebt.value.remaining_amount) {
    showToast('المبلغ المدفوع أكبر من المتبقي', 'warning');
    return;
  }

  saving.value = true;
  try {
    await axios.post(
      `${API_BASE}/debts/${activeDebt.value.id}/payment`,   // ← /payment وليس /payments
      {
        amount: paymentAmount.value,
        notes: paymentNotes.value || null,
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        params: { _ts: Date.now() },
      }
    );

    showPaymentModal.value = false;
    await fetchDebts(currentPage.value);
    if (selectedDebt.value && selectedDebt.value.id === activeDebt.value.id) {
      await refreshSelectedDebt();
    }
    showToast('تم تسجيل السداد بنجاح', 'success');
  } catch (e) {
    console.error(e);
    showToast(e.response?.data?.message || 'تعذّر حفظ السداد', 'error');
  } finally {
    saving.value = false;
  }
};

/* ============================================================
   Create Debt
   ============================================================ */
const openCreateDebtModal = () => {
  newDebtForm.branch_id = null;
  newDebtForm.total_amount = null;
  newDebtForm.due_date = '';
  newDebtForm.notes = '';
  showCreateModal.value = true;
};

const submitCreateDebt = async () => {
  if (!newDebtForm.total_amount || newDebtForm.total_amount <= 0) {
    showToast('أدخل إجمالي مبلغ صحيح', 'warning');
    return;
  }

  saving.value = true;
  try {
    await axios.post(
      `${API_BASE}/debts`,
      {
        branch_id: newDebtForm.branch_id,
        total_amount: newDebtForm.total_amount,
        due_date: newDebtForm.due_date || null,
        notes: newDebtForm.notes || null,
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        params: { _ts: Date.now() },
      }
    );

    showCreateModal.value = false;
    await fetchDebts(1);
    showToast('تم تسجيل الدين بنجاح', 'success');
  } catch (e) {
    console.error(e);
    showToast(e.response?.data?.message || 'تعذّر حفظ الدين', 'error');
  } finally {
    saving.value = false;
  }
};

/* ============================================================
   Lifecycle
   ============================================================ */
onMounted(async () => {
  if (!branches.value.length) await branchStore.fetchBranches();
  await fetchDebts(1);
});

onActivated(async () => {
  if (!branches.value.length) await branchStore.fetchBranches();
  await fetchDebts(currentPage.value);
  await refreshSelectedDebt();
});
</script>

<style scoped>
/* لا حاجة لأنماط إضافية — كل شيء يستخدم Tailwind */
</style>