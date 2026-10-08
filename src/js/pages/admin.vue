<!-- src/js/pages/admin.vue -->
<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Offline Overlay -->
    <div
      v-if="showOfflineOverlay"
      class="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 max-w-lg w-full text-center">
        <div class="mb-4 sm:mb-6">
          <i class="fas fa-wifi text-red-600 text-5xl sm:text-7xl"></i>
        </div>
        <h1 class="text-xl sm:text-3xl font-bold text-red-600 mb-3 sm:mb-4">لا يوجد اتصال بالإنترنت</h1>
        <p class="text-slate-600 text-sm sm:text-lg mb-4 sm:mb-6">
          تعذر الاتصال بالشبكة. يرجى التحقق من الاتصال ثم إعادة المحاولة.
        </p>
        <div class="inline-flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 sm:px-5 py-2 sm:py-3 rounded-lg text-sm sm:text-base">
          <span class="animate-pulse">●</span>
          انتظار عودة الاتصال...
        </div>
      </div>
    </div>

    <!-- ===== Sidebar Overlay (للجوال) ===== -->
    <transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        @click="closeSidebar"
        class="fixed inset-0 bg-black/60 z-40 lg:hidden"
      ></div>
    </transition>

    <!-- ===== القائمة الجانبية ===== -->
    <aside
      :class="[
        'sidebar text-slate-300 flex flex-col shrink-0 select-none h-screen fixed lg:relative z-50 transition-transform duration-300 ease-in-out w-72 max-w-[85vw]',
        sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      ]"
    >
      <!-- زر إغلاق القائمة (للجوال) -->
      <button
        @click="closeSidebar"
        class="absolute top-4 left-4 lg:hidden text-slate-400 hover:text-white transition z-10 w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
        aria-label="إغلاق القائمة"
      >
        <i class="fas fa-times text-base"></i>
      </button>

      <!-- الشعار -->
      <div class="logo px-4 sm:px-5 py-4 sm:py-6 flex items-center gap-3 border-b border-slate-800/60">
        <div class="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center overflow-hidden">
          <img
            v-if="pharmacyLogo && !logoFailed"
            :src="pharmacyLogo"
            @error="logoFailed = true"
            alt="شعار الصيدلية"
            class="w-full h-full object-contain"
          />
          <i v-else class="fas fa-heartbeat text-emerald-400 text-xl sm:text-2xl"></i>
        </div>

        <div class="flex-1 min-w-0">
          <h1 class="text-white text-base sm:text-lg font-extrabold tracking-wide truncate leading-tight">
            {{ pharmacyName || 'صيدليتي' }}
          </h1>
          <p
            v-if="pharmacyAddress"
            class="text-[10px] sm:text-[11px] text-slate-400 truncate mt-1 flex items-center gap-1"
            :title="pharmacyAddress">
            <i class="fas fa-map-marker-alt text-[9px] text-emerald-400/70"></i>
            {{ pharmacyAddress }}
          </p>
          <p v-else class="text-[10px] sm:text-[11px] text-slate-500 truncate mt-1">
            نظام إدارة الصيدلية
          </p>
        </div>
      </div>

      <!-- القائمة -->
      <ul class="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 overflow-y-auto" style="direction: rtl;">
        <li
          v-for="tab in mainTabs"
          :key="tab.id"
          @click="navigate(tab)"
          :class="['flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition text-sm font-medium cursor-pointer',
            activeTab === tab.id ? 'active' : '']"
        >
          <i :class="[tab.icon, 'w-5 text-center']"></i>
          <span>{{ tab.name }}</span>
        </li>

        <li
          v-for="tab in inventoryTabs"
          :key="tab.id"
          @click="navigate(tab)"
          :class="['flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition text-sm font-medium cursor-pointer',
            activeTab === tab.id ? 'active' : '']"
        >
          <i :class="[tab.icon, 'w-5 text-center']"></i>
          <span>{{ tab.name }}</span>
        </li>

        <li
          v-for="tab in financeTabs"
          :key="tab.id"
          @click="navigate(tab)"
          :class="['flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition text-sm font-medium cursor-pointer',
            activeTab === tab.id ? 'active' : '']"
        >
          <i :class="[tab.icon, 'w-5 text-center']"></i>
          <span>{{ tab.name }}</span>
        </li>

        <li
          v-for="tab in generalTabs"
          :key="tab.id"
          @click="navigate(tab)"
          :class="['flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition text-sm font-medium cursor-pointer',
            activeTab === tab.id ? 'active' : '']"
        >
          <i :class="[tab.icon, 'w-5 text-center']"></i>
          <span>{{ tab.name }}</span>
        </li>

        <li
          v-for="tab in supportTabs"
          :key="tab.id"
          @click="navigate(tab)"
          :class="['flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition text-sm font-medium cursor-pointer',
            activeTab === tab.id ? 'active' : '']"
        >
          <i :class="[tab.icon, 'w-5 text-center']"></i>
          <span>{{ tab.name }}</span>
        </li>
      </ul>

      <!-- تسجيل الخروج -->
      <div class="logout px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 cursor-pointer" @click="logout">
        <i class="fas fa-sign-out-alt w-5 text-center"></i>
        <span>تسجيل الخروج</span>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-50 min-w-0">
      <!-- شريط علوي مع زر القائمة -->
      <header class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4">
        <!-- زر Burger Menu -->
        <button
          @click="toggleSidebar"
          class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition text-slate-700 shrink-0"
          title="القائمة"
          aria-label="فتح القائمة"
        >
          <i :class="sidebarOpen ? 'fas fa-times' : 'fas fa-bars'" class="text-base sm:text-lg"></i>
        </button>

        <!-- عنوان الصفحة الحالية -->
        <h2 class="text-sm sm:text-lg font-bold text-slate-800 truncate">
          {{ currentTabName }}
        </h2>

        <div class="flex-1"></div>

        <!-- اسم المستخدم -->
        <div v-if="adminUser" class="hidden sm:flex items-center gap-2 text-sm text-slate-600">
          <i class="fas fa-user-circle text-slate-400 text-lg"></i>
          <span class="truncate max-w-[120px]">{{ adminUser.name || 'مدير' }}</span>
        </div>
      </header>

      <!-- محتوى الصفحة -->
      <div class="p-2 sm:p-4 flex-1 min-w-0">
        <div class="bg-transparent p-0 min-h-[400px] sm:min-h-[500px] min-w-0">
          <keep-alive>
            <component :is="currentComponent" :key="activeTab"></component>
          </keep-alive>
        </div>
      </div>

      <!-- زر الجولة العائم -->
      <div class="tour-floating-btn fixed bottom-4 left-4 sm:bottom-8 sm:left-8 z-30">
        <button
          @click="startAdminTour"
          class="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full w-12 h-12 sm:w-14 sm:h-14 shadow-xl shadow-blue-600/30 transition-all duration-300 hover:scale-110 hover:shadow-2xl flex items-center justify-center border-2 border-white/20"
          title="جولة إرشادية"
        >
          <i class="fas fa-compass text-xl sm:text-2xl"></i>
        </button>
        <span class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">جديد</span>
      </div>
    </main>

    <!-- Global Loader -->
    <div
      v-if="globalLoading"
      class="fixed inset-0 z-[9999] bg-white/70 flex items-center justify-center backdrop-blur-sm"
    >
      <div class="flex flex-col items-center">
        <i class="fas fa-spinner fa-spin text-4xl sm:text-5xl text-sky-600"></i>
        <p class="mt-3 sm:mt-4 font-bold text-slate-700 text-sm sm:text-base">جاري المعالجة...</p>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div v-if="toast.show" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg transition-all duration-300 max-w-[calc(100vw-2rem)] w-auto"
    :class="{
      'bg-emerald-50 border border-emerald-200 text-emerald-800': toast.type === 'success',
      'bg-red-50 border border-red-200 text-red-800': toast.type === 'error',
      'bg-amber-50 border border-amber-200 text-amber-800': toast.type === 'warning',
      'bg-blue-50 border border-blue-200 text-blue-800': toast.type === 'info'
    }">
    <div class="flex items-center gap-2 sm:gap-3">
      <i :class="{
        'fas fa-check-circle text-emerald-500': toast.type === 'success',
        'fas fa-exclamation-circle text-red-500': toast.type === 'error',
        'fas fa-exclamation-triangle text-amber-500': toast.type === 'warning',
        'fas fa-info-circle text-blue-500': toast.type === 'info'
      }"></i>
      <span class="font-medium text-sm sm:text-base">{{ toast.message }}</span>
      <button @click="toast.show = false" class="mr-2 sm:mr-4 text-slate-400 hover:text-slate-600 shrink-0"><i class="fas fa-times"></i></button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import pinia from '../stores/index.js';
