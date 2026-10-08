<!-- modules/overview/components/SaleDetailsModal.vue -->
<template>
  <div v-if="show" class="sale-details-overlay" @click.self="close">
    <div class="sale-details-modal">
      <!-- Loading -->
      <div v-if="loading" class="modal-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>جاري تحميل تفاصيل الفاتورة...</p>
      </div>

      <!-- Content -->
      <div v-else-if="sale" class="modal-body">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-left">
            <div class="icon-badge">
              <i class="fas fa-receipt"></i>
            </div>
            <div>
              <h2>فاتورة #{{ sale.id }}</h2>
              <p class="subtitle">
                <i class="far fa-calendar"></i> {{ formatDate(sale.created_at) }}
                <span class="separator">•</span>
                <i class="far fa-clock"></i> {{ formatTime(sale.created_at) }}
              </p>
            </div>
          </div>
          <button class="close-btn" @click="close" title="إغلاق">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Badges -->
        <div class="badges-row">
          <span class="badge-payment" :class="sale.payment_method">
            <i :class="sale.payment_method === 'cash' ? 'fas fa-money-bill-wave' : 'fas fa-university'"></i>
            {{ sale.payment_method === 'cash' ? 'نقدي' : 'تحويل بنكي' }}
          </span>

          <span v-if="sale.user" class="badge-user">
            <i class="fas fa-user"></i> {{ sale.user.name }}
          </span>

          <span v-if="sale.shift" class="badge-shift">
            <i class="fas fa-clock"></i> وردية #{{ sale.shift.id }}
          </span>

          <span v-if="isRefunded" class="badge-refunded">
            <i class="fas fa-undo"></i> مرتجعة بالكامل
          </span>
          <span v-else-if="totalRefunded > 0" class="badge-partial">
            <i class="fas fa-undo"></i> مرتجعة جزئياً
          </span>
        </div>

        <!-- Bank details -->
        <div v-if="sale.payment_method === 'bank'" class="bank-details">
          <div class="detail-row">
            <span class="label"><i class="fas fa-university"></i> البنك:</span>
            <span class="value">{{ sale.bank_name || 'غير محدد' }}</span>
          </div>
          <div class="detail-row">
            <span class="label"><i class="fas fa-hashtag"></i> رقم التحويل:</span>
            <span class="value">{{ sale.bank_reference || 'غير محدد' }}</span>
          </div>
          <div v-if="sale.bank_transfer_date" class="detail-row">
            <span class="label"><i class="far fa-calendar"></i> تاريخ التحويل:</span>
            <span class="value">{{ sale.bank_transfer_date }}</span>
          </div>
          <div v-if="sale.bank_notes" class="detail-row full">
            <span class="label"><i class="fas fa-sticky-note"></i> ملاحظات:</span>
            <span class="value">{{ sale.bank_notes }}</span>
          </div>
        </div>

        <!-- Items -->
        <div class="section">
          <h3 class="section-title">
            <i class="fas fa-pills"></i> الأدوية في الفاتورة
            <span class="count-badge">{{ items.length }}</span>
          </h3>

          <div class="items-table-wrap">
            <table class="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الدواء</th>
                  <th>الوحدة</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                  <th>الإجمالي</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in items" :key="item.id">
                  <td class="cell-idx">{{ idx + 1 }}</td>
                  <td class="cell-name">
                    <strong>{{ getMedicineName(item) }}</strong>
                    <small v-if="getScientificName(item)">{{ getScientificName(item) }}</small>
                  </td>
                  <td>
                    <span class="unit-pill">{{ getUnitLabel(item) }}</span>
                  </td>
                  <td class="cell-qty">{{ item.quantity }}</td>
                  <td class="cell-price">{{ formatCurrency(item.price) }}</td>
                  <td class="cell-total">{{ formatCurrency(item.price * item.quantity) }}</td>
                  <td>
                    <span v-if="item.refunded_quantity >= item.quantity" class="status-refunded">
                      <i class="fas fa-check-circle"></i> مرتجع كامل
                    </span>
                    <span v-else-if="item.refunded_quantity > 0" class="status-partial">
                      مرتجع: {{ item.refunded_quantity }}
                    </span>
                    <span v-else class="status-active">
                      <i class="fas fa-circle"></i> سليم
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Totals -->
        <div class="totals-section">
          <div class="total-row">
            <span>الإجمالي الأصلي</span>
            <span>{{ formatCurrency(sale.total_amount) }} ج.س</span>
          </div>
          <div v-if="totalRefunded > 0" class="total-row refund">
            <span><i class="fas fa-undo"></i> إجمالي المرتجع</span>
            <span>− {{ formatCurrency(totalRefunded) }} ج.س</span>
          </div>
          <div class="total-row final">
            <span>صافي الفاتورة</span>
            <span>{{ formatCurrency(netAmount) }} ج.س</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn-secondary" @click="close">
            <i class="fas fa-times"></i> إغلاق
          </button>
          <button class="btn-primary" @click="printInvoice">
            <i class="fas fa-print"></i> طباعة
          </button>
        </div>
      </div>

      <!-- Error -->
      <div v-else class="modal-error">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>تعذر تحميل تفاصيل الفاتورة</h3>
        <p>{{ error || 'حدث خطأ غير متوقع' }}</p>
        <button class="btn-secondary" @click="close">إغلاق</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  show:    { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  sale:    { type: Object,  default: null },
  error:   { type: String,  default: '' },
});



