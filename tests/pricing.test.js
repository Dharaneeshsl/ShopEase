const { calculateOrderTotals, FREE_SHIPPING_MIN, SHIPPING_FEE } = require('../server/utils/pricing');

describe('calculateOrderTotals', () => {
  test('applies tax and shipping under the free-shipping threshold', () => {
    const totals = calculateOrderTotals({ itemsPrice: 40, discount: 0 });
    expect(totals.taxPrice).toBe(4);
    expect(totals.shippingPrice).toBe(SHIPPING_FEE);
    expect(totals.totalPrice).toBe(54);
  });

  test('gives free shipping at the threshold', () => {
    const totals = calculateOrderTotals({ itemsPrice: FREE_SHIPPING_MIN });
    expect(totals.shippingPrice).toBe(0);
    expect(totals.taxPrice).toBe(10);
    expect(totals.totalPrice).toBe(110);
  });

  test('never lets discount exceed the subtotal', () => {
    const totals = calculateOrderTotals({ itemsPrice: 20, discount: 50 });
    expect(totals.discount).toBe(20);
    expect(totals.totalPrice).toBe(SHIPPING_FEE);
  });
});
