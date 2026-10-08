<!-- modules/analytics/analytics.vue -->
<template>
  <div class="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 min-h-screen" dir="rtl">

    <!-- ================= Header ================= -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
          <span class="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/25">
            <i class="fas fa-chart-line text-lg"></i>
          </span>
          مركز ذكاء الصيدلية
        </h1>
        <p class="text-sm text-slate-500 mt-1">لوحة تحليلات متقدمة لدعم القرارات الاستراتيجية</p>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <select
          v-model="selectedBranch"
          @change="onBranchChange"
          class="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
        >
          <option value="all">📊 كل الفروع</option>
          <option v-for="branch in branches" :key="branch.id" :value="branch.id">
            🏪 {{ branch.name }}
          </option>
        </select>
        <button
          @click="refreshData"
          :disabled="loading"
          class="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
        >
          <i class="fas fa-sync-alt" :class="{'animate-spin': loading}"></i>
          تحديث
        </button>
      </div>
    </div>

    <!-- ================= Loading ================= -->
    <div v-if="loading && !dashboard" class="flex items-center justify-center py-20">
      <div class="flex flex-col items-center gap-4">
        <i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i>
        <p class="text-slate-500 text-sm">جاري تحميل البيانات...</p>
      </div>
    </div>

    <!-- ================= Dashboard Content ================= -->
    <template v-if="dashboard">

    <!-- ===== Daily Action Center ===== -->
    <section>
      <h2 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
        <span class="w-1 h-6 bg-blue-600 rounded-full"></span>
        مركز القرارات اليومية
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- بطاقة: مخزون منخفض -->
        <button
          @click="openDetails('lowStock')"
          class="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition text-right w-full"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-slate-500">أصناف منخفضة المخزون</span>
            <span class="p-2 bg-red-50 text-red-600 rounded-xl"><i class="fas fa-exclamation-triangle"></i></span>
          </div>
          <div class="text-3xl font-bold text-red-600 mt-3">{{ inventory.low_stock || 0 }}</div>
          <div class="text-[10px] text-slate-400 mt-2">اضغط للتفاصيل ←</div>
        </button>

        <!-- بطاقة: قرب الانتهاء -->
        <button
          @click="openDetails('expiring')"
          class="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition text-right w-full"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-slate-500">قرب انتهاء الصلاحية</span>
            <span class="p-2 bg-amber-50 text-amber-600 rounded-xl"><i class="fas fa-clock"></i></span>
          </div>
          <div class="text-3xl font-bold text-amber-600 mt-3">{{ inventory.expiring_soon || 0 }}</div>
          <div class="text-[10px] text-slate-400 mt-2">اضغط للتفاصيل ←</div>
        </button>

        <!-- بطاقة: صحة المخزون -->
        <button
          @click="openDetails('health')"
          class="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition text-right w-full"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-slate-500">صحة المخزون</span>
            <span class="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><i class="fas fa-heartbeat"></i></span>
          </div>
          <div class="text-3xl font-bold text-emerald-600 mt-3">{{ inventory.health_score || 0 }}%</div>
          <div class="text-[10px] text-slate-400 mt-2">اضغط للتفاصيل ←</div>
        </button>

        <!-- بطاقة: رأس المال المجمد -->
        <button
          @click="openDetails('frozen')"
          class="bg-gradient-to-br from-red-50 to-red-100/50 backdrop-blur-sm rounded-2xl p-5 border border-red-200/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition text-right w-full"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-red-700">رأس المال المجمد</span>
            <span class="p-2 bg-red-200/50 text-red-700 rounded-xl"><i class="fas fa-lock"></i></span>
          </div>
          <div class="text-3xl font-bold text-red-700 mt-3">{{ formatCurrency(kpis.frozen_capital) }}</div>
          <div class="text-[10px] text-red-500 mt-2">اضغط للتفاصيل ←</div>
        </button>
      </div>
    </section>

      <!-- ===== KPIs ===== -->
      <section>
        <h2 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span class="w-1 h-6 bg-blue-600 rounded-full"></span>
          المؤشرات الرئيسية
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm hover:shadow-md transition">
            <div class="text-xs font-medium text-slate-400">مبيعات اليوم</div>
            <div class="text-xl font-bold text-slate-800 mt-1">{{ formatCurrency(kpis.today_sales) }}</div>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm hover:shadow-md transition">
            <div class="text-xs font-medium text-slate-400">ربح اليوم</div>
            <div class="text-xl font-bold text-emerald-600 mt-1">{{ formatCurrency(kpis.today_profit) }}</div>
          </div>
          <div class="bg-gradient-to-br from-purple-50 to-purple-100/50 backdrop-blur-sm rounded-2xl p-4 border border-purple-200/50 shadow-sm hover:shadow-md transition">
            <div class="text-xs font-medium text-purple-700">مبيعات الأسبوع</div>
            <div class="text-xl font-bold text-purple-700 mt-1">{{ formatCurrency(kpis.weekly_sales) }}</div>
          </div>
          <div class="bg-gradient-to-br from-indigo-50 to-indigo-100/50 backdrop-blur-sm rounded-2xl p-4 border border-indigo-200/50 shadow-sm hover:shadow-md transition">
            <div class="text-xs font-medium text-indigo-700">أرباح الأسبوع</div>
            <div class="text-xl font-bold text-indigo-700 mt-1">{{ formatCurrency(kpis.weekly_profit) }}</div>
          </div>
          <div class="bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50 shadow-sm hover:shadow-md transition">
            <div class="text-xs font-medium text-blue-700">مبيعات الشهر</div>
            <div class="text-xl font-bold text-blue-700 mt-1">{{ formatCurrency(kpis.monthly_sales) }}</div>
          </div>
          <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/50 backdrop-blur-sm rounded-2xl p-4 border border-emerald-200/50 shadow-sm hover:shadow-md transition">
            <div class="text-xs font-medium text-emerald-700">أرباح الشهر</div>
            <div class="text-xl font-bold text-emerald-700 mt-1">{{ formatCurrency(kpis.monthly_profit) }}</div>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm hover:shadow-md transition">
            <div class="text-xs font-medium text-slate-400">الفواتير</div>
            <div class="text-xl font-bold text-slate-800 mt-1">{{ kpis.today_invoices || 0 }}</div>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm hover:shadow-md transition">
            <div class="text-xs font-medium text-slate-400">متوسط الفاتورة</div>
            <div class="text-xl font-bold text-slate-800 mt-1">{{ formatCurrency(kpis.avg_invoice) }}</div>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm hover:shadow-md transition">
            <div class="text-xs font-medium text-slate-400">قيمة المخزون</div>
            <div class="text-xl font-bold text-slate-800 mt-1">{{ formatCurrency(kpis.inventory_value) }}</div>
          </div>
          <div class="bg-gradient-to-br from-red-50 to-red-100/50 backdrop-blur-sm rounded-2xl p-4 border border-red-200/50 shadow-sm hover:shadow-md transition">
            <div class="text-xs font-medium text-red-700">رأس المال المجمد</div>
            <div class="text-xl font-bold text-red-700 mt-1">{{ formatCurrency(kpis.frozen_capital) }}</div>
          </div>
        </div>
      </section>

      <!-- ===== Charts Row 1: Sales & Profit + Growth ===== -->
      <section>
        <h2 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span class="w-1 h-6 bg-blue-600 rounded-full"></span>
          التحليلات البصرية
        </h2>
        <div class="grid lg:grid-cols-2 gap-6">
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition">
            <h3 class="font-bold text-slate-700 mb-4">المبيعات والأرباح</h3>
            <div class="h-64">
              <canvas ref="salesProfitChartRef"></canvas>
            </div>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition">
            <h3 class="font-bold text-slate-700 mb-4">النمو الشهري (%)</h3>
            <div class="h-64">
              <canvas ref="growthChartRef"></canvas>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== Charts Row 2: Inventory, Suppliers, Peak Hours ===== -->
      <section>
        <div class="grid lg:grid-cols-3 gap-6">
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition">
            <h3 class="font-bold text-slate-700 mb-4">توزيع المخزون</h3>
            <div class="h-64">
              <canvas ref="inventoryChartRef"></canvas>
            </div>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition">
            <h3 class="font-bold text-slate-700 mb-4">تحليل الموردين</h3>
            <div class="h-64">
              <canvas ref="supplierChartRef"></canvas>
            </div>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition">
            <h3 class="font-bold text-slate-700 mb-4">ساعات الذروة</h3>
            <div class="h-64">
              <canvas ref="peakHoursChartRef"></canvas>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== Forecast ===== -->
      <section>
        <h2 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span class="w-1 h-6 bg-blue-600 rounded-full"></span>
          التوقعات والتنبؤات
        </h2>
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition">
          <div class="h-72">
            <canvas ref="forecastChartRef"></canvas>
          </div>
        </div>
      </section>

      <!-- ===== Top Selling & Profit ===== -->
      <section>
        <div class="grid lg:grid-cols-2 gap-6">
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition">
            <h2 class="font-bold text-slate-700 text-lg mb-4 flex items-center gap-2">
              <i class="fas fa-fire text-orange-500"></i>
              الأكثر مبيعاً
            </h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm" id="top-profit-table">
                <thead>
                  <tr class="border-b border-slate-200">
                    <th class="text-right py-3 font-semibold text-slate-500">الدواء</th>
                    <th class="text-right py-3 font-semibold text-slate-500">الكمية</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in topSelling" :key="item.name" class="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td class="py-3 font-medium text-slate-700">{{ item.name }}</td>
                    <td class="py-3 font-bold text-blue-600">{{ item.qty }}</td>
                  </tr>
                  <tr v-if="!topSelling.length">
                    <td colspan="2" class="py-8 text-center text-slate-400 text-sm">لا توجد بيانات كافية</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition">
            <h2 class="font-bold text-slate-700 text-lg mb-4 flex items-center gap-2">
              <i class="fas fa-coins text-emerald-500"></i>
              الأعلى ربحية
            </h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-200">
                    <th class="text-right py-3 font-semibold text-slate-500">الدواء</th>
                    <th class="text-right py-3 font-semibold text-slate-500">الربح</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in topProfit" :key="item.name" class="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td class="py-3 font-medium text-slate-700">{{ item.name }}</td>
                    <td class="py-3 font-bold text-emerald-600">{{ formatCurrency(item.profit) }}</td>
                  </tr>
                  <tr v-if="!topProfit.length">
                    <td colspan="2" class="py-8 text-center text-slate-400 text-sm">لا توجد بيانات كافية</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== Purchase Plan ===== -->
      <section>
        <h2 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span class="w-1 h-6 bg-blue-600 rounded-full"></span>
          خطة الشراء المقترحة (ERP Replenishment)
        </h2>
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition overflow-x-auto">
          <div class="flex justify-between items-center mb-4">
            <span class="text-sm text-slate-400">مبني على متوسط استهلاك 30 يوماً</span>
          </div>
          <table class="w-full text-sm" id="purchase-plan-table">
            <thead>
                <tr class="border-b border-slate-200 bg-slate-50/50">
                  <th class="text-right py-3 px-3 font-semibold text-slate-600">الصنف</th>
                  <th class="text-right py-3 px-3 font-semibold text-slate-600">
                    معدل البيع اليومي
                    <span class="block text-[10px] font-normal text-slate-400">بأكبر وحدة</span>
                  </th>
                  <th class="text-right py-3 px-3 font-semibold text-slate-600">
                    المخزون الحالي
                    <span class="block text-[10px] font-normal text-slate-400">بأكبر وحدة</span>
                  </th>
                  <th class="text-right py-3 px-3 font-semibold text-slate-600">يكفي لـ</th>
                  <th class="text-right py-3 px-3 font-semibold text-slate-600">
                    الطلب المقترح
                    <span class="block text-[10px] font-normal text-slate-400">بأكبر وحدة</span>
                  </th>
                  <th class="text-center py-3 px-3 font-semibold text-slate-600">الحالة</th>
                </tr>
              </thead>
            <tbody>
              <tr v-for="item in forecast" :key="item.name" class="border-b border-slate-100 hover:bg-slate-50/50 transition">
                <td class="py-3 px-3 font-medium text-slate-700">{{ item.name }}</td>

                <!-- ✅ معدل البيع اليومي بأكبر وحدة -->
                <td class="py-3 px-3 text-slate-600">
                  {{ item.avg_daily_in_largest_unit }}
                  <span class="text-xs text-slate-400">{{ item.largest_unit_name }}</span>
                </td>

                <!-- ✅ المخزون الحالي بأكبر وحدة -->
                <td class="py-3 px-3 font-bold text-slate-800">
                  {{ item.current_stock_in_largest_unit }}
                  <span class="text-xs font-normal text-slate-500">{{ item.largest_unit_name }}</span>
                </td>

                <!-- يكفي لـ (نفس المنطق) -->
                <td class="py-3 px-3 text-slate-600">
                  <span v-if="item.days_cover === '∞'">∞</span>
                  <span v-else>{{ item.days_cover }} يوم</span>
                </td>

                <!-- ✅ الطلب المقترح بأكبر وحدة -->
                <td class="py-3 px-3 font-extrabold text-blue-600">
                  <template v-if="item.suggested_order_in_largest_unit > 0">
                    {{ item.suggested_order_in_largest_unit }}
                    <span class="text-xs font-normal text-blue-400">{{ item.largest_unit_name }}</span>
                  </template>
                  <template v-else>—</template>
                </td>

                <!-- الحالة -->
                <td class="py-3 px-3 text-center">
                
                  <span :class="{
                    'bg-red-100 text-red-700 border-red-200': item.status === 'critical',
                    'bg-amber-100 text-amber-700 border-amber-200': item.status === 'warning',
                    'bg-emerald-100 text-emerald-700 border-emerald-200': item.status === 'normal',
                    'bg-slate-200 text-slate-700 border-slate-300': item.status === 'overstocked',
                    'bg-orange-100 text-orange-700 border-orange-200': item.status === 'excess'
                  }" class="px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1">
                    <i :class="{
                      'fas fa-ban': item.status === 'critical',
                      'fas fa-exclamation-triangle': item.status === 'warning',
                      'fas fa-check': item.status === 'normal',
                      'fas fa-snowflake': item.status === 'overstocked',
                      'fas fa-arrow-up': item.status === 'excess'
                    }" class="text-[10px]"></i>
                    {{ item.status_label }}
                  </span>
                </td>
              </tr>
              <tr v-if="!forecast.length">
                <td colspan="6" class="py-8 text-center text-slate-400 text-sm">لا توجد بيانات توقعات متاحة</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===== Recent Sales ===== -->
      <section>
        <h2 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span class="w-1 h-6 bg-blue-600 rounded-full"></span>
          آخر الفواتير
        </h2>
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="text-right py-3 font-semibold text-slate-500">#</th>
                <th class="text-right py-3 font-semibold text-slate-500">الإجمالي</th>
                <th class="text-right py-3 font-semibold text-slate-500">الربح</th>
                <th class="text-right py-3 font-semibold text-slate-500">طريقة الدفع</th>
                <th class="text-right py-3 font-semibold text-slate-500">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sale in recentSalesData" :key="sale.id" class="border-b border-slate-100 hover:bg-slate-50/50 transition">
                <td class="py-3 font-mono font-bold text-slate-700">#{{ sale.id }}</td>
                <td class="py-3 font-bold text-slate-800">{{ formatCurrency(sale.total_amount) }}</td>
                <td class="py-3 font-medium text-emerald-600">{{ formatCurrency(sale.profit_amount) }}</td>
                <td class="py-3 text-xs">
                  <span :class="{
                    'bg-emerald-100 text-emerald-700': sale.payment_method === 'cash',
                    'bg-blue-100 text-blue-700': sale.payment_method === 'bank' || sale.payment_method === 'bank_transfer'
                  }" class="px-2 py-1 rounded-full font-semibold">
                    {{ sale.payment_method === 'cash' ? '💵 نقدي' : '🏦 بنكي' }}
                  </span>
                </td>
                <td class="py-3 text-slate-500 text-xs">{{ formatDate(sale.created_at) }}</td>
              </tr>
              <tr v-if="!recentSalesData.length">
                <td colspan="5" class="py-8 text-center text-slate-400 text-sm">لا توجد فواتير حديثة</td>
              </tr>
            </tbody>
          </table>

          <!-- ✅ Pagination -->
          <div v-if="recentSalesMeta.last_page > 1" class="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <span class="text-xs text-slate-500">
              عرض {{ recentSalesMeta.total }} فاتورة — صفحة {{ recentSalesMeta.current_page }} / {{ recentSalesMeta.last_page }}
            </span>
            <div class="flex items-center gap-2">
              <button
                :disabled="recentSalesMeta.current_page <= 1"
                @click="loadPage(recentSalesMeta.current_page - 1)"
                class="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <i class="fas fa-chevron-right text-[10px]"></i>
                السابق
              </button>
              <span class="text-xs font-bold text-slate-600">
                {{ recentSalesMeta.current_page }} / {{ recentSalesMeta.last_page }}
              </span>
              <button
                :disabled="recentSalesMeta.current_page >= recentSalesMeta.last_page"
                @click="loadPage(recentSalesMeta.current_page + 1)"
                class="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                التالي
                <i class="fas fa-chevron-left text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      </section>
          <!-- ===== Details Modal ===== -->
    <div
      v-if="detailsModal.show"
      class="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      @click.self="closeDetails"
    >
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

        <!-- Header -->
        <div class="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center"
              :class="{
                'bg-red-100 text-red-600': detailsModal.type === 'frozen',
                'bg-amber-100 text-amber-600': detailsModal.type === 'lowStock',
                'bg-orange-100 text-orange-600': detailsModal.type === 'expiring',
                'bg-emerald-100 text-emerald-600': detailsModal.type === 'health'
              }">
              <i :class="{
                'fas fa-lock': detailsModal.type === 'frozen',
                'fas fa-exclamation-triangle': detailsModal.type === 'lowStock',
                'fas fa-clock': detailsModal.type === 'expiring',
                'fas fa-heartbeat': detailsModal.type === 'health'
              }"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-800">{{ detailsModal.title }}</h3>
              <p class="text-xs text-slate-500">{{ detailsModal.subtitle }}</p>
            </div>
          </div>
          <button @click="closeDetails"
            class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Summary Bar -->
        <div v-if="detailsModal.summary" class="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div v-for="(val, key) in detailsModal.summary" :key="key" class="flex items-center gap-2">
            <span class="text-xs text-slate-500">{{ key }}:</span>
            <span class="text-sm font-bold text-slate-800">{{ val }}</span>
          </div>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-5">
          <div v-if="detailsModal.loading" class="flex items-center justify-center py-12">
            <i class="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
          </div>

          <!-- جدول رأس المال المجمد -->
          <table v-else-if="detailsModal.type === 'frozen'" class="w-full text-sm">
            <thead class="sticky top-0 bg-white">
              <tr class="border-b border-slate-200">
                <th class="text-right py-3 px-2 font-semibold text-slate-500">#</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">الدواء</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">الدفعة</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">الفرع</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">الكمية المتبقية</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">سعر الشراء</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">القيمة المجمدة</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">الصلاحية</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in detailsModal.rows" :key="row.batch_id" class="border-b border-slate-100 hover:bg-slate-50/50">
                <td class="py-2.5 px-2 text-slate-400 font-mono text-xs">{{ i + 1 }}</td>
                <td class="py-2.5 px-2 font-medium text-slate-700">{{ row.medicine_name }}</td>
                <td class="py-2.5 px-2 text-slate-500 font-mono text-xs">{{ row.batch_number || '—' }}</td>
                <td class="py-2.5 px-2 text-slate-500 text-xs">{{ row.branch_name || '—' }}</td>
                <td class="py-2.5 px-2 font-bold text-slate-700">{{ row.remaining_qty }}</td>
                <td class="py-2.5 px-2 text-slate-600">{{ formatCurrency(row.buy_price) }}</td>
                <td class="py-2.5 px-2 font-bold text-red-600">{{ formatCurrency(row.frozen_value) }}</td>
                <td class="py-2.5 px-2">
                  <span v-if="row.days_to_expiry === null" class="text-slate-400">—</span>
                  <span v-else-if="row.days_to_expiry < 0" class="text-red-600 font-bold">منتهية</span>
                  <span v-else-if="row.days_to_expiry <= 30" class="text-red-600 font-bold">{{ row.days_to_expiry }} يوم</span>
                  <span v-else-if="row.days_to_expiry <= 90" class="text-amber-600">{{ row.days_to_expiry }} يوم</span>
                  <span v-else class="text-slate-500">{{ row.days_to_expiry }} يوم</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- جدول المخزون المنخفض -->
          <table v-else-if="detailsModal.type === 'lowStock'" class="w-full text-sm">
            <thead class="sticky top-0 bg-white">
              <tr class="border-b border-slate-200">
                <th class="text-right py-3 px-2 font-semibold text-slate-500">#</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">الدواء</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">الفرع</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">الكمية الحالية</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">الحد الأدنى</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">النقص</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">الطلب المقترح</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in detailsModal.rows" :key="row.id" class="border-b border-slate-100 hover:bg-slate-50/50">
                <td class="py-2.5 px-2 text-slate-400 font-mono text-xs">{{ i + 1 }}</td>
                <td class="py-2.5 px-2 font-medium text-slate-700">{{ row.medicine_name }}</td>
                <td class="py-2.5 px-2 text-slate-500 text-xs">{{ row.branch_name || '—' }}</td>
                <td class="py-2.5 px-2 font-bold text-red-600">{{ row.quantity }}</td>
                <td class="py-2.5 px-2 text-slate-600">{{ row.minimum_quantity }}</td>
                <td class="py-2.5 px-2 text-red-600 font-bold">− {{ row.deficit }}</td>
                <td class="py-2.5 px-2 font-bold text-blue-600">{{ row.reorder_qty }}</td>
              </tr>
            </tbody>
          </table>

          <!-- جدول قرب انتهاء الصلاحية -->
          <table v-else-if="detailsModal.type === 'expiring'" class="w-full text-sm">
            <thead class="sticky top-0 bg-white">
              <tr class="border-b border-slate-200">
                <th class="text-right py-3 px-2 font-semibold text-slate-500">#</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">الدواء</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">الدفعة</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">الفرع</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">الكمية</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">تاريخ الانتهاء</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">المتبقي</th>
                <th class="text-right py-3 px-2 font-semibold text-slate-500">القيمة</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in detailsModal.rows" :key="row.batch_id" class="border-b border-slate-100 hover:bg-slate-50/50"
                :class="{ 'bg-red-50/40': row.is_expired }">
                <td class="py-2.5 px-2 text-slate-400 font-mono text-xs">{{ i + 1 }}</td>
                <td class="py-2.5 px-2 font-medium text-slate-700">{{ row.medicine_name }}</td>
                <td class="py-2.5 px-2 text-slate-500 font-mono text-xs">{{ row.batch_number || '—' }}</td>
                <td class="py-2.5 px-2 text-slate-500 text-xs">{{ row.branch_name || '—' }}</td>
                <td class="py-2.5 px-2 font-bold text-slate-700">{{ row.remaining_qty }}</td>
                <td class="py-2.5 px-2 text-slate-600 text-xs">{{ row.expiry_date }}</td>
                <td class="py-2.5 px-2 font-bold">
                  <span v-if="row.is_expired" class="text-red-600">منتهية ({{ Math.abs(row.days_to_expiry) }} يوم)</span>
                  <span v-else-if="row.days_to_expiry <= 30" class="text-red-600">{{ row.days_to_expiry }} يوم</span>
                  <span v-else class="text-amber-600">{{ row.days_to_expiry }} يوم</span>
                </td>
                <td class="py-2.5 px-2 text-slate-600">{{ formatCurrency(row.stock_value) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- تفاصيل صحة المخزون -->
          <div v-else-if="detailsModal.type === 'health'" class="space-y-4">
            <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-6 border border-emerald-200">
              <div class="text-center">
                <div class="text-5xl font-black text-emerald-700">{{ detailsModal.summary?.score || 0 }}%</div>
                <div class="text-sm text-emerald-600 mt-2">صحة المخزون الإجمالية</div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-white rounded-2xl p-5 border border-slate-200">
                <div class="text-xs text-slate-400">النقاط الأساسية</div>
                <div class="text-2xl font-bold text-slate-700 mt-1">100</div>
              </div>
              <div class="bg-white rounded-2xl p-5 border border-red-200">
                <div class="text-xs text-red-500">خصم المخزون المنخفض</div>
                <div class="text-2xl font-bold text-red-600 mt-1">− {{ detailsModal.summary?.low_stock_penalty || 0 }}</div>
                <div class="text-[10px] text-slate-400 mt-1">({{ detailsModal.summary?.low_stock_count || 0 }} صنف × 2)</div>
              </div>
              <div class="bg-white rounded-2xl p-5 border border-amber-200">
                <div class="text-xs text-amber-500">خصم قرب الانتهاء</div>
                <div class="text-2xl font-bold text-amber-600 mt-1">− {{ detailsModal.summary?.expiring_penalty || 0 }}</div>
                <div class="text-[10px] text-slate-400 mt-1">({{ detailsModal.summary?.expiring_count || 0 }} صنف × 2)</div>
              </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
              <i class="fas fa-info-circle"></i>
              الصيغة: 100 − (عدد الأصناف منخفضة المخزون × 2) − (عدد الأصناف قرب الانتهاء × 2)
            </div>
          </div>

          <!-- No Data -->
          <div v-if="!detailsModal.loading && detailsModal.rows.length === 0 && detailsModal.type !== 'health'"
            class="text-center py-12 text-slate-400">
            <i class="fas fa-inbox text-5xl mb-3"></i>
            <p>لا توجد بيانات</p>
          </div>
        </div>

        <!-- Footer / Pagination -->
        <div v-if="detailsModal.meta && detailsModal.meta.last_page > 1"
          class="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <span class="text-xs text-slate-500">
            {{ detailsModal.meta.total }} عنصر — صفحة {{ detailsModal.meta.current_page }} / {{ detailsModal.meta.last_page }}
          </span>
          <div class="flex gap-2">
            <button
              :disabled="detailsModal.meta.current_page <= 1"
              @click="loadDetailsPage(detailsModal.meta.current_page - 1)"
              class="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              السابق
            </button>
            <button
              :disabled="detailsModal.meta.current_page >= detailsModal.meta.last_page"
              @click="loadDetailsPage(detailsModal.meta.current_page + 1)"
              class="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              التالي
            </button>
          </div>
        </div>
      </div>
    </div>
    </template>

    <!-- ===== Toast ===== -->
    <div v-if="toast.show" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-lg transition-all duration-300"
      :class="{
        'bg-emerald-50 border border-emerald-200 text-emerald-800': toast.type === 'success',
        'bg-red-50 border border-red-200 text-red-800': toast.type === 'error',
        'bg-amber-50 border border-amber-200 text-amber-800': toast.type === 'warning'
      }">
      <div class="flex items-center gap-3">
        <i :class="{
          'fas fa-check-circle text-emerald-500': toast.type === 'success',
          'fas fa-exclamation-circle text-red-500': toast.type === 'error',
          'fas fa-exclamation-triangle text-amber-500': toast.type === 'warning'
        }"></i>
        <span class="font-medium">{{ toast.message }}</span>
        <button @click="toast.show = false" class="mr-4 text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated, watch, nextTick } from 'vue';
