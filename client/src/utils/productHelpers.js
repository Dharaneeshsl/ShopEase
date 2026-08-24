export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=600&auto=format&fit=crop';

export const getProductImage = (product) => {
  if (!product) return PLACEHOLDER_IMAGE;
  if (typeof product.image === 'string' && product.image) return product.image;
  if (Array.isArray(product.images) && product.images.length) {
    const first = product.images[0];
    if (typeof first === 'string') return first;
    if (first?.url) return first.url;
  }
  return PLACEHOLDER_IMAGE;
};

export const getProductImages = (product) => {
  if (!product) return [{ url: PLACEHOLDER_IMAGE }];
  if (Array.isArray(product.images) && product.images.length) {
    return product.images.map((img) =>
      typeof img === 'string' ? { url: img } : { url: img.url, public_id: img.public_id }
    );
  }
  if (product.image) return [{ url: product.image }];
  return [{ url: PLACEHOLDER_IMAGE }];
};

export const getProductRating = (product) =>
  Number(product?.ratings ?? product?.rating ?? 0);

export const getProductReviewCount = (product) =>
  Number(product?.numOfReviews ?? product?.numReviews ?? 0);

export const getProductId = (item) =>
  item?.productId || item?.product?._id || item?.product || item?._id;

export const formatMoney = (value) =>
  `$${Number(value || 0).toFixed(2)}`;