const items = computed(() => props.sale?.items || []);
const totalRefunded = computed(() => Number(props.sale?.total_refunded || 0));
const isRefunded = computed(() => {
  const total = Number(props.sale?.total_amount || 0);
  return total > 0 && totalRefunded.value >= total;
});
const netAmount = computed(() => {
  const total = Number(props.sale?.total_amount || 0);
  return Math.max(0, total - totalRefunded.value);
});

const formatCurrency = (v) =>
  Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
};

const getMedicineName = (item) =>
  item.batch?.medicine?.name || item.medicine_name || 'دواء غير معروف';

const getScientificName = (item) =>
  item.batch?.medicine?.scientific_name || '';

const UNIT_LABELS = {
  box: 'علبة', strip: 'شريط', piece: 'حبة',
  bottle: 'زجاجة', vial: 'فيال', tube: 'أنبوب', pack: 'عبوة',
};

const getUnitLabel = (item) => {
  if (item.unit && UNIT_LABELS[item.unit]) return UNIT_LABELS[item.unit];
  if (item.unit_info?.name) return item.unit_info.name;
  return item.unit || 'وحدة';
};

const close = () => emit('close');
import { printInvoice as printThermal } from '../../../src/js/utils/thermalPrinter.js';

const emit = defineEmits(['close', 'print']);

const printInvoice = () => {
  // استخدم النسخة الحرارية الجديدة
  printThermal(props.sale, { autoPrint: true, width: 80 });
};
</script>

