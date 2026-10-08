<!-- modules/overview/components/TableAndAlerts.vue -->
<template>
  <!-- الصف الأول: الأكثر مبيعاً + التنبيهات -->
  <div class="row-grid">
    <!-- ✅ الأكثر مبيعاً (مع ترقيم) -->
    <div class="panel table-wrap">
      <div class="panel-header">
        <h3><i class="fas fa-fire" style="color:#e67e22;"></i> الأكثر مبيعاً</h3>
        <span class="count-chip" v-if="topMedicines && topMedicines.length">
          {{ topMedicines.length }} صنف
        </span>
      </div>

      <table v-if="paginatedTopMedicines.length">
        <thead>
          <tr><th>#</th><th>المنتج</th><th>الكمية</th><th>الحالة</th></tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in paginatedTopMedicines" :key="item.name + idx">
            <td class="rank-cell">{{ (topMedicinesPage - 1) * PER_PAGE + idx + 1 }}</td>
            <td><strong>{{ item.name }}</strong></td>
            <td class="qty-cell">{{ item.quantity }}</td>
            <td>
              <span class="badge" :class="{
                'success': item.status === 'متوفر',
                'warning': item.status === 'منخفض',
                'danger':  item.status === 'نفد'
              }">{{ item.status }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else class="empty-row">لا توجد بيانات</p>

      <Paginator
        v-model:page="topMedicinesPage"
        :total="topMedicines?.length || 0"
        :per-page="PER_PAGE"
      />
    </div>

    <!-- التنبيهات (بدون ترقيم - تمرير داخلي) -->
    <div class="panel" id="alerts-section">
      <div class="panel-header">
        <h3><i class="fas fa-bell" style="color:#e74c3c;"></i> التنبيهات</h3>
        <span class="badge" v-if="alerts && alerts.length">{{ alerts.length }}</span>
      </div>
      <div class="alerts-scroll">
        <div v-for="alert in alerts" :key="alert.id" class="alert-item">
          <div class="alert-dot" :style="{ color: alert.color, background: alert.color }"></div>
          <div class="alert-text">
            <h4>{{ alert.title }}</h4>
            <p>{{ alert.desc }}</p>
          </div>
          <span class="badge" :class="{
            'danger':  alert.severity === 'عاجل',
            'warning': alert.severity === 'انتباه',
            'info':    alert.severity === 'تنبيه',
            'success': alert.severity === 'تم'
          }">{{ alert.severity }}</span>
        </div>
        <div v-if="!alerts || alerts.length === 0" class="empty-alert">
          <i class="fas fa-check-circle text-2xl block mb-2 text-emerald-400"></i>
          لا توجد تنبيهات حالياً
        </div>
      </div>
    </div>
  </div>

  <!-- الصف الثاني: الأكثر ربحية + فواتير اليوم -->
  <div class="row-grid" style="margin-top: 25px;">
    <!-- ✅ الأكثر ربحية (مع ترقيم) -->
    <div class="panel table-wrap">
      <div class="panel-header">
        <h3><i class="fas fa-coins" style="color:#2ecc71;"></i> الأكثر ربحية</h3>
        <span class="count-chip" v-if="topProfit && topProfit.length">
          {{ topProfit.length }} صنف
        </span>
      </div>

      <table v-if="paginatedTopProfit.length">
        <thead>
          <tr><th>#</th><th>المنتج</th><th>الربح</th></tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in paginatedTopProfit" :key="item.name + idx">
            <td class="rank-cell">{{ (topProfitPage - 1) * PER_PAGE + idx + 1 }}</td>
            <td><strong>{{ item.name }}</strong></td>
            <td class="profit-cell">{{ formatCurrency(item.profit) }} ج.س</td>
          </tr>
        </tbody>
      </table>

      <p v-else class="empty-row">لا توجد بيانات كافية</p>

      <Paginator
        v-model:page="topProfitPage"
        :total="topProfit?.length || 0"
        :per-page="PER_PAGE"
      />
    </div>

    <!-- ✅ فواتير اليوم (مع ترقيم) -->
    <div class="panel" id="today-invoices-section">
      <div class="panel-header">
        <h3><i class="fas fa-receipt" style="color:#3498db;"></i> فواتير اليوم</h3>
        <span class="count-chip blue" v-if="todayInvoices && todayInvoices.length">
          {{ todayInvoices.length }} فاتورة
        </span>
      </div>

      <div class="invoices-scroll">
        <div
          v-for="inv in paginatedInvoices"
          :key="inv.id"
          class="invoice-item clickable"
          @click="$emit('invoice-click', inv.id)"
          :title="`اضغط لعرض تفاصيل الفاتورة #${inv.id}`"
        >
          <div class="inv-header">
            <span class="inv-id">فاتورة #{{ inv.id }}</span>
            <span class="inv-amount">{{ formatCurrency(inv.total_amount) }} ج.س</span>
          </div>
          <div class="inv-meta">
            <span class="inv-payment" :class="inv.payment_method === 'cash' ? 'cash' : 'bank'">
              <i :class="inv.payment_method === 'cash' ? 'fas fa-money-bill-wave' : 'fas fa-university'"></i>
              {{ inv.payment_method === 'cash' ? 'نقدي' : 'بنكي' }}
            </span>
            <span class="inv-time"><i class="far fa-clock"></i> {{ inv.created_at }}</span>
            <span v-if="inv.is_refunded" class="inv-refunded">
              <i class="fas fa-undo"></i> مرتجعة
            </span>
          </div>
          <div v-if="inv.payment_method === 'bank' && inv.bank_reference" class="inv-bank-info">
            <i class="fas fa-info-circle"></i>
            {{ inv.bank_name }} — رقم {{ inv.bank_reference }}
          </div>
          <div v-if="inv.bank_notes" class="inv-notes">
            <i class="fas fa-sticky-note"></i> {{ inv.bank_notes }}
          </div>
        </div>

        <div v-if="!todayInvoices || todayInvoices.length === 0" class="empty-alert">
          <i class="fas fa-receipt text-2xl block mb-2 opacity-30"></i>
          لا توجد فواتير اليوم بعد
        </div>
      </div>

      <Paginator
        v-model:page="invoicesPage"
        :total="todayInvoices?.length || 0"
        :per-page="PER_PAGE"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Paginator from './Paginator.vue';