import axios from 'axios';
import { useAnalyticsStore } from '../../src/js/stores/index.js';
import { storeToRefs } from 'pinia';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { API_BASE } from '../../src/js/config.js';

Chart.register(...registerables, ChartDataLabels);

// ===== Store =====
const analyticsStore = useAnalyticsStore();
const {
  dashboard, branches, loading, selectedBranch,
  kpis, inventory, forecast, topSelling, topProfit,
  salesProfitChart, growthChart, peakHours, suppliers,
} = storeToRefs(analyticsStore);
const { fetchBranches, fetchDashboard, refreshDashboard } = analyticsStore;

// ===== Toast =====
const toast = reactive({ show: false, message: '', type: 'success' });
const showToast = (message, type = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => toast.show = false, 4000);
};

// ===== Recent Sales Pagination =====
const recentSalesPage = ref(1);

// ✅ الشكل الصحيح الافتراضي
const recentSales = ref({
  data: [],
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  },
});

// ✅ computed آمنة للوصول من القالب
const recentSalesData = computed(() => recentSales.value?.data || []);
const recentSalesMeta = computed(() => recentSales.value?.meta || {
  current_page: 1, last_page: 1, per_page: 10, total: 0,
});
// ===== Details Modal =====
const detailsModal = reactive({
    show: false,
    type: null, // 'frozen' | 'lowStock' | 'expiring' | 'health'
    title: '',
    subtitle: '',
    summary: null,
    rows: [],
    meta: null,
    loading: false,
    currentPage: 1,
});

