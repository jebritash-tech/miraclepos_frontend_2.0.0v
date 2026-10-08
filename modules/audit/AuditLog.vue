<!-- modules/audit/AuditLog.vue -->
<template>
  <div class="audit-page">
    <div class="page-header">
      <div class="icon"><i class="fas fa-clipboard-list"></i></div>
      <div>
        <h2>سجل التدقيق</h2>
        <p>كل عملية حدثت في النظام — من فعلها ومتى</p>
      </div>
      <button class="btn-refresh-header" @click="load" :disabled="loading">
        <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
      </button>
    </div>

    <!-- Summary cards -->
    <div v-if="summary.length" class="summary-grid">
      <div v-for="s in summary" :key="s.action" class="summary-card">
        <i :class="iconFor(s.action)"></i>
        <div>
          <span class="label">{{ labelFor(s.action) }}</span>
          <strong>{{ s.count }}</strong>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input
        v-model="filters.q"
        @input="debouncedLoad"
        placeholder="🔍 بحث في الوصف أو اسم المستخدم..."
        class="search-input">

      <select v-model="filters.action" @change="reload">
        <option value="">كل العمليات</option>
        <option v-for="a in availableActions" :key="a" :value="a">
          {{ labelFor(a) }}
        </option>
      </select>

      <select v-model="filters.severity" @change="reload">
        <option value="">كل الخطورة</option>
        <option value="info">معلومات</option>
        <option value="warning">تحذير</option>
        <option value="critical">حرجة</option>
      </select>

      <input v-model="filters.user_id" placeholder="رقم المستخدم" @change="reload" type="number" class="user-filter">

      <input v-model="filters.from" type="date" @change="reload" title="من تاريخ">
      <input v-model="filters.to" type="date" @change="reload" title="إلى تاريخ">

      <button class="btn-clear" @click="clearFilters" v-if="hasActiveFilters" title="مسح الفلاتر">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- Content -->
    <div v-if="loading && !logs.length" class="state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>جاري التحميل...</p>
    </div>

    <div v-else-if="!logs.length" class="state">
      <i class="fas fa-inbox"></i>
      <p>لا توجد سجلات مطابقة</p>
      <small v-if="hasActiveFilters">جرّب مسح الفلاتر</small>
    </div>

    <div v-else class="timeline">
      <div
        v-for="log in logs"
        :key="log.id"
        class="timeline-item"
        :class="'sev-' + log.severity">

        <div class="timeline-dot">
          <i :class="iconFor(log.action)"></i>
        </div>

        <div class="timeline-content">
          <!-- Header -->
          <div class="timeline-header">
            <span class="user">
              <i class="fas fa-user"></i>
              {{ log.user_name || 'نظام' }}
              <span v-if="log.user_role" class="role">
                ({{ roleLabel(log.user_role) }})
              </span>
            </span>
            <span class="time" :title="fullDate(log.created_at)">
              <i class="far fa-clock"></i> {{ relativeTime(log.created_at) }}
            </span>
          </div>

          <!-- Action badge + description -->
          <div class="action-row">
            <span class="action-badge" :class="'sev-' + log.severity">
              <i :class="iconFor(log.action)"></i>
              {{ labelFor(log.action) }}
            </span>
            <p class="description">{{ log.description || '—' }}</p>
          </div>

          <!-- Changes (human-readable) -->
          <div v-if="hasChanges(log)" class="changes-section">
            <details>
              <summary>
                <i class="fas fa-code-compare"></i>
                عرض التغييرات
                <span class="change-count">{{ changeCount(log) }}</span>
              </summary>

              <div class="diff-table">
                <div class="diff-header">
                  <span>الحقل</span>
                  <span>القيمة السابقة</span>
                  <span></span>
                  <span>القيمة الجديدة</span>
                </div>

                <div
                  v-for="(item, idx) in buildDiff(log)"
                  :key="idx"
                  class="diff-row">
                  <span class="field-name">
                    <i class="fas fa-tag"></i>
                    {{ item.label }}
                  </span>
                  <span class="old-value">{{ item.old }}</span>
                  <i class="fas fa-arrow-left arrow"></i>
                  <span class="new-value">{{ item.new }}</span>
                </div>

                <p v-if="buildDiff(log).length === 0" class="no-changes">
                  <i class="fas fa-info-circle"></i>
                  لا توجد تغييرات قابلة للعرض
                </p>
              </div>
            </details>
          </div>

          <!-- Meta -->
          <div class="meta-row">
            <span v-if="log.ip_address" class="meta-item">
              <i class="fas fa-network-wired"></i> {{ log.ip_address }}
            </span>
            <span v-if="log.model_type" class="meta-item">
              <i class="fas fa-cube"></i>
              {{ modelLabel(log.model_type) }}
              <span v-if="log.model_id">#{{ log.model_id }}</span>
            </span>
            <span v-if="log.branch_id" class="meta-item">
              <i class="fas fa-code-branch"></i> فرع {{ log.branch_id }}
            </span>
          </div>

          <!-- Severity badge -->
          <span class="sev-badge" :class="log.severity">
            <i :class="severityIcon(log.severity)"></i>
            {{ severityLabel(log.severity) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="pagination">
      <button :disabled="meta.current_page <= 1" @click="goToPage(1)" title="الأولى">
        <i class="fas fa-angle-double-right"></i>
      </button>
      <button :disabled="meta.current_page <= 1" @click="goToPage(meta.current_page - 1)">
        <i class="fas fa-chevron-right"></i> السابق
      </button>

      <span class="page-info">
        صفحة <strong>{{ meta.current_page }}</strong> من <strong>{{ meta.last_page }}</strong>
        <small>({{ meta.total }} سجل)</small>
      </span>

      <button :disabled="meta.current_page >= meta.last_page" @click="goToPage(meta.current_page + 1)">
        التالي <i class="fas fa-chevron-left"></i>
      </button>
      <button :disabled="meta.current_page >= meta.last_page" @click="goToPage(meta.last_page)" title="الأخيرة">
        <i class="fas fa-angle-double-left"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import axios from 'axios';
import { API_BASE } from '../../src/js/config.js';

/* ============================================================
   State
   ============================================================ */
const logs = ref([]);
const summary = ref([]);
const availableActions = ref([]);
const loading = ref(false);
const page = ref(1);
const meta = reactive({ current_page: 1, last_page: 1, total: 0 });

const filters = reactive({
  q: '',
  action: '',
  severity: '',
  user_id: '',
  from: '',
  to: '',
});

const hasActiveFilters = computed(() => {
  return Object.values(filters).some(v => v !== '' && v !== null && v !== undefined);
});

/* ============================================================
   Labels & Icons
   ============================================================ */
const ACTION_LABELS = {
  // CRUD عام
  created: 'إنشاء',
  updated: 'تعديل',
  deleted: 'حذف',
  restored: 'استرجاع',

  // الورديات
  shift_opened: 'فتح وردية',
  shift_closed: 'إغلاق وردية',
  open: 'فتح وردية',
  close: 'إغلاق وردية',

  // المبيعات
  sale: 'بيع',
  refund: 'إرجاع',
  void_sale: 'إلغاء فاتورة',
  reprint: 'إعادة طباعة',

  // المالية
  withdraw: 'سحب نقدي',
  expense: 'مصروف',
  debt_payment: 'سداد دين',
  salary_paid: 'صرف راتب',

  // PIN
  pin_verified: 'تحقق PIN ناجح',
  pin_failed: 'محاولة PIN فاشلة',
  pin_set: 'تعيين PIN',
  pin_removed: 'إزالة PIN',

  // المصادقة
  login: 'تسجيل دخول',
  login_failed: 'محاولة دخول فاشلة',
  logout: 'تسجيل خروج',

  // المخزون
  batch_deleted: 'حذف دفعة',
  purchase_deleted: 'حذف فاتورة شراء',
  inventory_adjusted: 'تعديل مخزون',

  // الإعدادات
  settings_updated: 'تحديث إعدادات',
  backup_created: 'إنشاء نسخة احتياطية',
  backup_restored: 'استرجاع نسخة احتياطية',
};

const ICON_MAP = {
  created: 'fas fa-plus-circle',
  updated: 'fas fa-edit',
  deleted: 'fas fa-trash',
  restored: 'fas fa-undo',

  shift_opened: 'fas fa-door-open',
  shift_closed: 'fas fa-door-closed',
  open: 'fas fa-door-open',
  close: 'fas fa-door-closed',

  sale: 'fas fa-cash-register',
  refund: 'fas fa-undo',
  void_sale: 'fas fa-ban',
  reprint: 'fas fa-print',

  withdraw: 'fas fa-hand-holding-usd',
  expense: 'fas fa-receipt',
  debt_payment: 'fas fa-hand-holding-heart',
  salary_paid: 'fas fa-money-bill-wave',

  pin_verified: 'fas fa-key',
  pin_failed: 'fas fa-exclamation-triangle',
  pin_set: 'fas fa-lock',
  pin_removed: 'fas fa-unlock',

  login: 'fas fa-sign-in-alt',
  login_failed: 'fas fa-user-slash',
  logout: 'fas fa-sign-out-alt',

  batch_deleted: 'fas fa-boxes',
  purchase_deleted: 'fas fa-shopping-cart',
  inventory_adjusted: 'fas fa-balance-scale',

  settings_updated: 'fas fa-cog',
  backup_created: 'fas fa-database',
  backup_restored: 'fas fa-history',
};

const ROLE_LABELS = {
  admin: 'مدير',
  cashier: 'كاشير',
  pharmacist: 'صيدلي',
  manager: 'مسؤول',
};

const SEV_LABELS = {
  info: 'معلومة',
  warning: 'تحذير',
  critical: 'حرجة',
};

const SEV_ICONS = {
  info: 'fas fa-info-circle',
  warning: 'fas fa-exclamation-triangle',
  critical: 'fas fa-fire',
};

const labelFor = (action) => ACTION_LABELS[action] || action;
const iconFor = (action) => ICON_MAP[action] || 'fas fa-circle';
const roleLabel = (role) => ROLE_LABELS[role] || role;
const severityLabel = (s) => SEV_LABELS[s] || s;
const severityIcon = (s) => SEV_ICONS[s] || 'fas fa-circle';

const MODEL_LABELS = {
  'App\\Models\\Sale': 'فاتورة',
  'App\\Models\\Refund': 'إرجاع',
  'App\\Models\\Purchase': 'شراء',
  'App\\Models\\Medicine': 'دواء',
  'App\\Models\\MedicineBatch': 'دفعة',
  'App\\Models\\User': 'مستخدم',
  'App\\Models\\Expense': 'مصروف',
  'App\\Models\\Withdrawal': 'سحب',
  'App\\Models\\Debt': 'دين',
  'App\\Models\\Salary': 'راتب',
  'App\\Models\\Shift': 'وردية',
};

const modelLabel = (type) => {
  if (!type) return '';
  return MODEL_LABELS[type] || type.split('\\').pop();
};

/* ============================================================
   Field labels (for diff display)
   ============================================================ */
const FIELD_LABELS = {
  // أسماء ومعلومات
  name: 'الاسم',
  email: 'البريد الإلكتروني',
  phone: 'رقم الهاتف',
  address: 'العنوان',
  contact_person: 'الشخص المسؤول',
  role: 'الدور',
  salary: 'الراتب',
  is_active: 'حالة الحساب',
  notes: 'ملاحظات',
  reason: 'السبب',

  // الأدوية
  scientific_name: 'الاسم العلمي',
  category_id: 'التصنيف',
  pricing_method: 'طريقة التسعير',
  strips_per_box: 'شرائط بالعلبة',
  pieces_per_strip: 'حبات بالشريط',

  // الدفعات
  batch_number: 'رقم الدفعة',
  expiry_date: 'تاريخ الصلاحية',
  buy_price: 'سعر الشراء',
  sell_price: 'سعر البيع',
  remaining_quantity: 'الكمية المتبقية',
  quantity: 'الكمية',
  quantity_base: 'الكمية الأساسية',

  // الفواتير
  total_amount: 'الإجمالي',
  profit_amount: 'الربح',
  payment_method: 'طريقة الدفع',
  bank_name: 'البنك',
  bank_reference: 'رقم الحوالة',
  bank_transfer_date: 'تاريخ التحويل',
  bank_notes: 'ملاحظات التحويل',
  discount: 'الخصم',
  invoice_number: 'رقم الفاتورة',
  purchase_date: 'تاريخ الشراء',
  supplier_id: 'المورد',

  // الحقول المالية
  amount: 'المبلغ',
  paid_amount: 'المبلغ المدفوع',
  remaining_amount: 'المبلغ المتبقي',
  net_salary: 'صافي الراتب',
  allowances: 'البدلات',
  deductions: 'الخصومات',
  basic_salary: 'الراتب الأساسي',
  status: 'الحالة',
  paid_at: 'تاريخ الصرف',
  payment_method_label: 'طريقة الدفع',
  month: 'الشهر',
  year: 'السنة',

  // الورديات
  opening_cash: 'الرصيد الافتتاحي',
  closing_cash: 'الرصيد الفعلي',
  expected_cash: 'الرصيد المتوقع',
  cash_sales: 'المبيعات النقدية',
  card_sales: 'مبيعات البطاقة',
  refund_amount: 'المرتجعات',
  expenses_amount: 'المصروفات',
  withdraw_amount: 'السحوبات',
  debts_amount: 'سداد الديون',
  sales_count: 'عدد الفواتير',
  opened_at: 'وقت الفتح',
  closed_at: 'وقت الإغلاق',

  // المخزون
  quantity_changed: 'الكمية المتغيرة',
  type: 'النوع',

  // الإعدادات
  branch_id: 'الفرع',
  user_id: 'المستخدم',
  shift_id: 'الوردية',
};

// حقول لا تُعرض في الفروق
const SKIP_FIELDS = [
  'id', 'updated_at', 'created_at', 'deleted_at',
  'password', 'pin_hash', 'remember_token', 'email_verified_at',
  'two_factor_secret', 'two_factor_recovery_codes',
];

/* ============================================================
   Value formatters
   ============================================================ */
const formatValue = (val, field) => {
  if (val === null || val === undefined || val === '') return '—';

  // تواريخ
  if (field.includes('_at') || field.includes('date')) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('ar-EG', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    }
  }

  // منطقي
  if (typeof val === 'boolean') return val ? '✅ نعم' : '❌ لا';
  if (val === 1 || val === '1') return '✅ نعم';
  if (val === 0 || val === '0') return '❌ لا';

  // حالة الحساب
  if (field === 'is_active') {
    return Number(val) === 1 ? 'نشط' : 'معطّل';
  }

  // حالة الوردية
  if (field === 'status') {
    const map = {
      open: '🟢 مفتوحة',
      closed: '🔴 مغلقة',
      pending: '🟡 معلّق',
      paid: '✅ مدفوع',
      partial: '🟠 جزئي',
      completed: '✅ مكتمل',
      cancelled: '❌ ملغي',
    };
    return map[val] || val;
  }

  // طريقة الدفع
  if (field === 'payment_method') {
    const map = { cash: '💵 نقدي', bank: '🏦 بنكي', card: '💳 بطاقة' };
    return map[val] || val;
  }

  // نوع الحركة
  if (field === 'type') {
    const map = {
      purchase: 'شراء',
      sale: 'بيع',
      refund: 'إرجاع',
      adjust: 'تعديل',
      expense: 'مصروف',
      withdraw: 'سحب',
      debt_payment: 'سداد دين',
    };
    return map[val] || val;
  }

  // الدور
  if (field === 'role') {
    return roleLabel(val);
  }

  // المبالغ والأسعار
  if (
    field.includes('amount') ||
    field.includes('price') ||
    field.includes('total') ||
    field.includes('salary') ||
    field.includes('cash') ||
    field.includes('discount')
  ) {
    const num = Number(val);
    if (!isNaN(num)) {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }

  // JSON
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }

  return String(val);
};

/* ============================================================
   Diff builder
   ============================================================ */
const buildDiff = (log) => {
  const oldVals = log.old_values || {};
  const newVals = log.new_values || {};
  const rows = [];

  const allKeys = new Set([...Object.keys(oldVals), ...Object.keys(newVals)]);

  for (const key of allKeys) {
    if (SKIP_FIELDS.includes(key)) continue;

    const oldVal = oldVals[key];
    const newVal = newVals[key];

    // تجاهل الحقول التي لم تتغير فعلاً
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;

    rows.push({
      field: key,
      label: FIELD_LABELS[key] || key,
      old: formatValue(oldVal, key),
      new: formatValue(newVal, key),
    });
  }

  return rows;
};

const hasChanges = (log) => {
  return log.old_values || log.new_values;
};

const changeCount = (log) => buildDiff(log).length;

/* ============================================================
   Time formatting
   ============================================================ */
const relativeTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `قبل ${diffMins} د`;
  if (diffHours < 24) return `قبل ${diffHours} س`;
  if (diffDays < 7) return `قبل ${diffDays} ي`;

  return d.toLocaleDateString('ar-EG');
};

const fullDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ar-EG', {
    dateStyle: 'full',
    timeStyle: 'long',
  });
};

/* ============================================================
   Data loading
   ============================================================ */
let debounceTimer = null;
const debouncedLoad = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
    load();
  }, 350);
};

const reload = () => {
  page.value = 1;
  load();
};

const goToPage = (p) => {
  page.value = p;
  load();
};

const load = async () => {
  loading.value = true;
  try {
    const params = { page: page.value, per_page: 30 };
    Object.keys(filters).forEach(k => {
      if (filters[k]) params[k] = filters[k];
    });

    const res = await axios.get(`${API_BASE}/audit-logs`, { params });
    logs.value = res.data.data || [];
    Object.assign(meta, res.data.meta || {});
  } catch (e) {
    console.error('Audit log load failed:', e);
  } finally {
    loading.value = false;
  }
};

const loadSummary = async () => {
  try {
    const res = await axios.get(`${API_BASE}/audit-logs/summary`);
    summary.value = res.data.by_action || [];
  } catch (e) {
    console.warn('Summary load failed:', e);
  }
};

const loadFilters = async () => {
  try {
    const res = await axios.get(`${API_BASE}/audit-logs/filters`);
    availableActions.value = res.data.actions || [];
  } catch (e) {
    console.warn('Filters load failed:', e);
  }
};

