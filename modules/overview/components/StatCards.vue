<template>
  <div class="cards-row">

    <!-- مبيعات اليوم -->
    <div class="stat-card clickable"
         style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #fff;"
         @click="$emit('card-click', 'daily_sales')"
         title="عرض تفاصيل مبيعات اليوم">
      <div class="icon-bg"><i class="fas fa-dollar-sign"></i></div>
      <div class="icon-top"><i class="fas fa-coins"></i></div>
      <div class="info">
        <h4>مبيعات اليوم</h4>
        <h2>{{ formatCurrency(stats.daily_sales) }}</h2>

        <!-- ✅ صافي المبيعات -->
        <span v-if="stats.today_net_sales !== undefined && Number(stats.today_net_sales) !== Number(stats.daily_sales)"
              style="display:block; font-size:11px; color: rgba(255,255,255,0.85); margin-top:4px; font-family: monospace;">
          صافي: {{ formatCurrency(stats.today_net_sales) }}
        </span>

        <!-- ✅ المرتجعات -->
        <span v-if="Number(stats.today_refunds) > 0"
              style="display:block; font-size:11px; color:#fecaca; margin-top:2px; font-weight:800;">
          <i class="fas fa-undo-alt" style="font-size:9px;"></i>
          مرتجعات: − {{ formatCurrency(stats.today_refunds) }}
        </span>
      </div>
    </div>

    <!-- ربح اليوم (✅ جديد — مكان بطاقة "منتهي الصلاحية" القديمة) -->
    <div class="stat-card clickable"
         style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff;"
         @click="$emit('card-click', 'daily_profit')"
         title="عرض تفاصيل أرباح اليوم">
      <div class="icon-bg"><i class="fas fa-chart-line"></i></div>
      <div class="icon-top"><i class="fas fa-coins"></i></div>
      <div class="info">
        <h4>ربح اليوم</h4>
        <h2>{{ formatCurrency(stats.profit_today) }}</h2>

        <!-- ✅ ربح مُرتجَع (عندما الربح = 0 + هناك مرتجعات) -->
        <span v-if="Number(stats.profit_today) === 0 && Number(stats.today_refunds_profit) > 0"
              style="display:block; font-size:11px; color:#fde68a; margin-top:4px; font-weight:800;">
          <i class="fas fa-info-circle" style="font-size:9px;"></i>
          ربح مُرتجَع: {{ formatCurrency(stats.today_refunds_profit) }}
        </span>

        <!-- ✅ خصم المرتجعات (عندما الربح > 0) -->
        <span v-else-if="Number(stats.today_refunds_profit) > 0"
              style="display:block; font-size:11px; color:#fecaca; margin-top:4px; font-weight:800;">
          <i class="fas fa-undo-alt" style="font-size:9px;"></i>
          خصم مرتجعات: − {{ formatCurrency(stats.today_refunds_profit) }}
        </span>
      </div>
    </div>

    <!-- فواتير اليوم -->
    <div class="stat-card clickable"
         style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #fff;"
         @click="$emit('card-click', 'invoices')"
         title="عرض قائمة فواتير اليوم">
      <div class="icon-bg"><i class="fas fa-receipt"></i></div>
      <div class="icon-top"><i class="fas fa-file-invoice"></i></div>
      <div class="info">
        <h4>فواتير اليوم</h4>
        <h2>{{ stats.invoice_count || 0 }}</h2>
        <span class="trend" style="background:rgba(255,255,255,0.25);">
          <i class="fas fa-file-invoice"></i> فاتورة
        </span>
      </div>
    </div>

    <!-- مخزون منخفض -->
    <div class="stat-card clickable"
         style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: #fff;"
         @click="$emit('card-click', 'low_stock')"
         title="عرض تنبيهات المخزون المنخفض">
      <div class="icon-bg"><i class="fas fa-exclamation-triangle"></i></div>
      <div class="icon-top"><i class="fas fa-box-open"></i></div>
      <div class="info">
        <h4>مخزون منخفض</h4>
        <h2>{{ stats.low_stock_items || 0 }}</h2>
        <span class="trend" style="background:rgba(243,156,18,0.45);">
          <i class="fas fa-arrow-down"></i> يحتاج طلب
        </span>
      </div>
    </div>

    <!-- ✅ منتهي الصلاحية — مع اللون الأحمر -->
    <div class="stat-card clickable"
         style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #fff;"
         @click="$emit('card-click', 'expired')"
         title="عرض تنبيهات الصلاحية">
      <div class="icon-bg"><i class="fas fa-clock"></i></div>
      <div class="icon-top"><i class="fas fa-exclamation-circle"></i></div>
      <div class="info">
        <h4>منتهي الصلاحية</h4>
        <h2>{{ stats.expired_count || 0 }}</h2>
        <span class="trend" style="background:rgba(255,255,255,0.3);">
          <i class="fas fa-exclamation-triangle"></i> عاجل
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