import axios from 'axios';
import { API_BASE } from '../config.js';
import { clearCachedUser, getCachedUser } from '../auth.js';
import '../pwa.js';

// استيراد المكونات
import Overview from '../../../modules/overview/overview.vue';
import Branches from '../../../modules/branches/branches.vue';
import Categories from '../../../modules/categories/categories.vue';
import Medicine from '../../../modules/medicines/catalog.vue';
import Purchases from '../../../modules/medicines/purchase.vue';
import Suppliers from '../../../modules/suppliers/suppliers.vue';
import Users from '../../../modules/users/users.vue';
import Shifts from '../../../modules/shifts/shifts.vue';
import Debts from '../../../modules/debts/debts.vue';
import Expenses from '../../../modules/expenses/expenses.vue';
import Salaries from '../../../modules/salaries/salaries.vue';
import Pricing from '../../../modules/pricing-engine/pricing.vue';
import Analytics from '../../../modules/analytics/analytics.vue';
import Inventory from '../../../modules/inventory/inventory.vue';
import About from '../../../modules/about/about.vue';
import UserGuide from '../../../modules/about/UserGuide.vue';
import TourManager from '../services/tourManager.js';
import { getPharmacyInfo, savePharmacyInfo } from '../utils/thermalPrinter.js';
import PrintSettings from '../../../modules/settings/PrintSettings.vue';
import BackupSettings from '../../../modules/settings/BackupSettings.vue';
import Settings from '../../../modules/settings/Settings.vue';
import AuditLog from '../../../modules/audit/AuditLog.vue';
import FinancialReports from '../../../modules/reports/FinancialReports.vue';
import {
  settings as pharmacySettings,
  loadSettings,
  refreshSettings,
  pharmacyName,
  pharmacyLogo,
  pharmacyAddress,
} from '../settings.js';

