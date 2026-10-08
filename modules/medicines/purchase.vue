<!-- modules/medicines/purchase.vue -->
<template>
  <div class="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-slate-50/50 min-h-screen" dir="rtl">
    <!-- ================= Header ================= -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div class="px-4 py-4 lg:px-8 lg:py-6 border-b border-slate-100 bg-gradient-to-l from-slate-50/50 to-white header-padding">
        <div class="flex items-center gap-3">
          <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
          </div>
          <div>
            <h2 class="text-lg lg:text-xl font-extrabold text-slate-800 tracking-tight">شراء مخزون جديد</h2>
            <p class="text-xs lg:text-sm text-slate-500 mt-0.5">إنشاء فاتورة شراء جديدة وإضافة دفعات المخزون.</p>
          </div>
        </div>
      </div>
      <div class="p-4 lg:p-8 section-padding">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">المورد</label>
            <select v-model="purchase.supplier_id" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
              <option value="">اختر المورد</option>
              <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">{{ supplier.name }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">الفرع المستهدف</label>
            <select v-model="purchase.branch_id" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
              <option value="">اختر الفرع</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">رقم الفاتورة</label>
            <input v-model="purchase.invoice_number" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400" placeholder="INV-001">
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">تاريخ الشراء</label>
            <input type="date" v-model="purchase.purchase_date" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">الخصم</label>
            <input type="number" step="0.01" v-model="purchase.discount" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
          </div>
          <div class="space-y-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-1">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">ملاحظات</label>
            <input v-model="purchase.notes" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400" placeholder="اختياري">
          </div>
        </div>
      </div>
    </div>

    <!-- ================= Main Content: 80% Add Item + 20% History ================= -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 main-grid">
      <!-- ===== 80% - Add Item Section ===== -->
      <div class="lg:col-span-4 space-y-6">
        <!-- Add Item -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-200 hover:shadow-md">
          <div class="px-4 py-4 lg:px-8 lg:py-5 border-b border-slate-100 bg-gradient-to-l from-slate-50/50 to-white flex items-center justify-between header-padding">
            <h3 class="font-bold text-slate-800 text-base flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> إضافة صنف</h3>
          </div>
          <div class="p-4 lg:p-8 section-padding">
           <div class="space-y-5">
            <!-- ✅ البحث عن الدواء — عرض كامل -->
            <div class="relative space-y-1.5">
              <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <i class="fas fa-search text-emerald-600 text-[10px] ml-1"></i>
                  ابحث باسم الدواء أو باركود الوحدة
              </label>
              <div class="relative">
                  <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <i class="fas fa-pills text-slate-300 text-sm"></i>
                  </div>
                  <input
                      v-model="search"
                      @focus="showDropdown = true"
                      @input="showDropdown = true"
                      @blur="hideDropdown"
                      @keydown.esc="showDropdown = false"
                      class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 pr-11 py-3 text-base text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                      placeholder="ابدأ بكتابة اسم الدواء أو امسح الباركود..."
                  >
                  <!-- ✅ زر مسح البحث -->
                  <button
                      v-if="search"
                      @click="clearSearch"
                      type="button"
                      class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 hover:text-rose-500 transition"
                      title="مسح البحث"
                  >
                      <i class="fas fa-times-circle"></i>
                  </button>
              </div>
              <div
                  v-if="filteredMedicines.length"
                  class="absolute z-50 bg-white border border-slate-100 rounded-xl shadow-xl w-full mt-2 max-h-72 overflow-auto divide-y divide-slate-50"
              >
                  <div
                      v-for="medicine in filteredMedicines"
                      :key="medicine.id"
                      @mousedown.prevent="chooseMedicine(medicine)"
                      class="p-3.5 cursor-pointer hover:bg-emerald-50/50 transition-colors flex flex-col gap-0.5"
                  >
                      <div class="font-bold text-slate-800 text-sm">{{ medicine.name }}</div>
                      <div class="text-xs font-mono text-slate-400">{{ medicine.barcode }}</div>
                  </div>
              </div>
          </div>

            <!-- ✅ حقلان متساويان — عناصر تحت بعضها -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <!-- ═══════════ الجانب الأيمن — بيانات الشراء ═══════════ -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2 pb-2 border-b border-emerald-100">
                        <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span class="text-xs font-bold text-emerald-700 uppercase tracking-wider">بيانات الشراء</span>
                    </div>

                    <!-- الوحدة -->
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            <i class="fas fa-box text-emerald-500 text-[10px] ml-1"></i>
                            الوحدة
                        </label>
                        <select
                            v-model="item.unit_id"
                            @change="changeUnit"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        >
                            <option value="">اختر الوحدة</option>
                            <option v-for="unit in availableUnits" :key="unit.id" :value="unit.id">
                                {{ unit.name }} (معامل: {{ unit.factor }})
                            </option>
                        </select>
                    </div>

                    <!-- الكمية -->
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            <i class="fas fa-sort-numeric-up text-emerald-500 text-[10px] ml-1"></i>
                            الكمية
                        </label>
                        <input
                            type="number"
                            min="1"
                            v-model.number="item.quantity"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                            placeholder="1"
                        >
                    </div>

                    <!-- سعر الشراء -->
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            <i class="fas fa-tag text-emerald-500 text-[10px] ml-1"></i>
                            سعر الشراء
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            v-model.number="item.buy_price"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                            placeholder="0.00"
                        >
                    </div>
                </div>

                <!-- ═══════════ الجانب الأيسر — بيانات الدفعة ═══════════ -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2 pb-2 border-b border-blue-100">
                        <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span class="text-xs font-bold text-blue-700 uppercase tracking-wider">بيانات الدفعة</span>
                    </div>

                    <!-- سعر الوحدة الأساسية -->
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            <i class="fas fa-calculator text-blue-500 text-[10px] ml-1"></i>
                            سعر الوحدة الأساسية
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            :value="baseUnitPrice"
                            disabled
                            class="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-500 cursor-not-allowed font-mono"
                        >
                    </div>

                    <!-- LOT -->
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            <i class="fas fa-barcode text-blue-500 text-[10px] ml-1"></i>
                            رقم الدفعة (LOT)
                        </label>
                        <input
                            v-model="item.batch_number"
                            id="lot-input"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                            placeholder="B-001"
                        >
                    </div>

                    <!-- EXP -->
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            <i class="fas fa-calendar-alt text-blue-500 text-[10px] ml-1"></i>
                            تاريخ الصلاحية
                        </label>
                        <input
                            type="date"
                            v-model="item.expiry_date"
                            class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                        >
                    </div>
                </div>

            </div>
        </div>

            <!-- معلومات الوحدة -->
            <div v-if="selectedUnit" class="mt-6 bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4 lg:p-5">
              <div class="unit-info-grid text-center md:text-right">
                <div class="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div class="text-slate-400 text-xs font-medium mb-1">معامل التحويل</div>
                  <div class="font-bold text-slate-700 text-lg font-mono">× {{ selectedUnit.factor }}</div>
                </div>
                <div class="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div class="text-slate-400 text-xs font-medium mb-1">الكمية (وحدة أساسية)</div>
                  <div class="font-extrabold text-emerald-600 text-lg font-mono">{{ baseQuantity }}</div>
                </div>
                <div class="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div class="text-slate-400 text-xs font-medium mb-1">سعر الوحدة الأساسية</div>
                  <div class="font-extrabold text-blue-600 text-lg font-mono">{{ formatCurrency(baseUnitPrice) }}</div>
                </div>
                <div class="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div class="text-slate-400 text-xs font-medium mb-1">الوحدة الأساسية</div>
                  <div class="font-bold text-slate-700 text-base">{{ getBaseUnitName }}</div>
                </div>
                <div class="flex items-center justify-center md:justify-end add-item-btn">
                  <button @click="addItem" class="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium px-8 py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-150 flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    إضافة الصنف
                  </button>
                </div>
              </div>
            </div>

            <div v-if="selectedMedicine" class="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div class="text-xs text-slate-500 mb-1">قاعدة التسعير</div>
                  <div class="font-bold text-blue-700">{{ selectedMedicine.pricing_rule?.name || 'القاعدة الافتراضية' }}</div>
                </div>
                <div v-if="selectedMedicine.pricing_rule" class="text-sm text-slate-600">
                  <span v-if="selectedMedicine.pricing_rule.type === 'percentage'">ربح {{ selectedMedicine.pricing_rule.value }}%</span>
                  <span v-else-if="selectedMedicine.pricing_rule.type === 'fixed'">+ {{ selectedMedicine.pricing_rule.value }}</span>
                  <span v-else-if="selectedMedicine.pricing_rule.type === 'multiply'">× {{ selectedMedicine.pricing_rule.value }}</span>
                </div>
              </div>
              <div v-if="selectedMedicine.pricing_rule?.settings?.rounding" class="text-xs text-slate-500 mt-2">
                التقريب: {{ selectedMedicine.pricing_rule.settings.rounding.mode === 'up' ? 'لأعلى' : selectedMedicine.pricing_rule.settings.rounding.mode === 'down' ? 'لأسفل' : selectedMedicine.pricing_rule.settings.rounding.mode === 'nearest' ? 'الأقرب' : 'بدون تقريب' }}
                <span v-if="selectedMedicine.pricing_rule.settings.rounding.mode !== 'none'"> إلى {{ selectedMedicine.pricing_rule.settings.rounding.unit }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <!-- Desktop Table (يظهر على الشاشات الكبيرة فقط) -->
          <div class="hidden md:block table-scroll-wrapper">
            <table class="w-full text-right border-collapse">
              <thead>
                <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th class="p-3 lg:p-4.5">الدواء</th>
                  <th class="p-3 lg:p-4.5">الوحدة</th>
                  <th class="p-3 lg:p-4.5">الكمية</th>
                  <th class="p-3 lg:p-4.5">التحويل</th>
                  <th class="p-3 lg:p-4.5">الكمية الأساسية</th>
                  <th class="p-3 lg:p-4.5">سعر الشراء</th>
                  <th class="p-3 lg:p-4.5">سعر الوحدة الأساسية</th>
                  <th class="p-3 lg:p-4.5">الإجمالي</th>
                  <th class="p-3 lg:p-4.5">LOT</th>
                  <th class="p-3 lg:p-4.5">الصلاحية</th>
                  <th class="p-3 lg:p-4.5 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
                <tr v-for="(row, index) in purchaseItems" :key="index" class="hover:bg-slate-50/50 transition-colors group">
                  <td class="p-4.5 font-bold text-slate-800">{{ row.medicine_name }}</td>
                  <td class="p-4.5"><span class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">{{ row.unit_name }}</span></td>
                  <td class="p-4.5 font-mono font-semibold text-slate-700">{{ row.quantity }}</td>
                  <td class="p-4.5 font-mono text-slate-500">× {{ row.factor }}</td>
                  <td class="p-4.5 font-mono font-semibold text-slate-700">{{ row.base_quantity }}</td>
                  <td class="p-4.5 font-mono text-slate-600">{{ formatCurrency(row.buy_price) }}</td>
                  <td class="p-4.5 font-mono text-blue-600">{{ formatCurrency(row.buy_price / row.factor) }}</td>
                  <td class="p-4.5 font-mono font-bold text-emerald-600">{{ formatCurrency(row.subtotal) }}</td>
                  <td class="p-4.5 font-mono text-xs text-slate-500">{{ row.batch_number || '-' }}</td>
                  <td class="p-4.5 font-mono text-xs text-slate-500">{{ row.expiry_date || '-' }}</td>
                  <td class="p-4.5 text-center">
                    <button @click="removeItem(index)" class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-80 group-hover:opacity-100" title="حذف الصنف">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </td>
                </tr>
                <tr v-if="!purchaseItems.length"><td colspan="11" class="text-center py-12 text-slate-400">لم يتم إضافة أي أصناف إلى الفاتورة حتى الآن.</td></tr>
              </tbody>
            </table>
          </div>
        
          <!-- Mobile Cards (تظهر على الموبايل فقط) -->
          <div class="md:hidden">
            <!-- Header -->
            <div class="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h3 class="font-bold text-slate-700 text-sm flex items-center gap-2">
                <i class="fas fa-list text-emerald-600"></i>
                الأصناف المضافة
              </h3>
              <span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                {{ purchaseItems.length }}
              </span>
            </div>
        
            <!-- Cards -->
            <div v-if="purchaseItems.length" class="divide-y divide-slate-100">
              <div v-for="(row, index) in purchaseItems" :key="index" class="p-4">
                <!-- اسم الدواء + زر حذف -->
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-slate-800 text-sm leading-tight">{{ row.medicine_name }}</h4>
                    <span class="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium">
                      {{ row.unit_name }}
                    </span>
                  </div>
                  <button @click="removeItem(index)" class="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors shrink-0" title="حذف">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
        
                <!-- شبكة المعلومات -->
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="bg-slate-50 rounded-lg p-2">
                    <div class="text-slate-400 text-[10px] mb-0.5">الكمية</div>
                    <div class="font-bold text-slate-700 font-mono">{{ row.quantity }}</div>
                  </div>
                  <div class="bg-slate-50 rounded-lg p-2">
                    <div class="text-slate-400 text-[10px] mb-0.5">التحويل</div>
                    <div class="font-bold text-slate-700 font-mono">× {{ row.factor }}</div>
                  </div>
                  <div class="bg-slate-50 rounded-lg p-2">
                    <div class="text-slate-400 text-[10px] mb-0.5">الكمية الأساسية</div>
                    <div class="font-bold text-slate-700 font-mono">{{ row.base_quantity }}</div>
                  </div>
                  <div class="bg-slate-50 rounded-lg p-2">
                    <div class="text-slate-400 text-[10px] mb-0.5">سعر الشراء</div>
                    <div class="font-bold text-slate-700 font-mono">{{ formatCurrency(row.buy_price) }}</div>
                  </div>
                  <div class="bg-blue-50 rounded-lg p-2">
                    <div class="text-blue-500 text-[10px] mb-0.5">سعر الوحدة الأساسية</div>
                    <div class="font-bold text-blue-700 font-mono">{{ formatCurrency(row.buy_price / row.factor) }}</div>
                  </div>
                  <div class="bg-emerald-50 rounded-lg p-2">
                    <div class="text-emerald-500 text-[10px] mb-0.5">الإجمالي</div>
                    <div class="font-bold text-emerald-700 font-mono">{{ formatCurrency(row.subtotal) }}</div>
                  </div>
                </div>
        
                <!-- LOT + EXP -->
                <div v-if="row.batch_number || row.expiry_date" class="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div v-if="row.batch_number" class="bg-amber-50 rounded-lg p-2">
                    <div class="text-amber-600 text-[10px] mb-0.5">LOT</div>
                    <div class="font-bold text-amber-800 font-mono text-[11px]">{{ row.batch_number }}</div>
                  </div>
                  <div v-if="row.expiry_date" class="bg-rose-50 rounded-lg p-2">
                    <div class="text-rose-600 text-[10px] mb-0.5">الصلاحية</div>
                    <div class="font-bold text-rose-800 font-mono text-[11px]">{{ row.expiry_date }}</div>
                  </div>
                </div>
              </div>
            </div>
        
            <!-- Empty state -->
            <div v-else class="text-center py-12 px-4">
              <i class="fas fa-inbox text-4xl text-slate-300 mb-3"></i>
              <p class="text-slate-400 text-sm">لم يتم إضافة أي أصناف إلى الفاتورة حتى الآن.</p>
            </div>
          </div>
        </div>
        <!-- Summary -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <!-- Desktop: 6 أعمدة -->
          <div class="hidden md:grid grid-cols-3 lg:grid-cols-6 gap-4 p-4 lg:p-6 text-center divide-x divide-x-reverse divide-slate-100">
            <div class="p-2">
              <div class="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">إجمالي الفاتورة</div>
              <div class="font-extrabold text-slate-800 text-xl font-mono">{{ formatCurrency(subtotal) }}</div>
            </div>
            <div class="p-2">
              <div class="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">الخصم</div>
              <div class="font-extrabold text-slate-800 text-xl font-mono">{{ formatCurrency(purchase.discount) }}</div>
            </div>
            <div class="p-2">
              <div class="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">الصافي</div>
              <div class="font-extrabold text-emerald-600 text-2xl font-mono">{{ formatCurrency(grandTotal) }}</div>
            </div>
            <div class="p-2">
              <div class="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">عدد الأصناف</div>
              <div class="font-extrabold text-slate-800 text-xl font-mono">{{ purchaseItems.length }}</div>
            </div>
            <div class="p-2">
              <div class="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">إجمالي الحبات</div>
              <div class="font-extrabold text-slate-800 text-xl font-mono">{{ totalBase }}</div>
            </div>
            <div class="p-2">
              <div class="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">متوسط سعر الحبة</div>
              <div class="font-extrabold text-blue-600 text-xl font-mono">{{ formatCurrency(grandTotal / (totalBase || 1)) }}</div>
            </div>
          </div>
        
          <!-- Mobile: بطاقة مخصصة -->
          <div class="md:hidden">
            <!-- الإجمالي والصافي (الأهم - في الأعلى) -->
            <div class="grid grid-cols-2 gap-3 p-4 bg-gradient-to-l from-emerald-50/50 to-white border-b border-slate-100">
              <div class="text-center">
                <div class="text-slate-500 text-[11px] font-semibold mb-1">إجمالي الفاتورة</div>
                <div class="font-extrabold text-slate-800 text-lg font-mono">{{ formatCurrency(subtotal) }}</div>
              </div>
              <div class="text-center">
                <div class="text-emerald-600 text-[11px] font-semibold mb-1">الصافي</div>
                <div class="font-extrabold text-emerald-600 text-xl font-mono">{{ formatCurrency(grandTotal) }}</div>
              </div>
            </div>
        
            <!-- باقي التفاصيل -->
            <div class="grid grid-cols-2 gap-3 p-4">
              <div class="bg-slate-50 rounded-lg p-3 text-center">
                <div class="text-slate-400 text-[10px] font-semibold mb-1">الخصم</div>
                <div class="font-bold text-slate-700 text-base font-mono">{{ formatCurrency(purchase.discount) }}</div>
              </div>
              <div class="bg-slate-50 rounded-lg p-3 text-center">
                <div class="text-slate-400 text-[10px] font-semibold mb-1">عدد الأصناف</div>
                <div class="font-bold text-slate-700 text-base font-mono">{{ purchaseItems.length }}</div>
              </div>
              <div class="bg-slate-50 rounded-lg p-3 text-center">
                <div class="text-slate-400 text-[10px] font-semibold mb-1">إجمالي الحبات</div>
                <div class="font-bold text-slate-700 text-base font-mono">{{ totalBase }}</div>
              </div>
              <div class="bg-blue-50 rounded-lg p-3 text-center">
                <div class="text-blue-500 text-[10px] font-semibold mb-1">متوسط سعر الحبة</div>
                <div class="font-bold text-blue-700 text-base font-mono">{{ formatCurrency(grandTotal / (totalBase || 1)) }}</div>
              </div>
            </div>
          </div>
        </div>
        <!-- Save -->
        <div class="flex justify-end pt-2">
          <button id="save-purchase-btn" @click="savePurchase" :disabled="saving" class="save-btn bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-55 text-white font-bold px-6 lg:px-10 py-3.5 rounded-xl shadow-xl shadow-emerald-700/20 transition-all duration-150 flex items-center gap-3">
            <svg v-if="!saving" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {{ saving ? "جارى الحفظ..." : "حفظ الفاتورة" }}
          </button>
        </div>
      </div>

      <!-- ===== 20% - Purchases History ===== -->
      <div class="lg:col-span-1 history-column">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden lg:sticky lg:top-6 history-sticky">
          <div class="border-b border-slate-100 p-4 bg-gradient-to-l from-slate-50/50 to-white">
            <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
              <i class="fas fa-history text-emerald-600"></i>
              سجل المشتريات
            </h3>
            <p class="text-xs text-slate-400">اختر فاتورة لعرض التفاصيل</p>
          </div>

          <!-- Search in history -->
          <div class="p-3 border-b border-slate-100">
            <input v-model="historySearch" type="text" placeholder="بحث في المشتريات..." class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
          </div>

          <!-- History List -->
          <div class="max-h-[300px] lg:max-h-[500px] overflow-y-auto divide-y divide-slate-100">
            <div v-if="loadingHistory" class="p-8 text-center text-slate-400 text-sm">جاري التحميل...</div>
            <div v-else-if="filteredHistory.length === 0" class="p-8 text-center text-slate-400 text-sm">لا توجد مشتريات سابقة</div>
            <div
              v-for="p in filteredHistory"
              :key="p.id"
              @click="selectPurchase(p)"
              class="p-4 cursor-pointer hover:bg-emerald-50/60 transition-all duration-150"
              :class="{'bg-emerald-50/80 border-r-4 border-emerald-600': selectedPurchaseId === p.id}"
            >
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-bold text-slate-800 text-sm">#{{ p.id }}</p>
                  <p class="text-xs text-slate-500">{{ p.supplier?.name || 'غير محدد' }}</p>
                </div>
                <div class="text-left">
                  <p class="font-bold text-emerald-600 text-sm">{{ formatCurrency(p.total_amount || 0) }}</p>
                  <p class="text-[10px] text-slate-400">{{ new Date(p.created_at).toLocaleDateString('ar') }}</p>
                </div>
              </div>
              <div class="mt-1 text-[10px] text-slate-400">
                {{ p.items?.length || 0 }} صنف
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div class="flex justify-between items-center p-3 border-t border-slate-100">
            <span class="text-xs text-slate-400">صفحة {{ pagination.currentPage }} من {{ pagination.lastPage }}</span>
            <div class="flex gap-1">
              <button @click="refreshPurchases(pagination.currentPage - 1)" 
                  :disabled="pagination.currentPage <= 1"
                  class="px-2 py-1 text-xs bg-slate-100 rounded disabled:opacity-40">◀</button>
              <button @click="refreshPurchases(pagination.currentPage + 1)" 
                  :disabled="pagination.currentPage >= pagination.lastPage"
                  class="px-2 py-1 text-xs bg-slate-100 rounded disabled:opacity-40">▶</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= Purchase Details Modal ================= -->
    <div v-if="showDetailsModal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 lg:p-4">
      <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] lg:max-h-[90vh] overflow-hidden flex flex-col">
        <div class="flex justify-between items-center border-b border-slate-100 p-4 bg-gradient-to-l from-slate-50/50 to-white">
          <h3 class="text-base lg:text-lg font-bold text-slate-800 flex items-center gap-2">
            <i class="fas fa-file-invoice text-emerald-600"></i>
            تفاصيل الفاتورة #{{ selectedPurchase?.id }}
          </h3>
          <button @click="showDetailsModal = false" class="text-slate-400 hover:text-slate-600 p-1">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-4 lg:p-6 overflow-y-auto flex-1">
          <!-- Supplier & Date Info -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
            <div class="bg-slate-50 rounded-xl p-3 lg:p-4">
              <p class="text-xs text-slate-400">المورد</p>
              <p class="font-bold text-slate-800 text-sm lg:text-base">{{ selectedPurchase?.supplier?.name || 'غير محدد' }}</p>
            </div>
            <div class="bg-slate-50 rounded-xl p-3 lg:p-4">
              <p class="text-xs text-slate-400">رقم الفاتورة</p>
              <p class="font-bold text-slate-800 text-sm lg:text-base">{{ selectedPurchase?.invoice_number || '-' }}</p>
            </div>
            <div class="bg-slate-50 rounded-xl p-3 lg:p-4">
              <p class="text-xs text-slate-400">التاريخ</p>
              <p class="font-bold text-slate-800 text-sm lg:text-base">{{ new Date(selectedPurchase?.created_at).toLocaleDateString('ar') }}</p>
            </div>
            <div class="bg-emerald-50 rounded-xl p-3 lg:p-4">
              <p class="text-xs text-emerald-600">الإجمالي</p>
              <p class="font-bold text-emerald-700 text-sm lg:text-base">{{ formatCurrency(selectedPurchase?.total_amount || 0) }}</p>
            </div>
          </div>

          <!-- Items Table with Base Unit Price -->
          <div class="border rounded-xl overflow-hidden">
            <div class="table-scroll-wrapper">
              <table class="w-full text-right text-sm">
                <thead class="bg-slate-50">
                  <tr class="text-slate-600 text-xs font-bold uppercase tracking-wider">
                    <th class="p-3">الدواء</th>
                    <th class="p-3">الوحدة</th>
                    <th class="p-3">الكمية</th>
                    <th class="p-3">سعر الوحدة الأساسية</th>
                    <th class="p-3">الإجمالي</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="item in selectedPurchase?.items || []" :key="item.id" class="hover:bg-slate-50/60">
                    <td class="p-3 font-semibold">{{ item.medicine?.name || 'غير معروف' }}</td>
                    <td class="p-3 text-slate-600">{{ item.unit_name || '-' }}</td>
                    <td class="p-3 font-mono">{{ item.quantity }}</td>
                    <td class="p-3 font-mono text-blue-600">
                      {{ formatCurrency((item.buy_price || 0) / (item.factor || 1)) }}
                    </td>
                    <td class="p-3 font-bold text-emerald-600">{{ formatCurrency((item.buy_price || 0) * item.quantity) }}</td>
                  </tr>
                </tbody>
                <tfoot class="bg-slate-50 font-bold border-t-2 border-slate-200">
                  <tr>
                    <td colspan="4" class="p-3 text-left text-slate-600">الإجمالي الكلي</td>
                    <td class="p-3 text-emerald-700 text-lg">{{ formatCurrency(selectedPurchase?.total_amount || 0) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="toast.show" class="toast-container fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] px-4 lg:px-6 py-3 lg:py-4 rounded-xl shadow-lg transition-all duration-300"
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
        <span class="font-medium text-sm lg:text-base">{{ toast.message }}</span>
        <button @click="toast.show = false" class="mr-2 lg:mr-4 text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useMedicineStore, useBranchStore, useSupplierStore, usePurchaseStore } from '../../src/js/stores/index.js';
import { storeToRefs } from 'pinia';
import axios from 'axios';
import { API_BASE } from '../../src/js/config.js';
import PurchaseService from '../../src/js/services/purchase.service.js';

// ===== Purchase Store =====
const purchaseStore = usePurchaseStore();
const { purchases, loading: loadingHistory, pagination } = storeToRefs(purchaseStore);
const { refreshPurchases } = purchaseStore;

const medicineStore = useMedicineStore();
const branchStore = useBranchStore();
const supplierStore = useSupplierStore();

const { medicines } = storeToRefs(medicineStore);
const { branches } = storeToRefs(branchStore);
const { suppliers } = storeToRefs(supplierStore);

// ===== State =====
const purchase = reactive({
    supplier_id: "",
    branch_id: "",
    invoice_number: "",
    purchase_date: new Date().toISOString().substring(0, 10),
    exchange_rate: 1,
    discount: 0,
    notes: ""
});

const purchaseItems = ref([]);
const availableUnits = ref([]);
const search = ref("");
const showDropdown = ref(false); 
const selectedMedicine = ref(null);
const saving = ref(false);

const item = reactive({
    medicine_id: null,
    medicine_name: "",
    unit_id: null,
    unit_name: "",
    quantity: 1,
    factor: 1,
    base_quantity: 1,
    buy_price: 0,
    subtotal: 0,
    batch_number: "",
    expiry_date: ""
});

// ===== History State =====
const purchaseHistory = ref([]);
const selectedPurchaseId = ref(null);
const selectedPurchase = ref(null);
const showDetailsModal = ref(false);
const historySearch = ref('');

// ===== Computed =====
const filteredMedicines = computed(() => {
    // ✅ لا تعرض القائمة إذا كانت مغلقة
    if (!showDropdown.value) return [];

    // ✅ لا تعرض إذا كان البحث قصيراً
    const query = String(search.value || '').trim();
    if (query.length < 2) return [];

    // ✅ إذا تم اختيار دواء مطابق تماماً، لا تعرض القائمة
    if (
        selectedMedicine.value &&
        selectedMedicine.value.name === query
    ) {
        return [];
    }

    return medicines.value.filter(m =>
        m.name?.toLowerCase().includes(query.toLowerCase()) ||
        (m.barcode || "").includes(query)
    ).slice(0, 20);
});
const filteredHistory = computed(() => {
    if (!historySearch.value) return purchases.value;
    const query = historySearch.value.toLowerCase().trim();
    return purchases.value.filter(p =>
        p.id?.toString().includes(query) ||
        p.supplier?.name?.toLowerCase().includes(query) ||
        p.invoice_number?.toLowerCase().includes(query)
    );
});

const selectedUnit = computed(() => {
    return availableUnits.value.find(u => Number(u.id) === Number(item.unit_id)) || null;
});

const baseQuantity = computed(() => {
    if (!selectedUnit.value) return 0;
    return Number(item.quantity) * Number(selectedUnit.value.factor);
});

const baseUnitPrice = computed(() => {
    if (!selectedUnit.value || !item.buy_price) return 0;
    return Number(item.buy_price) / Number(selectedUnit.value.factor);
});

const getBaseUnitName = computed(() => {
    if (!selectedMedicine.value) return 'غير محدد';
    const baseUnit = selectedMedicine.value.units?.find(u => u.is_base);
    return baseUnit?.unit?.name || 'حبة';
});

const subtotal = computed(() => {
    return purchaseItems.value.reduce((sum, row) => sum + (Number(row.quantity) * Number(row.buy_price)), 0);
});

const grandTotal = computed(() => {
    return subtotal.value - Number(purchase.discount || 0);
});

const totalBase = computed(() => {
    return purchaseItems.value.reduce((sum, row) => sum + Number(row.base_quantity), 0);
});

// ===== Toast =====
const toast = reactive({ show: false, message: '', type: 'success' });
const showToast = (message, type = 'success') => {
    toast.message = message;
    toast.type = type;
    toast.show = true;
    setTimeout(() => toast.show = false, 4000);
};

// ===== Methods =====
const resetItem = () => {
    item.medicine_id = null;
    item.medicine_name = "";
    item.unit_id = null;
    item.unit_name = "";
    item.quantity = 1;
    item.factor = 1;
    item.base_quantity = 1;
    item.buy_price = 0;
    item.subtotal = 0;
    item.batch_number = "";
    item.expiry_date = "";
    availableUnits.value = [];
    selectedMedicine.value = null;
    search.value = "";
    showDropdown.value = false;   // ← ✅
};

const chooseMedicine = (medicine) => {
    selectedMedicine.value = medicine;
    search.value = medicine.name;
    showDropdown.value = false;   // ← ✅ أغلق القائمة فوراً
    item.medicine_id = medicine.id;
    item.medicine_name = medicine.name;

    availableUnits.value = (medicine.units || []).map(u => ({
        id: u.unit_id,
        pivot_id: u.id,
        name: u.unit?.name || 'وحدة',
        factor: Number(u.factor) || 1,
        is_base: u.is_base
    }));

    if (availableUnits.value.length) {
        const base = availableUnits.value.find(u => u.is_base) || availableUnits.value[0];
        item.unit_id = base.id;
        item.unit_name = base.name;
        item.factor = base.factor;
    }
};

const changeUnit = () => {
    const unit = availableUnits.value.find(u => Number(u.id) === Number(item.unit_id));
    if (!unit) return;
    item.unit_name = unit.name;
    item.factor = unit.factor;
    item.base_quantity = Number(item.quantity) * Number(unit.factor);
};

const addItem = () => {
    if (!item.medicine_id) return showToast("اختر دواء", "warning");
    if (!item.unit_id) return showToast("اختر وحدة", "warning");
    if (Number(item.quantity) <= 0) return showToast("أدخل الكمية", "warning");
    if (Number(item.buy_price) <= 0) return showToast("أدخل سعر الشراء", "warning");

    item.factor = Number(item.factor || 1);
    item.base_quantity = Number(item.quantity) * Number(item.factor);
    item.subtotal = Number(item.quantity) * Number(item.buy_price);

    purchaseItems.value.push({
        medicine_id: item.medicine_id,
        medicine_name: item.medicine_name,
        unit_id: item.unit_id,
        unit_name: item.unit_name,
        quantity: Number(item.quantity),
        factor: Number(item.factor),
        base_quantity: Number(item.base_quantity),
        buy_price: Number(item.buy_price),
        subtotal: Number(item.subtotal),
        batch_number: item.batch_number,
        expiry_date: item.expiry_date
    });

    resetItem();
};

const removeItem = (index) => {
    purchaseItems.value.splice(index, 1);
};

const buildPayload = () => {
    return {
        purchase: {
            supplier_id: purchase.supplier_id,
            branch_id: purchase.branch_id,
            invoice_number: purchase.invoice_number,
            purchase_date: purchase.purchase_date,
            exchange_rate: purchase.exchange_rate,
            discount: purchase.discount,
            notes: purchase.notes
        },
        items: purchaseItems.value
    };
};

const validatePurchase = () => {
    if (!purchase.branch_id) return "اختر الفرع المستهدف";
    if (!purchase.supplier_id) return "اختر المورد";
    if (!purchaseItems.value.length) return "الفاتورة فارغة";
    return null;
};

const resetPurchase = () => {
    purchase.supplier_id = "";
    purchase.branch_id = "";
    purchase.invoice_number = "";
    purchase.discount = 0;
    purchase.notes = "";
    purchaseItems.value = [];
    resetItem();
};

const formatCurrency = (value) => {
    value = Number(value || 0);
    return value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + " ج.س";
};

// ===== History Methods =====
const loadPurchaseHistory = async () => {
    await refreshPurchases(1);
};

const selectPurchase = (purchase) => {
    selectedPurchaseId.value = purchase.id;
    selectedPurchase.value = purchase;
    showDetailsModal.value = true;
};

const savePurchase = async () => {
    const error = validatePurchase();
    if (error) return showToast(error, "warning");

    saving.value = true;
    try {
        const response = await PurchaseService.save(buildPayload());
        console.log('✅ تم حفظ الفاتورة:', response);
        
        showToast("تم حفظ الفاتورة بنجاح", "success");
        resetPurchase();
        
        // ===== تحديث قائمة المشتريات فوراً =====
        if (response.purchases) {
            purchases.value = response.purchases;
        }
        if (response.pagination) {
            Object.assign(pagination.value, response.pagination);
        }
        
        // تحديث المخزون والأدوية
        await medicineStore.fetchMedicines();
    } catch (e) {
        console.error('❌ خطأ في حفظ الفاتورة:', e);
        showToast(e.response?.data?.message || "حدث خطأ أثناء الحفظ", "error");
    } finally {
        saving.value = false;
    }
};

const hideDropdown = () => {
    setTimeout(() => {
        showDropdown.value = false;
    }, 200);
};

const clearSearch = () => {
    search.value = '';
    selectedMedicine.value = null;
    showDropdown.value = false;
};

// ===== Watchers =====
watch(() => item.quantity, () => {
    if (!selectedUnit.value) return;
    item.factor = selectedUnit.value.factor;
    item.base_quantity = Number(item.quantity) * Number(selectedUnit.value.factor);
});

watch([() => item.quantity, () => item.buy_price], () => {
    item.subtotal = Number(item.quantity) * Number(item.buy_price);
});

watch(() => item.unit_id, (newVal) => {
    const unit = availableUnits.value.find(u => Number(u.id) === Number(newVal));
    if (unit) {
        item.unit_name = unit.name;
        item.factor = unit.factor;
        item.base_quantity = Number(item.quantity) * Number(unit.factor);
    }
});

// ===== Lifecycle =====
onMounted(async () => {
    await Promise.all([
        medicineStore.fetchMedicines(),
        branchStore.fetchBranches(),
        supplierStore.fetchSuppliers(),
        loadPurchaseHistory()
    ]);
    const searchData = localStorage.getItem('search_result_data');
    if (searchData) {
      try {
        const data = JSON.parse(searchData);
        if (data.type === 'فاتورة شراء') {
          const purchase = purchases.value.find(p => p.id === data.id);
          if (purchase) {
            selectPurchase(purchase);
            showToast(`تم العثور على فاتورة شراء #${data.id}`, 'success');
          } else {
            fetchAndShowPurchase(data.id);
          }
        }
      } catch(e) {}
      localStorage.removeItem('search_result_data');
    }
});
</script>

<style scoped>
/* ============================================
   تحسينات الحقول والمدخلات
   ============================================ */
input, select, textarea {
  font-size: 14px;
}

input:focus, select:focus {
  outline: none;
}


/* ============================================
   قسم معلومات الوحدة (5 أعمدة)
   ============================================ */
.unit-info-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  align-items: center;
}

/* ============================================
   الجدول — تمرير أفقي محسّن
   ============================================ */
.table-scroll-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-scroll-wrapper table {
  min-width: 1000px;
}

/* ============================================
   الموبايل (أقل من 1024px)
   ============================================ */
@media (max-width: 1023px) {
  .main-grid {
    grid-template-columns: 1fr;
  }

  .history-column,
  .history-sticky {
    position: static !important;
  }


  .unit-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .unit-info-grid .add-item-btn {
    grid-column: 1 / -1;
  }
}

/* ============================================
   الموبايل الصغير (أقل من 640px)
   ============================================ */
@media (max-width: 639px) {

  .unit-info-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .save-btn {
    width: 100%;
    justify-content: center;
  }

  .modal-content {
    max-height: 100vh !important;
    border-radius: 0 !important;
    margin: 0 !important;
  }

  .toast-container {
    left: 1rem !important;
    right: 1rem !important;
    transform: none !important;
    max-width: none !important;
  }
}

/* ============================================
   تحسينات عامة
   ============================================ */
* {
  -webkit-tap-highlight-color: transparent;
}

button {
  touch-action: manipulation;
}

.min-h-screen {
  overflow-x: hidden;
}
</style>
