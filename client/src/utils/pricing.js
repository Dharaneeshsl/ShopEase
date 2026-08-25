// Mirrors server/utils/pricing.js so the client renders the exact same
// totals (tax, shipping, discount) that the backend will persist on the order.
export const TAX_RATE = 0.1;
export const FREE_SHIPPING_MIN = 100;
export const SHIPPING_FEE = 10;

const round2 = (value) => Number((Number(value) || 0).toFixed(2));

export const calculateOrderTotals = ({ itemsPrice = 0, discount = 0 } = {}) => {
  const safeItems = Math.max(0, round2(itemsPrice));
  const safeDiscount = Math.min(safeItems, Math.max(0, round2(discount)));
  const taxable = Math.max(0, safeItems - safeDiscount);
  const taxPrice = round2(taxable * TAX_RATE);
  const shippingPrice = taxable >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
  const totalPrice = round2(taxable + taxPrice + shippingPrice);

  return {
    itemsPrice: safeItems,
    discount: safeDiscount,
    taxPrice,
    shippingPrice,
    totalPrice,
  };
};
