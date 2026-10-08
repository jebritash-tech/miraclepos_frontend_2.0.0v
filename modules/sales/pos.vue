<!-- modules/sales/pos.vue -->
<template>
  <div class="flex flex-col h-screen max-w-4xl mx-auto bg-slate-50">
    <!-- معلومات الوردية -->
    <div class="bg-white shadow-sm p-2 text-center text-xs text-slate-500 border-b">
      <span v-if="currentShift">
        الوردية #{{ currentShift.id }} - الفتح: {{ Number(currentShift.opening_cash || 0).toLocaleString() }} ج.س
        <span class="mx-2">|</span>
        {{ currentUser?.name || 'غير معروف' }}
      </span>
      <span v-else class="text-red-600">⚠️ لا توجد وردية مفتوحة</span>
    </div>

    <!-- شريط البحث -->
    <div class="p-4 bg-white shadow-sm relative z-10">
      <div class="relative">
        <i class="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
        <input 
          v-model="searchQuery" 
          @input="onSearch"
          type="text" 
          placeholder="ابحث عن دواء (الاسم أو الباركود)..."
          class="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
        >
      </div>
      
      <!-- نتائج البحث -->
      <div v-if="searchQuery && filteredMedicines.length > 0" 
           class="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-20">
        <div v-for="med in filteredMedicines.slice(0, 15)" 
             :key="med.id" 
             @click="addToCart(med)"
             class="flex items-center justify-between px-4 py-2.5 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0">
          <div>
            <div class="font-medium text-slate-800">{{ med.name }}</div>
            <div class="text-xs text-slate-400 font-mono">{{ med.barcode || 'بدون باركود' }}</div>
          </div>
          <div class="text-sm font-bold text-emerald-600">
            {{ Number(med.sell_price || 0).toFixed(2) }} ج.س
          </div>
        </div>
      </div>
    </div>

    <!-- محتوى السلة -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2">
      <div v-if="cart.items.length === 0" class="text-center text-slate-400 py-12">
        <i class="fas fa-shopping-cart text-5xl block mb-4 opacity-30"></i>
        <p>السلة فارغة</p>
        <p class="text-sm">ابحث عن دواء وأضفه إلى السلة</p>
      </div>
      
      <div v-for="(item, index) in cart.items" :key="index" 
           class="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-4 hover:shadow-md transition">
        <div class="flex-1 min-w-0">
          <div class="font-bold text-slate-800 text-sm">{{ item.medicine_name }}</div>
          <div class="text-xs text-slate-500 flex items-center gap-2">
            <span>{{ item.unit_name }}</span>
            <span class="text-slate-300">|</span>
            <span class="font-mono">{{ Number(item.price || 0).toFixed(2) }} ج.س</span>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <button @click="cart.updateQuantity(index, item.quantity - 1)" 
                  class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition">
            -
          </button>
          <span class="font-bold text-slate-800 w-6 text-center">{{ item.quantity }}</span>
          <button @click="cart.updateQuantity(index, item.quantity + 1)" 
                  class="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-600 flex items-center justify-center text-sm font-bold transition">
            +
          </button>
        </div>
        
        <div class="font-bold text-emerald-600 w-20 text-left">
          {{ Number(item.total || 0).toFixed(2) }} ج.س
        </div>
        
        <button @click="cart.removeItem(index)" 
                class="text-red-400 hover:text-red-600 transition p-1">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- الإجماليات والدفع -->
    <div class="bg-white shadow-lg border-t border-slate-100 p-4 space-y-3">
      <!-- الإجماليات -->
      <div class="flex justify-between text-sm">
        <span class="text-slate-500">المجموع الفرعي</span>
        <span class="font-bold">{{ Number(cart.subtotal || 0).toFixed(2) }} ج.س</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-slate-500">الخصم ({{ cart.discount || 0 }}%)</span>
        <span class="text-red-500">- {{ Number(cart.discountAmount || 0).toFixed(2) }} ج.س</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-slate-500">الضريبة ({{ cart.tax || 0 }}%)</span>
        <span class="text-amber-600">+ {{ Number(cart.taxAmount || 0).toFixed(2) }} ج.س</span>
      </div>
      <div class="flex justify-between text-lg font-bold border-t border-slate-100 pt-3">
        <span>الإجمالي</span>
        <span class="text-emerald-600">{{ Number(cart.total || 0).toFixed(2) }} ج.س</span>
      </div>

      <!-- خيارات الدفع -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1 grid grid-cols-3 gap-2">
          <button @click="sale.payment_method = 'cash'" 
                  class="py-2 rounded-xl text-sm font-bold transition"
                  :class="sale.payment_method === 'cash' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
            <i class="fas fa-money-bill-wave block text-lg"></i>
            نقدي
          </button>
          <button @click="sale.payment_method = 'card'" 
                  class="py-2 rounded-xl text-sm font-bold transition"
                  :class="sale.payment_method === 'card' ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
            <i class="fas fa-credit-card block text-lg"></i>
            بطاقة
          </button>
          <button @click="sale.payment_method = 'debt'" 
                  class="py-2 rounded-xl text-sm font-bold transition"
                  :class="sale.payment_method === 'debt' ? 'bg-amber-100 text-amber-700 border-2 border-amber-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
            <i class="fas fa-file-invoice block text-lg"></i>
            دين
          </button>
        </div>
        
        <button @click="checkout" :disabled="loading || cart.items.length === 0"
                class="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition flex items-center justify-center gap-2 min-w-[120px]">
          <i class="fas fa-check" v-if="!loading"></i>
          <i class="fas fa-spinner fa-spin" v-else></i>
          {{ loading ? 'جاري...' : 'إتمام البيع' }}
        </button>
      </div>

      <!-- ملاحظات البيع -->
      <input v-model="sale.notes" type="text" placeholder="ملاحظات إضافية (اختياري)" 
             class="w-full text-sm border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { SalesService } from './services/sales.service.js';
