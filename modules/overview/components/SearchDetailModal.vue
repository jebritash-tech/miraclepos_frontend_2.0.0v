<template>
  <div v-if="show" class="sdm-overlay" @click.self="close">
    <div class="sdm-modal">
      <!-- Loading -->
      <div v-if="loading" class="sdm-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>جاري تحميل التفاصيل...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="sdm-state error">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>تعذر التحميل</h3>
        <p>{{ error }}</p>
        <button @click="close">إغلاق</button>
      </div>

      <!-- Content -->
      <div v-else-if="data" class="sdm-content">
        <!-- Header -->
        <div class="sdm-header" :class="'t-' + data.type">
          <div class="sdm-header-icon">
            <i :class="headerIcon"></i>
          </div>
          <div class="sdm-header-text">
            <h2>{{ headerTitle }}</h2>
            <p>{{ headerSubtitle }}</p>
          </div>
          <button class="sdm-close" @click="close"><i class="fas fa-times"></i></button>
        </div>

        <!-- Stats cards -->
        <div v-if="statsCards.length" class="sdm-stats">
          <div v-for="(s, i) in statsCards" :key="i" class="sdm-stat">
            <i :class="s.icon"></i>
            <div>
              <span class="sdm-stat-label">{{ s.label }}</span>
              <span class="sdm-stat-value" :class="s.color || ''">{{ s.value }}</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div v-if="tabs.length" class="sdm-tabs">
          <button
            v-for="t in tabs"
            :key="t.key"
            :class="{ active: activeTab === t.key }"
            @click="activeTab = t.key"
          >
            <i :class="t.icon"></i> {{ t.label }}
            <span v-if="t.count !== undefined" class="sdm-tab-count">{{ t.count }}</span>
          </button>
        </div>

        <!-- Sections -->
        <div class="sdm-body">
          <!-- Medicine: Stock -->
          <section v-if="activeTab === 'stock'" class="sdm-section">
            <table v-if="data.stock?.length" class="sdm-table">
              <thead><tr><th>الفرع</th><th>الكمية</th><th>الحد الأدنى</th><th>الحالة</th></tr></thead>
              <tbody>
                <tr v-for="s in data.stock" :key="s.branch_id">
                  <td>{{ s.branch_name }}</td>
                  <td>{{ s.quantity }}</td>
                  <td>{{ s.minimum_quantity }}</td>
                  <td>
                    <span class="sdm-badge" :class="s.is_low ? 'danger' : 'success'">
                      {{ s.is_low ? 'منخفض' : 'جيد' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-else class="sdm-empty">لا يوجد مخزون مسجل</p>
          </section>

          <!-- Medicine: Batches -->
          <section v-if="activeTab === 'batches'" class="sdm-section">
            <table v-if="data.batches?.length" class="sdm-table">
              <thead><tr><th>رقم الدفعة</th><th>الصلاحية</th><th>الكمية</th><th>المتبقي</th><th>سعر الشراء</th></tr></thead>
              <tbody>
                <tr v-for="b in data.batches" :key="b.id">
                  <td>{{ b.batch_number || '—' }}</td>
                  <td>
                    <span :class="{ expired: b.is_expired }">{{ b.expiry_date || '—' }}</span>
                  </td>
                  <td>{{ b.quantity }}</td>
                  <td><strong>{{ b.remaining_quantity }}</strong></td>
                  <td>{{ formatCurrency(b.buy_price) }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="sdm-empty">لا توجد دفعات</p>
          </section>

          <!-- Medicine: Purchases / Supplier purchases -->
          <section v-if="activeTab === 'purchases'" class="sdm-section">
            <table v-if="(data.purchases || data.purchases)?.length" class="sdm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th v-if="data.type === 'medicine'">المورد</th>
                  <th v-if="data.type === 'supplier'">التاريخ</th>
                  <th v-if="data.type === 'medicine'">الكمية</th>
                  <th v-if="data.type === 'medicine'">سعر الشراء</th>
                  <th v-if="data.type === 'medicine'">الإجمالي</th>
                  <th v-if="data.type === 'supplier'">إجمالي الفاتورة</th>
                  <th v-if="data.type === 'supplier'">عدد الأصناف</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in data.purchases" :key="p.id">
                  <td>{{ p.id }}</td>
                  <template v-if="data.type === 'medicine'">
                    <td>{{ p.supplier_name || '—' }}</td>
                    <td>{{ p.quantity }}</td>
                    <td>{{ formatCurrency(p.buy_price) }}</td>
                    <td><strong>{{ formatCurrency(p.subtotal) }}</strong></td>
                  </template>
                  <template v-else>
                    <td>{{ p.purchase_date }}</td>
                    <td><strong>{{ formatCurrency(p.total_amount) }}</strong></td>
                    <td>{{ p.items_count }}</td>
                  </template>
                </tr>
              </tbody>
            </table>
            <p v-else class="sdm-empty">لا توجد مشتريات</p>
          </section>

          <!-- Medicine: Sales -->
          <section v-if="activeTab === 'sales'" class="sdm-section">
            <table v-if="data.sales?.length" class="sdm-table">
              <thead>
                <tr>
                  <th>فاتورة</th>
                  <th v-if="data.type === 'medicine'">الكمية</th>
                  <th v-if="data.type === 'medicine'">السعر</th>
                  <th>الإجمالي</th>
                  <th>الموظف</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in data.sales" :key="s.id">
                  <td>#{{ s.sale_id }}</td>
                  <td v-if="data.type === 'medicine'">{{ s.quantity }}</td>
                  <td v-if="data.type === 'medicine'">{{ formatCurrency(s.price) }}</td>
                  <td>
                    <strong v-if="data.type === 'medicine'">{{ formatCurrency(s.quantity * s.price) }}</strong>
                    <strong v-else>{{ formatCurrency(s.total_amount) }}</strong>
                  </td>
                  <td>{{ s.user_name || '—' }}</td>
                  <td>{{ formatDateTime(s.created_at) }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="sdm-empty">لا توجد مبيعات</p>
          </section>

          <!-- Supplier list (medicine view) -->
          <section v-if="activeTab === 'suppliers'" class="sdm-section">
            <div v-if="data.suppliers?.length" class="sdm-cards">
              <div v-for="s in data.suppliers" :key="s.id" class="sdm-card">
                <i class="fas fa-truck"></i>
                <div>
                  <strong>{{ s.name }}</strong>
                  <small v-if="s.phone">{{ s.phone }}</small>
                </div>
              </div>
            </div>
            <p v-else class="sdm-empty">لا يوجد موردون</p>
          </section>

          <!-- Category: medicines list -->
          <section v-if="activeTab === 'medicines'" class="sdm-section">
            <table v-if="data.medicines?.length" class="sdm-table">
              <thead><tr><th>#</th><th>الدواء</th><th>الاسم العلمي</th><th>المخزون</th></tr></thead>
              <tbody>
                <tr v-for="(m, i) in data.medicines" :key="m.id">
                  <td>{{ i + 1 }}</td>
                  <td><strong>{{ m.name }}</strong></td>
                  <td>{{ m.scientific_name || '—' }}</td>
                  <td>{{ m.current_stock }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="sdm-empty">لا توجد أدوية في هذا التصنيف</p>
          </section>

          <!-- User: shifts -->
          <section v-if="activeTab === 'shifts'" class="sdm-section">
            <table v-if="data.shifts?.length" class="sdm-table">
              <thead><tr><th>#</th><th>فتح</th><th>إغلاق</th><th>مبيعات نقدية</th><th>بطاقة</th><th>الحالة</th></tr></thead>
              <tbody>
                <tr v-for="s in data.shifts" :key="s.id">
                  <td>{{ s.id }}</td>
                  <td>{{ formatDateTime(s.opened_at) }}</td>
                  <td>{{ s.closed_at ? formatDateTime(s.closed_at) : '—' }}</td>
                  <td>{{ formatCurrency(s.cash_sales) }}</td>
                  <td>{{ formatCurrency(s.card_sales) }}</td>
                  <td>
                    <span class="sdm-badge" :class="s.status === 'open' ? 'success' : 'info'">
                      {{ s.status === 'open' ? 'مفتوحة' : 'مغلقة' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-else class="sdm-empty">لا توجد ورديات</p>
          </section>

          <!-- User: expenses -->
          <section v-if="activeTab === 'expenses'" class="sdm-section">
            <table v-if="data.expenses?.length" class="sdm-table">
              <thead><tr><th>#</th><th>البيان</th><th>المبلغ</th><th>التاريخ</th></tr></thead>
              <tbody>
                <tr v-for="e in data.expenses" :key="e.id">
                  <td>{{ e.id }}</td>
                  <td>{{ e.title }}</td>
                  <td>{{ formatCurrency(e.amount) }}</td>
                  <td>{{ formatDateTime(e.created_at) }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="sdm-empty">لا توجد مصروفات</p>
          </section>

          <!-- User: withdrawals -->
          <section v-if="activeTab === 'withdrawals'" class="sdm-section">
            <table v-if="data.withdrawals?.length" class="sdm-table">
              <thead><tr><th>#</th><th>المبلغ</th><th>السبب</th><th>التاريخ</th></tr></thead>
              <tbody>
                <tr v-for="w in data.withdrawals" :key="w.id">
                  <td>{{ w.id }}</td>
                  <td>{{ formatCurrency(w.amount) }}</td>
                  <td>{{ w.reason }}</td>
                  <td>{{ formatDateTime(w.created_at) }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="sdm-empty">لا توجد سحوبات</p>
          </section>

          <!-- User: salaries -->
          <section v-if="activeTab === 'salaries'" class="sdm-section">
            <table v-if="data.salaries?.length" class="sdm-table">
              <thead><tr><th>الشهر</th><th>السنة</th><th>الصافي</th><th>الحالة</th></tr></thead>
              <tbody>
                <tr v-for="s in data.salaries" :key="s.id">
                  <td>{{ s.month }}</td>
                  <td>{{ s.year }}</td>
                  <td>{{ formatCurrency(s.net_salary) }}</td>
                  <td>
                    <span class="sdm-badge" :class="s.status === 'paid' ? 'success' : 'warning'">
                      {{ s.status === 'paid' ? 'مدفوع' : 'معلق' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-else class="sdm-empty">لا توجد رواتب</p>
          </section>

          <!-- Batch: sales -->
          <section v-if="activeTab === 'batch_sales'" class="sdm-section">
            <table v-if="data.sales?.length" class="sdm-table">
              <thead><tr><th>فاتورة</th><th>الكمية</th><th>السعر</th><th>الموظف</th><th>التاريخ</th></tr></thead>
              <tbody>
                <tr v-for="s in data.sales" :key="s.id">
                  <td>#{{ s.sale_id }}</td>
                  <td>{{ s.quantity }}</td>
                  <td>{{ formatCurrency(s.price) }}</td>
                  <td>{{ s.user_name }}</td>
                  <td>{{ formatDateTime(s.created_at) }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="sdm-empty">لا توجد مبيعات لهذه الدفعة</p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  show: Boolean,
  type: String,   // 'medicine' | 'sale' | 'supplier' | ...
  id:   Number,
  data: Object,   // البيانات الجاهزة (اختياري، للاستخدام المباشر)
  loading: Boolean,
  error: String,
});
const emit = defineEmits(['close']);

const activeTab = ref('');

// ===== العنوان =====
const headerIcon = computed(() => ({
  medicine: 'fas fa-pills', sale: 'fas fa-receipt', supplier: 'fas fa-truck',
  category: 'fas fa-tags', user: 'fas fa-user', batch: 'fas fa-boxes',
}[props.type] || 'fas fa-info-circle'));

const headerTitle = computed(() => {
  const d = props.data;
  if (!d) return '';
  return ({
    medicine: d.medicine?.name,
    sale:     `فاتورة #${d.sale?.id}`,
    supplier: d.supplier?.name,
    category: d.category?.name,
    user:     d.user?.name,
    batch:    `دفعة ${d.batch?.batch_number || d.batch?.id}`,
  }[d.type]) || '';
});

const headerSubtitle = computed(() => {
  const d = props.data;
  if (!d) return '';
  return ({
    medicine: d.medicine?.scientific_name || d.medicine?.category?.name || 'دواء',
    sale:     d.sale?.user?.name || '',
    supplier: d.supplier?.phone || 'مورد',
    category: 'تصنيف',
    user:     d.user?.email || '',
    batch:    d.batch?.medicine?.name || '',
  }[d.type]) || '';
});

// ===== بطاقات الإحصائيات =====
const statsCards = computed(() => {
  const d = props.data;
  if (!d?.stats) return [];

  if (d.type === 'medicine') return [
    { icon: 'fas fa-boxes',      label: 'المخزون الحالي',   value: formatNumber(d.stats.current_stock), color: 'emerald' },
    { icon: 'fas fa-shopping-cart', label: 'إجمالي المشتريات', value: formatNumber(d.stats.total_purchased) },
    { icon: 'fas fa-cash-register', label: 'إجمالي المبيعات',  value: formatNumber(d.stats.total_sold), color: 'blue' },
    { icon: 'fas fa-coins',       label: 'إجمالي الإيراد',    value: formatCurrency(d.stats.total_revenue), color: 'emerald' },
    { icon: 'fas fa-chart-line',  label: 'إجمالي الربح',     value: formatCurrency(d.stats.total_profit), color: 'emerald' },
    { icon: 'fas fa-truck',       label: 'الموردون',         value: d.stats.suppliers_count },
  ];

  if (d.type === 'supplier') return [
    { icon: 'fas fa-file-invoice', label: 'عدد الفواتير', value: d.stats.total_purchases },
    { icon: 'fas fa-dollar-sign',  label: 'إجمالي المبالغ', value: formatCurrency(d.stats.total_amount), color: 'emerald' },
    { icon: 'fas fa-boxes',        label: 'إجمالي الأصناف', value: formatNumber(d.stats.total_items), color: 'blue' },
  ];

  if (d.type === 'category') return [
    { icon: 'fas fa-pills', label: 'عدد الأدوية', value: d.stats.medicines_count, color: 'blue' },
  ];

  if (d.type === 'user') return [
    { icon: 'fas fa-file-invoice-dollar', label: 'إجمالي المبيعات', value: formatCurrency(d.stats.total_sales), color: 'emerald' },
    { icon: 'fas fa-receipt',             label: 'عدد الفواتير',   value: d.stats.invoices_count, color: 'blue' },
    { icon: 'fas fa-chart-line',          label: 'إجمالي الربح',    value: formatCurrency(d.stats.total_profit), color: 'emerald' },
    { icon: 'fas fa-clock',               label: 'عدد الورديات',   value: d.stats.shifts_count },
    { icon: 'fas fa-receipt',             label: 'مصروفات',         value: formatCurrency(d.stats.expenses_total), color: 'red' },
    { icon: 'fas fa-hand-holding-usd',    label: 'سحوبات',          value: formatCurrency(d.stats.withdrawals_total), color: 'red' },
  ];

  if (d.type === 'batch') return [
    { icon: 'fas fa-box',  label: 'الكمية الأصلية', value: formatNumber(d.batch.quantity) },
    { icon: 'fas fa-boxes', label: 'المتبقي',        value: formatNumber(d.batch.remaining_quantity), color: 'emerald' },
    { icon: 'fas fa-cash-register', label: 'المباع', value: formatNumber(d.stats.sold_quantity), color: 'blue' },
    { icon: 'fas fa-coins', label: 'الإيراد',       value: formatCurrency(d.stats.revenue), color: 'emerald' },
  ];

  return [];
});

// ===== التبويبات =====
const tabs = computed(() => {
  const d = props.data;
  if (!d) return [];

  if (d.type === 'medicine') return [
    { key: 'stock',     label: 'المخزون',   icon: 'fas fa-warehouse', count: d.stock?.length || 0 },
    { key: 'batches',   label: 'الدفعات',   icon: 'fas fa-boxes',     count: d.batches?.length || 0 },
    { key: 'purchases', label: 'المشتريات', icon: 'fas fa-shopping-cart', count: d.purchases?.length || 0 },
    { key: 'sales',     label: 'المبيعات',  icon: 'fas fa-cash-register', count: d.sales?.length || 0 },
    { key: 'suppliers', label: 'الموردون',  icon: 'fas fa-truck',     count: d.suppliers?.length || 0 },
  ];

  if (d.type === 'supplier') return [
    { key: 'purchases', label: 'الفواتير', icon: 'fas fa-file-invoice', count: d.purchases?.length || 0 },
  ];

  if (d.type === 'category') return [
    { key: 'medicines', label: 'الأدوية', icon: 'fas fa-pills', count: d.medicines?.length || 0 },
  ];

  if (d.type === 'user') return [
    { key: 'shifts',      label: 'الورديات', icon: 'fas fa-clock', count: d.shifts?.length || 0 },
    { key: 'sales',       label: 'المبيعات', icon: 'fas fa-cash-register', count: d.sales?.length || 0 },
    { key: 'expenses',    label: 'المصروفات', icon: 'fas fa-receipt', count: d.expenses?.length || 0 },
    { key: 'withdrawals', label: 'السحوبات', icon: 'fas fa-hand-holding-usd', count: d.withdrawals?.length || 0 },
    { key: 'salaries',    label: 'الرواتب', icon: 'fas fa-money-bill-wave', count: d.salaries?.length || 0 },
  ];

  if (d.type === 'batch') return [
    { key: 'batch_sales', label: 'المبيعات', icon: 'fas fa-cash-register', count: d.sales?.length || 0 },
  ];

  return [];
});

watch(() => props.data, (d) => {
  const firstTab = tabs.value[0]?.key;
  if (firstTab) activeTab.value = firstTab;
}, { immediate: true });

// ===== Helpers =====
const formatCurrency = (v) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatNumber = (v) => Number(v || 0).toLocaleString('en-US');
const formatDateTime = (iso) => {
  if (!iso) return '—';
  const dt = new Date(iso);
  return dt.toLocaleDateString('ar-EG') + ' ' + dt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
};

const close = () => emit('close');
</script>

<style scoped>
.sdm-overlay {
  position: fixed; inset: 0;
  background: rgba(11,26,46,0.65);
  backdrop-filter: blur(6px);
  z-index: 99999;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.sdm-modal {
  background: #fff; width: 100%; max-width: 1000px;
  max-height: 92vh; border-radius: 22px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.3);
  overflow: hidden; display: flex; flex-direction: column;
}
.sdm-content { display: flex; flex-direction: column; max-height: 92vh; overflow: hidden; }

.sdm-header {
  display: flex; align-items: center; gap: 16px;
  padding: 22px 26px;
  background: linear-gradient(135deg, #0f5b7a, #1ba7c2);
  color: #fff; position: relative; flex-shrink: 0;
}
.sdm-header.t-sale     { background: linear-gradient(135deg, #065f46, #10b981); }
.sdm-header.t-supplier { background: linear-gradient(135deg, #5b21b6, #7c3aed); }
.sdm-header.t-category { background: linear-gradient(135deg, #92400e, #d97706); }
.sdm-header.t-user     { background: linear-gradient(135deg, #1e3a8a, #3b82f6); }
.sdm-header.t-batch    { background: linear-gradient(135deg, #0f766e, #14b8a6); }

.sdm-header-icon {
  width: 52px; height: 52px; border-radius: 14px;
  background: rgba(255,255,255,0.18);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; flex-shrink: 0;
}
.sdm-header-text { flex: 1; }
.sdm-header-text h2 { font-size: 20px; font-weight: 800; margin: 0; }
.sdm-header-text p  { margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.85); }

.sdm-close {
  width: 40px; height: 40px; border-radius: 50%;
  border: none; background: rgba(255,255,255,0.15);
  color: #fff; font-size: 16px; cursor: pointer;
  transition: 0.25s;
}
.sdm-close:hover { background: rgba(255,255,255,0.28); transform: rotate(90deg); }

/* Stats */
.sdm-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px; padding: 18px 26px 0; flex-shrink: 0;
}
.sdm-stat {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; border-radius: 12px;
  background: #f8fafc; border: 1px solid #e2e8f0;
}
.sdm-stat i { font-size: 18px; color: #64748b; width: 22px; text-align: center; }
.sdm-stat-label { display: block; font-size: 11px; color: #94a3b8; font-weight: 600; }
.sdm-stat-value { display: block; font-size: 15px; color: #1e293b; font-weight: 800; }
.sdm-stat-value.emerald { color: #059669; }
.sdm-stat-value.blue    { color: #2563eb; }
.sdm-stat-value.red     { color: #dc2626; }

/* Tabs */
.sdm-tabs {
  display: flex; gap: 6px; padding: 18px 26px 0;
  border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
  overflow-x: auto;
}
.sdm-tabs::-webkit-scrollbar { height: 4px; }
.sdm-tabs::-webkit-scrollbar-thumb { background: #cbd5e1; }
.sdm-tabs button {
  padding: 10px 16px; border: none; background: transparent;
  color: #64748b; font-weight: 700; font-size: 13px;
  cursor: pointer; border-bottom: 3px solid transparent;
  transition: 0.2s; white-space: nowrap;
  font-family: inherit; display: inline-flex; align-items: center; gap: 6px;
}
.sdm-tabs button.active { color: #0f5b7a; border-color: #1ba7c2; }
.sdm-tabs button:hover { color: #0f5b7a; }
.sdm-tab-count {
  background: #e2e8f0; color: #475569;
  padding: 1px 8px; border-radius: 10px;
  font-size: 11px; font-weight: 800;
}
.sdm-tabs button.active .sdm-tab-count {
  background: #dbeafe; color: #1e40af;
}

/* Body */
.sdm-body {
  flex: 1; overflow-y: auto; padding: 20px 26px 26px;
}
.sdm-body::-webkit-scrollbar { width: 8px; }
.sdm-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

.sdm-section { animation: sdmFade 0.25s ease; }
@keyframes sdmFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.sdm-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.sdm-table thead { background: #f8fafc; }
.sdm-table th {
  text-align: right; padding: 11px 12px;
  color: #64748b; font-weight: 700; font-size: 12px;
  border-bottom: 1px solid #e2e8f0;
}
.sdm-table td {
  padding: 11px 12px; border-bottom: 1px solid #f1f5f9;
  color: #334155;
}
.sdm-table tr:hover { background: #f8fafc; }
.sdm-table td strong { color: #0f5b7a; }
.sdm-table .expired { color: #dc2626; font-weight: 700; }

.sdm-badge {
  display: inline-block; padding: 3px 10px;
  border-radius: 12px; font-size: 11px; font-weight: 700;
}
.sdm-badge.success { background: #d1fae5; color: #065f46; }
.sdm-badge.danger  { background: #fee2e2; color: #991b1b; }
.sdm-badge.warning { background: #fef3c7; color: #92400e; }
.sdm-badge.info    { background: #dbeafe; color: #1e40af; }

.sdm-empty {
  text-align: center; color: #94a3b8;
  padding: 30px 0; font-size: 13px;
}

.sdm-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.sdm-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-radius: 12px;
  background: #f8fafc; border: 1px solid #e2e8f0;
}
.sdm-card i { color: #7c3aed; font-size: 20px; }
.sdm-card strong { display: block; color: #1e293b; }
.sdm-card small { color: #94a3b8; font-size: 11px; }

/* State */
.sdm-state {
  padding: 60px 30px; text-align: center;
  color: #64748b; font-size: 14px;
}
.sdm-state i { font-size: 42px; color: #1ba7c2; margin-bottom: 14px; display: block; }
.sdm-state.error i { color: #dc2626; }
.sdm-state h3 { color: #1e293b; font-weight: 800; margin-bottom: 6px; }
.sdm-state button {
  margin-top: 16px; padding: 10px 24px; border-radius: 12px;
  background: #e2e8f0; color: #475569; border: none;
  font-weight: 700; cursor: pointer; font-family: inherit;
}

@media (max-width: 640px) {
  .sdm-modal { max-height: 100vh; border-radius: 0; }
  .sdm-header { padding: 16px 18px; }
  .sdm-header-text h2 { font-size: 17px; }
  .sdm-stats { grid-template-columns: 1fr 1fr; padding: 14px 16px 0; }
  .sdm-tabs { padding: 14px 16px 0; }
  .sdm-body { padding: 16px; }
  .sdm-table th, .sdm-table td { padding: 8px 6px; font-size: 12px; }
}
</style>