// أمثلة
const info = getPharmacyInfo();
console.log(info);

savePharmacyInfo({
  name: 'صيدلية التلال',
  phone: '0912345678',
  address: 'الخرطوم - التلال',
  taxNumber: '123456789',
});
const logoFailed = ref(false);

watch(pharmacyLogo, () => { logoFailed.value = false; });

// ===== State =====
const activeTab = ref('overview');
const globalLoading = ref(false);
const adminUser = ref(null);
const showOfflineOverlay = ref(!navigator.onLine);

// ===== Sidebar State =====
const sidebarOpen = ref(false);

const MOBILE_BREAKPOINT = 1024;

const checkScreenSize = () => {
  if (window.innerWidth < MOBILE_BREAKPOINT) {
    sidebarOpen.value = false;
  } else {
    sidebarOpen.value = true;
  }
};

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};

// ===== اسم التبويب الحالي =====
const currentTabName = computed(() => {
  const allTabs = [...mainTabs, ...inventoryTabs, ...financeTabs, ...generalTabs, ...supportTabs];
  const tab = allTabs.find(t => t.id === activeTab.value);
  return tab ? tab.name : 'الرئيسية';
});

// ===== Toast =====
const toast = reactive({ show: false, message: '', type: 'success' });

const handleToast = (event) => {
  const { message, type } = event.detail;
  toast.message = message;
  toast.type = type || 'success';
  toast.show = true;
  setTimeout(() => { toast.show = false; }, 4000);
};

// ===== TourManager =====
TourManager.setTabSwitcher((tabId) => {
  activeTab.value = tabId;
});

const startAdminTour = () => {
  let tourName = '';
  switch (activeTab.value) {
    case 'overview': tourName = 'main'; break;
    case 'medicine': tourName = 'medicine'; break;
    case 'purchases': tourName = 'purchases'; break;
    case 'stocktaking': tourName = 'inventory'; break;
    case 'analytics': tourName = 'analytics'; break;
    case 'branches': tourName = 'branches'; break;
    case 'categories': tourName = 'categories'; break;
    case 'debts': tourName = 'debts'; break;
    case 'expenses': tourName = 'expenses'; break;
    case 'salaries': tourName = 'salaries'; break;
    case 'shifts': tourName = 'shifts'; break;
    case 'suppliers': tourName = 'suppliers'; break;
    case 'users': tourName = 'users'; break;
    case 'pricing': tourName = 'pricing'; break;
    default: tourName = 'main';
  }
  TourManager.startTourByName(tourName);
};

const startPageTour = () => {
  let steps = [];
  let tourName = '';

  switch (activeTab.value) {
    case 'medicine':
      steps = TourManager.createMedicineTour();
      tourName = 'medicine';
      break;
    case 'purchases':
      steps = TourManager.createPurchaseTour();
      tourName = 'purchases';
      break;
    case 'stocktaking':
      steps = TourManager.createInventoryTour();
      tourName = 'inventory';
      break;
    default:
      startMainTour();
      return;
  }

  TourManager.startTour(tourName, steps);
};

