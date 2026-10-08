<!-- modules/overview/components/SubCards.vue -->
<template>
  <div class="sub-cards">
    <!-- 1. قيمة المخزون -->
    <div class="sub-card">
      <div class="sub-icon"><i class="fas fa-boxes"></i></div>
      <div class="sub-info">
        <h4>قيمة المخزون</h4>
        <h3>{{ formatCurrency(inventory?.value || 0) }}</h3>
        <div class="progress-mini">
          <div class="fill" style="--p:75%;"></div>
        </div>
        <span class="sub-subtext">
          {{ inventory?.total_items || 0 }} صنف
        </span>
      </div>
    </div>

    <!-- 2. أرباح اليوم -->
    <div class="sub-card">
      <div class="sub-icon"><i class="fas fa-hand-holding-usd"></i></div>
      <div class="sub-info">
        <h4>أرباح اليوم</h4>
        <h3>{{ formatCurrency(profit?.today || 0) }}</h3>
        <div class="progress-mini">
          <div class="fill" style="--p:60%; background:linear-gradient(90deg,#f39c12,#e67e22);"></div>
        </div>
        <span class="sub-subtext">
          صافي ربح اليوم
        </span>
      </div>
    </div>

    <!-- 3. مشتريات اليوم -->
    <div class="sub-card">
      <div class="sub-icon"><i class="fas fa-shopping-cart"></i></div>
      <div class="sub-info">
        <h4>مشتريات اليوم</h4>
        <h3>{{ formatCurrency(purchases?.today || 0) }}</h3>
        <div class="progress-mini">
          <div class="fill" style="--p:40%; background:linear-gradient(90deg,#1abc9c,#16a085);"></div>
        </div>
        <span class="sub-subtext">
          إجمالي المشتريات
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps(['inventory', 'profit', 'purchases']);
const formatCurrency = (v) => Number(v || 0).toLocaleString();
</script>

<style scoped>
/* ===== التخطيط الافتراضي (ديسكتوب): أيقونة على الجانب ===== */
.sub-card {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.sub-info {
  flex: 1;
  min-width: 0;
}

.sub-info h3 {
  word-break: break-word;
  line-height: 1.2;
}

.sub-subtext {
  display: block;
  font-size: 11px;
  color: #7f8c8d;
  margin-top: 4px;
}

/* ===== على الموبايل: أيقونة في الأعلى، النص تحتها ===== */
@media (max-width: 767px) {
  .sub-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
    padding: 18px 14px;
  }

  .sub-icon {
    /* تكبير الأيقونة قليلاً لتكون أوضح في المنتصف */
    width: 56px;
    height: 56px;
    font-size: 24px;
    margin: 0 auto;
    flex-shrink: 0;
  }

  .sub-info {
    width: 100%;
    text-align: center;
  }

  .sub-info h4 {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .sub-info h3 {
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 10px;
  }

  .progress-mini {
    margin: 0 auto 6px;
    max-width: 200px;
  }

  .sub-subtext {
    font-size: 11px;
  }
}

/* ===== الموبايل الصغير جداً ===== */
@media (max-width: 380px) {
  .sub-card {
    padding: 14px 10px;
    gap: 10px;
  }

  .sub-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .sub-info h3 {
    font-size: 19px;
  }
}
</style>
