<template>
  <div class="financial-reports">
    <!-- Page header -->
    <div class="page-header">
      <div class="icon"><i class="fas fa-chart-line"></i></div>
      <div>
        <h2>التقارير المالية</h2>
        <p>ملخص شامل للأداء المالي — جاهز للطباعة والمحاسب</p>
      </div>
    </div>

    <!-- Branch filter -->
    <div class="branch-bar">
      <label class="branch-label">
        <i class="fas fa-store"></i>
        <span>الفرع:</span>
      </label>
      <select v-model="selectedBranch" @change="load" class="branch-select">
        <option value="all">🏢 كل الفروع</option>
        <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
      </select>

      <div v-if="report?.branch?.id" class="branch-active">
        <i class="fas fa-check-circle"></i>
        <span>تقرير فرع: <strong>{{ report.branch.name }}</strong></span>
      </div>
      <div v-else class="branch-all">
        <i class="fas fa-globe"></i>
        <span>تقرير مُجمّع لكل الفروع</span>
      </div>
    </div>

    <!-- Period selector -->
    <div class="period-tabs">
      <button v-for="p in periods" :key="p.id"
              :class="{ active: selectedPeriod === p.id }"
              @click="selectedPeriod = p.id; load()">
        <i :class="p.icon"></i> {{ p.label }}
      </button>
    </div>

    <!-- Custom range -->
    <div class="custom-range">
      <label>من: <input type="date" v-model="customFrom" @change="loadCustom"></label>
      <label>إلى: <input type="date" v-model="customTo" @change="loadCustom"></label>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>جاري التحميل...</p>
    </div>

    <div v-else-if="report" class="content">
      <!-- Period info -->
      <div class="period-info">
        <i class="fas fa-calendar-alt"></i>
        {{ report.period.label }} — من {{ report.period.from }} إلى {{ report.period.to }}
        <span class="branch-chip">
          <i class="fas fa-store"></i>
          {{ report.branch.name }}
        </span>
      </div>

      <!-- KPI cards -->
      <div class="kpi-grid">
        <div class="kpi-card success">
          <i class="fas fa-cash-register"></i>
          <span class="label">إجمالي المبيعات</span>
          <strong>{{ fmt(report.summary.total_sales) }}</strong>
        </div>
        <div class="kpi-card success">
          <i class="fas fa-chart-line"></i>
          <span class="label">إجمالي الأرباح</span>
          <strong>{{ fmt(report.summary.total_profit) }}</strong>
        </div>
        <div class="kpi-card danger">
          <i class="fas fa-receipt"></i>
          <span class="label">المصروفات</span>
          <strong>{{ fmt(report.summary.total_expenses) }}</strong>
        </div>
        <div class="kpi-card danger">
          <i class="fas fa-hand-holding-usd"></i>
          <span class="label">السحوبات</span>
          <strong>{{ fmt(report.summary.total_withdrawals) }}</strong>
        </div>
        <div class="kpi-card warning">
          <i class="fas fa-undo"></i>
          <span class="label">المرتجعات</span>
          <strong>{{ fmt(report.summary.total_refunds) }}</strong>
        </div>
        <div class="kpi-card info">
          <i class="fas fa-money-bill-wave"></i>
          <span class="label">سداد الديون</span>
          <strong>{{ fmt(report.summary.total_debts_paid) }}</strong>
        </div>
        <div class="kpi-card info">
          <i class="fas fa-truck"></i>
          <span class="label">المشتريات</span>
          <strong>{{ fmt(report.summary.total_purchases) }}</strong>
        </div>
        <div class="kpi-card warning">
          <i class="fas fa-user-tie"></i>
          <span class="label">الرواتب</span>
          <strong>{{ fmt(report.summary.total_salaries) }}</strong>
        </div>
        <div class="kpi-card primary">
          <i class="fas fa-trophy"></i>
          <span class="label">صافي الإيراد</span>
          <strong>{{ fmt(report.summary.net_revenue) }}</strong>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-row">
        <div class="panel">
          <h3><i class="fas fa-credit-card"></i> المبيعات حسب طريقة الدفع</h3>
          <div v-for="p in report.breakdown.sales_by_payment" :key="p.payment_method" class="payment-row">
            <span class="method">{{ p.payment_method === 'cash' ? '💵 نقدي' : '🏦 بنكي' }}</span>
            <span class="count">({{ p.count }})</span>
            <span class="total">{{ fmt(p.total) }}</span>
          </div>
          <p v-if="!report.breakdown.sales_by_payment.length" class="empty">لا توجد مبيعات</p>
        </div>

        <div class="panel">
          <h3><i class="fas fa-fire"></i> الأكثر مبيعاً</h3>
          <div v-for="(m, idx) in report.breakdown.top_medicines.slice(0, 5)" :key="m.name" class="medicine-row">
            <span class="rank">{{ idx + 1 }}</span>
            <span class="name">{{ m.name }}</span>
            <span class="qty">{{ m.quantity }} وحدة</span>
            <span class="revenue">{{ fmt(m.revenue) }}</span>
          </div>
          <p v-if="!report.breakdown.top_medicines.length" class="empty">لا توجد مبيعات</p>
        </div>
      </div>

      <!-- ============================================================
           Details — Expenses + Withdrawals
           ============================================================ -->
      <div class="details-row">
        <!-- EXPENSES -->
        <div class="panel">
          <div class="panel-head">
            <h3>
              <i class="fas fa-receipt"></i>
              تفاصيل المصروفات
              <span class="badge-count">{{ report.details.expenses_list.length }}</span>
            </h3>
            <PerPageSelect
              v-model="pagination.expenses.perPage"
              @update:modelValue="resetPage('expenses')"
            />
          </div>

          <table v-if="report.details.expenses_list.length">
            <thead>
              <tr>
                <th>البيان</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>الموظف</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in paginatedExpenses" :key="e.id">
                <td>{{ e.title }}</td>
                <td class="num">{{ fmt(e.amount) }}</td>
                <td>
                  <!-- ✅ حالة السداد للمصروفات -->
                  <span class="status-badge status-paid">
                    <i class="fas fa-check-circle"></i>
                    مدفوع
                  </span>
                </td>
                <td>{{ e.user?.name || '—' }}</td>
                <td>{{ shortDate(e.created_at) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="empty">لا توجد مصروفات</p>

          <Paginator
            v-if="report.details.expenses_list.length > pagination.expenses.perPage"
            :current="pagination.expenses.page"
            :total="report.details.expenses_list.length"
            :per-page="pagination.expenses.perPage"
            @change="(p) => goToPage('expenses', p)"
          />
        </div>

        <!-- WITHDRAWALS -->
        <div class="panel">
          <div class="panel-head">
            <h3>
              <i class="fas fa-hand-holding-usd"></i>
              تفاصيل السحوبات
              <span class="badge-count">{{ report.details.withdrawals_list.length }}</span>
            </h3>
            <PerPageSelect
              v-model="pagination.withdrawals.perPage"
              @update:modelValue="resetPage('withdrawals')"
            />
          </div>

          <table v-if="report.details.withdrawals_list.length">
            <thead>
              <tr>
                <th>السبب</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>الموظف</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="w in paginatedWithdrawals" :key="w.id">
                <td>{{ w.reason }}</td>
                <td class="num">{{ fmt(w.amount) }}</td>
                <td>
                  <!-- ✅ حالة السداد للسحوبات -->
                  <div class="status-cell">
                    <span :class="['status-badge', statusClass(w.payment_status)]">
                      <i :class="statusIcon(w.payment_status)"></i>
                      {{ statusLabel(w.payment_status) }}
                    </span>
                    <span v-if="w.payment_status === 'partial'"
                          class="status-detail">
                      {{ fmt(w.paid_amount) }} / {{ fmt(w.amount) }}
                    </span>
                  </div>
                </td>
                <td>{{ w.user?.name || '—' }}</td>
                <td>{{ shortDate(w.created_at) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="empty">لا توجد سحوبات</p>

          <Paginator
            v-if="report.details.withdrawals_list.length > pagination.withdrawals.perPage"
            :current="pagination.withdrawals.page"
            :total="report.details.withdrawals_list.length"
            :per-page="pagination.withdrawals.perPage"
            @change="(p) => goToPage('withdrawals', p)"
          />
        </div>
      </div>

      <!-- Purchases -->
      <div class="details-row">
        <div class="panel" style="grid-column: 1 / -1;">
          <div class="panel-head">
            <h3>
              <i class="fas fa-truck"></i>
              تفاصيل المشتريات
              <span class="badge-count">{{ report.details.purchases_list.length }}</span>
            </h3>
            <PerPageSelect
              v-model="pagination.purchases.perPage"
              @update:modelValue="resetPage('purchases')"
            />
          </div>

          <table v-if="report.details.purchases_list.length">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>المورد</th>
                <th>المبلغ</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in paginatedPurchases" :key="p.id">
                <td>{{ p.invoice_number || '#' + p.id }}</td>
                <td>{{ p.supplier?.name || '—' }}</td>
                <td class="num">{{ fmt(p.total_amount) }}</td>
                <td>{{ shortDate(p.created_at) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="empty">لا توجد مشتريات</p>

          <Paginator
            v-if="report.details.purchases_list.length > pagination.purchases.perPage"
            :current="pagination.purchases.page"
            :total="report.details.purchases_list.length"
            :per-page="pagination.purchases.perPage"
            @change="(p) => goToPage('purchases', p)"
          />
        </div>
      </div>

      <!-- Export buttons -->
      <div class="export-bar">
        <button class="btn-print" @click="printReport">
          <i class="fas fa-print"></i> طباعة التقرير
        </button>
        <button class="btn-excel" @click="exportExcel">
          <i class="fas fa-file-excel"></i> تصدير Excel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, defineComponent, h } from 'vue';
import axios from 'axios';
import { API_BASE } from '../../src/js/config.js';
import { useBranchStore } from '../../src/js/stores/index.js';
import { storeToRefs } from 'pinia';

/* ============================================================
   Stores
   ============================================================ */
const branchStore = useBranchStore();
const { branches } = storeToRefs(branchStore);

/* ============================================================
   Periods & State
   ============================================================ */
const periods = [
  { id: 'daily',   label: 'اليومي',   icon: 'fas fa-calendar-day' },
  { id: 'weekly',  label: 'الأسبوعي', icon: 'fas fa-calendar-week' },
  { id: 'monthly', label: 'الشهري',   icon: 'fas fa-calendar-alt' },
  { id: 'yearly',  label: 'السنوي',   icon: 'fas fa-calendar' },
];

const selectedPeriod = ref('daily');
const selectedBranch = ref('all');
const customFrom = ref('');
const customTo = ref('');
const report = ref(null);
const loading = ref(false);

/* ============================================================
   Pagination
   ============================================================ */
const pagination = reactive({
  expenses:    { page: 1, perPage: 8 },
  withdrawals: { page: 1, perPage: 8 },
  purchases:   { page: 1, perPage: 8 },
});

const PER_PAGE_OPTIONS = [5, 8, 10, 20, 50];

const paginatedExpenses = computed(() => {
  const list = report.value?.details?.expenses_list || [];
  const s = pagination.expenses;
  return list.slice((s.page - 1) * s.perPage, s.page * s.perPage);
});

const paginatedWithdrawals = computed(() => {
  const list = report.value?.details?.withdrawals_list || [];
  const s = pagination.withdrawals;
  return list.slice((s.page - 1) * s.perPage, s.page * s.perPage);
});

const paginatedPurchases = computed(() => {
  const list = report.value?.details?.purchases_list || [];
  const s = pagination.purchases;
  return list.slice((s.page - 1) * s.perPage, s.page * s.perPage);
});

const goToPage = (key, page) => {
  const list =
    key === 'expenses'    ? (report.value?.details?.expenses_list || []) :
    key === 'withdrawals' ? (report.value?.details?.withdrawals_list || []) :
                            (report.value?.details?.purchases_list || []);

  const s = pagination[key];
  const lastPage = Math.max(1, Math.ceil(list.length / s.perPage));

  if (page < 1) page = 1;
  if (page > lastPage) page = lastPage;

  s.page = page;
};

const resetPage = (key) => { pagination[key].page = 1; };
const resetAllPages = () => {
  pagination.expenses.page = 1;
  pagination.withdrawals.page = 1;
  pagination.purchases.page = 1;
};

/* ============================================================
   Status helpers — ✅ جديد
   ============================================================ */
const statusLabel = (s) => {
  switch (s) {
    case 'paid':    return 'مسدّد';
    case 'partial': return 'جزئي';
    case 'pending': return 'غير مسدّد';
    default:        return '—';
  }
};

const statusClass = (s) => {
  switch (s) {
    case 'paid':    return 'status-paid';
    case 'partial': return 'status-partial';
    case 'pending': return 'status-pending';
    default:        return 'status-unknown';
  }
};

const statusIcon = (s) => {
  switch (s) {
    case 'paid':    return 'fas fa-check-circle';
    case 'partial': return 'fas fa-adjust';
    case 'pending': return 'fas fa-clock';
    default:        return 'fas fa-question-circle';
  }
};

/* ============================================================
   Load
   ============================================================ */
const load = async () => {
  loading.value = true;
  resetAllPages();

  try {
    const params = {
      period: selectedPeriod.value,
      branch_id: selectedBranch.value,
      _ts: Date.now(),
    };

    if (customFrom.value && customTo.value) {
      params.from = customFrom.value;
      params.to = customTo.value;
    }

    const res = await axios.get(`${API_BASE}/financial-reports`, {
      params,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

    report.value = res.data;
  } catch (e) {
    console.error('Financial report load error:', e);
  } finally {
    loading.value = false;
  }
};

const loadCustom = () => {
  if (customFrom.value && customTo.value) load();
};

/* ============================================================
   Helpers
   ============================================================ */
const fmt = (v) => Number(v || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const shortDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB') : '—';

/* ============================================================
   Local Components
   ============================================================ */
const Paginator = defineComponent({
  name: 'Paginator',
  props: {
    current: { type: Number, required: true },
    total:   { type: Number, required: true },
    perPage: { type: Number, required: true },
  },
  emits: ['change'],
  setup(props, { emit }) {
    const lastPage = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)));

    const pages = computed(() => {
      const total = lastPage.value;
      const current = props.current;
      const range = [];
      const maxVisible = 5;

      let start = Math.max(1, current - Math.floor(maxVisible / 2));
      let end = Math.min(total, start + maxVisible - 1);

      if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

      if (start > 1) {
        range.push(1);
        if (start > 2) range.push('...');
      }

      for (let i = start; i <= end; i++) range.push(i);

      if (end < total) {
        if (end < total - 1) range.push('...');
        range.push(total);
      }

      return range;
    });

    const fromItem = computed(() => (props.current - 1) * props.perPage + 1);
    const toItem = computed(() => Math.min(props.total, props.current * props.perPage));

    return () => h('div', { class: 'paginator' }, [
      h('div', { class: 'pag-info' }, `عرض ${fromItem.value}–${toItem.value} من ${props.total}`),
      h('div', { class: 'pag-buttons' }, [
        h('button', {
          class: ['pag-btn', { disabled: props.current <= 1 }],
          disabled: props.current <= 1,
          onClick: () => emit('change', props.current - 1),
        }, [h('i', { class: 'fas fa-chevron-right' })]),

        ...pages.value.map(p =>
          p === '...'
            ? h('span', { class: 'pag-ellipsis' }, '…')
            : h('button', {
                class: ['pag-btn', 'pag-num', { active: p === props.current }],
                onClick: () => emit('change', p),
              }, String(p))
        ),

        h('button', {
          class: ['pag-btn', { disabled: props.current >= lastPage.value }],
          disabled: props.current >= lastPage.value,
          onClick: () => emit('change', props.current + 1),
        }, [h('i', { class: 'fas fa-chevron-left' })]),
      ]),
    ]);
  },
});

const PerPageSelect = defineComponent({
  name: 'PerPageSelect',
  props: { modelValue: { type: Number, required: true } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', { class: 'per-page-select' }, [
      h('label', 'عرض'),
      h('select', {
        value: props.modelValue,
        onChange: (e) => emit('update:modelValue', Number(e.target.value)),
      }, PER_PAGE_OPTIONS.map(n => h('option', { value: n }, `${n}`))),
    ]);
  },
});

/* ============================================================
   Print
   ============================================================ */
const printReport = () => {
  if (!report.value) return;
  const w = window.open('', '_blank');
  const r = report.value;
  const branchLabel = r.branch?.name || 'كل الفروع';

  const statusLabels = { paid: 'مسدّد', partial: 'جزئي', pending: 'غير مسدّد', unknown: '—' };

  const html = `
    <!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <title>تقرير مالي - ${branchLabel}</title>
    <style>
      body { font-family: Cairo, Arial; padding: 24px; color: #333; }
      h1 { color: #0f5b7a; text-align: center; margin-bottom: 4px; }
      .branch-line { text-align: center; font-weight: 800; color: #059669; margin-bottom: 4px; font-size: 15px; }
      .meta { text-align: center; color: #666; margin-bottom: 24px; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 13px; }
      th { background: #f1f5f9; }
      .kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
      .kpi div { padding: 14px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; }
      .kpi strong { display: block; font-size: 18px; margin-top: 6px; color: #0f5b7a; }
      h2 { color: #334155; font-size: 16px; margin-top: 24px; }
      .status { font-weight: 700; }
      .status-paid { color: #059669; }
      .status-partial { color: #d97706; }
      .status-pending { color: #dc2626; }
    </style></head><body>
    <h1>التقرير المالي</h1>
    <div class="branch-line">الفرع: ${branchLabel}</div>
    <div class="meta">${r.period.label} — من ${r.period.from} إلى ${r.period.to}</div>
    <div class="kpi">
      <div>المبيعات<strong>${fmt(r.summary.total_sales)}</strong></div>
      <div>الأرباح<strong>${fmt(r.summary.total_profit)}</strong></div>
      <div>المصروفات<strong>${fmt(r.summary.total_expenses)}</strong></div>
      <div>المرتجعات<strong>${fmt(r.summary.total_refunds)}</strong></div>
      <div>السحوبات<strong>${fmt(r.summary.total_withdrawals)}</strong></div>
      <div>سداد ديون<strong>${fmt(r.summary.total_debts_paid)}</strong></div>
      <div>المشتريات<strong>${fmt(r.summary.total_purchases)}</strong></div>
      <div>الرواتب<strong>${fmt(r.summary.total_salaries)}</strong></div>
      <div>صافي الإيراد<strong>${fmt(r.summary.net_revenue)}</strong></div>
    </div>

    <h2>المصروفات</h2>
    <table><thead><tr><th>البيان</th><th>المبلغ</th><th>الحالة</th><th>الموظف</th><th>التاريخ</th></tr></thead><tbody>
      ${r.details.expenses_list.map(e => `<tr><td>${e.title}</td><td>${fmt(e.amount)}</td><td class="status status-paid">مدفوع</td><td>${e.user?.name || '—'}</td><td>${shortDate(e.created_at)}</td></tr>`).join('')}
    </tbody></table>

    <h2>السحوبات</h2>
    <table><thead><tr><th>السبب</th><th>المبلغ</th><th>الحالة</th><th>المدفوع</th><th>المتبقي</th><th>الموظف</th><th>التاريخ</th></tr></thead><tbody>
      ${r.details.withdrawals_list.map(w => `<tr>
        <td>${w.reason}</td>
        <td>${fmt(w.amount)}</td>
        <td class="status status-${w.payment_status}">${statusLabels[w.payment_status] || '—'}</td>
        <td>${fmt(w.paid_amount)}</td>
        <td>${fmt(w.remaining_amount)}</td>
        <td>${w.user?.name || '—'}</td>
        <td>${shortDate(w.created_at)}</td>
      </tr>`).join('')}
    </tbody></table>

    <h2>المشتريات</h2>
    <table><thead><tr><th>رقم الفاتورة</th><th>المورد</th><th>المبلغ</th><th>التاريخ</th></tr></thead><tbody>
      ${r.details.purchases_list.map(p => `<tr><td>${p.invoice_number || '#' + p.id}</td><td>${p.supplier?.name || '—'}</td><td>${fmt(p.total_amount)}</td><td>${shortDate(p.created_at)}</td></tr>`).join('')}
    </tbody></table>
    <script>window.onload = () => window.print();<\/script>
    </body></html>`;
  w.document.write(html);
  w.document.close();
};

/* ============================================================
   Export Excel
   ============================================================ */
const exportExcel = () => {
  const r = report.value;
  if (!r) return;

  const branchLabel = r.branch?.name || 'كل الفروع';
  const statusLabels = { paid: 'مسدّد', partial: 'جزئي', pending: 'غير مسدّد', unknown: '—' };

  const rows = [
    ['التقرير المالي', r.period.label],
    ['الفرع', branchLabel],
    ['من', r.period.from],
    ['إلى', r.period.to],
    [],
    ['المؤشر', 'القيمة'],
    ['المبيعات', r.summary.total_sales],
    ['الأرباح', r.summary.total_profit],
    ['المصروفات', r.summary.total_expenses],
    ['المرتجعات', r.summary.total_refunds],
    ['السحوبات', r.summary.total_withdrawals],
    ['سداد ديون', r.summary.total_debts_paid],
    ['المشتريات', r.summary.total_purchases],
    ['الرواتب', r.summary.total_salaries],
    ['صافي الإيراد', r.summary.net_revenue],
    [],
    ['المصروفات'],
    ['البيان', 'المبلغ', 'الحالة', 'الموظف', 'التاريخ'],
    ...r.details.expenses_list.map(e => [e.title, e.amount, 'مدفوع', e.user?.name || '', shortDate(e.created_at)]),
    [],
    ['السحوبات'],
    ['السبب', 'المبلغ', 'الحالة', 'المدفوع', 'المتبقي', 'الموظف', 'التاريخ'],
    ...r.details.withdrawals_list.map(w => [
      w.reason,
      w.amount,
      statusLabels[w.payment_status] || '',
      w.paid_amount,
      w.remaining_amount,
      w.user?.name || '',
      shortDate(w.created_at),
    ]),
  ];

  const csv = rows.map(row => row.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const branchPart = r.branch?.id ? `-branch${r.branch.id}` : '-all-branches';
  a.download = `financial-report${branchPart}-${r.period.type}-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/* ============================================================
   Lifecycle
   ============================================================ */
onMounted(async () => {
  if (!branches.value.length) await branchStore.fetchBranches();
  await load();
});
</script>

<style scoped>
.financial-reports { max-width: 1200px; margin: 0 auto; padding: 10px; }

.page-header { display: flex; gap: 16px; align-items: center; margin-bottom: 24px; }
.page-header .icon {
  width: 56px; height: 56px; border-radius: 16px;
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}
.page-header h2 { font-size: 22px; font-weight: 800; margin: 0; color: #1e293b; }
.page-header p { color: #64748b; font-size: 13px; margin: 4px 0 0; }

.branch-bar {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 1.5px solid #a7f3d0;
  border-radius: 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.branch-label {
  display: flex; align-items: center; gap: 8px;
  font-weight: 800; font-size: 13.5px; color: #047857;
}
.branch-select {
  padding: 9px 16px; border: 2px solid #6ee7b7; background: #fff;
  border-radius: 10px; font-family: inherit; font-weight: 700;
  font-size: 13.5px; color: #065f46; cursor: pointer;
  min-width: 200px; transition: 0.15s;
}
.branch-select:hover { border-color: #34d399; }
.branch-select:focus { outline: none; border-color: #059669; box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15); }

.branch-active {
  display: flex; align-items: center; gap: 6px;
  background: #10b981; color: #fff; padding: 6px 12px;
  border-radius: 20px; font-size: 12.5px; font-weight: 700;
  margin-right: auto;
}
.branch-all {
  display: flex; align-items: center; gap: 6px;
  background: #64748b; color: #fff; padding: 6px 12px;
  border-radius: 20px; font-size: 12.5px; font-weight: 700;
  margin-right: auto;
}

.period-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.period-tabs button {
  padding: 10px 20px; border: 2px solid #e2e8f0; background: #fff;
  border-radius: 12px; cursor: pointer; font-family: inherit;
  font-weight: 700; color: #64748b; transition: 0.2s;
  display: flex; align-items: center; gap: 6px;
}
.period-tabs button.active { border-color: #059669; background: #ecfdf5; color: #047857; }

.custom-range {
  display: flex; gap: 16px; margin-bottom: 20px;
  padding: 12px 16px; background: #f8fafc; border-radius: 12px;
}
.custom-range label { font-size: 13px; color: #475569; display: flex; align-items: center; gap: 8px; }
.custom-range input {
  padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: inherit;
}

.period-info {
  padding: 12px 16px; background: #eff6ff; color: #1e40af;
  border-radius: 10px; font-weight: 700; font-size: 13px; margin-bottom: 16px;
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.branch-chip {
  margin-right: auto;
  background: #1e40af; color: #fff; padding: 5px 12px;
  border-radius: 20px; font-size: 12px; font-weight: 800;
  display: inline-flex; align-items: center; gap: 6px;
}

.kpi-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px; margin-bottom: 20px;
}
.kpi-card { padding: 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; }
.kpi-card i { font-size: 18px; margin-bottom: 8px; display: block; }
.kpi-card .label { font-size: 12px; color: #94a3b8; display: block; margin-bottom: 4px; }
.kpi-card strong { font-size: 20px; font-weight: 800; }
.kpi-card.success i, .kpi-card.success strong { color: #059669; }
.kpi-card.danger i,  .kpi-card.danger strong  { color: #dc2626; }
.kpi-card.warning i, .kpi-card.warning strong { color: #d97706; }
.kpi-card.info i,    .kpi-card.info strong    { color: #2563eb; }
.kpi-card.primary i, .kpi-card.primary strong { color: #7c3aed; }
.kpi-card.primary { background: #faf5ff; border-color: #ddd6fe; }

.charts-row, .details-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;
}
@media (max-width: 900px) {
  .charts-row, .details-row { grid-template-columns: 1fr; }
}

.panel {
  background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 14px;
}

.panel-head {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; margin-bottom: 14px; flex-wrap: wrap;
}
.panel h3 {
  font-size: 15px; font-weight: 800; color: #1e293b;
  margin: 0; display: flex; align-items: center; gap: 8px;
}
.badge-count {
  background: #e2e8f0; color: #475569;
  padding: 2px 10px; border-radius: 12px;
  font-size: 12px; font-weight: 800;
  margin-right: 4px;
}

/* Per-page select */
.per-page-select {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #64748b; font-weight: 700;
}
.per-page-select select {
  padding: 5px 8px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  font-family: inherit;
  font-weight: 700;
  font-size: 12px;
  color: #334155;
  cursor: pointer;
}
.per-page-select select:focus {
  outline: none; border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
}

/* Payment / Medicine rows */
.payment-row, .medicine-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0; border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}
.payment-row:last-child, .medicine-row:last-child { border: none; }
.payment-row .method { flex: 1; font-weight: 700; }
.payment-row .count { color: #94a3b8; font-size: 12px; }
.payment-row .total { font-weight: 800; color: #059669; }
.medicine-row .rank {
  width: 24px; height: 24px; border-radius: 50%;
  background: #f1f5f9; color: #64748b; font-size: 11px;
  display: flex; align-items: center; justify-content: center; font-weight: 800;
}
.medicine-row .name { flex: 1; font-weight: 700; color: #1e293b; }
.medicine-row .qty { color: #94a3b8; font-size: 12px; }
.medicine-row .revenue { color: #059669; font-weight: 800; }

/* Tables */
.panel table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.panel table th {
  text-align: right; padding: 8px 6px; color: #64748b;
  font-weight: 700; border-bottom: 1px solid #e2e8f0; font-size: 11.5px;
}
.panel table td { padding: 8px 6px; border-bottom: 1px solid #f1f5f9; }
.panel table .num { font-weight: 800; color: #059669; text-align: left; }
.panel .empty { text-align: center; color: #94a3b8; padding: 20px; font-size: 13px; }

/* ============================================================
   Status badges — ✅ جديد
   ============================================================ */
.status-cell {
  display: flex; flex-direction: column; gap: 2px; align-items: flex-start;
}
.status-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 12px;
  font-size: 11px; font-weight: 800;
  border: 1px solid transparent;
  white-space: nowrap;
}
.status-badge i { font-size: 10px; }
.status-detail {
  font-size: 10px; color: #94a3b8; font-weight: 700;
  padding-right: 4px; font-family: monospace;
}
.status-paid {
  background: #ecfdf5; color: #047857; border-color: #a7f3d0;
}
.status-partial {
  background: #fffbeb; color: #b45309; border-color: #fcd34d;
}
.status-pending {
  background: #fef2f2; color: #b91c1c; border-color: #fecaca;
}
.status-unknown {
  background: #f1f5f9; color: #64748b; border-color: #e2e8f0;
}

/* ============================================================
   Paginator
   ============================================================ */
.paginator {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-top: 14px;
  padding-top: 14px; border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}
.pag-info {
  font-size: 12px; color: #94a3b8; font-weight: 700;
}
.pag-buttons {
  display: flex; align-items: center; gap: 4px;
}
.pag-btn {
  min-width: 32px; height: 32px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 700;
  color: #475569;
  transition: 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.pag-btn:hover:not(.disabled):not(.active) {
  border-color: #059669; background: #ecfdf5; color: #047857;
}
.pag-btn.active {
  background: #059669; color: #fff; border-color: #059669;
}
.pag-btn.disabled {
  opacity: 0.4; cursor: not-allowed;
}
.pag-num {
  padding: 0 8px;
}
.pag-ellipsis {
  padding: 0 6px;
  color: #94a3b8;
  font-weight: 800;
  font-size: 14px;
}

/* Export bar */
.export-bar { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
.export-bar button {
  padding: 12px 24px; border: none; border-radius: 12px;
  cursor: pointer; font-family: inherit; font-weight: 700;
  display: flex; align-items: center; gap: 8px;
  transition: 0.2s;
}
.btn-print { background: #0f5b7a; color: #fff; }
.btn-print:hover { background: #1ba7c2; transform: translateY(-2px); }
.btn-excel { background: #16a34a; color: #fff; }
.btn-excel:hover { background: #15803d; transform: translateY(-2px); }

.state { text-align: center; padding: 60px; color: #94a3b8; }
.state i { font-size: 42px; display: block; margin-bottom: 12px; }
</style>