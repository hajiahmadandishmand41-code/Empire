/**
 * Public surface of the `product` feature (Phase 4).
 *
 * Product detail surface — reuses the shop catalog as source of
 * truth and enriches each product with description, features,
 * and a 4-item placeholder gallery.
 */
export { ProductDetail } from './components/product-detail';
export { ProductGallery } from './components/product-gallery';
export { ProductActions } from './components/product-actions';
export { RelatedProducts } from './components/related-products';
export {
  getProductBySlug,
  getRelatedProducts,
  getAllProductSlugs,
  toProductDetail,
} from './data/product-details';
export type {
  ProductDetail as ProductDetailModel,
  ProductGalleryItem,
} from './data/product-details';