// ===== عند تغيير التبويب - إغلاق تلقائي على الجوال =====
watch(activeTab, () => {
  if (window.innerWidth < MOBILE_BREAKPOINT) {
    closeSidebar();
  }
});

// ===== إعدادات Axios =====
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// ===== Global Loading Interceptors =====
const globalLoadingEvent = 'miraclepos:global-loading';
let activeRequests = 0;

axios.interceptors.request.use(
  (config) => {
    activeRequests++;
    window.dispatchEvent(new CustomEvent(globalLoadingEvent, { detail: { loading: activeRequests > 0 } }));
    return config;
  },
  (error) => {
    activeRequests = Math.max(0, activeRequests - 1);
    window.dispatchEvent(new CustomEvent(globalLoadingEvent, { detail: { loading: activeRequests > 0 } }));
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    activeRequests = Math.max(0, activeRequests - 1);
    window.dispatchEvent(new CustomEvent(globalLoadingEvent, { detail: { loading: activeRequests > 0 } }));
    return response;
  },
  (error) => {
    activeRequests = Math.max(0, activeRequests - 1);
    window.dispatchEvent(new CustomEvent(globalLoadingEvent, { detail: { loading: activeRequests > 0 } }));
    return Promise.reject(error);
  }
);

// ===== Tabs =====
const mainTabs = [
  { id: 'overview', name: 'الرئيسية', icon: 'fas fa-th-large' }
];

const inventoryTabs = [
  { id: 'medicine', name: 'إدارة الأدوية', icon: 'fas fa-pills' },
  { id: 'purchases', name: 'المشتريات', icon: 'fas fa-shopping-cart' },
  { id: 'stocktaking', name: 'الجرد', icon: 'fas fa-clipboard-list' }
];

const financeTabs = [
  { id: 'shifts', name: 'الورديات', icon: 'fas fa-user-clock' },
  { id: 'debts', name: 'الديون', icon: 'fas fa-file-invoice-dollar' },
  { id: 'expenses', name: 'المصروفات', icon: 'fas fa-wallet' },
  { id: 'salaries', name: 'الرواتب', icon: 'fas fa-hand-holding-usd' },
  { id: 'pricing', name: 'محرك الأسعار', icon: 'fas fa-dollar-sign' },
  { id: 'financial_reports', name: 'التقارير المالية', icon: 'fas fa-chart-line' },
];

const generalTabs = [
  { id: 'branches', name: 'الفروع', icon: 'fas fa-code-branch' },
  { id: 'categories', name: 'التصنيفات', icon: 'fas fa-tags' },
  { id: 'suppliers', name: 'الموردين', icon: 'fas fa-truck' },
  { id: 'users', name: 'المستخدمين', icon: 'fas fa-users' },
];

const supportTabs = [
  { id: 'analytics', name: 'التحليلات', icon: 'fas fa-chart-bar' },
  { id: 'audit_log', name: 'سجل التدقيق', icon: 'fas fa-clipboard-list' },
  { id: 'backup_settings', name: 'النسخ الاحتياطي', icon: 'fas fa-database' },
  { id: 'settings', name: 'الإعدادات', icon: 'fas fa-cog' },
  { id: 'guide', name: 'دليل الاستخدام', icon: 'fas fa-book' },
  { id: 'about', name: 'حول النظام', icon: 'fas fa-info-circle' }
];

const tabs = [
  ...mainTabs,
  ...inventoryTabs,
  ...financeTabs,
  ...generalTabs,
  ...supportTabs
];

// ===== Navigation =====
const navigate = (tab) => {
  activeTab.value = tab.id;
};

// ===== Current Component =====
const currentComponent = computed(() => {
  const map = {
    overview: Overview,
    branches: Branches,
    categories: Categories,
    purchases: Purchases,
    about: About,
    suppliers: Suppliers,
    medicine: Medicine,
    users: Users,
    shifts: Shifts,
    debts: Debts,
    pricing: Pricing,
    analytics: Analytics,
    stocktaking: Inventory,
    expenses: Expenses,
    salaries: Salaries,
    guide: UserGuide,
    backup_settings: BackupSettings,
    settings: Settings,
    financial_reports: FinancialReports,
    audit_log: AuditLog,
  };
  return map[activeTab.value] || Overview;
});