const clearFilters = () => {
  filters.q = '';
  filters.action = '';
  filters.severity = '';
  filters.user_id = '';
  filters.from = '';
  filters.to = '';
  reload();
};

/* ============================================================
   Lifecycle
   ============================================================ */
onMounted(() => {
  load();
  loadSummary();
  loadFilters();
});
</script>

<style scoped>
.audit-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px;
}

/* ============== Header ============== */
.page-header {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
}
.page-header .icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #6d28d9, #a78bfa);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.page-header h2 {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
  color: #1e293b;
}
.page-header p {
  color: #64748b;
  font-size: 13px;
  margin: 4px 0 0;
}
.btn-refresh-header {
  margin-right: auto;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #6d28d9;
  cursor: pointer;
  transition: 0.2s;
}
.btn-refresh-header:hover:not(:disabled) {
  background: #f5f3ff;
  border-color: #6d28d9;
}
.btn-refresh-header:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============== Summary ============== */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}
.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: 0.2s;
}
.summary-card:hover {
  border-color: #a78bfa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.08);
}
.summary-card i {
  font-size: 20px;
  color: #6d28d9;
  width: 24px;
  text-align: center;
}
.summary-card .label {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}
.summary-card strong {
  display: block;
  font-size: 18px;
  color: #1e293b;
  font-weight: 800;
}

