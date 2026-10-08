<!-- modules/users/users.vue -->
<template>
  <div class="p-4" dir="rtl">
    <!-- Add Form -->
    <div class="bg-white p-6 rounded-xl shadow mb-8 border border-slate-100">
      <h3 class="font-bold text-lg mb-4 text-emerald-800">إضافة مستخدم جديد</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div class="col-span-full">
          <div v-for="(error, key) in errors" :key="key" class="text-red-500 text-xs mb-1">* {{ error[0] }}</div>
        </div>
        <input v-model="userForm.name" placeholder="اسم الموظف" class="border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" :class="{'border-red-500': errors.name}">
        <input v-model="userForm.email" type="email" placeholder="البريد الإلكتروني" class="border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" :class="{'border-red-500': errors.email}">
        <input v-model="userForm.password" type="password" placeholder="كلمة المرور" class="border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" :class="{'border-red-500': errors.password}">
        <input v-model="userForm.salary" type="number" placeholder="الراتب الأساسي" class="border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" :class="{'border-red-500': errors.salary}">
        <select v-model="userForm.role" class="border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
          <option value="cashier">صيدلي</option>
          <option value="admin">مدير</option>
        </select>
        <select v-model="userForm.branch_id" class="border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
          <option value="" disabled selected>اختر الفرع...</option>
          <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>
      </div>
      <button @click="saveUser" :disabled="saving" class="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-6 py-2.5 mt-4 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all">
        {{ saving ? 'جاري الحفظ...' : 'حفظ المستخدم' }}
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <table class="w-full text-right border-collapse">
        <thead>
          <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
            <th class="p-4">الاسم</th>
            <th class="p-4">البريد</th>
            <th class="p-4">الراتب</th>
            <th class="p-4">الدور</th>
            <th class="p-4">الفرع</th>
            <th class="p-4 text-center">العمليات</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
          <tr v-if="loading && users.length === 0"><td colspan="6" class="text-center py-8 text-slate-400">جاري التحميل...</td></tr>
          <tr v-else-if="!users || users.length === 0"><td colspan="6" class="text-center py-8 text-slate-400">لا توجد سجلات مستخدمين متاحة.</td></tr>
          <tr v-for="u in users" :key="u.id" class="hover:bg-slate-50/50 transition-colors">
            <td class="p-4 font-semibold text-slate-800">{{ u.name }}</td>
            <td class="p-4 font-mono text-xs text-slate-500">{{ u.email }}</td>
            <td class="p-4 font-semibold text-emerald-600">{{ u.salary ?? 0 }}</td>
            <td class="p-4"><span :class="u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'" class="px-3 py-1 rounded-full text-xs font-bold border">{{ u.role === 'admin' ? 'مدير' : 'صيدلي' }}</span></td>
            <td class="p-4">{{ u.branch?.name || 'غير محدد' }}</td>
            <td class="p-4 text-center flex items-center justify-center gap-2">
              <button @click="openEditModal(u)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg> تعديل
              </button>
              <button @click="deleteUser(u.id)" :disabled="deleting" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 text-xs font-bold transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> حذف
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-150">
        <div class="flex justify-between items-center border-b border-slate-100 pb-4">
          <h3 class="text-lg font-bold text-slate-800">تعديل بيانات المستخدم</h3>
          <button @click="showEditModal = false" class="text-slate-400 hover:text-slate-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
        <div class="space-y-4">
          <div v-for="(error, key) in editErrors" :key="'edit-'+key" class="text-red-500 text-xs mb-1">* {{ error[0] }}</div>
          <div><label class="block text-xs font-bold text-slate-600 uppercase mb-1">اسم الموظف</label><input v-model="editForm.name" class="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"></div>
          <div><label class="block text-xs font-bold text-slate-600 uppercase mb-1">البريد الإلكتروني</label><input v-model="editForm.email" type="email" class="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"></div>
          <div><label class="block text-xs font-bold text-slate-600 uppercase mb-1">كلمة المرور الجديدة (اختياري)</label><input v-model="editForm.password" type="password" placeholder="اتركها فارغة إن لم ترغب بتغييرها" class="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"></div>
          <div><label class="block text-xs font-bold text-slate-600 uppercase mb-1">الراتب الأساسي</label><input v-model="editForm.salary" type="number" class="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"></div>
          <div><label class="block text-xs font-bold text-slate-600 uppercase mb-1">الدور</label><select v-model="editForm.role" class="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"><option value="pharmacist">صيدلي</option><option value="admin">مدير</option></select></div>
          <div><label class="block text-xs font-bold text-slate-600 uppercase mb-1">الفرع</label><select v-model="editForm.branch_id" class="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"><option value="" disabled>اختر الفرع...</option><option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option></select></div>
        </div>
        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button @click="showEditModal = false" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all">إلغاء</button>
          <button @click="updateUser" :disabled="saving" class="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-amber-600/25 transition-all">
            {{ saving ? 'جاري الحفظ...' : 'تحديث البيانات' }}
          </button>
        </div>
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
import { ref, reactive, onMounted, onActivated } from 'vue';
import { useUserStore, useBranchStore } from '../../src/js/stores/index.js';
import { storeToRefs } from 'pinia';
import { API_BASE } from '../../src/js/config.js';
import axios from 'axios';

