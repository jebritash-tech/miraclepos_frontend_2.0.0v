<template>
  <div class="cards-row">
    <!-- مبيعات اليوم -->
    <div class="stat-card clickable"
         @click="$emit('card-click', 'daily_sales')"
         title="عرض تفاصيل مبيعات اليوم">
      <div class="icon-bg"><i class="fas fa-dollar-sign"></i></div>
      <div class="icon-top"><i class="fas fa-coins"></i></div>
      <div class="info">
        <h4>مبيعات اليوم</h4>
        <h2>{{ formatCurrency(stats.daily_sales) }}</h2>
        <span class="trend"><i class="fas fa-arrow-up"></i> +12.5%</span>
      </div>
    </div>

    <!-- فواتير اليوم -->
    <div class="stat-card clickable"
         @click="$emit('card-click', 'invoices')"
         title="عرض قائمة فواتير اليوم">
      <div class="icon-bg"><i class="fas fa-receipt"></i></div>
      <div class="icon-top"><i class="fas fa-file-invoice"></i></div>
      <div class="info">
        <h4>فواتير اليوم</h4>
        <h2>{{ stats.invoice_count || 0 }}</h2>
        <span class="trend"><i class="fas fa-arrow-up"></i> +8%</span>
      </div>
    </div>

    <!-- مخزون منخفض -->
    <div class="stat-card clickable"
         @click="$emit('card-click', 'low_stock')"
         title="عرض تنبيهات المخزون المنخفض">
      <div class="icon-bg"><i class="fas fa-exclamation-triangle"></i></div>
      <div class="icon-top"><i class="fas fa-box-open"></i></div>
      <div class="info">
        <h4>مخزون منخفض</h4>
        <h2>{{ stats.low_stock_items || 0 }}</h2>
        <span class="trend" style="background:rgba(243,156,18,0.3);">
          <i class="fas fa-arrow-down"></i> يحتاج طلب
        </span>
      </div>
    </div>

    <!-- منتهي الصلاحية -->
    <div class="stat-card clickable"
         @click="$emit('card-click', 'expired')"
         title="عرض تنبيهات الصلاحية">
      <div class="icon-bg"><i class="fas fa-clock"></i></div>
      <div class="icon-top"><i class="fas fa-exclamation-circle"></i></div>
      <div class="info">
        <h4>منتهي الصلاحية</h4>
        <h2>{{ stats.expired_count || 0 }}</h2>
        <span class="trend" style="background:rgba(231,76,60,0.3);">
          <i class="fas fa-arrow-down"></i> عاجل
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps(['stats']);
defineEmits(['card-click']);
const formatCurrency = (v) => Number(v || 0).toLocaleString();
</script>

<style scoped>
.stat-card.clickable {
  cursor: pointer;
  position: relative;
}

.stat-card.clickable::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 28px;
  border: 2px solid rgba(255,255,255,0);
  transition: border-color 0.25s ease;
  pointer-events: none;
}
.stat-card.clickable:hover::after {
  border-color: rgba(255,255,255,0.65);
}
.stat-card.clickable:active {
  transform: scale(0.98);
}
</style>
