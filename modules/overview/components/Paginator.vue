<!-- modules/overview/components/Paginator.vue -->
<template>
  <div v-if="total > 0" class="paginator">
    <button
      class="pag-btn"
      :disabled="page <= 1"
      @click="$emit('update:page', page - 1)"
      title="السابق"
    >
      <i class="fas fa-chevron-right"></i>
    </button>

    <span class="pag-info">
      <span class="pag-range">{{ start }}–{{ end }}</span>
      <span class="pag-sep">من</span>
      <span class="pag-total">{{ total }}</span>
    </span>

    <button
      class="pag-btn"
      :disabled="page >= totalPages"
      @click="$emit('update:page', page + 1)"
      title="التالي"
    >
      <i class="fas fa-chevron-left"></i>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  page:    { type: Number, default: 1 },
  total:   { type: Number, default: 0 },
  perPage: { type: Number, default: 5 },
});

defineEmits(['update:page']);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.total / props.perPage))
);
const start = computed(() =>
  props.total === 0 ? 0 : (props.page - 1) * props.perPage + 1
);
const end = computed(() =>
  Math.min(props.page * props.perPage, props.total)
);
</script>

<style scoped>
.paginator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 4px 2px;
  border-top: 1px solid #f1f5f9;
  margin-top: 8px;
}

.pag-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 12px;
  flex-shrink: 0;
}
.pag-btn:hover:not(:disabled) {
  background: #f0f9ff;
  border-color: #1ba7c2;
  color: #0f5b7a;
  transform: translateY(-1px);
}
.pag-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pag-info {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  min-width: 110px;
  text-align: center;
  user-select: none;
}
.pag-range {
  color: #0f5b7a;
  font-weight: 800;
}
.pag-sep {
  margin: 0 5px;
  opacity: 0.6;
  font-size: 11px;
}
.pag-total {
  color: #1e293b;
  font-weight: 800;
}
</style>