const modalConfig = {
    frozen: {
        title: 'رأس المال المجمد',
        subtitle: 'الدفعات التي لم تُبَع خلال 90 يوماً',
        endpoint: '/analytics/frozen-capital-details',
        icon: 'fas fa-lock',
    },
    lowStock: {
        title: 'أصناف منخفضة المخزون',
        subtitle: 'أصناف كميتها أقل من أو تساوي الحد الأدنى',
        endpoint: '/analytics/low-stock-details',
        icon: 'fas fa-exclamation-triangle',
    },
    expiring: {
        title: 'قرب انتهاء الصلاحية',
        subtitle: 'الدفعات التي ستنتهي خلال 60 يوماً',
        endpoint: '/analytics/expiring-details',
        icon: 'fas fa-clock',
    },
    health: {
        title: 'صحة المخزون',
        subtitle: 'مؤشر مركب لقياس حالة المخزون العامة',
        endpoint: '/analytics/health-details',
        icon: 'fas fa-heartbeat',
    },
};

const openDetails = async (type) => {
    const cfg = modalConfig[type];
    if (!cfg) return;

    detailsModal.show = true;
    detailsModal.type = type;
    detailsModal.title = cfg.title;
    detailsModal.subtitle = cfg.subtitle;
    detailsModal.rows = [];
    detailsModal.meta = null;
    detailsModal.summary = null;
    detailsModal.currentPage = 1;
    detailsModal.loading = true;

    await loadDetailsPage(1);
};

