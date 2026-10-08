<!-- modules/settings/BackupSettings.vue -->
<template>
  <div class="backup-settings">

    <!-- ============================================================
         Header
         ============================================================ -->
    <div class="header">
      <div class="icon"><i class="fas fa-database"></i></div>
      <div>
        <h2>النسخ الاحتياطي</h2>
        <p>نسخة كاملة من قاعدة البيانات محفوظة تلقائياً كل يوم الساعة 11:59 مساءً.</p>
      </div>
    </div>

    <!-- ============================================================
         Info cards
         ============================================================ -->
    <div class="info-cards">
      <div class="info-card">
        <i class="fas fa-clock"></i>
        <div>
          <span class="label">جدولة تلقائية</span>
          <span class="value">كل يوم 23:59</span>
        </div>
      </div>
      <div class="info-card">
        <i class="fas fa-hdd"></i>
        <div>
          <span class="label">مساحة مستخدمة</span>
          <span class="value">{{ totalUsage }}</span>
        </div>
      </div>
      <div class="info-card">
        <i class="fas fa-history"></i>
        <div>
          <span class="label">الاحتفاظ</span>
          <span class="value">آخر 30 يوماً</span>
        </div>
      </div>
    </div>

    <!-- ============================================================
         Action bar
         ============================================================ -->
    <div class="action-bar">
      <button class="btn-create" @click="createBackup" :disabled="creating || restoring">
        <i :class="creating ? 'fas fa-spinner fa-spin' : 'fas fa-plus-circle'"></i>
        {{ creating ? 'جاري الإنشاء...' : 'إنشاء نسخة الآن' }}
      </button>
      <button class="btn-refresh" @click="loadBackups" :disabled="loading || restoring">
        <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
        تحديث
      </button>
    </div>

    <!-- ============================================================
         Restoring overlay
         ============================================================ -->
    <div v-if="restoring" class="restore-overlay">
      <div class="restore-overlay-content">
        <i class="fas fa-spinner fa-spin"></i>
        <h3>جاري استعادة النسخة الاحتياطية...</h3>
        <p>قد تستغرق العملية عدة دقائق. يُرجى عدم إغلاق الصفحة.</p>
        <div class="restore-progress">
          <div class="restore-progress-bar"></div>
        </div>
      </div>
    </div>

    <!-- ============================================================
         Backups list
         ============================================================ -->
    <div class="backups-list">
      <h3>
        <i class="fas fa-list"></i>
        النسخ المتوفرة
        <span class="count-badge">{{ backups.length }}</span>
      </h3>

      <!-- Loading -->
      <div v-if="loading" class="state">
        <i class="fas fa-spinner fa-spin"></i>
        جاري التحميل...
      </div>

      <!-- Empty -->
      <div v-else-if="!backups.length" class="state empty">
        <i class="fas fa-inbox"></i>
        <p>لا توجد نسخ احتياطية بعد</p>
        <small>اضغط "إنشاء نسخة الآن" لإنشاء أول نسخة</small>
      </div>

      <!-- Table -->
      <table v-else class="backups-table">
        <thead>
          <tr>
            <th>الملف</th>
            <th>الحجم</th>
            <th>التاريخ</th>
            <th>العمر</th>
            <th class="col-actions-head"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in backups" :key="b.filename">
            <td class="col-name">
              <i class="fas fa-file-archive"></i>
              <span class="filename">{{ b.filename }}</span>
            </td>
            <td>{{ b.size_human }}</td>
            <td class="col-date">{{ b.created_at }}</td>
            <td>
              <span :class="['age-badge', ageClass(b.age_days)]">
                {{ ageLabel(b.age_days) }}
              </span>
            </td>
            <td class="actions">
              <button
                @click="downloadBackup(b.filename)"
                class="btn-icon btn-download"
                title="تنزيل"
                :disabled="restoring"
              >
                <i class="fas fa-download"></i>
              </button>

              <button
                @click="confirmRestore(b.filename)"
                class="btn-icon btn-restore"
                title="استعادة"
                :disabled="restoring"
              >
                <i class="fas fa-undo"></i>
              </button>

              <button
                @click="deleteBackup(b.filename)"
                class="btn-icon btn-delete"
                title="حذف"
                :disabled="restoring"
              >
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ============================================================
         Info box
         ============================================================ -->
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      <div>
        <strong>كيف أسترجع نسخة؟</strong>
        <p>
          اضغط زر <strong>الاستعادة</strong> (🔄) بجانب النسخة المطلوبة. سيتم إنشاء نسخة أمان تلقائياً
          قبل الاستعادة. يمكنك أيضاً تنزيل ملف ZIP يدوياً واستيراد SQL عبر phpMyAdmin.
        </p>
      </div>
    </div>

    <!-- ============================================================
         Toast
         ============================================================ -->
    <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
      <i :class="{
        'fas fa-check-circle': toast.type === 'success',
        'fas fa-exclamation-circle': toast.type === 'error',
        'fas fa-exclamation-triangle': toast.type === 'warning',
      }"></i>
      <span>{{ toast.message }}</span>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';