/* ============== Filters ============== */
.filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  align-items: center;
}
.filters input,
.filters select {
  padding: 9px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  min-width: 140px;
  color: #334155;
  background: #fff;
}
.filters input:focus,
.filters select:focus {
  outline: none;
  border-color: #6d28d9;
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.1);
}
.search-input {
  flex: 1;
  min-width: 220px;
}
.user-filter {
  max-width: 110px;
}
.btn-clear {
  padding: 9px 14px;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 700;
  transition: 0.2s;
}
.btn-clear:hover {
  background: #fecaca;
}

/* ============== Timeline ============== */
.timeline {
  position: relative;
  padding-right: 40px;
}
.timeline::before {
  content: '';
  position: absolute;
  right: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #e2e8f0 0%, #e2e8f0 95%, transparent);
}

.timeline-item {
  position: relative;
  padding: 16px 20px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: 0.2s;
}
.timeline-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.timeline-item.sev-warning {
  border-right: 4px solid #f59e0b;
}
.timeline-item.sev-critical {
  border-right: 4px solid #dc2626;
  background: #fef2f2;
}

.timeline-dot {
  position: absolute;
  right: -40px;
  top: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 2px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6d28d9;
  font-size: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  z-index: 1;
}
.sev-critical .timeline-dot {
  background: #fee2e2;
  color: #dc2626;
}
.sev-warning .timeline-dot {
  background: #fef3c7;
  color: #d97706;
}

