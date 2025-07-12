export { productService } from "./productService";
export { cartService } from "./cartService";
export { authService } from "./authService";
export { homeService } from "./homeService";
export { shopService } from "./shopService";
export { orderService } from "./orderService";
export { promotionService } from "./promotionService";
export { paymentService } from "./paymentService";
export { addressService } from "./addressService";
export { userService } from "./userService";
export { reviewService } from "./reviewService";
export { chatService } from "./chatService";

// Export types
export type { AuthUser, LoginCredentials, SignupData } from "./authService";
export type { FilterValues, ShopFilters } from "./shopService";
export type { OrderItem, CreateOrderData } from "./orderService";
export type { PaymentData } from "./paymentService";
export type { CreateAddressData } from "./addressService";
export type {
  UpdateProfileData,
  ChangePasswordData,
  UserActivity,
} from "./userService";
export type { CreateReviewData } from "./reviewService";
export type { ChatMessage, ChatHistoryItem } from "./chatService";