const props = defineProps({
  topMedicines:  { type: Array, default: () => [] },
  alerts:        { type: Array, default: () => [] },
  topProfit:     { type: Array, default: () => [] },
  todayInvoices: { type: Array, default: () => [] },
});

defineEmits(['invoice-click']);

// عدد العناصر في الصفحة الواحدة
const PER_PAGE = 5;

// حالة الصفحة لكل جدول (مستقلة)
const topMedicinesPage = ref(1);
const topProfitPage    = ref(1);
const invoicesPage     = ref(1);

// دوال مساعدة
const paginate = (items, page) => {
  const start = (page - 1) * PER_PAGE;
  return (items || []).slice(start, start + PER_PAGE);
};

// القوائم المرقّمة
const paginatedTopMedicines = computed(() => paginate(props.topMedicines, topMedicinesPage.value));
const paginatedTopProfit    = computed(() => paginate(props.topProfit, topProfitPage.value));
const paginatedInvoices     = computed(() => paginate(props.todayInvoices, invoicesPage.value));

// ✅ إعادة تعيين الصفحة إلى 1 عند تغير البيانات (تحديث تلقائي كل 30 ثانية)
watch(() => props.topMedicines,  () => { topMedicinesPage.value = 1; });
watch(() => props.topProfit,     () => { topProfitPage.value = 1; });
watch(() => props.todayInvoices, () => { invoicesPage.value = 1; });

