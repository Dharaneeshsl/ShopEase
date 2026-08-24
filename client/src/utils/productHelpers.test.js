import { formatMoney, getProductRating, getProductReviewCount, getProductImage } from './productHelpers';

describe('productHelpers', () => {
  test('formatMoney formats two decimal places', () => {
    expect(formatMoney(10)).toBe('$10.00');
    expect(formatMoney(19.9)).toBe('$19.90');
  });

  test('getProductRating prefers ratings then rating', () => {
    expect(getProductRating({ ratings: 4.5, rating: 2 })).toBe(4.5);
    expect(getProductRating({ rating: 3 })).toBe(3);
    expect(getProductRating({})).toBe(0);
  });

  test('getProductReviewCount reads either field', () => {
    expect(getProductReviewCount({ numOfReviews: 12 })).toBe(12);
    expect(getProductReviewCount({ numReviews: 4 })).toBe(4);
  });

  test('getProductImage falls back when missing', () => {
    expect(getProductImage({ images: [{ url: 'https://cdn.example/p.jpg' }] })).toBe('https://cdn.example/p.jpg');
    expect(getProductImage(null)).toMatch(/^https:\/\//);
  });
});
