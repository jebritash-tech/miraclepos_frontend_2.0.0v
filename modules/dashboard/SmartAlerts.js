// modules/dashboard/SmartAlerts.js
export default {
  props: ['alerts', 'activeShift'],
  setup() {
    const formatCurrency = (v) => Number(v || 0).toLocaleString();
    return { formatCurrency };
  },
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- العمود الأيمن: التنبيهات العامة -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <h3 class="font-bold text-base text-slate-800 flex items-center gap-2.5 mb-5">
          <span class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-sm">
            <i class="fas fa-bell"></i>
          </span>
          التنبيهات
          <span v-if="alerts.length" class="text-[10px] bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-bold mr-auto">
            {{ alerts.length }}
          </span>
        </h3>

        <div v-if="!alerts || alerts.length === 0" class="text-center py-8 text-slate-400 text-sm">
          <i class="fas fa-check-circle text-emerald-400 text-3xl block mb-3"></i>
          كل شيء على ما يرام! لا توجد تنبيهات
        </div>

        <div v-else class="space-y-3">
          <div v-for="alert in alerts" :key="alert.message" class="p-4 rounded-xl border flex items-start gap-3"
            :class="{
              'bg-amber-50 border-amber-200': alert.type === 'expiry',
              'bg-rose-50 border-rose-200': alert.type === 'debt',
              'bg-blue-50 border-blue-200': alert.type === 'low_stock'
            }">
            <div class="p-1.5 rounded-lg shrink-0" :class="{
              'bg-amber-200 text-amber-700': alert.type === 'expiry',
              'bg-rose-200 text-rose-700': alert.type === 'debt',
              'bg-blue-200 text-blue-700': alert.type === 'low_stock'
            }">
              <i class="fas" :class="{
                'fa-clock': alert.type === 'expiry',
                'fa-hand-holding-usd': alert.type === 'debt',
                'fa-boxes': alert.type === 'low_stock'
              }"></i>
            </div>
            <div class="flex-1">
              <p class="text-sm font-bold text-slate-800">{{ alert.message }}</p>
              <p v-if="alert.count" class="text-xs text-slate-500 mt-0.5">
                <span class="font-bold" :class="{
                  'text-amber-600': alert.type === 'expiry',
                  'text-rose-600': alert.type === 'debt'
                }">{{ alert.count }}</span>
                {{ alert.type === 'expiry' ? 'دواء ينتهي خلال 30 يوماً' : 'دين مستحق' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- العمود الأيسر: الوردية النشطة -->
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg border border-slate-700 text-white flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-base flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm backdrop-blur-sm">
                <i class="fas fa-clock"></i>
              </span>
              الوردية النشطة
            </h3>
            <span class="flex items-center gap-1.5 text-[10px] bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              مفتوحة
            </span>
          </div>

          <div v-if="activeShift" class="mt-4 space-y-3">
            <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
              <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50">
                <i class="fas fa-user-md"></i>
              </div>
              <div>
                <p class="font-bold text-sm">{{ activeShift.user?.name || 'غير محدد' }}</p>
                <p class="text-xs text-slate-400">رقم الوردية: <span class="font-mono text-white/80">#{{ activeShift.id }}</span></p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs bg-white/5 rounded-xl p-3 border border-white/5">
              <div>
                <span class="text-slate-400">الرصيد الافتتاحي</span>
                <p class="font-bold text-emerald-300">{{ formatCurrency(activeShift.opening_cash) }}</p>
              </div>
              <div>
                <span class="text-slate-400">المبيعات</span>
                <p class="font-bold text-white">{{ formatCurrency(activeShift.cash_sales) }}</p>
              </div>
            </div>
          </div>

          <div v-else class="mt-4 text-center py-6 bg-white/5 rounded-xl border border-white/5 border-dashed">
            <i class="fas fa-door-closed text-3xl text-slate-600 block mb-2"></i>
            <p class="text-sm text-slate-400">لا توجد وردية مفتوحة حالياً</p>
            <p class="text-xs text-slate-500 mt-1">افتح وردية جديدة لبدء العمل</p>
          </div>
        </div>

        <button v-if="!activeShift" class="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-emerald-600/20">
          <i class="fas fa-plus ml-2"></i> فتح وردية جديدة
        </button>
      </div>
    </div>
  `
};