const userStore = useUserStore();
const branchStore = useBranchStore();
const { users, loading } = storeToRefs(userStore);
const { refreshUsers } = userStore;
const { branches } = storeToRefs(branchStore);

// ===== Local State =====
const userForm = ref({ name: '', email: '', password: '', salary: '', role: 'cashier', branch_id: '' });
const editForm = ref({ id: null, name: '', email: '', password: '', salary: '', role: 'cashier', branch_id: '' });
const errors = ref({});
const editErrors = ref({});
const showEditModal = ref(false);
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
const openEditModal = (user) => {
  editErrors.value = {};
  editForm.value = {
    id: user.id,
    name: user.name,
    email: user.email,
    password: '',
    salary: user.salary || '',
    role: user.role,
    branch_id: user.branch_id || ''
  };
  showEditModal.value = true;
};

const saveUser = async () => {
  errors.value = {};
  saving.value = true;

  try {
    const response = await axios.post(`${API_BASE}/users`, userForm.value);
    const newUser = response.data.user || { id: Date.now(), ...userForm.value };
    users.value.unshift(newUser);
    userForm.value = { name: '', email: '', password: '', salary: '', role: 'cashier', branch_id: '' };
    showToast('تم حفظ المستخدم', 'success');
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

const updateUser = async () => {
  editErrors.value = {};
  saving.value = true;

  try {
    const payload = { ...editForm.value };
    if (!payload.password) delete payload.password;
    const response = await axios.put(`${API_BASE}/users/${editForm.value.id}`, payload);
    const index = users.value.findIndex(u => u.id === editForm.value.id);
    if (index !== -1) {
      users.value[index] = response.data.user || payload;
    }
    showEditModal.value = false;
    showToast('تم تحديث المستخدم', 'success');
  } catch (e) {
    if (e.response?.status === 422) {
      editErrors.value = e.response.data.errors;
      showToast('يرجى تصحيح الأخطاء', 'warning');
    } else {
      showToast('حدث خطأ أثناء التحديث', 'error');
      console.error(e);
    }
  } finally {
    saving.value = false;
  }
};

const deleteUser = async (id) => {
  if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
  deleting.value = true;

  try {
    await axios.delete(`${API_BASE}/users/${id}`);
    users.value = users.value.filter(u => u.id !== id);
    showToast('تم حذف المستخدم', 'success');
  } catch (e) {
    showToast('حدث خطأ أثناء الحذف', 'error');
    console.error(e);
  } finally {
    deleting.value = false;
  }
};

// ===== Lifecycle =====
onMounted(async () => {
  console.log('🟢 onMounted - جلب المستخدمين...');
  await refreshUsers();
  console.log('✅ onMounted - المستخدمين بعد الجلب:', users.value);
  if (!branches.value.length) {
    await branchStore.fetchBranches();
  }
});

onActivated(async () => {
  console.log('🟢 onActivated - جلب المستخدمين (force refresh)...');
  await refreshUsers();
  console.log('✅ onActivated - المستخدمين بعد الجلب:', users.value);
  if (!branches.value.length) {
    await branchStore.fetchBranches();
  }
});
</script>