<!-- modules/settings/components/UsersPinTable.vue -->
<template>
  <div class="users-pin-table">
    <div class="section-header">
      <h3><i class="fas fa-users-cog"></i> PIN الموظفين</h3>
      <button class="btn-refresh" @click="load" :disabled="loading">
        <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
      </button>
    </div>

    <table v-if="users.length" class="pin-table">
      <thead>
        <tr>
          <th>الموظف</th>
          <th>الدور</th>
          <th>الفرع</th>
          <th>حالة PIN</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td><strong>{{ u.name }}</strong></td>
          <td>
            <span class="role-badge" :class="u.role">
              {{ u.role === 'admin' ? 'مدير' : u.role === 'cashier' ? 'كاشير' : u.role }}
            </span>
          </td>
          <td>{{ u.branch || '—' }}</td>
          <td>
            <span v-if="u.has_pin" class="pin-status set">
              <i class="fas fa-check-circle"></i> معيّن
            </span>
            <span v-else class="pin-status unset">
              <i class="fas fa-exclamation-circle"></i> غير معيّن
            </span>
          </td>
          <td class="actions">
            <button @click="openSetModal(u)" class="btn-sm btn-primary">
              <i class="fas fa-key"></i>
              {{ u.has_pin ? 'تغيير' : 'تعيين' }}
            </button>
            <button v-if="u.has_pin" @click="removePin(u)" class="btn-sm btn-danger" title="إزالة">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading" class="empty-state">
      لا يوجد مستخدمون
    </p>

    <!-- Set PIN Modal -->
    <div v-if="modal.show" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>{{ modal.user.has_pin ? 'تغيير' : 'تعيين' }} PIN — {{ modal.user.name }}</h3>
        <p class="modal-sub">الرقم السري من 4-8 أرقام</p>

        <input v-model="modal.pin" type="password" inputmode="numeric"
               maxlength="8" placeholder="PIN الجديد"
               class="modal-input">
        <input v-model="modal.confirm" type="password" inputmode="numeric"
               maxlength="8" placeholder="تأكيد PIN"
               class="modal-input"
               @keyup.enter="save">

        <div v-if="modal.error" class="modal-error">
          <i class="fas fa-exclamation-circle"></i> {{ modal.error }}
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="closeModal">إلغاء</button>
          <button class="btn-save" @click="save" :disabled="saving">
            {{ saving ? 'جاري الحفظ...' : 'حفظ' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { API_BASE } from '../../../src/js/config.js';

const users = ref([]);
const loading = ref(false);
const saving = ref(false);
const modal = ref({ show: false, user: null, pin: '', confirm: '', error: '' });

const load = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE}/pin/status`);
    users.value = res.data.users || [];
  } catch (e) {
    console.error(e);
    toast('تعذر تحميل حالة PIN', 'error');
  } finally {
    loading.value = false;
  }
};

const openSetModal = (user) => {
  modal.value = { show: true, user, pin: '', confirm: '', error: '' };
};

const closeModal = () => {
  modal.value = { show: false, user: null, pin: '', confirm: '', error: '' };
};

const save = async () => {
  modal.value.error = '';

  if (!/^\d{4,8}$/.test(modal.value.pin)) {
    modal.value.error = 'PIN يجب أن يكون من 4 إلى 8 أرقام';
    return;
  }
  if (modal.value.pin !== modal.value.confirm) {
    modal.value.error = 'PIN وتأكيده غير متطابقين';
    return;
  }

  saving.value = true;
  try {
    await axios.post(`${API_BASE}/pin/set`, {
      user_id: modal.value.user.id,
      pin: modal.value.pin,
    });
    toast('✅ تم حفظ PIN', 'success');
    closeModal();
    await load();
  } catch (e) {
    modal.value.error = e.response?.data?.message || 'تعذر الحفظ';
  } finally {
    saving.value = false;
  }
};

const removePin = async (user) => {
  if (!confirm(`إزالة PIN من "${user.name}"؟`)) return;
  try {
    await axios.post(`${API_BASE}/pin/remove`, { user_id: user.id });
    toast('تم إزالة PIN', 'success');
    await load();
  } catch (e) {
    toast('تعذر الإزالة', 'error');
  }
};

const toast = (message, type = 'success') => {
  window.dispatchEvent(new CustomEvent('miraclepos:toast', {
    detail: { message, type },
  }));
};

onMounted(load);
</script>

<style scoped>
.users-pin-table {
  margin-top: 26px;
  padding-top: 22px;
  border-top: 2px dashed #e2e8f0;
}
.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
.section-header h3 {
  font-size: 15px; font-weight: 800; color: #1e293b;
  margin: 0; display: flex; align-items: center; gap: 8px;
}
.btn-refresh {
  width: 34px; height: 34px; border-radius: 8px;
  border: 1px solid #e2e8f0; background: #fff;
  cursor: pointer; color: #64748b;
}

.pin-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.pin-table th {
  text-align: right; padding: 10px 8px; color: #64748b;
  font-weight: 700; font-size: 12px; border-bottom: 1px solid #e2e8f0;
}
.pin-table td {
  padding: 12px 8px; border-bottom: 1px solid #f1f5f9;
  color: #334155;
}
.pin-table .actions { display: flex; gap: 6px; justify-content: flex-end; }

.role-badge {
  padding: 3px 10px; border-radius: 12px;
  font-size: 11px; font-weight: 700;
}
.role-badge.admin   { background: #ede9fe; color: #6d28d9; }
.role-badge.cashier { background: #dbeafe; color: #1e40af; }

.pin-status {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 700;
}
.pin-status.set   { color: #059669; }
.pin-status.unset { color: #d97706; }

.btn-sm {
  padding: 6px 12px; border-radius: 8px;
  font-size: 12px; font-weight: 700;
  border: none; cursor: pointer;
  display: inline-flex; align-items: center; gap: 5px;
  font-family: inherit;
}
.btn-primary { background: #a855f7; color: #fff; }
.btn-primary:hover { background: #9333ea; }
.btn-danger { background: #fee2e2; color: #dc2626; padding: 6px 10px; }
.btn-danger:hover { background: #fecaca; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(11, 26, 46, 0.65);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal {
  background: #fff; border-radius: 18px;
  padding: 26px; width: 100%; max-width: 400px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.3);
}
.modal h3 { font-size: 17px; font-weight: 800; color: #1e293b; margin: 0 0 6px; }
.modal-sub { color: #64748b; font-size: 12.5px; margin: 0 0 18px; }
.modal-input {
  width: 100%; padding: 12px 14px;
  border: 2px solid #e2e8f0; border-radius: 12px;
  font-family: inherit; font-size: 16px; font-weight: 700;
  text-align: center; letter-spacing: 4px;
  margin-bottom: 10px;
}
.modal-input:focus {
  outline: none; border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}
.modal-error {
  background: #fee2e2; color: #dc2626;
  padding: 8px 12px; border-radius: 8px;
  font-size: 12.5px; margin-bottom: 10px;
}
.modal-actions {
  display: flex; gap: 10px; margin-top: 8px;
}
.btn-cancel, .btn-save {
  flex: 1; padding: 12px; border-radius: 12px;
  border: none; font-weight: 700; cursor: pointer;
  font-family: inherit; font-size: 14px;
}
.btn-cancel { background: #f1f5f9; color: #475569; }
.btn-save {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff;
}
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
</style>