/* ============== Timeline content ============== */
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 12px;
  flex-wrap: wrap;
}
.user {
  font-weight: 700;
  color: #1e293b;
  font-size: 13.5px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.user i {
  color: #6d28d9;
  font-size: 11px;
}
.user .role {
  color: #94a3b8;
  font-weight: 500;
  font-size: 12px;
}
.time {
  color: #94a3b8;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: help;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.action-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.action-badge.sev-warning {
  background: #fef3c7;
  color: #92400e;
}
.action-badge.sev-critical {
  background: #fee2e2;
  color: #991b1b;
}

.description {
  color: #334155;
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  flex: 1;
}

/* ============== Changes section ============== */
.changes-section {
  margin-top: 10px;
}
.changes-section details {
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}
.changes-section summary {
  cursor: pointer;
  padding: 10px 14px;
  font-size: 12.5px;
  font-weight: 700;
  color: #6d28d9;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: 0.15s;
}
.changes-section summary:hover {
  background: #f5f3ff;
}
.changes-section summary i {
  font-size: 11px;
}
.change-count {
  background: #ede9fe;
  color: #6d28d9;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  margin-right: auto;
}

/* ============== Diff table ============== */
.diff-table {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.diff-header {
  display: grid;
  grid-template-columns: 1.2fr 1.5fr 30px 1.5fr;
  gap: 10px;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid #e2e8f0;
}

.diff-row {
  display: grid;
  grid-template-columns: 1.2fr 1.5fr 30px 1.5fr;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #fff;
  border-radius: 8px;
  font-size: 12.5px;
  border: 1px solid #e2e8f0;
  transition: 0.15s;
}
.diff-row:hover {
  border-color: #cbd5e1;
  background: #fefeff;
}

.field-name {
  font-weight: 700;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  word-break: break-word;
}
.field-name i {
  color: #a78bfa;
  font-size: 10px;
  flex-shrink: 0;
}

.old-value {
  color: #94a3b8;
  text-decoration: line-through;
  text-align: center;
  word-break: break-word;
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 12px;
}

.new-value {
  color: #059669;
  font-weight: 700;
  text-align: center;
  word-break: break-word;
  padding: 4px 8px;
  background: #ecfdf5;
  border-radius: 6px;
  font-size: 12px;
}

.arrow {
  color: #cbd5e1;
  font-size: 10px;
  text-align: center;
}

.no-changes {
  text-align: center;
  color: #94a3b8;
  padding: 14px;
  font-size: 12.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* ============== Meta row ============== */
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
  font-size: 11.5px;
  color: #94a3b8;
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.meta-item i {
  color: #cbd5e1;
  font-size: 10px;
}

/* ============== Severity badge ============== */
.sev-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  margin-top: 8px;
}
.sev-badge.info {
  background: #dbeafe;
  color: #1e40af;
}
.sev-badge.warning {
  background: #fef3c7;
  color: #92400e;
}
.sev-badge.critical {
  background: #fee2e2;
  color: #991b1b;
}

/* ============== Pagination ============== */
.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  align-items: center;
  margin-top: 24px;
  padding: 12px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
}
.pagination button {
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  color: #475569;
  font-size: 13px;
  transition: 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.pagination button:hover:not(:disabled) {
  background: #f5f3ff;
  border-color: #6d28d9;
  color: #6d28d9;
}
.pagination button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.page-info {
  padding: 0 12px;
  font-size: 13px;
  color: #64748b;
}
.page-info strong {
  color: #1e293b;
}
.page-info small {
  color: #94a3b8;
  margin-right: 6px;
}

/* ============== States ============== */
.state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}
.state i {
  font-size: 42px;
  display: block;
  margin-bottom: 12px;
  color: #cbd5e1;
}
.state p {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 6px;
  color: #64748b;
}
.state small {
  font-size: 12.5px;
}

/* ============== Responsive ============== */
@media (max-width: 640px) {
  .page-header {
    flex-wrap: wrap;
  }
  .btn-refresh-header {
    margin-right: 0;
  }
  .diff-header,
  .diff-row {
    grid-template-columns: 1fr;
    text-align: right;
    gap: 6px;
  }
  .diff-header {
    display: none;
  }
  .diff-row {
    padding: 12px;
  }
  .old-value,
  .new-value {
    text-align: right;
  }
  .old-value::before {
    content: 'قبل: ';
    font-weight: 700;
    color: #64748b;
  }
  .new-value::before {
    content: 'بعد: ';
    font-weight: 700;
    color: #64748b;
  }
  .arrow {
    display: none;
  }
  .timeline {
    padding-right: 30px;
  }
  .timeline-dot {
    right: -32px;
    width: 26px;
    height: 26px;
    font-size: 10px;
  }
}
</style>