const loadDetailsPage = async (page) => {
    const type = detailsModal.type;
    const cfg = modalConfig[type];
    if (!cfg) return;

    detailsModal.loading = true;
    detailsModal.currentPage = page;

    try {
        const params = {
            branch_id: selectedBranch.value,
            _ts: Date.now(),
        };

        // للـ health لا نحتاج pagination
        if (type !== 'health') {
            params.page = page;
            params.per_page = 20;
        }

        const res = await axios.get(`${API_BASE}${cfg.endpoint}`, { params });

        if (type === 'health') {
            const data = res.data;
            detailsModal.summary = {
                score: data.health_score,
                low_stock_count: data.low_stock,
                expiring_count: data.expiring_soon,
                low_stock_penalty: data.breakdown?.low_stock_penalty || 0,
                expiring_penalty: data.breakdown?.expiring_penalty || 0,
            };
            detailsModal.rows = [];
            detailsModal.meta = null;
        } else {
            detailsModal.rows = res.data?.data || [];
            detailsModal.meta = res.data?.meta || null;

            // Summary bar
            if (type === 'frozen' && res.data?.meta?.total_value) {
                detailsModal.summary = {
                    'إجمالي القيمة المجمدة': formatCurrency(res.data.meta.total_value),
                    'عدد الدفعات': res.data.meta.total,
                };
            } else if (type === 'lowStock') {
                detailsModal.summary = {
                    'عدد الأصناف': res.data?.data?.length || 0,
                };
            } else if (type === 'expiring') {
                const expired = (res.data?.data || []).filter(r => r.is_expired).length;
                detailsModal.summary = {
                    'عدد الدفعات': res.data?.data?.length || 0,
                    'منتهية فعلاً': expired,
                };
            }
        }
    } catch (e) {
        console.error('loadDetailsPage error:', e);
        showToast('فشل تحميل التفاصيل', 'error');
        detailsModal.rows = [];
        detailsModal.meta = null;
    } finally {
        detailsModal.loading = false;
    }
};

