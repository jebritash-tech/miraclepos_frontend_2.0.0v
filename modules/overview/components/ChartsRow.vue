<template>
  <div class="row-grid">
    <!-- مبيعات الأسبوع -->
    <div class="panel">
      <div class="panel-header">
        <h3><i class="fas fa-chart-simple" style="color:#3498db;"></i> مبيعات الأسبوع</h3>
        <span style="color:#3498db; font-weight:700;">{{ formatCurrency(lastWeekTotal) }} ج.س</span>
      </div>
      <div class="chart-bars">
        <div v-for="(item, idx) in chartData" :key="idx" class="bar-item">
          <div class="bar-value">{{ formatCurrency(item.label_value) }}</div>
          <div
            class="bar"
            :style="{
              height: getBarHeight(item.label_value) + 'px',
              background: getBarColor(item.label_value)
            }"
          ></div>
          <span class="bar-label">{{ item.day }}</span>
        </div>
      </div>
    </div>

    <!-- توزيع المبيعات حسب الفئة -->
    <div class="panel">
      <div class="panel-header">
        <h3><i class="fas fa-chart-pie" style="color:#2ecc71;"></i> توزيع المبيعات حسب الفئة</h3>
      </div>

      <div v-if="distribution && distribution.length > 0" class="donut-container">
        <div class="donut" :style="{ background: getDonutGradient(distribution) }">
          <span class="donut-center">{{ formatCurrency(getTotalSales) }}</span>
        </div>
        <div class="donut-legend">
          <div v-for="(item, idx) in distribution" :key="item.id" class="legend-item">
            <span class="dot" :style="{ background: getColor(idx) }"></span>
            <span class="legend-name">{{ item.name }}</span>
            <span class="legend-percent">{{ getPercent(item.total_sales) }}%</span>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-slate-400 py-4 text-sm">
        <i class="fas fa-chart-pie text-3xl block mb-2 opacity-30"></i>
        لا توجد مبيعات كافية لتوزيعها حسب الفئة
      </div>

      <hr style="margin:18px 0; border-color:rgba(0,0,0,0.04);">

      <div v-if="activities && activities.length">
        <div v-for="act in activities.slice(0, 3)" :key="act.id" class="activity-item">
          <div class="act-icon" :style="{ background: act.color || '#3498db' }">
            <i :class="act.icon || 'fas fa-circle'"></i>
          </div>
          <div class="act-text">
            <h4>{{ act.title }}</h4>
            <p>{{ act.desc }}</p>
          </div>
          <div class="act-time">{{ act.time }}</div>
        </div>
      </div>
      <div v-else class="text-center text-slate-400 text-sm py-2">
        لا توجد أنشطة حديثة
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  chartData:    { type: Array, default: () => [] },
  activities:   { type: Array, default: () => [] },
  distribution: { type: Array, default: () => [] }
});

const formatCurrency = (v) => Number(v || 0).toLocaleString();

// ✅ إجمالي مبيعات الأسبوع — بصيغة رقمية آمنة
const lastWeekTotal = computed(() => {
  return props.chartData.reduce((sum, item) => sum + Number(item?.label_value || 0), 0);
});

// ✅ إجمالي التوزيع — بصيغة رقمية آمنة (يمنع NAN)
const getTotalSales = computed(() => {
  if (!props.distribution || props.distribution.length === 0) return 0;
  return props.distribution.reduce((sum, d) => sum + Number(d?.total_sales || 0), 0);
});

// ✅ ارتفاع العمود بناءً على label_value الفعلي
const getBarHeight = (value) => {
  if (!props.chartData || props.chartData.length === 0) return 5;
  const numValue = Number(value || 0);
  const maxVal = Math.max(...props.chartData.map(d => Number(d?.label_value || 0)));
  if (maxVal <= 0) return 5;
  return Math.max((numValue / maxVal) * 180, 5);
};

const getBarColor = (value) => {
  if (!props.chartData || props.chartData.length === 0) return 'linear-gradient(180deg, #3498db, #85c1e9)';
  const numValue = Number(value || 0);
  const maxVal = Math.max(...props.chartData.map(d => Number(d?.label_value || 0)));
  if (maxVal <= 0) return 'linear-gradient(180deg, #3498db, #85c1e9)';
  const ratio = numValue / maxVal;
  if (ratio > 0.7) return 'linear-gradient(180deg, #2ecc71, #27ae60)';
  if (ratio > 0.4) return 'linear-gradient(180deg, #f39c12, #e67e22)';
  return 'linear-gradient(180deg, #e74c3c, #c0392b)';
};

const colors = [
  '#2ecc71','#3498db','#f39c12','#e74c3c',
  '#9b59b6','#1abc9c','#e67e22','#34495e',
  '#e84393','#00b894','#fd79a8','#6c5ce7'
];
const getColor = (index) => colors[index % colors.length];

// ✅ نسبة مئوية آمنة (لا NAN ولا Infinity)
const getPercent = (value) => {
  const total = getTotalSales.value;
  if (!total || total <= 0) return '0.0';
  const percent = (Number(value || 0) / total) * 100;
  if (!Number.isFinite(percent)) return '0.0';
  return percent.toFixed(1);
};

// ✅ تدرّج دائري آمن
const getDonutGradient = (distribution) => {
  if (!distribution || distribution.length === 0) return '#e2e8f0';
  const total = getTotalSales.value;
  if (total <= 0) return '#e2e8f0';

  let currentPercent = 0;
  const stops = distribution.map((item, index) => {
    const percent = (Number(item?.total_sales || 0) / total) * 100;
    const start = currentPercent;
    const end = currentPercent + percent;
    currentPercent = end;
    return `${getColor(index)} ${start}% ${end}%`;
  });
  return `conic-gradient(${stops.join(', ')})`;
};
</script>

<style scoped>
/* نفس أنماطك السابقة — لا تغيير */
</style>