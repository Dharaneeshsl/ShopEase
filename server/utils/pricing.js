const TAX_RATE = 0.1;
const FREE_SHIPPING_MIN = 100;
const SHIPPING_FEE = 10;

const calculateOrderTotals = ({ itemsPrice = 0, discount = 0 } = {}) => {
  const safeItems = Math.max(0, Number(itemsPrice) || 0);
  const safeDiscount = Math.min(safeItems, Math.max(0, Number(discount) || 0));
  const taxable = Math.max(0, safeItems - safeDiscount);
  const taxPrice = Number((taxable * TAX_RATE).toFixed(2));
  const shippingPrice = taxable >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
  const totalPrice = Number((taxable + taxPrice + shippingPrice).toFixed(2));

  return {
    itemsPrice: Number(safeItems.toFixed(2)),
    discount: Number(safeDiscount.toFixed(2)),
    taxPrice,
    shippingPrice,
    totalPrice,
  };
};

module.exports = {
  TAX_RATE,
  FREE_SHIPPING_MIN,
  SHIPPING_FEE,
  calculateOrderTotals,
};