const closeDetails = () => {
    detailsModal.show = false;
    detailsModal.type = null;
    detailsModal.rows = [];
    detailsModal.meta = null;
    detailsModal.summary = null;
};
// ===== Chart Refs =====
const salesProfitChartRef = ref(null);
const growthChartRef = ref(null);
const inventoryChartRef = ref(null);
const supplierChartRef = ref(null);
const peakHoursChartRef = ref(null);
const forecastChartRef = ref(null);
let chartInstances = {};

// ===== Helpers =====
const formatCurrency = (value) => {
  value = Number(value || 0);
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ج.س';
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
};

// ===== Load recent sales from API =====
const loadRecentSales = async () => {
  try {
    const res = await axios.get(`${API_BASE}/analytics/dashboard`, {
      params: {
        branch_id: selectedBranch.value,
        recent_sales_page: recentSalesPage.value,
        recent_sales_per_page: 10,
      },
    });

    const recent = res.data?.recent_sales;

    // ✅ الحماية من أي شكل غير متوقع
    if (recent && typeof recent === 'object' && Array.isArray(recent.data)) {
      recentSales.value = recent;
    } else if (Array.isArray(recent)) {
      // توافق مع الـ API القديم (مصفوفة فقط)
      recentSales.value = {
        data: recent,
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: recent.length,
        },
      };
    } else {
      recentSales.value = {
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
      };
    }
  } catch (e) {
    console.error('Failed to load recent sales:', e);
    recentSales.value = {
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    };
  }
};

