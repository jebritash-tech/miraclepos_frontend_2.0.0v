// modules/dashboard/RecentMovementsTable.js
export default {
  props: ['movements'],
  template: `
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col h-full">
      <div class="flex items-center justify-between mb-5">
        <h3 class="font-bold text-base text-slate-800 flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-sm">
            <i class="fas fa-history"></i>
          </span>
          حركات المخزون
        </h3>
        <button class="text-xs font-bold text-purple-600 hover:text-purple-800 transition">
          عرض الكل <i class="fas fa-arrow-left mr-1"></i>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-right text-sm">
          <thead>
            <tr class="border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th class="pb-3 font-semibold">الدواء</th>
              <th class="pb-3 font-semibold">النوع</th>
              <th class="pb-3 font-semibold">الكمية</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!movements || movements.length === 0">
              <td colspan="3" class="text-center py-8 text-slate-400 text-xs">لا توجد حركات مخزون حديثة</td>
            </tr>
            <tr v-for="mov in movements" :key="mov.id" class="border-b border-slate-50 hover:bg-slate-50/60 transition">
              <td class="py-3 font-bold text-slate-700 text-xs truncate max-w-[100px]">{{ mov.medicine_name }}</td>
              <td class="py-3">
                <span class="px-2.5 py-1 rounded-md text-[10px] font-bold"
                  :class="{
                    'bg-emerald-50 text-emerald-700 border border-emerald-200': mov.type === 'purchase',
                    'bg-amber-50 text-amber-700 border border-amber-200': mov.type === 'adjustment',
                    'bg-rose-50 text-rose-700 border border-rose-200': mov.type === 'sale'
                  }">
                  {{ mov.type === 'purchase' ? 'شراء' : mov.type === 'adjustment' ? 'تعديل' : 'بيع' }}
                </span>
              </td>
              <td class="py-3 font-bold text-slate-700 font-mono">
                <span :class="{
                  'text-emerald-600': mov.type === 'purchase',
                  'text-rose-600': mov.type === 'sale',
                  'text-amber-600': mov.type === 'adjustment'
                }">
                  {{ mov.type === 'purchase' ? '+' : mov.type === 'sale' ? '-' : '±' }}{{ mov.quantity }}
                </span>
              </td>
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