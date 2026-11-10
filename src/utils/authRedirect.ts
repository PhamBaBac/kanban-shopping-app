/** @format */

import { message } from "antd";
import type { NextRouter } from "next/router";
import type { Dispatch, UnknownAction } from "@reduxjs/toolkit";
import { cartService, CartItem } from "@/services/cartService";
import { syncProducts } from "@/redux/reducers/cartReducer";
import { showErrorMessage } from "@/utils/errorHandler";

interface AuthLike {
  accessToken?: string;
  userId?: string;
}

interface RedirectProductContext {
  id?: string;
  slug?: string;
}

export interface PendingBuyNowItem extends CartItem {
  createdBy: string;
  savedAt: number;
}

const PENDING_BUY_NOW_KEY = "kanban_pending_buy_now";
const PENDING_BUY_NOW_TTL_MS = 30 * 60 * 1000;

export const savePendingBuyNow = (item: CartItem & { createdBy?: string }): void => {
  if (typeof window === "undefined") return;
  try {
    const payload: PendingBuyNowItem = {
      ...item,
      createdBy: item.createdBy || "",
      savedAt: Date.now(),
    };
    localStorage.setItem(PENDING_BUY_NOW_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to save pending buy-now item:", error);
  }
};

export const getPendingBuyNow = (): PendingBuyNowItem | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PENDING_BUY_NOW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingBuyNowItem;
    if (!parsed?.subProductId || !parsed?.savedAt) {
      localStorage.removeItem(PENDING_BUY_NOW_KEY);
      return null;
    }
    if (Date.now() - parsed.savedAt > PENDING_BUY_NOW_TTL_MS) {
      localStorage.removeItem(PENDING_BUY_NOW_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(PENDING_BUY_NOW_KEY);
    return null;
  }
};

export const clearPendingBuyNow = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PENDING_BUY_NOW_KEY);
  } catch {
    // ignore storage errors
  }
};

/**
 * Checks whether the current user is logged in before running an authenticated action.
 * Optionally persists a pending Buy Now item and redirects to `/auth/login`.
 */
export const requireAuthForAction = (
  auth: AuthLike | null | undefined,
  router: NextRouter,
  notice = "Vui lòng đăng nhập để mua ngay!",
  product?: RedirectProductContext,
  pendingBuyNow?: CartItem
): boolean => {
  if (auth?.accessToken && auth?.userId) {
    return true;
  }

  if (pendingBuyNow) {
    savePendingBuyNow(pendingBuyNow);
  }

  message.warning(notice);

  const query: Record<string, string> = {};
  if (pendingBuyNow) {
    query.buyNow = "1";
  }
  if (product?.id) {
    query.id = product.id;
    query.productId = product.id;
    query.slug = product.slug || "detail";
  }

  router.push(
    Object.keys(query).length > 0
      ? { pathname: "/auth/login", query }
      : "/auth/login"
  );
  return false;
};

/**
 * Adds or updates a Buy Now item in the authenticated user's DB cart,
 * refreshes Redux cart state, and returns the checkout URL targeting that item.
 */
export const addOrSyncBuyNowItem = async (
  itemToSave: CartItem & { createdBy: string },
  dispatch: Dispatch<UnknownAction>,
  options?: { preserveExistingCount?: boolean }
): Promise<string> => {
  const dbCart = await cartService.getCart();
  const existing = Array.isArray(dbCart)
    ? dbCart.find(
        (c) => String(c.subProductId) === String(itemToSave.subProductId) && c.id
      )
    : undefined;

  if (existing?.id) {
    if (!options?.preserveExistingCount) {
      await cartService.updateCartItem(existing.id, itemToSave);
    }
  } else {
    await cartService.addToCart(itemToSave);
  }

  const updatedCart = await cartService.getCart();
  if (Array.isArray(updatedCart)) {
    dispatch(syncProducts(updatedCart));
  }

  return `/shop/checkout?buyNowId=${encodeURIComponent(itemToSave.subProductId)}`;
};

/**
 * Completes a pending Buy Now action immediately after login:
 * adds/updates the item in the authenticated user's DB cart, syncs Redux,
 * and returns the checkout URL targeting that exact subProductId.
 */
export const completePendingBuyNowAfterLogin = async (
  userId: string,
  dispatch: Dispatch<UnknownAction>
): Promise<string | null> => {
  const pending = getPendingBuyNow();
  if (!pending || !userId) return null;

  clearPendingBuyNow();

  try {
    const itemToSave: CartItem & { createdBy: string } = {
      subProductId: pending.subProductId,
      productId: pending.productId,
      title: pending.title,
      image: pending.image,
      price: pending.price,
      count: pending.count,
      size: pending.size,
      color: pending.color,
      qty: pending.qty,
      createdBy: userId,
    };

    return await addOrSyncBuyNowItem(itemToSave, dispatch);
  } catch (error: unknown) {
    showErrorMessage(
      error,
      "Không thể chuyển sản phẩm sang trang thanh toán. Vui lòng thử lại!"
    );
    return null;
  }
};
