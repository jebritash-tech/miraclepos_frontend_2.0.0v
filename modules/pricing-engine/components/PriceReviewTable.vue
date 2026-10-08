<template>
  <div class="price-review-table">

    <!-- Summary -->
    <div class="prt-summary">
      <div class="summary-item">
        <i class="fas fa-boxes"></i>
        <div>
          <span class="label">دفعات</span>
          <strong>{{ totalBatches }}</strong>
        </div>
      </div>
      <div class="summary-item">
        <i class="fas fa-tags"></i>
        <div>
          <span class="label">أسعار</span>
          <strong>{{ totalItems }}</strong>
        </div>
      </div>
      <div class="summary-item warning">
        <i class="fas fa-lock"></i>
        <div>
          <span class="label">مقفلة</span>
          <strong>{{ lockedCount }}</strong>
        </div>
      </div>
      <div class="summary-item success">
        <i class="fas fa-edit"></i>
        <div>
          <span class="label">معدّلة يدوياً</span>
          <strong>{{ overridesCount }}</strong>
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="prt-filter">
      <div class="search-wrap">
        <i class="fas fa-search"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ابحث باسم الدواء..."
          class="search-input">
      </div>
      <div class="filter-actions">
        <button @click="expandAll" class="btn-mini">فتح الكل</button>
        <button @click="collapseAll" class="btn-mini">إغلاق الكل</button>
      </div>
    </div>

    <!-- Groups -->
    <div class="prt-groups">
      <div
        v-for="group in filteredGroups"
        :key="group.rule_id"
        class="prt-group">

        <div class="group-header" @click="toggleGroup(group.rule_id)">
          <div class="group-header-left">
            <i
              class="fas fa-chevron-down group-toggle"
              :class="{ rotated: !isGroupCollapsed(group.rule_id) }"></i>
            <i class="fas fa-layer-group group-icon"></i>
            <div>
              <strong class="group-name">{{ group.rule_name }}</strong>
              <span class="group-meta">
                {{ group.rule_type || '—' }}
                <template v-if="group.rule_value !== null">
                  — القيمة: {{ formatRuleValue(group) }}
                </template>
              </span>
            </div>
          </div>
          <span class="group-count">{{ group.items.length }} سعر</span>
        </div>

        <div v-if="!isGroupCollapsed(group.rule_id)" class="group-body">
          <table class="prt-table">
            <thead>
              <tr>
                <th class="col-med">الدواء</th>
                <th class="col-unit">الوحدة</th>
                <th class="col-buy">سعر الشراء</th>
                <th class="col-old">السعر الحالي</th>
                <th class="col-new">السعر الجديد</th>
                <th class="col-diff">الفرق</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in group.items"
                :key="item.batch_id + '-' + item.unit_id"
                :class="{
                  'row-modified': isModified(item),
                  'row-locked': item.is_locked,
                }">

                <td class="col-med">
                  <div class="med-cell">
                    <strong>{{ item.medicine_name }}</strong>
                    <span v-if="item.is_locked" class="lock-badge" :title="item.lock_reason">
                      <i class="fas fa-lock"></i>
                    </span>
                  </div>
                  <small v-if="item.medicine_barcode">{{ item.medicine_barcode }}</small>
                  <small v-if="item.is_locked && item.lock_reason" class="lock-reason">
                    <i class="fas fa-info-circle"></i>
                    {{ item.lock_reason }}
                  </small>
                </td>

                <td class="col-unit">
                  <span class="unit-pill">{{ item.unit_name }}</span>
                </td>

                <td class="col-buy">{{ formatNum(item.buy_price) }}</td>

                <td class="col-old">
                  <span :class="{ 'text-muted': item.old_sell_price === 0 }">
                    {{ formatNum(item.old_sell_price) }}
                  </span>
                </td>

                <!-- ✅ حقل الإدخال للأسعار غير المقفلة، أو نص ثابت للمقفلة -->
                <td class="col-new">
                  <template v-if="!item.is_locked">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      :value="getCurrentValue(item)"
                      @input="onPriceInput(item, $event)"
                      @blur="onPriceBlur(item, $event)"
                      class="price-input"
                      :class="{ 'modified': isModified(item) }">
                  </template>
                  <template v-else>
                    <div class="locked-price-display">
                      <span>{{ formatNum(item.old_sell_price) }}</span>
                      <button
                        class="unlock-btn"
                        @click="toggleUnlock(item)"
                        :title="isMarkedForUnlock(item) ? 'إلغاء الفتح' : 'فتح للتعديل'">
                        <i :class="isMarkedForUnlock(item) ? 'fas fa-undo' : 'fas fa-unlock'"></i>
                      </button>
                    </div>
                    <span v-if="isMarkedForUnlock(item)" class="unlock-note">
                      سيُفتح ويُعاد حسابه
                    </span>
                  </template>
                </td>

                <td class="col-diff">
                  <span
                    v-if="!item.is_locked && getDiff(item) !== 0"
                    class="diff-badge"
                    :class="getDiff(item) > 0 ? 'diff-up' : 'diff-down'">
                    {{ getDiff(item) > 0 ? '+' : '' }}{{ formatNum(getDiff(item)) }}
                  </span>
                  <span v-else class="diff-badge diff-zero">—</span>
                </td>

              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="filteredGroups.length === 0" class="empty-state">
        <i class="fas fa-search"></i>
        لا توجد نتائج مطابقة
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  groups: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:overrides', 'update:unlocks']);

