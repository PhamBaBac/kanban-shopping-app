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

  const rootCategory = categories.find(
    (cat) => !cat.parentId || String(cat.parentId).trim() === ""
  );

  if (rootCategory && (rootCategory.id || (rootCategory as any)._id)) {
    return rootCategory;
  }

  const firstWithId = allCats.find(
    (cat) => Boolean(cat.id) || Boolean((cat as any)._id)
  );

  return firstWithId || categories[0] || null;
};

/**
 * Tìm Root Category (danh mục gốc) của một categoryId hoặc category bất kỳ
 */
export const findRootCategory = (
  targetId: string,
  categories: CategoyModel[]
): CategoyModel | null => {
  if (!targetId || !categories || categories.length === 0) return null;

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
  const catMap = new Map<string, CategoyModel>();
  allCats.forEach((c) => catMap.set(String(c.id), c));

  let current = catMap.get(String(targetId));
  if (!current) return null;

  const visited = new Set<string>();
  while (current && current.parentId && String(current.parentId).trim() !== "") {
    if (visited.has(String(current.id))) break;
    visited.add(String(current.id));
    const parent = catMap.get(String(current.parentId));
    if (!parent || String(parent.id) === String(current.id)) break;
    current = parent;
  }

  return current || null;
};

/**
 * Tìm Root Category phù hợp nhất với từ khóa tìm kiếm (so khớp theo title hoặc slug của category)
 */
export const findCategoryByKeyword = (
  keyword: string,
  categories: CategoyModel[]
): CategoyModel | null => {
  if (!keyword || !categories || categories.length === 0) return null;
  const kw = keyword.trim().toLowerCase();

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

  const matched = allCats.find((c) => {
    const title = (c.title || "").toLowerCase();
    const slug = (c.slug || "").toLowerCase();
    return title.includes(kw) || kw.includes(title) || slug.includes(kw);
  });

  if (matched) {
    return findRootCategory(matched.id, categories) || matched;
  }

  return null;
};

