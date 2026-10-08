// modules/sales/utils/cart.js
import { reactive } from 'vue';
import { calculateTotals } from './totals.js';

export function createCart() {
  const items = reactive([]);
  let discount = 0;
  let tax = 0;

  const addItem = (medicine, unit, quantity, price, batchId = null) => {
    const existing = items.find(item => 
      item.medicine_id === medicine.id && 
      item.unit_id === unit.id &&
      item.batch_id === batchId
    );
    
    if (existing) {
      existing.quantity += quantity;
      existing.total = existing.quantity * existing.price;
    } else {
      items.push({
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        unit_id: unit.id,
        unit_name: unit.name,
        factor: unit.factor || 1,
        quantity: quantity,
        price: price,
        total: quantity * price,
        batch_id: batchId,
        batch_number: medicine.batch_number || null,
        expiry_date: medicine.expiry_date || null,
        remaining_stock: medicine.remaining_stock || 0
      });
    }
    updateTotals();
  };

  const removeItem = (index) => {
    items.splice(index, 1);
    updateTotals();
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }
    const item = items[index];
    if (item.remaining_stock && newQuantity > item.remaining_stock) {
      alert(`الكمية المتاحة: ${item.remaining_stock}`);
      return;
    }
    items[index].quantity = newQuantity;
    items[index].total = newQuantity * items[index].price;
    updateTotals();
  };

  const updateTotals = () => {
    const totals = calculateTotals(items, discount, tax);
    Object.assign(cart, totals);
  };

  const clear = () => {
    items.splice(0, items.length);
    discount = 0;
    tax = 0;
    updateTotals();
  };

  const cart = {
    items,
    discount,
    tax,
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    total: 0,
    itemCount: 0,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    updateTotals,
    setDiscount: (value) => { discount = value; updateTotals(); },
    setTax: (value) => { tax = value; updateTotals(); }
  };

  return cart;
}