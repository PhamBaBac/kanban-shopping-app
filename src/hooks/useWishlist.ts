/** @format */

import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { message } from "antd";
import { ProductModel } from "@/models/Products";
import { authSelector } from "@/redux/reducers/authReducer";
import {
  clearWishlist,
  loadWishlist,
  removeWishlist,
  setWishlistFromServer,
  toggleWishlist,
  wishlistCountSelector,
  wishlistIdsSelector,
  wishlistItemsSelector,
} from "@/redux/reducers/wishlistSlice";
import { wishlistService } from "@/services/wishlistService";

const GUEST_STORAGE_KEY = "kanban_wishlist_guest";

let isSyncing = false;
let globalSyncedUserId: string | null = null;

export const useWishlist = () => {
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  const items = useSelector(wishlistItemsSelector);
  const ids = useSelector(wishlistIdsSelector);
  const count = useSelector(wishlistCountSelector);

  const userId = auth?.userId || null;
  const isLoggedIn = Boolean(auth?.accessToken && userId);

  // 1. Luôn load ngay từ localStorage khi userId thay đổi để UI có data tức thì
  useEffect(() => {
    dispatch(loadWishlist({ userId }));
  }, [dispatch, userId]);

  // 2. Đồng bộ danh sách yêu thích khi đăng nhập / đăng xuất
  useEffect(() => {
    if (!isLoggedIn) {
      globalSyncedUserId = null;
      return;
    }

    if (isLoggedIn && userId && globalSyncedUserId !== userId && !isSyncing) {
      globalSyncedUserId = userId;

      const syncWithServer = async () => {
        isSyncing = true;
        try {
          // Lấy danh sách sản phẩm khách vãng lai đã thích trước khi đăng nhập
          let guestIds: string[] = [];
          if (typeof window !== "undefined") {
            const guestData = localStorage.getItem(GUEST_STORAGE_KEY);
            if (guestData) {
              try {
                const guestItems: ProductModel[] = JSON.parse(guestData);
                if (Array.isArray(guestItems)) {
                  guestIds = guestItems.map((g) => g.id).filter(Boolean);
                }
              } catch (e) {
                console.error("Failed to parse guest wishlist during sync:", e);
              }
            }
          }

          // Gửi danh sách ID khách vãng lai lên backend Spring Boot để merge vào Database
          if (guestIds.length > 0) {
            await wishlistService.syncWishlist(guestIds);
            // Sau khi sync thành công lên Database mới xóa guest storage
            if (typeof window !== "undefined") {
              localStorage.removeItem(GUEST_STORAGE_KEY);
            }
          }

          // Lấy toàn bộ danh sách sản phẩm yêu thích chính thức đã merge từ Database
          const serverItems = await wishlistService.getWishlist();
          if (serverItems && Array.isArray(serverItems)) {
            dispatch(setWishlistFromServer({ items: serverItems, userId }));
          }
        } catch (error) {
          console.error("Error syncing wishlist with backend:", error);
        } finally {
          isSyncing = false;
        }
      };

      syncWithServer();
    }
  }, [dispatch, userId, isLoggedIn]);

  const isFavorite = useCallback(
    (productId?: string | null): boolean => {
      if (!productId) return false;
      return ids.includes(productId);
    },
    [ids]
  );

  const toggleFavorite = useCallback(
    async (product: ProductModel) => {
      if (!product || !product.id) return;
      const willBeRemoved = ids.includes(product.id);

      // Optimistic UI update: Cập nhật ngay lập tức giao diện
      dispatch(toggleWishlist({ product, userId }));

      if (willBeRemoved) {
        message.info({
          content: "Đã xóa khỏi bộ sưu tập yêu thích",
          key: `wishlist-${product.id}`,
          duration: 2,
        });
      } else {
        message.success({
          content: "Đã thêm vào bộ sưu tập yêu thích",
          key: `wishlist-${product.id}`,
          duration: 2,
        });
      }

      // Nếu đã đăng nhập, gọi API Spring Boot ngầm
      if (isLoggedIn) {
        try {
          await wishlistService.toggleWishlist(product.id);
        } catch (err) {
          console.error("Failed to sync toggle with server:", err);
        }
      }
    },
    [dispatch, ids, userId, isLoggedIn]
  );

  const removeFavorite = useCallback(
    async (productId: string) => {
      dispatch(removeWishlist({ productId, userId }));
      message.info({
        content: "Đã xóa khỏi bộ sưu tập yêu thích",
        key: `wishlist-${productId}`,
        duration: 2,
      });

      if (isLoggedIn) {
        try {
          await wishlistService.removeFromWishlist(productId);
        } catch (err) {
          console.error("Failed to remove from server wishlist:", err);
        }
      }
    },
    [dispatch, userId, isLoggedIn]
  );

  const clearAll = useCallback(async () => {
    dispatch(clearWishlist({ userId }));
    message.info("Đã làm trống bộ sưu tập yêu thích");

    if (isLoggedIn) {
      try {
        await wishlistService.clearWishlist();
      } catch (err) {
        console.error("Failed to clear server wishlist:", err);
      }
    }
  }, [dispatch, userId, isLoggedIn]);

  return {
    wishlistItems: items,
    wishlistIds: ids,
    wishlistCount: count,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearAll,
  };
};

export default useWishlist;
