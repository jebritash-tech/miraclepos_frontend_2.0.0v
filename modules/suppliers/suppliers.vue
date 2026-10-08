<!-- modules/suppliers/suppliers.vue -->
<template>
  <div class="p-6 lg:p-8 space-y-8 bg-slate-50/50 min-h-screen" dir="rtl">
    <!-- Form -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div class="px-8 py-6 border-b border-slate-100 bg-gradient-to-l from-slate-50/50 to-white">
        <div class="flex items-center gap-3">
          <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
          <div>
            <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">إدارة الموردين</h2>
            <p class="text-sm text-slate-500 mt-0.5">إضافة وتحديث بيانات الموردين المسجلين في النظام.</p>
          </div>
        </div>
      </div>
      <div class="p-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">اسم المورد</label>
            <input v-model="form.name" placeholder="اسم المورد" class="w-full bg-slate-50/50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" :class="{'border-red-500 bg-red-50/30': errors.name, 'border-slate-200': !errors.name}">
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">رقم الهاتف</label>
            <input v-model="form.phone" placeholder="رقم الهاتف" class="w-full bg-slate-50/50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-mono" :class="{'border-red-500 bg-red-50/30': errors.phone, 'border-slate-200': !errors.phone}">
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">البريد الإلكتروني</label>
            <input v-model="form.email" placeholder="البريد الإلكتروني" class="w-full bg-slate-50/50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-mono" :class="{'border-red-500 bg-red-50/30': errors.email, 'border-slate-200': !errors.email}">
          </div>
        </div>
        <div v-if="Object.keys(errors).length" class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl space-y-1">
          <div v-for="(err, key) in errors" :key="key" class="text-red-600 text-xs font-medium flex items-center gap-1.5">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <span>{{ err[0] }}</span>
          </div>
        </div>
        <div class="flex justify-end">
          <button @click="saveSupplier" :disabled="saving" class="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-60 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-150 flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            {{ saving ? 'جاري الحفظ...' : isEditing ? 'تحديث بيانات المورد' : 'إضافة مورد جديد' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-right border-collapse">
          <thead>
            <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <th class="p-4.5">اسم المورد</th>
              <th class="p-4.5">الهاتف</th>
              <th class="p-4.5">البريد</th>
              <th class="p-4.5 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
            <tr v-if="loading && suppliers.length === 0"><td colspan="4" class="text-center py-12 text-slate-400">جاري التحميل...</td></tr>
            <tr v-else-if="!suppliers || suppliers.length === 0"><td colspan="4" class="text-center py-12 text-slate-400">لا يوجد موردين مسجلين حتى الآن.</td></tr>
            <tr v-for="s in suppliers" :key="s.id" class="hover:bg-slate-50/50 transition-colors group">
              <td class="p-4.5 font-bold text-slate-800">{{ s.name }}</td>
              <td class="p-4.5 font-mono text-slate-600">{{ s.phone }}</td>
              <td class="p-4.5 font-mono text-slate-500">{{ s.email }}</td>
              <td class="p-4.5 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button @click="editSupplier(s)" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="تعديل">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </button>
                  <button @click="deleteSupplier(s.id)" :disabled="deleting" class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50" title="حذف">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Toast -->
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
import { ref, reactive, onMounted, onActivated, watch } from 'vue';
import { useSupplierStore } from '../../src/js/stores/index.js';
import { storeToRefs } from 'pinia';
import { API_BASE } from '../../src/js/config.js';
import axios from 'axios';

const supplierStore = useSupplierStore();
const { suppliers, loading } = storeToRefs(supplierStore);
const { refreshSuppliers } = supplierStore;

// مراقبة التغييرات في suppliers
watch(suppliers, (newVal) => {
  console.log('🔵 [suppliers.vue] suppliers changed:', newVal);
}, { deep: true });



const form = ref({ id: null, name: '', phone: '', email: '' });
const isEditing = ref(false);
const errors = ref({});
const saving = ref(false);
const deleting = ref(false);

// Toast
const toast = reactive({ show: false, message: '', type: 'success' });
const showToast = (message, type = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => toast.show = false, 4000);
};

const resetForm = () => {
  form.value = { id: null, name: '', phone: '', email: '' };
  isEditing.value = false;
  errors.value = {};
};

const editSupplier = (s) => {
  form.value = { ...s };
  isEditing.value = true;
  errors.value = {};
};

const saveSupplier = async () => {
  errors.value = {};
  saving.value = true;

  try {
    let response;
    if (isEditing.value) {
      response = await axios.put(`${API_BASE}/suppliers/${form.value.id}`, form.value);
      const index = suppliers.value.findIndex(s => s.id === form.value.id);
      if (index !== -1) {
        suppliers.value[index] = response.data.supplier || form.value;
      }
      showToast('تم تحديث المورد', 'success');
    } else {
      response = await axios.post(`${API_BASE}/suppliers`, form.value);
      const newSupplier = response.data.supplier || { id: Date.now(), ...form.value };
      suppliers.value.unshift(newSupplier);
      showToast('تم إضافة المورد', 'success');
    }
    resetForm();
  } catch (e) {
    if (e.response?.status === 422) {
      errors.value = e.response.data.errors;
      showToast('يرجى تصحيح الأخطاء', 'warning');
    } else {
      showToast('حدث خطأ غير متوقع', 'error');
      console.error(e);
    }
  } finally {
    saving.value = false;
  }
};

const deleteSupplier = async (id) => {
  if (!confirm('هل أنت متأكد من حذف هذا المورد؟')) return;
  deleting.value = true;

  try {
    await axios.delete(`${API_BASE}/suppliers/${id}`);
    suppliers.value = suppliers.value.filter(s => s.id !== id);
    showToast('تم حذف المورد', 'success');
  } catch (e) {
    showToast('حدث خطأ أثناء الحذف', 'error');
    console.error(e);
  } finally {
    deleting.value = false;
  }
};

// ===== Lifecycle =====
onMounted(async () => {
  console.log('🟢 onMounted - جلب الموردين...');
  await refreshSuppliers();
  console.log('✅ onMounted - الموردين بعد الجلب:', suppliers.value);
});

onActivated(async () => {
  console.log('🟢 onActivated - جلب الموردين...');
  await refreshSuppliers();
  console.log('✅ onActivated - الموردين بعد الجلب:', suppliers.value);
  const searchData = localStorage.getItem('search_result_data');
    if (searchData) {
      try {
        const data = JSON.parse(searchData);
        if (data.type === 'مورد') {
          const supplier = suppliers.value.find(s => s.id === data.id);
          if (supplier) {
            editSupplier(supplier);
            showToast(`تم العثور على المورد: ${data.name}`, 'success');
          }
        }
      } catch(e) {}
      localStorage.removeItem('search_result_data');
    }
});
</script>