// modules/sales/utils/totals.js
export function calculateTotals(items, discount = 0, tax = 0) {
  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxAmount = (subtotal * tax) / 100;
  const total = subtotal - discountAmount + taxAmount;

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total,
    itemCount: items.length
  };
}