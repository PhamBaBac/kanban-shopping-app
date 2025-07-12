# Kanban Shopping App - Complete API Refactor

## Tổng quan

Đã refactor toàn bộ hệ thống API calls trong Kanban Shopping App theo cấu trúc **Services/Hooks/Components** để tách biệt rõ ràng các concerns và tăng tính maintainability.

## Cấu trúc mới

### 1. Services (`src/services/`)

Tất cả API calls được tổ chức theo domain:

#### Core Services

- **`productService.ts`** - Quản lý sản phẩm, sub-products, suppliers, reviews
- **`cartService.ts`** - Quản lý giỏ hàng (database & Redis)
- **`authService.ts`** - Authentication, MFA, OAuth, password reset
- **`homeService.ts`** - Dữ liệu trang chủ (promotions, categories, best sellers)
- **`shopService.ts`** - Filter, search, categories cho shop
- **`orderService.ts`** - Quản lý đơn hàng (CRUD operations)
- **`promotionService.ts`** - Kiểm tra và lấy promotion codes
- **`paymentService.ts`** - Xử lý thanh toán (VNPay)
- **`addressService.ts`** - Quản lý địa chỉ giao hàng
- **`userService.ts`** - Profile, password change, 2FA setup
- **`reviewService.ts`** - Tạo và upload review
- **`chatService.ts`** - AI chat support

#### Export

- **`index.ts`** - Export tất cả services và types

### 2. Hooks (`src/hooks/`)

Custom hooks quản lý business logic và state:

#### Core Hooks

- **`useProductDetail.ts`** - Logic cho product detail page
- **`useCart.ts`** - Logic quản lý cart
- **`useHome.ts`** - Logic cho trang chủ
- **`useShop.ts`** - Logic cho shop page với filter/search
- **`useAuth.ts`** - Logic authentication (login, signup, MFA)
- **`useOrders.ts`** - Logic quản lý orders
- **`useAddress.ts`** - Logic quản lý addresses
- **`useChat.ts`** - Logic cho AI chat

#### Export

- **`index.ts`** - Export tất cả hooks

### 3. Components

Components chỉ lo render UI, sử dụng hooks để lấy data:

#### Đã refactor

- **`pages/index.tsx`** - Sử dụng `useHome`
- **`pages/shop/index.tsx`** - Sử dụng `useShop`
- **`pages/products/[slug]/[id]/index.tsx`** - Sử dụng `useProductDetail` & `useCart`
- **`components/ChatButton.tsx`** - Sử dụng `useChat`

## Lợi ích của refactor

### 1. **Separation of Concerns**

- **Services**: Chỉ chứa API calls
- **Hooks**: Chứa business logic và state management
- **Components**: Chỉ lo render UI

### 2. **Reusability**

- Services có thể được sử dụng ở nhiều nơi
- Hooks có thể được tái sử dụng giữa các components
- Logic được tách biệt khỏi UI

### 3. **Maintainability**

- Dễ dàng thay đổi API endpoints
- Logic phức tạp được tách riêng
- Code dễ đọc và debug

### 4. **Testability**

- Có thể test từng layer riêng biệt
- Mock services dễ dàng
- Unit tests cho hooks

### 5. **Type Safety**

- TypeScript interfaces rõ ràng
- Type checking cho API responses
- IntelliSense support

## Cách sử dụng

### Trong Components

```typescript
// Sử dụng hooks
const { products, isLoading, error, fetchProducts } = useShop();
const { login, isLoading } = useAuth();
const { messages, sendMessage } = useChat();

// Sử dụng services trực tiếp (nếu cần)
import { productService } from "@/services";
const product = await productService.getProductDetail(slug, id);
```

### Tạo Service mới

```typescript
// src/services/newService.ts
import handleAPI from "@/apis/handleApi";

export const newService = {
  getData: async (): Promise<any> => {
    const res: any = await handleAPI("/api/endpoint");
    return res.result;
  },
};
```

### Tạo Hook mới

```typescript
// src/hooks/useNewFeature.ts
import { useState, useEffect } from "react";
import { newService } from "@/services";

export const useNewFeature = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await newService.getData();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, fetchData };
};
```

## Migration Guide

### Từ handleAPI trực tiếp sang Services

**Trước:**

```typescript
const res = await handleAPI("/products", data, "post");
```

**Sau:**

```typescript
const result = await productService.createProduct(data);
```

### Từ useState + useEffect sang Hooks

**Trước:**

```typescript
const [products, setProducts] = useState([]);
const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  fetchProducts();
}, []);

const fetchProducts = async () => {
  setIsLoading(true);
  try {
    const res = await handleAPI("/products");
    setProducts(res.result);
  } catch (error) {
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};
```

**Sau:**

```typescript
const { products, isLoading, error, fetchProducts } = useShop();
```

## File Structure

```
src/
├── services/
│   ├── index.ts
│   ├── productService.ts
│   ├── cartService.ts
│   ├── authService.ts
│   ├── homeService.ts
│   ├── shopService.ts
│   ├── orderService.ts
│   ├── promotionService.ts
│   ├── paymentService.ts
│   ├── addressService.ts
│   ├── userService.ts
│   ├── reviewService.ts
│   └── chatService.ts
├── hooks/
│   ├── index.ts
│   ├── useProductDetail.ts
│   ├── useCart.ts
│   ├── useHome.ts
│   ├── useShop.ts
│   ├── useAuth.ts
│   ├── useOrders.ts
│   ├── useAddress.ts
│   └── useChat.ts
├── pages/
│   ├── index.tsx (refactored)
│   ├── shop/index.tsx (refactored)
│   └── products/[slug]/[id]/index.tsx (refactored)
└── components/
    ├── ChatButton.tsx (refactored)
    └── ... (other components)
```

## Best Practices

1. **Services**: Luôn return data đã được xử lý, không return raw API response
2. **Hooks**: Xử lý error handling và loading states
3. **Components**: Chỉ sử dụng hooks, không gọi services trực tiếp
4. **Types**: Export types từ services để sử dụng ở hooks và components
5. **Error Handling**: Consistent error handling pattern across all layers

## Next Steps

1. Refactor các components còn lại
2. Thêm unit tests cho services và hooks
3. Implement caching layer nếu cần
4. Add error boundaries cho components
5. Optimize performance với React.memo và useMemo