import { createCart } from './utils/cart.js';
import { getCachedUser } from '../../src/js/offline-db.js';
import { playSound } from '../../src/js/sounds.js';

// ===== حالة التطبيق =====
const loading = ref(false);
const searchQuery = ref('');
const medicines = ref([]);
const filteredMedicines = computed(() => {
  if (!searchQuery.value) return [];
  const query = searchQuery.value.toLowerCase().trim();
  return medicines.value.filter(m =>
    m.name?.toLowerCase().includes(query) ||
    m.barcode?.toLowerCase().includes(query)
  );
});

// ===== السلة =====
const cart = createCart();

// ===== بيانات البيع =====
const sale = reactive({
  customer_name: '',
  customer_phone: '',
  payment_method: 'cash',
  notes: ''
});

// ===== الوردية الحالية =====
const currentShift = ref(null);
const currentUser = ref(null);

// ===== تحميل الأدوية =====
const loadMedicines = async () => {
  loading.value = true;
  try {
    const user = await getCachedUser();
    currentUser.value = user;
    const branchId = user?.branch_id || 1;
    const data = await SalesService.fetchMedicines(branchId);
    medicines.value = data;
  } catch (error) {
    console.error('❌ فشل تحميل الأدوية:', error);
  } finally {
    loading.value = false;
  }
};

// ===== جلب الوردية المفتوحة =====
const loadShift = async () => {
  try {
    const user = await getCachedUser();
    if (!user) return;
    const shift = await SalesService.getCurrentShift(user.id);
    if (shift && shift.status === 'open') {
      currentShift.value = shift;
    } else {
      window.location.href = 'shift.html';
    }
  } catch (error) {
    console.error('❌ فشل جلب الوردية:', error);
    window.location.href = 'shift.html';
  }
};

// ===== إضافة دواء إلى السلة =====
const addToCart = (medicine) => {
  const unit = medicine.units?.find(u => u.is_base) || medicine.units?.[0];
  if (!unit) {
    alert('هذا الدواء لا يحتوي على وحدات بيع!');
    return;
  }

  const price = medicine.sell_price || medicine.prices?.[0]?.sell_price || 0;
  if (price <= 0) {
    alert('هذا الدواء ليس له سعر بيع محدد!');
    return;
  }

  const batch = medicine.batches?.find(b => b.remaining_quantity > 0);
  if (!batch) {
    alert('لا يوجد مخزون متاح لهذا الدواء!');
    return;
  }

  cart.addItem(medicine, unit, 1, price, batch.id);
  playSound('cart');
};

// ===== إتمام البيع =====
const checkout = async () => {
  if (cart.items.length === 0) {
    alert('السلة فارغة!');
    return;
  }

  if (!currentShift.value) {
    alert('لا توجد وردية مفتوحة!');
    return;
  }

  const payload = {
    shift_id: currentShift.value.id,
    branch_id: currentShift.value.branch_id,
    user_id: currentShift.value.user_id,
    items: cart.items.map(item => ({
      medicine_id: item.medicine_id,
      batch_id: item.batch_id,
      unit_id: item.unit_id,
      quantity: item.quantity,
      price: item.price,
      total: item.total
    })),
    total_amount: cart.total,
    discount: cart.discount,
    tax: cart.tax,
    payment_method: sale.payment_method,
    customer_name: sale.customer_name,
    customer_phone: sale.customer_phone,
    notes: sale.notes
  };

  loading.value = true;
  try {
    const result = await SalesService.saveSale(payload);
    if (result.success) {
      playSound('success');
      alert('تم حفظ الفاتورة بنجاح!');
      cart.clear();
      sale.customer_name = '';
      sale.customer_phone = '';
      sale.notes = '';
      await loadMedicines();
    } else {
      alert('حدث خطأ أثناء حفظ الفاتورة.');
    }
  } catch (error) {
    console.error('❌ خطأ أثناء إتمام البيع:', error);
    alert('حدث خطأ غير متوقع.');
  } finally {
    loading.value = false;
  }
};

// ===== البحث الفوري =====
const onSearch = () => {
  // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
};

// ===== مزامنة الفواتير غير المتزامنة =====
window.addEventListener('online', async () => {
  const count = await SalesService.syncPendingSales();
  if (count > 0) {
    alert(`تمت مزامنة ${count} فواتير بنجاح.`);
    await loadMedicines();
  }
});

// ===== دورة الحياة =====
onMounted(async () => {
  await loadMedicines();
  await loadShift();
});
</script>

<style scoped>
/* يمكن إضافة أنماط خاصة بالـ POS هنا */
</style>