import { API_BASE } from '../../src/js/config.js';

/* ============================================================
   State
   ============================================================ */
const backups    = ref([]);
const totalUsage = ref('—');
const loading    = ref(false);
const creating   = ref(false);
const restoring  = ref(false);

const toast = reactive({
  show: false,
  message: '',
  type: 'success',
});

/* ============================================================
   Toast helper
   ============================================================ */
let toastTimer = null;
const showToast = (message, type = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.show = true;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.show = false;
  }, 5000);
};

/* ============================================================
   Age helpers
   ============================================================ */
const ageLabel = (days) => {
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7)   return `منذ ${days} أيام`;
  if (days < 30)  return `منذ ${Math.floor(days / 7)} أسابيع`;
  return `منذ ${Math.floor(days / 30)} أشهر`;
};

const ageClass = (days) => {
  if (days <= 1) return 'fresh';
  if (days <= 7) return 'recent';
  return 'old';
};

/* ============================================================
   Load backups
   ============================================================ */
const loadBackups = async () => {
  if (loading.value) return;
  loading.value = true;

  try {
    const res = await axios.get(`${API_BASE}/backups`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      params: { _ts: Date.now() },
    });

    backups.value = res.data?.backups || [];

    // ✅ استخدام الحقل الصحيح من الـ API
    totalUsage.value = res.data?.total_disk_usage?.human || '—';

  } catch (e) {
    console.error('Load backups failed:', e);
    showToast('تعذر تحميل قائمة النسخ الاحتياطية', 'error');
  } finally {
    loading.value = false;
  }
};

/* ============================================================
   Create backup
   ============================================================ */
const createBackup = async () => {
  if (creating.value || restoring.value) return;
  creating.value = true;

  try {
    const res = await axios.post(`${API_BASE}/backups/create`, {}, {
      params: { _ts: Date.now() },
    });

    showToast(
      `✅ تم إنشاء النسخة (${res.data.backup.size_human})`,
      'success'
    );

    await loadBackups();
  } catch (e) {
    console.error('Create backup failed:', e);
    showToast(
      `تعذر إنشاء النسخة: ${e.response?.data?.message || e.message}`,
      'error'
    );
  } finally {
    creating.value = false;
  }
};

/* ============================================================
   Download backup
   ============================================================ */
const downloadBackup = (filename) => {
  if (!filename) {
    showToast('اسم الملف غير معرّف', 'error');
    return;
  }

  const url = `${API_BASE}/backups/${encodeURIComponent(filename)}/download`;
  window.open(url, '_blank');
};

/* ============================================================
   Delete backup
   ============================================================ */
const deleteBackup = async (filename) => {
  if (!filename) {
    showToast('اسم الملف غير معرّف', 'error');
    return;
  }

  const confirmed = confirm(
    `هل تريد حذف النسخة:\n\n"${filename}"؟\n\n` +
    `لا يمكن التراجع عن هذا الإجراء.`
  );
  if (!confirmed) return;

  try {
    await axios.delete(`${API_BASE}/backups/${encodeURIComponent(filename)}`, {
      params: { _ts: Date.now() },
    });

    showToast('تم حذف النسخة بنجاح', 'success');
    await loadBackups();

  } catch (e) {
    console.error('Delete backup failed:', e);
    showToast(
      `تعذر الحذف: ${e.response?.data?.message || e.message}`,
      'error'
    );
  }
};

/* ============================================================
   Restore backup
   ============================================================ */
