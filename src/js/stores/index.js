// src/js/stores/index.js
import { createPinia } from 'pinia';

// تصدير جميع الـ Stores
export { useMedicineStore } from './medicineStore.js';
export { useBranchStore } from './branchStore.js';
export { useCategoryStore } from './categoryStore.js';
export { useSupplierStore } from './supplierStore.js';
export { useUserStore } from './userStore.js';
export { useExpenseStore } from './expenseStore.js';
export { useInventoryStore } from './inventoryStore.js';
export { useDebtStore } from './debtStore.js';
export { useSalaryStore } from './salaryStore.js';
export { useShiftStore } from './shiftStore.js';
export { usePricingStore } from './pricingStore.js';
export { usePurchaseStore } from './purchaseStore.js';
export { useAnalyticsStore } from './analyticsStore.js';


// إنشاء وتصدير Pinia
const pinia = createPinia();
export default pinia;