// ===== Authentication =====
const checkAuth = async () => {
  try {
    const response = await axios.get(`${API_BASE}/current-user`);
    if (response.data.role !== 'admin') {
      window.location.href = 'pos.html';
      return;
    }
    adminUser.value = response.data;
  } catch (error) {
    console.error('Authentication failed:', error);
    const cachedUser = await getCachedUser();
    if (!navigator.onLine && cachedUser && cachedUser.role === 'admin') {
      adminUser.value = cachedUser;
      return;
    }
    clearCachedUser();
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
};

const initApp = async () => {
  if (!adminUser.value) {
    try {
      const userRes = await axios.get(`${API_BASE}/current-user`);
      adminUser.value = userRes.data;
    } catch (error) {
      console.error('Could not load admin user:', error);
    }
  }
};

// ===== Logout =====
const logout = () => {
  clearCachedUser();
  localStorage.removeItem('token');
  localStorage.removeItem('offline_mode');
  delete axios.defaults.headers.common['Authorization'];
  window.location.href = 'login.html';
};

// ===== Connection Status =====
const updateConnectionStatus = () => {
  showOfflineOverlay.value = !navigator.onLine;
};

const updateGlobalLoading = (event) => {
  globalLoading.value = !!event.detail?.loading;
};

// ===== Lifecycle =====
onMounted(async () => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);

  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  window.addEventListener(globalLoadingEvent, updateGlobalLoading);
  window.addEventListener('miraclepos:toast', handleToast);
  window.addEventListener('miraclepos:navigate', (event) => {
    const { tab, result } = event.detail;
    if (tab) {
      activeTab.value = tab;
      window.selectedSearchResult = result;
    }
  });

  await loadSettings();
  updateConnectionStatus();
  await checkAuth();
  await initApp();
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
  window.removeEventListener('online', updateConnectionStatus);
  window.removeEventListener('offline', updateConnectionStatus);
  window.removeEventListener(globalLoadingEvent, updateGlobalLoading);
  window.removeEventListener('miraclepos:toast', handleToast);
});
</script>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
}

/* منع التمرير الأفقي */
:global(html), :global(body) {
  overflow-x: hidden;
  max-width: 100vw;
}

/* تحسين التمرير للقائمة */
.sidebar ul::-webkit-scrollbar {
  width: 4px;
}
.sidebar ul::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.sidebar ul::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ============================================
   تحسينات الاستجابة للجوال
   ============================================ */

/* على الجوال: جعل المحتوى يأخذ العرض الكامل */
@media (max-width: 1023px) {
  /* القائمة الجانبية ثابتة فوق المحتوى */
  aside.sidebar {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    height: 100dvh;
  }

  main {
    width: 100%;
    max-width: 100vw;
  }
}

/* على الجوال الصغير: تقليل الحشوات */
@media (max-width: 640px) {
  /* شريط علوي أكثر إحكاماً */
  header {
    padding: 0.5rem 0.75rem;
  }

  /* تقليل حشوة المحتوى */
  main > div.p-2 {
    padding: 0.5rem;
  }
}

/* ============================================
   تحسينات عامة للبطاقات داخل المكونات الفرعية
   (تُطبق على العناصر داخل المحتوى)
   ============================================ */
:deep(.card),
:deep([class*="card"]) {
  max-width: 100%;
}

/* ضمان عدم تجاوز العناصر للعرض */
:deep(*) {
  max-width: 100%;
}

/* الجداول على الجوال - تمرير أفقي */
:deep(table) {
  display: block;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 767px) {
  /* تحسين الشبكات (Grids) على الجوال */
  :deep(.grid) {
    grid-template-columns: 1fr !important;
    gap: 0.75rem !important;
  }

  /* تحسين المرونة (Flex) على الجوال */
  :deep(.flex-wrap-mobile) {
    flex-wrap: wrap;
  }

  /* تقليل أحجام النصوص الكبيرة */
  :deep(h1) { font-size: 1.25rem !important; }
  :deep(h2) { font-size: 1.125rem !important; }
  :deep(h3) { font-size: 1rem !important; }

  /* الحشوات */
  :deep(.p-6) { padding: 1rem !important; }
  :deep(.p-8) { padding: 1.25rem !important; }
  :deep(.px-6) { padding-left: 1rem !important; padding-right: 1rem !important; }
  :deep(.py-6) { padding-top: 1rem !important; padding-bottom: 1rem !important; }

  /* الأزرار */
  :deep(button) {
    max-width: 100%;
  }

  /* النوافذ المنبثقة */
  :deep(.modal),
  :deep([class*="modal"]) {
    max-width: calc(100vw - 1rem) !important;
    margin: 0.5rem !important;
  }
}

/* ============================================
   دعم الشاشات الصغيرة جداً
   ============================================ */
@media (max-width: 380px) {
  aside.sidebar {
    width: 90vw;
  }

  header h2 {
    font-size: 0.8125rem;
  }
}
</style>