// ===== Pagination handler =====
const loadPage = async (page) => {
  if (page < 1 || page > recentSalesMeta.value.last_page) return;
  recentSalesPage.value = page;
  await loadRecentSales();
};

// ===== Branch change =====
const onBranchChange = async () => {
  recentSalesPage.value = 1; // ✅ إعادة تعيين الصفحة
  await refreshDashboard(selectedBranch.value);
  await loadRecentSales();
  await nextTick();
  renderCharts();
};

// ===== Refresh =====
const refreshData = async () => {
  try {
    recentSalesPage.value = 1;
    await refreshDashboard(selectedBranch.value);
    await loadRecentSales();
    await nextTick();
    renderCharts();
    showToast('تم تحديث البيانات بنجاح', 'success');
  } catch (e) {
    showToast('حدث خطأ أثناء التحديث', 'error');
  }
};

const loadData = async () => {
  try {
    await fetchBranches();
    await fetchDashboard(selectedBranch.value);
    await loadRecentSales();
    await nextTick();
    renderCharts();
  } catch (e) {
    console.error('❌ فشل تحميل البيانات:', e);
  }
};

// ===== Chart Rendering =====
const renderCharts = () => {
  renderSalesProfitChart();
  renderGrowthChart();
  renderInventoryChart();
  renderSupplierChart();
  renderPeakHoursChart();
  renderForecastChart();
};