const confirmRestore = async (filename) => {
  if (!filename) {
    showToast('⚠️ اسم الملف غير معرّف', 'error');
    return;
  }

  if (restoring.value) return;

  /* ===== تأكيد 1 ===== */
  const step1 = confirm(
    `⚠️ تحذير شديد\n\n` +
    `أنت على وشك استعادة النسخة:\n` +
    `"${filename}"\n\n` +
    `⚠️ سيتم استبدال كل البيانات الحالية بالبيانات الموجودة في النسخة!\n\n` +
    `• سيتم إنشاء نسخة أمان تلقائياً قبل البدء\n` +
    `• لا يمكن التراجع عن هذه العملية\n\n` +
    `هل أنت متأكد؟`
  );
  if (!step1) return;

  /* ===== تأكيد 2: اكتب كلمة ===== */
  const typed = prompt(
    `تأكيد نهائي:\n\n` +
    `اكتب كلمة "استعادة" (بالعربية) للمتابعة:`
  );

  if (typed !== 'استعادة') {
    showToast('تم إلغاء العملية — الكلمة غير صحيحة', 'warning');
    return;
  }

  /* ===== التنفيذ ===== */
  restoring.value = true;

  try {
    const res = await axios.post(
      `${API_BASE}/backups/${encodeURIComponent(filename)}/restore`,
      { safety_backup: true },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        params: { _ts: Date.now() },
        timeout: 10 * 60 * 1000, // 10 دقائق
      }
    );

    let message = `✅ تمت الاستعادة بنجاح — المدة: ${res.data.duration_sec} ثانية`;
    if (res.data.safety_backup) {
      message += ` (نسخة أمان: ${res.data.safety_backup})`;
    }

    showToast(message, 'success');

    await loadBackups();

  } catch (e) {
    console.error('Restore failed:', e);

    let errorMsg = 'تعذر استعادة النسخة';
    if (e.response?.data?.message) {
      errorMsg = e.response.data.message;
    } else if (e.code === 'ECONNABORTED') {
      errorMsg = 'انتهت مهلة الاستعادة (10 دقائق). تحقق من السجلات.';
    } else if (e.message) {
      errorMsg = e.message;
    }

    showToast(`فشلت الاستعادة: ${errorMsg}`, 'error');

  } finally {
    restoring.value = false;
  }
};

/* ============================================================
   Lifecycle
   ============================================================ */
onMounted(() => {
  loadBackups();
});
</script>

<style scoped>
.backup-settings { max-width: 900px; margin: 0 auto; padding: 10px; }

/* ============================================================
   Header
   ============================================================ */
