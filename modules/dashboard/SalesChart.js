// modules/dashboard/SalesChart.js
import { ref, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  props: ['chartData'],
  setup(props) {
    const chartCanvas = ref(null);
    let chartInstance = null;

    const renderChart = () => {
      if (!chartCanvas.value || !props.chartData) return;
      if (chartInstance) chartInstance.destroy();

      chartInstance = new Chart(chartCanvas.value, {
        type: 'line',
        data: {
          labels: props.chartData.labels || [],
          datasets: [{
            label: 'المبيعات',
            data: props.chartData.values || [],
            borderColor: '#0b132b',
            backgroundColor: 'rgba(11, 19, 43, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#0b132b',
            pointBorderColor: '#fff',
            borderWidth: 3,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { rtl: true }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
          }
        }
      });
    };

    onMounted(() => {
      if (props.chartData) renderChart();
    });

    watch(() => props.chartData, (newVal) => {
      if (newVal) renderChart();
    });

    return { chartCanvas };
  },
  template: `
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
      <h3 class="font-bold text-base text-slate-800 mb-4">اتجاه المبيعات (آخر 7 أيام)</h3>
      <div class="h-64">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>
  `
};