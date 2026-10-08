// modules/dashboard/TopSellingMedicines.js
export default {
  props: ['items'],
  setup() {
    const formatCurrency = (v) => Number(v || 0).toLocaleString();
    return { formatCurrency };
  },
  template: `
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 h-full">
      <div class="flex items-center justify-between mb-5">
        <h3 class="font-bold text-base text-slate-800 flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
            <i class="fas fa-crown"></i>
          </span>
          الأكثر مبيعاً
        </h3>
        <span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">آخر 30 يوم</span>
      </div>

      <div v-if="!items || items.length === 0" class="text-center py-10 text-slate-400 text-sm">
        <i class="fas fa-box-open text-3xl block mb-3 opacity-30"></i>
        لا توجد بيانات كافية لعرضها
      </div>

      <div v-else class="space-y-3">
        <div v-for="(item, index) in items" :key="item.name" class="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition group">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
            :class="{
              'bg-amber-400 text-white shadow-lg shadow-amber-400/30': index === 0,
              'bg-slate-200 text-slate-600': index === 1,
              'bg-slate-100 text-slate-400': index >= 2
            }">
            {{ index + 1 }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-slate-800 text-sm truncate">{{ item.name }}</p>
            <div class="flex items-center gap-3 text-xs text-slate-500">
              <span><i class="fas fa-cubes text-slate-400 ml-1"></i> {{ item.total_quantity }} وحدة</span>
            </div>
          </div>
          <div class="text-left shrink-0">
            <span class="font-bold text-emerald-600 text-sm">{{ formatCurrency(item.total_revenue) }}</span>
            <span class="text-[10px] text-slate-400 block">إيرادات</span>
          </div>
        </div>
      </div>
    </div>
  `
};