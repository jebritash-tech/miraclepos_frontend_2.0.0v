<!-- modules/categories/categories.vue -->
<template>
  <div class="p-8 max-w-5xl mx-auto space-y-6" dir="rtl">
    <!-- Form -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div class="border-b border-slate-100 p-6 bg-slate-50/50">
        <h2 class="text-base font-bold text-slate-800 flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
            <i class="fas fa-tags"></i>
          </span>
          {{ isEditing ? 'تعديل التصنيف' : 'إضافة تصنيف جديد' }}
        </h2>
      </div>
      <div class="p-6 space-y-4">
        <div class="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div class="flex-1 w-full">
            <input
              v-model="form.name"
              placeholder="اسم التصنيف"
              class="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              :class="{'border-rose-500 bg-rose-50/30': errors.name, 'border-slate-300': !errors.name}"
            />
          </div>
          <div class="flex gap-2 w-full md:w-auto">
            <button
              @click="saveCategory"
              :disabled="saving"
              class="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              <i class="fas fa-save text-xs"></i>
              {{ saving ? 'جاري الحفظ...' : isEditing ? 'تحديث' : 'إضافة' }}
            </button>
            <button
              v-if="isEditing"
              @click="resetForm"
              class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-3 rounded-xl font-semibold text-sm transition"
            >
              إلغاء
            </button>
          </div>
        </div>
        <div v-if="Object.keys(errors).length" class="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-1">
          <div v-for="(err, key) in errors" :key="key" class="text-rose-600 text-xs font-medium">• {{ err[0] }}</div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div class="border-b border-slate-100 p-6 bg-slate-50/50">
        <h2 class="font-bold text-base text-slate-800 flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-sm">
            <i class="fas fa-list-ul"></i>
          </span>
          قائمة التصنيفات
        </h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-right text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <th class="p-4">اسم التصنيف</th>
              <th class="p-4 text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading && categories.length === 0">
              <td colspan="2" class="p-8 text-center text-slate-400 text-xs">جاري التحميل...</td>
            </tr>
            <tr v-else-if="!categories || categories.length === 0">
              <td colspan="2" class="p-8 text-center text-slate-400 text-xs">لا توجد تصنيفات مضافة حالياً</td>
            </tr>
            <tr v-for="cat in categories" :key="cat.id" class="hover:bg-slate-50/60 transition">
              <td class="p-4 font-bold text-slate-800">{{ cat.name }}</td>
              <td class="p-4 text-left">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="editCategory(cat)"
                    title="تعديل"
                    class="w-9 h-9 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 flex items-center justify-center transition shadow-sm"
                  >
                    <i class="fas fa-pen text-xs"></i>
                  </button>
                  <button
                    @click="deleteCategory(cat.id)"
                    :disabled="deleting"
                    title="حذف"
                    class="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-600 flex items-center justify-center transition shadow-sm"
                  >
                    <i class="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Toast Notification -->
    <div
      v-if="toast.show"
      class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-lg transition-all duration-300"
      :class="{
        'bg-emerald-50 border border-emerald-200 text-emerald-800': toast.type === 'success',
        'bg-red-50 border border-red-200 text-red-800': toast.type === 'error',
        'bg-amber-50 border border-amber-200 text-amber-800': toast.type === 'warning'
      }"
    >
      <div class="flex items-center gap-3">
        <i
          :class="{
            'fas fa-check-circle text-emerald-500': toast.type === 'success',
            'fas fa-exclamation-circle text-red-500': toast.type === 'error',
            'fas fa-exclamation-triangle text-amber-500': toast.type === 'warning'
          }"
        ></i>
        <span class="font-medium">{{ toast.message }}</span>
        <button @click="toast.show = false" class="mr-4 text-slate-400 hover:text-slate-600">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated } from 'vue';
import { useCategoryStore } from '../../src/js/stores/index.js';
import { storeToRefs } from 'pinia';
import { API_BASE } from '../../src/js/config.js';
import axios from 'axios';

const categoryStore = useCategoryStore();
const { categories, loading } = storeToRefs(categoryStore);
const { refreshCategories } = categoryStore;

// ===== Local State =====
const form = ref({ id: null, name: '' });
const isEditing = ref(false);
const errors = ref({});
const saving = ref(false);
const deleting = ref(false);

// ===== Toast System =====
const toast = reactive({ show: false, message: '', type: 'success' });
const showToast = (message, type = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => { toast.show = false; }, 4000);
};

// ===== Methods =====
const resetForm = () => {
  form.value = { id: null, name: '' };
  isEditing.value = false;
  errors.value = {};
};

const editCategory = (cat) => {
  form.value = { ...cat };
  isEditing.value = true;
  errors.value = {};
};

const saveCategory = async () => {
  errors.value = {};
  saving.value = true;

  try {
    let response;
    if (isEditing.value) {
      response = await axios.put(`${API_BASE}/categories/${form.value.id}`, { name: form.value.name });
      const index = categories.value.findIndex(c => c.id === form.value.id);
      if (index !== -1) {
        categories.value[index] = response.data.category || { id: form.value.id, name: form.value.name };
      }
      showToast('تم تحديث التصنيف', 'success');
    } else {
      response = await axios.post(`${API_BASE}/categories`, { name: form.value.name });
      const newCategory = response.data.category || { id: Date.now(), name: form.value.name };
      categories.value.unshift(newCategory);
      showToast('تم إضافة التصنيف', 'success');
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

const deleteCategory = async (id) => {
  if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
  deleting.value = true;

  try {
    await axios.delete(`${API_BASE}/categories/${id}`);
    categories.value = categories.value.filter(cat => cat.id !== id);
    showToast('تم حذف التصنيف', 'success');
  } catch (e) {
    showToast('حدث خطأ أثناء الحذف', 'error');
    console.error(e);
  } finally {
    deleting.value = false;
  }
};

// ===== Lifecycle =====
onMounted(async () => {
  console.log('🟢 onMounted - جلب التصنيفات...');
  await refreshCategories();
  console.log('✅ onMounted - التصنيفات بعد الجلب:', categories.value);
});

onActivated(async () => {
  console.log('🟢 onActivated - جلب التصنيفات (force refresh)...');
  await refreshCategories();
  console.log('✅ onActivated - التصنيفات بعد الجلب:', categories.value);
});
</script>