const renderSalesProfitChart = () => {
  if (!salesProfitChartRef.value || !salesProfitChart.value?.length) return;
  if (chartInstances.salesProfit) chartInstances.salesProfit.destroy();

  const data = salesProfitChart.value;
  chartInstances.salesProfit = new Chart(salesProfitChartRef.value, {
    type: 'bar',
    data: {
      labels: data.map(d => d.month),
      datasets: [
        {
          label: 'المبيعات',
          data: data.map(d => d.sales),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 6,
        },
        {
          label: 'الربح',
          data: data.map(d => d.profit),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { usePointStyle: true, padding: 20, font: { size: 12 } } },
        datalabels: { display: false },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } },
      },
    },
  });
};

const renderGrowthChart = () => {
  if (!growthChartRef.value || !growthChart.value?.length) return;
  if (chartInstances.growth) chartInstances.growth.destroy();

  const data = growthChart.value;
  chartInstances.growth = new Chart(growthChartRef.value, {
    type: 'line',
    data: {
      labels: data.map(d => d.month),
      datasets: [{
        label: 'نمو المبيعات (%)',
        data: data.map(d => d.growth),
        borderColor: 'rgba(139, 92, 246, 1)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        pointBorderColor: '#fff',
        borderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'top',
          formatter: v => v + '%',
          font: { size: 10, weight: 'bold' },
          color: '#7c3aed',
        },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } },
      },
    },
  });
};