// ✅ ضبط الصفحة إذا تجاوزت الحد الأقصى (مثلاً بعد حذف عناصر)
watch(() => props.topMedicines?.length, (len) => {
  const max = Math.max(1, Math.ceil((len || 0) / PER_PAGE));
  if (topMedicinesPage.value > max) topMedicinesPage.value = max;
});
watch(() => props.topProfit?.length, (len) => {
  const max = Math.max(1, Math.ceil((len || 0) / PER_PAGE));
  if (topProfitPage.value > max) topProfitPage.value = max;
});
watch(() => props.todayInvoices?.length, (len) => {
  const max = Math.max(1, Math.ceil((len || 0) / PER_PAGE));
  if (invoicesPage.value > max) invoicesPage.value = max;
});
watch(() => props.topMedicines, () => { topMedicinesPage.value = 1; });
const formatCurrency = (v) => Number(v || 0).toLocaleString();
</script>

<style scoped>
/* ========== رأس الجدول + Chip ========== */
.count-chip {
  background: #fff7ed;
  color: #c2410c;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 800;
}
.count-chip.blue {
  background: #dbeafe;
  color: #1e40af;
}

/* ========== الجداول ========== */
table {
  width: 100%;
  border-collapse: collapse;
}
thead {
  background: #f8fafc;
}
th {
  text-align: right;
  padding: 10px 8px;
  color: #64748b;
  font-weight: 700;
  font-size: 11.5px;
  border-bottom: 1px solid #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
td {
  padding: 11px 8px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  color: #334155;
}
tbody tr {
  transition: background 0.15s;
}
tbody tr:hover {
  background: #f8fafc;
}
.rank-cell {
  color: #94a3b8;
  font-weight: 700;
  width: 36px;
  text-align: center;
}
.qty-cell {
  font-weight: 700;
  color: #0f5b7a;
}
.profit-cell {
  color: #16a34a;
  font-weight: 700;
}

/* ========== Empty states ========== */
.empty-row {
  text-align: center;
  color: #94a3b8;
  padding: 24px 0;
  font-size: 13px;
}
.empty-alert {
  text-align: center;
  color: #94a3b8;
  padding: 24px 0;
  font-size: 13px;
}

/* ========== التنبيهات - تمرير داخلي ========== */
.alerts-scroll {
  max-height: 340px;
  overflow-y: auto;
  padding-left: 4px;
}
.alerts-scroll::-webkit-scrollbar { width: 6px; }
.alerts-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

/* ========== فواتير اليوم - تمرير داخلي ========== */
.invoices-scroll {
  max-height: 400px;
  overflow-y: auto;
  padding-left: 4px;
}
.invoices-scroll::-webkit-scrollbar { width: 6px; }
.invoices-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.invoice-item {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 10px;
  background: #f8fafc;
  transition: all 0.2s ease;
}
.invoice-item:hover {
  background: #fff;
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.inv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.inv-id {
  font-weight: 700;
  color: #334155;
  font-size: 14px;
}
.inv-amount {
  font-weight: 800;
  color: #059669;
  font-size: 15px;
}
.inv-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
}
.inv-payment {
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.inv-payment.cash { background: #d1fae5; color: #065f46; }
.inv-payment.bank { background: #dbeafe; color: #1e40af; }
.inv-time {
  color: #64748b;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.inv-refunded {
  background: #fee2e2;
  color: #991b1b;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 700;
}
.inv-bank-info,
.inv-notes {
  margin-top: 6px;
  font-size: 11px;
  color: #475569;
  background: #f1f5f9;
  padding: 6px 10px;
  border-radius: 8px;
}
.inv-notes {
  background: #fef3c7;
  color: #78350f;
}

/* ========== مؤشر النقر (الفواتير قابلة للنقر) ========== */
.invoice-item.clickable {
  cursor: pointer;
  position: relative;
}
.invoice-item.clickable::after {
  content: '\f06e';
  font-family: 'Font Awesome 6 Free';
  font-weight: 900;
  position: absolute;
  top: 12px;
  left: 12px;
  font-size: 11px;
  color: #94a3b8;
  opacity: 0;
  transition: opacity 0.2s;
}
.invoice-item.clickable:hover::after {
  opacity: 1;
}
.invoice-item.clickable:hover {
  background: #fff;
  border-color: #1ba7c2;
  transform: translateX(-3px);
  box-shadow: 0 6px 16px rgba(27, 167, 194, 0.15);
}

/* ========== Badge info ========== */
.badge.info {
  background: #3498db;
  color: #fff;
}
</style>