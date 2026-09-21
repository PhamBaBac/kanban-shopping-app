/** @format */

import { CategoyModel } from "@/models/Products";

/**
 * Tìm danh mục mặc định cho trang /shop khi người dùng truy cập trực tiếp không có catId:
 * 1. Ưu tiên danh mục "Nổi bật" hoặc "Bán chạy" (theo title, slug hoặc description).
 * 2. Nếu không có, ưu tiên danh mục gốc đầu tiên (root category có parentId rỗng/null).
 * 3. Fallback danh mục đầu tiên có id trong danh sách.
 */
export const findDefaultOrFeaturedCategory = (
  categories: CategoyModel[]
): CategoyModel | null => {
  if (!categories || categories.length === 0) return null;

  const flatten = (items: CategoyModel[]): CategoyModel[] => {
    let result: CategoyModel[] = [];
    for (const item of items) {
      if (!item) continue;
      result.push(item);
      if (item.children && Array.isArray(item.children) && item.children.length > 0) {
        result = result.concat(flatten(item.children));
      }
    }
    return result;
  };

  const allCats = flatten(categories);

  const featuredKeywords = [
    "nổi bật",
    "bán chạy",
    "noi bat",
    "ban chay",
    "featured",
    "best seller",
    "bestseller",
    "hot",
    "trending",
    "phổ biến",
    "pho bien",
  ];

  // 1. Tìm danh mục nổi bật / bán chạy
  const featured = allCats.find((cat) => {
    const title = (cat.title || "").toLowerCase();
    const slug = (cat.slug || "").toLowerCase();
    const desc = (cat.description || "").toLowerCase();
    return featuredKeywords.some(
      (kw) => title.includes(kw) || slug.includes(kw) || desc.includes(kw)
    );
  });

  if (featured && (featured.id || (featured as any)._id)) {
    return featured;
  }

  // 2. Ưu tiên danh mục gốc đầu tiên
  const rootCategory = categories.find(
    (cat) => !cat.parentId || String(cat.parentId).trim() === ""
  );

  if (rootCategory && (rootCategory.id || (rootCategory as any)._id)) {
    return rootCategory;
  }

  // 3. Fallback danh mục đầu tiên
  const firstWithId = allCats.find(
    (cat) => Boolean(cat.id) || Boolean((cat as any)._id)
  );

  return firstWithId || categories[0] || null;
};
