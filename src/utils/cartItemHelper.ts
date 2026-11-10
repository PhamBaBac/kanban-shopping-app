/** @format */

import { ProductModel, SubProductModel } from "@/models/Products";
import type { CartItem } from "@/services/cartService";

interface BuildCartItemParams {
  subProduct: SubProductModel;
  product: ProductModel;
  count: number;
  createdBy: string;
}

const isSystemAttribute = (key: string): boolean => {
  const lower = key.trim().toLowerCase();
  return (
    lower === "discounttype" ||
    lower === "discountvalue" ||
    lower === "discountamount" ||
    lower === "discount" ||
    lower === "price" ||
    lower === "cost" ||
    lower === "stock" ||
    lower === "qty"
  );
};

type SubProductWithLegacyIds = SubProductModel & {
  _id?: string;
  subProductId?: string;
};

/**
 * Resolves color, size, image, and pricing into a CartItem payload
 * from a product and its selected variant.
 */
export const buildCartItemPayload = ({
  subProduct,
  product,
  count,
  createdBy,
}: BuildCartItemParams): CartItem & { createdBy: string } => {
  const legacySubProduct = subProduct as SubProductWithLegacyIds;
  const targetSubProductId =
    legacySubProduct.id ||
    legacySubProduct._id ||
    legacySubProduct.subProductId ||
    "";

  let attrs: Record<string, unknown> = {};
  if (subProduct.attributes) {
    if (typeof subProduct.attributes === "string") {
      try {
        attrs = JSON.parse(subProduct.attributes) as Record<string, unknown>;
      } catch {
        attrs = {};
      }
    } else if (typeof subProduct.attributes === "object") {
      attrs = subProduct.attributes;
    }
  }

  let resolvedColor = subProduct.color || "";
  if (!resolvedColor) {
    for (const [key, val] of Object.entries(attrs)) {
      const lowerKey = key.trim().toLowerCase();
      if (
        lowerKey.includes("màu") ||
        lowerKey.includes("color") ||
        lowerKey.includes("colour")
      ) {
        resolvedColor = String(val);
        break;
      }
    }
  }

  const nonColorList: string[] = [];
  for (const [key, val] of Object.entries(attrs)) {
    const lowerKey = key.trim().toLowerCase();
    if (
      !isSystemAttribute(key) &&
      !lowerKey.includes("màu") &&
      !lowerKey.includes("color") &&
      !lowerKey.includes("colour")
    ) {
      if (val) nonColorList.push(String(val));
    }
  }

  const resolvedSize =
    nonColorList.length > 0 ? nonColorList.join(" - ") : subProduct.size || "";

  const resolvedImage =
    subProduct.imgURL ||
    subProduct.images?.[0] ||
    product.images?.[0] ||
    "";

  return {
    createdBy,
    count,
    subProductId: targetSubProductId,
    size: resolvedSize,
    title: product.title,
    color: resolvedColor,
    price: subProduct.discount ?? subProduct.price,
    qty: subProduct.stock,
    productId: product.id,
    image: resolvedImage,
  };
};