<style scoped>
.sale-details-overlay {
  position: fixed;
  inset: 0;
  background: rgba(11, 26, 46, 0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: sdFadeIn 0.2s ease;
}
@keyframes sdFadeIn { from { opacity: 0; } to { opacity: 1; } }

.sale-details-modal {
  background: #fff;
  width: 100%;
  max-width: 900px;
  max-height: 92vh;
  border-radius: 22px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: sdSlideUp 0.3s ease;
}
@keyframes sdSlideUp {
  from { transform: translateY(30px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.modal-body { display: flex; flex-direction: column; max-height: 92vh; }

/* Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 26px;
  background: linear-gradient(135deg, #0f5b7a, #1ba7c2);
  color: #fff;
  flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: 16px; }
.icon-badge {
  width: 52px; height: 52px; border-radius: 14px;
  background: rgba(255,255,255,0.18);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}
.modal-header h2 { font-size: 22px; font-weight: 800; margin: 0; }
.modal-header .subtitle {
  margin: 4px 0 0; font-size: 13px;
  color: rgba(255,255,255,0.85);
  display: flex; align-items: center; gap: 8px;
}
.modal-header .separator { opacity: 0.5; }
.close-btn {
  width: 40px; height: 40px; border-radius: 50%;
  border: none; background: rgba(255,255,255,0.15);
  color: #fff; font-size: 16px; cursor: pointer;
  transition: 0.25s;
}
.close-btn:hover { background: rgba(255,255,255,0.28); transform: rotate(90deg); }

/* Badges */
.badges-row {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding: 18px 26px 0;
  flex-shrink: 0;
}
.badge-payment, .badge-user, .badge-shift,
.badge-refunded, .badge-partial {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 20px;
  font-size: 12.5px; font-weight: 700;
}
.badge-payment.cash { background: #d1fae5; color: #065f46; }
.badge-payment.bank { background: #dbeafe; color: #1e40af; }
.badge-user, .badge-shift { background: #f1f5f9; color: #475569; }
.badge-refunded { background: #fee2e2; color: #991b1b; }
.badge-partial  { background: #fef3c7; color: #92400e; }

/* Bank details */
.bank-details {
  margin: 16px 26px 0;
  padding: 16px 20px;
  background: #f8fafc;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 20px;
  flex-shrink: 0;
}
.detail-row {
  display: flex; justify-content: space-between; gap: 10px;
  font-size: 13px;
}
.detail-row.full { grid-column: 1 / -1; }
.detail-row .label { color: #64748b; }
.detail-row .value { color: #1e293b; font-weight: 700; }

/* Items section */
.section {
  padding: 20px 26px 0;
  flex: 1;
  overflow-y: auto;
}
.section::-webkit-scrollbar { width: 8px; }
.section::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

.section-title {
  font-size: 16px; font-weight: 800; color: #1e293b;
  margin: 0 0 14px;
  display: flex; align-items: center; gap: 10px;
}
.section-title i { color: #1ba7c2; }
.count-badge {
  background: #dbeafe; color: #1e40af;
  padding: 2px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 800;
}

.items-table-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
}
.items-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.items-table thead { background: #f8fafc; }
.items-table th {
  text-align: right; padding: 12px 14px;
  color: #64748b; font-weight: 700;
  font-size: 12px; text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 1px solid #e2e8f0;
}
.items-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.items-table tr:last-child td { border-bottom: none; }

.cell-idx { color: #94a3b8; font-weight: 700; width: 40px; }
.cell-name strong { display: block; color: #1e293b; }
.cell-name small { color: #94a3b8; font-size: 11px; }
.cell-qty, .cell-price, .cell-total { font-weight: 700; }
.cell-total { color: #059669; }

.unit-pill {
  background: #eff6ff; color: #1e40af;
  padding: 3px 10px; border-radius: 12px;
  font-size: 11.5px; font-weight: 700;
  white-space: nowrap;
}

.status-active   { color: #10b981; font-size: 12px; font-weight: 700; }
.status-active i { font-size: 8px; vertical-align: middle; }
.status-refunded { color: #dc2626; font-size: 12px; font-weight: 700; }
.status-partial  { color: #d97706; font-size: 12px; font-weight: 700; }

/* Totals */
.totals-section {
  padding: 18px 26px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.total-row {
  display: flex; justify-content: space-between;
  padding: 8px 0;
  font-size: 14px; color: #475569;
}
.total-row.refund { color: #dc2626; }
.total-row.final {
  border-top: 2px dashed #cbd5e1;
  margin-top: 8px;
  padding-top: 14px;
  font-size: 18px; font-weight: 800;
  color: #0f5b7a;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 26px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.btn-secondary, .btn-primary {
  padding: 10px 22px;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
}
.btn-secondary { background: #e2e8f0; color: #475569; }
.btn-secondary:hover { background: #cbd5e1; }
.btn-primary {
  background: linear-gradient(135deg, #0f5b7a, #1ba7c2);
  color: #fff;
  box-shadow: 0 8px 20px rgba(15, 91, 122, 0.25);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(15, 91, 122, 0.35);
}

/* Loading & Error */
.modal-loading, .modal-error {
  padding: 60px 30px;
  text-align: center;
  color: #64748b;
}
.modal-loading i { font-size: 40px; color: #1ba7c2; margin-bottom: 14px; display: block; }
.modal-error   i { font-size: 48px; color: #dc2626; margin-bottom: 14px; display: block; }
.modal-error h3 { color: #1e293b; font-size: 18px; font-weight: 800; margin-bottom: 6px; }
.modal-error p  { margin-bottom: 20px; font-size: 14px; }

/* Responsive */
@media (max-width: 640px) {
  .sale-details-modal { max-height: 100vh; border-radius: 0; }
  .bank-details { grid-template-columns: 1fr; }
  .items-table { font-size: 12px; }
  .items-table th, .items-table td { padding: 8px 8px; }
  .modal-header { padding: 16px 18px; }
  .modal-header h2 { font-size: 18px; }
}
</style>