.header {
  display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
}
.header .icon {
  width: 56px; height: 56px; border-radius: 16px;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 22px; flex-shrink: 0;
}
.header h2 { font-size: 22px; font-weight: 800; color: #1e293b; margin: 0; }
.header p { color: #64748b; font-size: 13px; margin: 4px 0 0; }

/* ============================================================
   Info cards
   ============================================================ */
.info-cards {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 12px; margin-bottom: 20px;
}
@media (max-width: 640px) {
  .info-cards { grid-template-columns: 1fr; }
}
.info-card {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px; background: #fff;
  border: 1px solid #e2e8f0; border-radius: 14px;
}
.info-card i { font-size: 22px; color: #3b82f6; }
.info-card .label { display: block; font-size: 11.5px; color: #94a3b8; font-weight: 600; }
.info-card .value { display: block; font-size: 15px; color: #1e293b; font-weight: 800; }

/* ============================================================
   Action bar
   ============================================================ */
.action-bar { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }

.btn-create {
  padding: 12px 24px;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  color: #fff; border: none; border-radius: 12px;
  font-weight: 700; cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  font-family: inherit; transition: 0.2s;
  font-size: 13.5px;
}
.btn-create:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}
.btn-create:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-refresh {
  padding: 12px 20px; background: #f1f5f9; color: #475569;
  border: none; border-radius: 12px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  font-family: inherit; transition: 0.15s; font-size: 13.5px;
}
.btn-refresh:hover:not(:disabled) { background: #e2e8f0; }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

/* ============================================================
   Restoring overlay
   ============================================================ */
.restore-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.restore-overlay-content {
  background: #fff;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3);
}
.restore-overlay-content > i {
  font-size: 48px; color: #3b82f6;
  display: block; margin-bottom: 20px;
}
.restore-overlay-content h3 {
  font-size: 18px; font-weight: 800;
  color: #1e293b; margin: 0 0 8px;
}
.restore-overlay-content p {
  font-size: 13px; color: #64748b;
  margin: 0 0 24px; line-height: 1.6;
}
.restore-progress {
  width: 100%; height: 6px;
  background: #e2e8f0; border-radius: 3px;
  overflow: hidden;
}
.restore-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #1e40af, #3b82f6, #60a5fa, #3b82f6, #1e40af);
  background-size: 200% 100%;
  border-radius: 3px;
  animation: progress-slide 1.5s linear infinite;
}
@keyframes progress-slide {
  0%   { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

/* ============================================================
   Backups list
   ============================================================ */
.backups-list {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 14px; padding: 20px;
}
.backups-list h3 {
  font-size: 16px; font-weight: 800; color: #1e293b;
  margin: 0 0 16px; display: flex; align-items: center; gap: 10px;
}
.count-badge {
  background: #dbeafe; color: #1e40af;
  padding: 2px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 800;
}

/* ============================================================
   State
   ============================================================ */
.state { text-align: center; padding: 30px 0; color: #94a3b8; }
.state i { font-size: 36px; margin-bottom: 10px; display: block; }
.state.empty p { font-size: 15px; margin: 0 0 4px; color: #64748b; }
.state.empty small { font-size: 12px; }

/* ============================================================
   Table
   ============================================================ */
.backups-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.backups-table th {
  text-align: right;
  padding: 10px 8px;
  color: #64748b;
  font-weight: 700;
  font-size: 11.5px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}
.backups-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}
.backups-table tbody tr:last-child td { border-bottom: none; }
.backups-table tbody tr:hover { background: #f8fafc; }

.col-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e293b;
}
.col-name i { color: #3b82f6; font-size: 14px; flex-shrink: 0; }
.filename {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  word-break: break-all;
}
.col-date {
  font-family: 'Courier New', monospace;
  font-size: 11.5px;
  color: #64748b;
  white-space: nowrap;
}
.col-actions-head { width: 120px; }

/* ============================================================
   Action buttons
   ============================================================ */
.actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.btn-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  transition: 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  padding: 0;
}
.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-icon:not(:disabled):hover {
  transform: translateY(-1px);
}

.btn-download { color: #3b82f6; }
.btn-download:not(:disabled):hover {
  background: #dbeafe;
  border-color: #3b82f6;
}

.btn-restore { color: #92400e; }
.btn-restore:not(:disabled):hover {
  background: #fef3c7;
  border-color: #f59e0b;
}

.btn-delete { color: #dc2626; }
.btn-delete:not(:disabled):hover {
  background: #fee2e2;
  border-color: #dc2626;
}

/* ============================================================
   Age badge
   ============================================================ */
.age-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.age-badge.fresh  { background: #d1fae5; color: #065f46; }
.age-badge.recent { background: #fef3c7; color: #92400e; }
.age-badge.old    { background: #f1f5f9; color: #64748b; }

/* ============================================================
   Info box
   ============================================================ */
.info-box {
  display: flex; gap: 12px; margin-top: 24px;
  padding: 16px 20px; background: #eff6ff;
  border: 1px solid #bfdbfe; border-radius: 14px; color: #1e3a8a;
}
.info-box i { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
.info-box strong { font-size: 14px; font-weight: 800; }
.info-box p { font-size: 13px; margin: 4px 0 0; line-height: 1.6; }

/* ============================================================
   Toast
   ============================================================ */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  padding: 14px 22px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  animation: toastIn 0.3s ease;
  max-width: 500px;
}
@keyframes toastIn {
  from { transform: translate(-50%, -20px); opacity: 0; }
  to   { transform: translate(-50%, 0);     opacity: 1; }
}
.toast-success {
  background: #ecfdf5; color: #065f46; border: 1.5px solid #a7f3d0;
}
.toast-error {
  background: #fef2f2; color: #991b1b; border: 1.5px solid #fecaca;
}
.toast-warning {
  background: #fffbeb; color: #92400e; border: 1.5px solid #fcd34d;
}
</style>