const searchQuery = ref('');
const collapsedGroups = ref(new Set());
const localOverrides = ref({});
const localUnlocks = ref(new Set()); // ← set من price_ids المراد فتحها

/* ============================================================
   Computed
   ============================================================ */
const totalBatches = computed(() => {
  const set = new Set();
  props.groups.forEach(g => {
    g.items.forEach(i => set.add(i.batch_id));
  });
  return set.size;
});

const totalItems = computed(() => {
  return props.groups.reduce((sum, g) => sum + g.items.length, 0);
});

const lockedCount = computed(() => {
  return props.groups.reduce((sum, g) => {
    return sum + g.items.filter(i => i.is_locked).length;
  }, 0);
});

const overridesCount = computed(() => Object.keys(localOverrides.value).length);

const filteredGroups = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return props.groups;

  return props.groups
    .map(g => ({
      ...g,
      items: g.items.filter(i =>
        i.medicine_name?.toLowerCase().includes(q) ||
        i.medicine_barcode?.toLowerCase().includes(q)
      ),
    }))
    .filter(g => g.items.length > 0);
});

/* ============================================================
   Helpers
   ============================================================ */
const formatNum = (v) => {
  return Number(v || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatRuleValue = (group) => {
  if (group.rule_value === null || group.rule_value === undefined) return '—';
  const v = Number(group.rule_value);
  if (group.rule_type === 'percentage') return `${v}%`;
  if (group.rule_type === 'fixed') return `+${v}`;
  if (group.rule_type === 'multiply') return `×${v}`;
  return String(v);
};

const isGroupCollapsed = (ruleId) => collapsedGroups.value.has(ruleId);

const toggleGroup = (ruleId) => {
  const set = new Set(collapsedGroups.value);
  if (set.has(ruleId)) set.delete(ruleId);
  else set.add(ruleId);
  collapsedGroups.value = set;
};

const expandAll = () => { collapsedGroups.value = new Set(); };
const collapseAll = () => {
  collapsedGroups.value = new Set(props.groups.map(g => g.rule_id));
};

/* ============================================================
   Override Logic (للأسعار غير المقفلة)
   ============================================================ */
const getCurrentValue = (item) => {
  if (!item.price_id) return item.new_sell_price;
  const override = localOverrides.value[item.price_id];
  return override !== undefined ? override : item.new_sell_price;
};

const isModified = (item) => {
  if (!item.price_id || item.is_locked) return false;
  return localOverrides.value[item.price_id] !== undefined;
};

const getDiff = (item) => {
  return getCurrentValue(item) - item.old_sell_price;
};

const onPriceInput = (item, event) => {
  const value = parseFloat(event.target.value);
  if (isNaN(value) || value <= 0) return;
  if (!item.price_id) return;

  if (Math.abs(value - item.new_sell_price) < 0.01) {
    const next = { ...localOverrides.value };
    delete next[item.price_id];
    localOverrides.value = next;
  } else {
    localOverrides.value = {
      ...localOverrides.value,
      [item.price_id]: value,
    };
  }
};

const onPriceBlur = (item, event) => {
  const value = parseFloat(event.target.value);
  if (isNaN(value) || value <= 0) {
    event.target.value = getCurrentValue(item);
    return;
  }
  onPriceInput(item, event);
};

/* ============================================================
   Unlock Logic (للأسعار المقفلة)
   ============================================================ */
const isMarkedForUnlock = (item) => {
  if (!item.price_id) return false;
  return localUnlocks.value.has(item.price_id);
};

const toggleUnlock = (item) => {
  if (!item.price_id) return;

  const set = new Set(localUnlocks.value);
  if (set.has(item.price_id)) {
    set.delete(item.price_id);
  } else {
    set.add(item.price_id);
  }
  localUnlocks.value = set;
};

/* ============================================================
   Emit to parent
   ============================================================ */
watch(localOverrides, (val) => {
  const overrides = Object.entries(val).map(([priceId, newPrice]) => ({
    price_id: Number(priceId),
    new_sell_price: Number(newPrice),
  }));
  emit('update:overrides', overrides);
}, { deep: true });

watch(localUnlocks, (val) => {
  emit('update:unlocks', Array.from(val));
}, { deep: true });

/* ============================================================
   Public method
   ============================================================ */
defineExpose({
  getOverrides: () => {
    return Object.entries(localOverrides.value).map(([priceId, newPrice]) => ({
      price_id: Number(priceId),
      new_sell_price: Number(newPrice),
    }));
  },
  getUnlocks: () => Array.from(localUnlocks.value),
  reset: () => {
    localOverrides.value = {};
    localUnlocks.value = new Set();
  },
});
</script>

<style scoped>
/* نفس الـ styles السابقة + إضافات */

.price-review-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.prt-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.summary-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.summary-item i { font-size: 18px; color: #3b82f6; flex-shrink: 0; }
.summary-item.warning i { color: #f59e0b; }
.summary-item.success i { color: #10b981; }
.summary-item .label {
  display: block; font-size: 10.5px; color: #94a3b8; font-weight: 600;
}
.summary-item strong {
  display: block; font-size: 16px; color: #1e293b; font-weight: 800;
}

.prt-filter {
  display: flex; gap: 10px; padding: 10px 16px;
  border-bottom: 1px solid #e2e8f0; flex-shrink: 0; align-items: center;
}
.search-wrap { flex: 1; position: relative; }
.search-wrap i {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: #94a3b8; font-size: 13px; pointer-events: none;
}
.search-input {
  width: 100%; padding: 8px 36px 8px 12px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-family: inherit; font-size: 13px;
}
.search-input:focus {
  outline: none; border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.filter-actions { display: flex; gap: 6px; }
.btn-mini {
  padding: 7px 12px; background: #f1f5f9; color: #475569;
  border: none; border-radius: 8px; font-family: inherit;
  font-weight: 700; font-size: 12px; cursor: pointer;
}
.btn-mini:hover { background: #e2e8f0; }

.prt-groups {
  flex: 1; overflow-y: auto; padding: 12px 16px; min-height: 0;
}
.prt-groups::-webkit-scrollbar { width: 8px; }
.prt-groups::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

.prt-group {
  margin-bottom: 14px; border: 1px solid #e2e8f0;
  border-radius: 12px; overflow: hidden; background: #fff;
}

.group-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  cursor: pointer; user-select: none;
}
.group-header:hover { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }

.group-header-left {
  display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;
}
.group-toggle {
  color: #3b82f6; font-size: 12px; transition: transform 0.2s; flex-shrink: 0;
}
.group-toggle.rotated { transform: rotate(-180deg); }
.group-icon { color: #1d4ed8; font-size: 16px; flex-shrink: 0; }
.group-name {
  display: block; font-size: 14px; font-weight: 800; color: #1e3a8a;
}
.group-meta {
  display: block; font-size: 11.5px; color: #64748b; margin-top: 2px;
}
.group-count {
  background: #1d4ed8; color: #fff; padding: 4px 12px;
  border-radius: 20px; font-size: 11.5px; font-weight: 800; flex-shrink: 0;
}

.group-body { border-top: 1px solid #e2e8f0; }
.prt-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.prt-table thead { background: #f8fafc; position: sticky; top: 0; z-index: 1; }
.prt-table th {
  text-align: right; padding: 10px 12px; color: #64748b;
  font-weight: 700; font-size: 11.5px; text-transform: uppercase;
  letter-spacing: 0.3px; border-bottom: 1px solid #e2e8f0; white-space: nowrap;
}
.prt-table td {
  padding: 10px 12px; border-bottom: 1px solid #f1f5f9;
  color: #334155; vertical-align: middle;
}
.prt-table tbody tr:hover { background: #f8fafc; }
.prt-table tbody tr.row-modified {
  background: #fffbeb; border-right: 3px solid #f59e0b;
}
.prt-table tbody tr.row-locked {
  background: #f8fafc; opacity: 0.85;
}
.prt-table tbody tr.row-locked:hover { opacity: 1; }

.col-med { min-width: 220px; }
.med-cell {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.col-med strong { color: #1e293b; font-weight: 700; }
.col-med small {
  display: block; color: #94a3b8; font-size: 10.5px; font-family: monospace;
}
.lock-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 50%;
  background: #fef3c7; color: #92400e; font-size: 10px;
  flex-shrink: 0;
}
.lock-reason {
  color: #92400e; font-size: 10.5px; font-style: italic;
  display: block; margin-top: 3px; max-width: 220px;
}

.col-unit { width: 90px; }
.unit-pill {
  display: inline-block; padding: 3px 10px;
  background: #f1f5f9; color: #475569;
  border-radius: 12px; font-size: 11.5px; font-weight: 700;
}

.col-buy, .col-old { width: 110px; font-family: monospace; }
.col-new { width: 170px; }
.col-diff { width: 100px; text-align: center; }

.text-muted { color: #cbd5e1; }

.price-input {
  width: 100%; padding: 8px 10px;
  border: 1.5px solid #e2e8f0; border-radius: 8px;
  font-family: monospace; font-size: 13.5px; font-weight: 700;
  text-align: center; color: #1e293b; background: #fff;
}
.price-input:focus {
  outline: none; border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.price-input.modified {
  border-color: #f59e0b; background: #fffbeb; color: #92400e;
}

/* Locked price display */
.locked-price-display {
  display: flex; align-items: center; gap: 6px;
  justify-content: center;
  padding: 6px 10px;
  background: #f8fafc; border: 1.5px dashed #cbd5e1;
  border-radius: 8px;
}
.locked-price-display span {
  font-family: monospace; font-size: 13.5px;
  font-weight: 700; color: #64748b;
}
.unlock-btn {
  width: 26px; height: 26px; border-radius: 6px;
  border: none; background: #fef3c7; color: #92400e;
  cursor: pointer; font-size: 11px;
  display: inline-flex; align-items: center; justify-content: center;
  transition: 0.15s; flex-shrink: 0;
}
.unlock-btn:hover { background: #fde68a; }

.unlock-note {
  display: block; text-align: center; margin-top: 4px;
  font-size: 10.5px; color: #059669; font-weight: 700;
}

.diff-badge {
  display: inline-block; padding: 3px 10px; border-radius: 12px;
  font-size: 11.5px; font-weight: 800; font-family: monospace;
  white-space: nowrap;
}
.diff-up { background: #fee2e2; color: #991b1b; }
.diff-down { background: #d1fae5; color: #065f46; }
.diff-zero { background: #f1f5f9; color: #94a3b8; }

.empty-state {
  text-align: center; padding: 40px; color: #94a3b8; font-size: 14px;
}
.empty-state i {
  display: block; font-size: 32px; margin-bottom: 10px; color: #cbd5e1;
}

@media (max-width: 768px) {
  .prt-summary { grid-template-columns: 1fr 1fr; }
  .col-buy, .col-old, .col-diff { display: none; }
}
</style>