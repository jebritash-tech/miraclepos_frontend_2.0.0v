<!-- modules/overview/overview.vue -->
<template>
  <div class="main-content">
    <!-- الشريط العلوي (Top Bar) -->
    <div class="top-bar">
      <!-- ===== محرك البحث ===== -->
      <div class="search-box" style="position: relative; flex: 1;">
        <i class="fas fa-search" style="color:#8899bb; position: absolute; right: 15px; top: 50%; transform: translateY(-50%); z-index: 1;"></i>
        <input
          v-model="searchQuery"
          @input="onSearch"
          @focus="showSearchResults = true"
          @blur="closeSearchDelayed"
          type="text"
          placeholder="🔍 بحث في الصيدلية (أدوية، فواتير، موردين...)"
          style="width: 100%; padding: 12px 45px 12px 20px; border: none; background: #f1f4f9; border-radius: 30px; font-size: 14px; outline: none; transition: 0.3s;"
        >

        <!-- قائمة النتائج المقترحة -->
        <div v-if="showSearchResults && searchResults.length > 0"
             style="position: absolute; top: 100%; left: 0; right: 0; background: white; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); z-index: 10000000 !important; margin-top: 8px; max-height: 400px; overflow-y: auto; padding: 8px 0;">
          <div v-for="result in searchResults" :key="result.type + result.id"
               @mousedown.prevent="selectResult(result)"
               style="display: flex; align-items: center; gap: 12px; padding: 10px 20px; cursor: pointer; transition: 0.15s; border-bottom: 1px solid #f1f4f9;">
            <div style="width: 35px; height: 35px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; background: v-bind('result.color');">
              <i :class="'fas ' + result.icon"></i>
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #2c3e50; font-size: 14px;">{{ result.name }}</div>
              <div style="font-size: 12px; color: #7f8c8d;">{{ result.sub }} • <span style="background: #ecf0f1; padding: 1px 8px; border-radius: 20px; font-size: 10px;">{{ result.type }}</span></div>
            </div>
            <i class="fas fa-arrow-left" style="color: #bdc3c7; font-size: 12px;"></i>
          </div>
        </div>
        <div v-if="showSearchResults && searchQuery.length > 1 && searchResults.length === 0 && !loadingSearch"
             style="position: absolute; top: 100%; left: 0; right: 0; background: white; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); z-index: 1000; margin-top: 8px; padding: 20px; text-align: center; color: #95a5a6;">
          <i class="fas fa-search-minus" style="display: block; font-size: 24px; margin-bottom: 8px;"></i>
          لا توجد نتائج مطابقة لـ "{{ searchQuery }}"
        </div>
      </div>

      <!-- ===== الملف الشخصي ===== -->
      <div class="user-area">
        <div class="profile" @click="showProfileModal = true" style="cursor: pointer;">
          <img :src="'https://ui-avatars.com/api/?background=0b1a2e&color=fff&name=' + (user?.name || 'مستخدم')" alt="صورة">
          <span>{{ user?.name || 'مستخدم' }}</span>
        </div>
      </div>
    </div>

    <!-- الهيكل العظمي -->
    <DashboardSkeleton v-if="loading" />

    <!-- المحتوى الفعلي -->
    <div v-else class="space-y-6">
      <!-- ✅ البطاقات الرئيسية - قابلة للنقر -->
      <StatCards :stats="stats" @card-click="handleCardClick" />

      <!-- البطاقات الفرعية -->
      <SubCards
        :inventory="inventory"
        :profit="profit"
        :purchases="purchases"
      />

      <!-- صف المخططات -->
      <ChartsRow
        :chartData="chartData"
        :activities="activities"
        :distribution="distribution"
      />

      <!-- الجداول: الأكثر مبيعاً + التنبيهات + الأكثر ربحية + فواتير اليوم -->
      <TableAndAlerts
        :topMedicines="topMedicines"
        :topProfit="topProfit"
        :alerts="alerts"
        :todayInvoices="todayInvoices"
        @invoice-click="openSaleDetails"
      />
    </div>

    <!-- ===== نافذة الملف الشخصي (Modal) ===== -->
    <div v-if="showProfileModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]" @click.self="showProfileModal = false">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in-up">
        <div class="text-center">
          <img :src="'https://ui-avatars.com/api/?background=0b1a2e&color=fff&size=128&name=' + (user?.name || 'مستخدم')"
               class="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-emerald-100">
          <h2 class="text-2xl font-bold text-slate-800">{{ user?.name }}</h2>
          <p class="text-slate-500 text-sm">{{ user?.email }}</p>
          <span class="inline-block mt-2 px-4 py-1 rounded-full text-xs font-bold"
                :class="user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
            {{ user?.role === 'admin' ? 'مدير النظام' : 'صيدلي' }}
          </span>
        </div>
        <hr class="my-6 border-slate-100">
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-500">الفرع</span>
            <span class="font-bold text-slate-800">{{ user?.branch?.name || 'غير محدد' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">الراتب الأساسي</span>
            <span class="font-bold text-emerald-600">{{ Number(user?.salary || 0).toLocaleString() }} ج.س</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">تاريخ الانضمام</span>
            <span class="font-bold text-slate-800">{{ user?.created_at ? new Date(user.created_at).toLocaleDateString('ar') : 'غير محدد' }}</span>
          </div>
        </div>
        <div class="mt-6 flex gap-3">
          <button @click="showProfileModal = false" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold transition">إغلاق</button>
          <button @click="logout" class="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2">
            <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
    <!-- مودال تفاصيل الفاتورة -->
    <SaleDetailsModal
      :show="showSaleDetailsModal"
      :loading="loadingSaleDetails"
      :sale="selectedSaleDetails"
      :error="saleDetailsError"
      @close="closeSaleDetails"
      @print="printInvoice"
    />
    <SearchDetailModal
      :show="showDetailModal"
      :type="detailType"
      :id="detailId"
      :data="detailData"
      :loading="detailLoading"
      :error="detailError"
      @close="closeDetailModal"
    />
    <!-- تذييل -->
    <div class="footer">
      <i class="fas fa-sync-alt" :class="{'fa-spin': loading}" @click="fetchData" style="cursor:pointer;"></i>
      آخر تحديث: {{ lastUpdate }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, onDeactivated } from 'vue';
import axios from 'axios';
import { API_BASE } from '../../src/js/config.js';
import { getCachedUser, db } from '../../src/js/offline-db.js';

// استيراد المكونات الفرعية
import StatCards from './components/StatCards.vue';
import SubCards from './components/SubCards.vue';
import ChartsRow from './components/ChartsRow.vue';
import TableAndAlerts from './components/TableAndAlerts.vue';
import DashboardSkeleton from './components/DashboardSkeleton.vue';
import SaleDetailsModal from './components/SaleDetailsModal.vue';
import SearchDetailModal from './components/SearchDetailModal.vue';

const showDetailModal = ref(false);
const detailType = ref('');
const detailId = ref(null);
const detailData = ref(null);
const detailLoading = ref(false);
const detailError = ref('');

// ===== مودال تفاصيل الفاتورة =====
const showSaleDetailsModal = ref(false);
const selectedSaleDetails = ref(null);
const loadingSaleDetails = ref(false);
const saleDetailsError = ref('');

// ===== حالة البيانات =====
const loading = ref(true);
const lastUpdate = ref(new Date().toLocaleTimeString('ar'));

// البطاقات الرئيسية
const stats = ref({
  daily_sales: 0,
  invoice_count: 0,
  low_stock_items: 0,
  expired_count: 0
});

// البطاقات الفرعية
const inventory = ref({
  total_items: 0,
  value: 0
});
const profit = ref({ today: 0 });
const purchases = ref({ today: 0 });

// المخططات والجداول
const chartData = ref([]);
const distribution = ref([]);
const activities = ref([]);
const topMedicines = ref([]);
const topProfit = ref([]);          // ✅ الأكثر ربحية
const todayInvoices = ref([]);      // ✅ فواتير اليوم
const alerts = ref([]);

// ===== حالة البحث =====
const searchQuery = ref('');
const searchResults = ref([]);
const showSearchResults = ref(false);
const loadingSearch = ref(false);

// ===== حالة المستخدم والملف الشخصي =====
const user = ref(null);
const showProfileModal = ref(false);

let refreshInterval = null;
let searchTimeout = null;

// ===== أنواع النتائج والتبويبات المقابلة لها =====
const resultTypeMap = {
  'دواء':         { tab: 'medicine',   action: 'edit' },
  'فاتورة بيع':   { tab: 'shifts',     action: 'view' },
  'فاتورة شراء':  { tab: 'purchases',  action: 'view' },
  'مورد':         { tab: 'suppliers',  action: 'edit' },
  'دفعة (LOT)':   { tab: 'stocktaking', action: 'filter' },
  'تصنيف':        { tab: 'categories', action: 'view' },
  'مستخدم':       { tab: 'users',      action: 'view' },
};

// ===== دوال البحث =====
const onSearch = () => {
  clearTimeout(searchTimeout);
  const query = searchQuery.value.trim();
  if (query.length < 2) {
    searchResults.value = [];
    return;
  }
  loadingSearch.value = true;
  searchTimeout = setTimeout(async () => {
    try {
      const res = await axios.get(`${API_BASE}/search`, { params: { q: query } });
      searchResults.value = res.data || [];
    } catch (error) {
      console.error('❌ خطأ في البحث:', error);
      searchResults.value = [];
    } finally {
      loadingSearch.value = false;
    }
  }, 300);
};

const closeSearchDelayed = () => {
  setTimeout(() => {
    showSearchResults.value = false;
  }, 200);
};

const selectResult = (result) => {
  showSearchResults.value = false;
  searchQuery.value = '';
  searchResults.value = [];

  // ✅ افتح مودال التفاصيل مباشرة
  openSearchDetail(result);
};

// ===== فتح تفاصيل نتيجة بحث =====
const openSearchDetail = async (result) => {
  // نتيجة "فاتورة بيع" لها tab = 'shifts'، لكننا نريدها تفتح مودال الفاتورة
  const typeMap = {
    'دواء':          'medicine',
    'فاتورة بيع':    'sale',
    'فاتورة شراء':   'purchase',
    'مورد':          'supplier',
    'دفعة (LOT)':    'batch',
    'تصنيف':         'category',
    'مستخدم':        'user',
  };
  const backendType = typeMap[result.type];
  if (!backendType) {
    alert(`لا يوجد عرض تفاصيل للنوع: ${result.type}`);
    return;
  }

  detailType.value = backendType;
  detailId.value = result.id;
  detailData.value = null;
  detailError.value = '';
  detailLoading.value = true;
  showDetailModal.value = true;

  try {
    const res = await axios.get(`${API_BASE}/search/details/${backendType}/${result.id}`);
    detailData.value = res.data;
  } catch (error) {
    console.error('❌ فشل تحميل التفاصيل:', error);
    detailError.value = error.response?.data?.message || 'تعذر الاتصال بالخادم';
  } finally {
    detailLoading.value = false;
  }
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  detailData.value = null;
  detailError.value = '';
  detailType.value = '';
  detailId.value = null;
};

// ===== ✅ معالج النقر على بطاقات الإحصائيات =====
const handleCardClick = (type) => {
  // خريطة: نوع البطاقة → معرّف القسم المراد التمرير إليه
  const map = {
    daily_sales: 'today-invoices-section', // مبيعات اليوم → قسم فواتير اليوم
    invoices:    'today-invoices-section', // فواتير اليوم → قسم فواتير اليوم
    low_stock:   'alerts-section',          // مخزون منخفض → قسم التنبيهات
    expired:     'alerts-section',          // منتهي الصلاحية → قسم التنبيهات
  };

  const targetId = map[type];
  if (!targetId) return;

  const el = document.getElementById(targetId);
  if (!el) {
    console.warn(`⚠️ القسم ${targetId} غير موجود في الصفحة`);
    return;
  }

  // تمرير سلس إلى القسم
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // تأثير إبراز بصري مؤقت
  const prevTransition = el.style.transition;
  const prevShadow = el.style.boxShadow;
  el.style.transition = 'box-shadow 0.4s ease';
  el.style.boxShadow = '0 0 0 4px rgba(46, 204, 113, 0.45)';
  setTimeout(() => {
    el.style.boxShadow = prevShadow;
    el.style.transition = prevTransition;
  }, 1600);

  // ✅ إذا كانت البطاقة "مخزون منخفض" أو "منتهي الصلاحية"، نمرر أيضاً نوع التنبيه
  // بحيث يمكن للقسم إبراز التنبيهات المتعلقة (اختياري - يتطلب تحديث TableAndAlerts)
  if (type === 'low_stock' || type === 'expired') {
    window.dispatchEvent(new CustomEvent('miraclepos:alert-filter', {
      detail: { filter: type }
    }));
  }
};
// ===== فتح تفاصيل فاتورة =====
const openSaleDetails = async (saleId) => {
  if (!saleId) return;

  showSaleDetailsModal.value = true;
  loadingSaleDetails.value = true;
  selectedSaleDetails.value = null;
  saleDetailsError.value = '';

  try {
    const res = await axios.get(`${API_BASE}/sales/${saleId}/details`);
    selectedSaleDetails.value = res.data;
  } catch (error) {
    console.error('❌ فشل تحميل تفاصيل الفاتورة:', error);
    saleDetailsError.value =
      error.response?.data?.message || 'تعذر الاتصال بالخادم';
  } finally {
    loadingSaleDetails.value = false;
  }
};

const closeSaleDetails = () => {
  showSaleDetailsModal.value = false;
  selectedSaleDetails.value = null;
  saleDetailsError.value = '';
};

// ===== طباعة الفاتورة (A4) =====
const printInvoice = (sale) => {
  if (!sale) return;

  const itemsRows = (sale.items || []).map((item, idx) => {
    const name = item.batch?.medicine?.name || 'دواء';
    const unit = item.unit || 'وحدة';
    const total = Number(item.price) * Number(item.quantity);
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${name}</td>
        <td>${unit}</td>
        <td>${item.quantity}</td>
        <td>${Number(item.price).toFixed(2)}</td>
        <td>${total.toFixed(2)}</td>
      </tr>`;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة #${sale.id}</title>
      <style>
        * { font-family: 'Cairo', Arial, sans-serif; }
        body { padding: 20px; }
        h1 { text-align: center; color: #0f5b7a; margin-bottom: 8px; }
        .meta { text-align: center; color: #64748b; margin-bottom: 20px; font-size: 13px; }
        .info { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-size: 13px; }
        th { background: #f1f5f9; color: #0f5b7a; }
        .totals { margin-top: 20px; text-align: left; font-size: 15px; }
        .totals .row { margin: 6px 0; }
        .totals .final { font-size: 20px; font-weight: bold; color: #0f5b7a; }
      </style>
    </head>
    <body>
      <h1>فاتورة #${sale.id}</h1>
      <div class="meta">${new Date(sale.created_at).toLocaleString('ar-EG')}</div>
      <div class="info">
        <span>طريقة الدفع: ${sale.payment_method === 'cash' ? 'نقدي' : 'بنكي'}</span>
        <span>الكاشير: ${sale.user?.name || '—'}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th><th>الدواء</th><th>الوحدة</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div class="totals">
        <div class="row">الإجمالي: ${Number(sale.total_amount).toFixed(2)} ج.س</div>
        ${Number(sale.total_refunded) > 0
          ? `<div class="row">المرتجع: − ${Number(sale.total_refunded).toFixed(2)} ج.س</div>`
          : ''}
        <div class="row final">
          الصافي: ${(Number(sale.total_amount) - Number(sale.total_refunded || 0)).toFixed(2)} ج.س
        </div>
      </div>
      <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
    </body>
    </html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
};
// ===== جلب بيانات لوحة التحكم =====
const fetchData = async () => {
  loading.value = true;
  try {
    const branchId = localStorage.getItem('selectedBranch') || 'all';
    const res = await axios.get(`${API_BASE}/admin/dashboard-data`, {
      params: { branch_id: branchId }
    });
    const data = res.data;

    // البطاقات الرئيسية
    stats.value = {
      daily_sales:     Number(data.daily_sales || 0),
      invoice_count:   Number(data.invoice_count || 0),
      low_stock_items: Number(data.low_stock_items || 0),
      expired_count:   Number(data.expired_count || 0)
    };

    // البطاقات الفرعية
    inventory.value = {
      total_items: Number(data.total_items || 0),
      value:       Number(data.inventory_value || 0)
    };
    profit.value = { today: Number(data.profit_today || 0) };
    purchases.value = { today: Number(data.shipments_count || 0) };

    // المخططات
    chartData.value    = Array.isArray(data.weekly_sales)         ? data.weekly_sales         : [];
    distribution.value = Array.isArray(data.distribution)         ? data.distribution         : [];
    activities.value   = Array.isArray(data.recent_activities)    ? data.recent_activities    : [];

    // الجداول
    topMedicines.value = Array.isArray(data.top_medicines)        ? data.top_medicines        : [];
    topProfit.value    = Array.isArray(data.top_profit)           ? data.top_profit           : [];   // ✅
    todayInvoices.value = Array.isArray(data.today_invoices)      ? data.today_invoices       : [];   // ✅
    alerts.value       = Array.isArray(data.alerts)               ? data.alerts               : [];

    lastUpdate.value = new Date().toLocaleTimeString('ar');
  } catch (error) {
    console.error('❌ خطأ في جلب بيانات لوحة التحكم:', error);
  } finally {
    loading.value = false;
  }
};

// ===== تحميل بيانات المستخدم =====
const loadUser = async () => {
  try {
    const cached = await getCachedUser();
    if (cached) {
      user.value = cached;
    } else {
      const res = await axios.get(`${API_BASE}/current-user`);
      user.value = res.data;
    }
  } catch (error) {
    console.error('❌ فشل تحميل بيانات المستخدم:', error);
  }
};

// ===== تسجيل الخروج =====
const logout = () => {
  db.user_cache.clear();
  localStorage.removeItem('token');
  window.location.href = 'login.html';
};

// ===== دورة الحياة =====
onMounted(() => {
  loadUser();
  fetchData();
  refreshInterval = setInterval(fetchData, 90000);
});

onActivated(() => {
  fetchData();
});

onDeactivated(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
});
</script>
<style>
@import './overview-responsive.css';

/* أنماط إضافية للـ Modal */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

.top-bar {
  position: relative;
  z-index: 9999;
}

.search-box {
  position: relative;
  z-index: 10000;
}
</style>
