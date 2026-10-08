// modules/dashboard/RecentSalesTable.js
export default {
  props: ['sales'],
  setup() {
    const formatCurrency = (v) => Number(v || 0).toLocaleString();
    return { formatCurrency };
  },
  template: `
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col h-full">
      <div class="flex items-center justify-between mb-5">
        <h3 class="font-bold text-base text-slate-800 flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
            <i class="fas fa-receipt"></i>
          </span>
          آخر الفواتير
        </h3>
        <button class="text-xs font-bold text-blue-600 hover:text-blue-800 transition">
          عرض الكل <i class="fas fa-arrow-left mr-1"></i>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-right text-sm">
          <thead>
            <tr class="border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th class="pb-3 font-semibold">الفاتورة</th>
              <th class="pb-3 font-semibold">العميل</th>
              <th class="pb-3 font-semibold">طريقة الدفع</th>
              <th class="pb-3 font-semibold text-left">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!sales || sales.length === 0">
              <td colspan="4" class="text-center py-8 text-slate-400 text-xs">لا توجد مبيعات حديثة</td>
            </tr>
            <tr v-for="sale in sales" :key="sale.id" class="border-b border-slate-50 hover:bg-slate-50/60 transition">
              <td class="py-3 font-mono font-bold text-slate-700 text-xs">#{{ sale.id }}</td>
              <td class="py-3 text-slate-600 text-xs">{{ sale.customer_name || 'عميل نقدي' }}</td>
              <td class="py-3">
                <span class="px-2.5 py-1 rounded-md text-[10px] font-bold"
                  :class="{
                    'bg-emerald-50 text-emerald-700 border border-emerald-200': sale.payment_method === 'cash',
                    'bg-blue-50 text-blue-700 border border-blue-200': sale.payment_method === 'card',
                    'bg-purple-50 text-purple-700 border border-purple-200': sale.payment_method === 'insurance'
                  }">
                  {{ sale.payment_method }}
                </span>
              </td>
              <td class="py-3 font-bold text-emerald-600 text-left font-mono">{{ formatCurrency(sale.total_amount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-4">
        <i class="far fa-clock ml-1"></i> آخر تحديث: {{ new Date().toLocaleTimeString('ar') }}
      </p>
    </div>
  `
};