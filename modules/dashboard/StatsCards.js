// modules/dashboard/StatsCards.js
import { computed } from 'vue';

export default {
  props: ['data'],
  setup(props) {
    const formatCurrency = (v) => Number(v || 0).toLocaleString();
    return { formatCurrency };
  },
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- بطاقة المبيعات -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 hover:shadow-md transition group">
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-slate-500">مبيعات اليوم</span>
          <span class="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><i class="fas fa-wallet"></i></span>
        </div>
        <p class="text-3xl font-black text-slate-800 mt-4">{{ formatCurrency(data.daily_sales) }}</p>
        <span class="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full inline-block mt-2"><i class="fas fa-arrow-up"></i> +12% عن الأمس</span>
      </div>
      
      <!-- بطاقة عدد الفواتير -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 hover:shadow-md transition group">
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-slate-500">عدد الفواتير</span>
          <span class="p-3 bg-blue-50 text-blue-600 rounded-xl"><i class="fas fa-receipt"></i></span>
        </div>
        <p class="text-3xl font-black text-slate-800 mt-4">{{ data.invoice_count }}</p>
      </div>
      
      <!-- بطاقة صافي الربح -->
      <div class="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl shadow-sm border border-emerald-100/80 hover:shadow-md transition group">
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-emerald-700">صافي الربح</span>
          <span class="p-3 bg-white text-emerald-600 rounded-xl shadow-sm"><i class="fas fa-coins"></i></span>
        </div>
        <p class="text-3xl font-black text-emerald-700 mt-4">{{ formatCurrency(data.net_profit) }}</p>
      </div>
      
      <!-- بطاقة التنبيه (Low Stock) -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 hover:shadow-md transition group relative overflow-hidden">
        <div v-if="data.low_stock_count > 0" class="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-slate-500">تنبيهات المخزون</span>
          <span class="p-3 bg-rose-50 text-rose-600 rounded-xl"><i class="fas fa-exclamation-triangle"></i></span>
        </div>
        <p class="text-3xl font-black text-slate-800 mt-4">{{ data.low_stock_count }}</p>
        <span v-if="data.low_stock_count > 0" class="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-full inline-block mt-2">يحتاج تدخل فوري!</span>
      </div>
    </div>
  `
};