const renderInventoryChart = () => {
  if (!inventoryChartRef.value) return;
  if (chartInstances.inventory) chartInstances.inventory.destroy();

  const labels = ['منخفض المخزون', 'قرب الانتهاء', 'مخزون آمن'];
  const values = [
    inventory.value?.low_stock || 0,
    inventory.value?.expiring_soon || 0,
    Math.max(0, (inventory.value?.low_stock || 0) * 3),
  ];

  chartInstances.inventory = new Chart(inventoryChartRef.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, padding: 15, font: { size: 12 } },
        },
        datalabels: {
          formatter: v => v > 0 ? v : '',
          font: { size: 14, weight: 'bold' },
          color: '#fff',
        },
      },
    },
  });
};

const renderSupplierChart = () => {
  if (!supplierChartRef.value || !suppliers.value?.length) return;
  if (chartInstances.supplier) chartInstances.supplier.destroy();

  const data = suppliers.value;
  chartInstances.supplier = new Chart(supplierChartRef.value, {
    type: 'pie',
    data: {
      labels: data.map(d => d.name),
      datasets: [{
        data: data.map(d => d.total),
        backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c'],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, padding: 10, font: { size: 11 } },
        },
        datalabels: {
          formatter: v => v > 0 ? formatCurrency(v) : '',
          font: { size: 10, weight: 'bold' },
          color: '#fff',
          anchor: 'center',
        },
      },
    },
  });
};

const renderPeakHoursChart = () => {
  if (!peakHoursChartRef.value || !peakHours.value?.length) return;
  if (chartInstances.peak) chartInstances.peak.destroy();

  const data = peakHours.value;
  chartInstances.peak = new Chart(peakHoursChartRef.value, {
    type: 'bar',
    data: {
      labels: data.map(d => d.hour),
      datasets: [{
        label: 'عدد الفواتير',
        data: data.map(d => d.invoices),
        backgroundColor: data.map((_, i) => {
          const colors = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];
          return colors[i % colors.length];
        }),
        borderRadius: 6,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'top',
          formatter: v => v > 0 ? v : '',
          font: { size: 10, weight: 'bold' },
          color: '#64748b',
        },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } },
      },
    },
  });
};

const renderForecastChart = () => {
  if (!forecastChartRef.value || !forecast.value?.length) return;
  if (chartInstances.forecast) chartInstances.forecast.destroy();

  const data = forecast.value;

  // ✅ استخدم القيم بأكبر وحدة
  const labels = data.map(d =>
    d.largest_unit_name && d.largest_unit_name !== 'وحدة'
      ? `${d.name} (${d.largest_unit_name})`
      : d.name
  );

  chartInstances.forecast = new Chart(forecastChartRef.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'المخزون الحالي',
          data: data.map(d => d.current_stock_in_largest_unit ?? d.current_stock),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 6,
        },
        {
          label: 'الطلب المقترح',
          data: data.map(d => d.suggested_order_in_largest_unit ?? d.suggested_order),
          backgroundColor: 'rgba(245, 158, 11, 0.6)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, padding: 15, font: { size: 12 } },
        },
        datalabels: { display: false },
        tooltip: {
          callbacks: {
            afterLabel: (ctx) => {
              const idx = ctx.dataIndex;
              const item = data[idx];
              if (!item) return '';
              return [
                `الوحدة: ${item.largest_unit_name}`,
                `المخزون الفعلي: ${item.current_stock} قطعة`,
              ];
            },
          },
        },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } },
      },
    },
  });
};

// ===== Watch for data changes =====
watch(dashboard, () => {
  nextTick(() => renderCharts());
}, { deep: true });

// ===== Lifecycle =====
onMounted(async () => {
  console.log('🟢 onMounted - تحميل صفحة التحليلات...');
  await loadData();
  console.log('✅ onMounted - تم تحميل التحليلات بنجاح');
});

onActivated(async () => {
  console.log('🟢 onActivated - تحديث التحليلات (force refresh)...');
  await refreshDashboard(selectedBranch.value);
  await loadRecentSales();
  await nextTick();
  renderCharts();
  console.log('✅ onActivated - تم تحديث التحليلات');
});
</script>

<style scoped>
/* أنماط إضافية حسب الحاجة */
</style>