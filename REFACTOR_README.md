# ProductDetail Refactor

## Cấu trúc mới

### 1. Services (`src/services/`)

Chứa tất cả các API calls được tách riêng:

- **`productService.ts`**: Xử lý các API liên quan đến product

  - `getProductDetail()`: Lấy thông tin chi tiết sản phẩm
  - `getSubProducts()`: Lấy danh sách sub products
  - `getSupplier()`: Lấy thông tin supplier
  - `getReviews()`: Lấy tất cả reviews

- **`cartService.ts`**: Xử lý các API liên quan đến cart
  - `addToCart()`: Thêm sản phẩm vào cart (đã đăng nhập)
  - `updateCartItem()`: Cập nhật số lượng trong cart
  - `addToRedisCart()`: Thêm sản phẩm vào Redis cart (chưa đăng nhập)
  - `getRedisCart()`: Lấy cart từ Redis

### 2. Hooks (`src/hooks/`)

Chứa logic business và state management:

- **`useProductDetail.ts`**: Quản lý logic fetch data cho product detail

  - Fetch sub products, supplier, reviews
  - Quản lý loading state và error handling
  - Quản lý sub product selected

- **`useCart.ts`**: Quản lý logic cart
  - Xử lý thêm/cập nhật cart
  - Tính toán available quantity
  - Quản lý count và instock quantity

### 3. Component (`src/pages/products/[slug]/[id]/index.tsx`)

Chỉ lo render UI:

- Sử dụng các hooks để lấy data
- Render UI components
- Xử lý user interactions

## Lợi ích của refactor

1. **Separation of Concerns**: Tách biệt rõ ràng giữa API calls, business logic và UI
2. **Reusability**: Services và hooks có thể tái sử dụng ở các component khác
3. **Testability**: Dễ dàng test từng layer riêng biệt
4. **Maintainability**: Code dễ bảo trì và mở rộng
5. **Type Safety**: TypeScript interfaces rõ ràng cho mỗi layer

## Cách sử dụng

```typescript
// Trong component
const {
  subProducts,
  supplier,
  reviews,
  subProductSelected,
  setSubProductSelected,
  loading,
  error,
} = useProductDetail({ product });

const { count, setCount, instockQuantity, handleCart } = useCart({
  subProductSelected,
  product,
});
```

## File structure

```
src/
├── services/
│   ├── index.ts
│   ├── productService.ts
│   └── cartService.ts
├── hooks/
│   ├── index.ts
│   ├── useProductDetail.ts
│   └── useCart.ts
└── pages/products/[slug]/[id]/
    └── index.tsx (refactored component)
```
