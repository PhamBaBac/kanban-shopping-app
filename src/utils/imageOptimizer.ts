import { ImageLoaderProps } from "next/image";

/**
 * Utility tối ưu hóa ảnh cho storefront
 * - Tự động chèn dynamic transformations cho Cloudinary (f_auto, q_auto, w_width, c_limit)
 * - Tương thích chuẩn next/image ImageLoader
 * - Giảm tới 70-85% dung lượng ảnh tải về
 *
 * @format
 */

export const getOptimizedImageUrl = (
  url?: string | null,
  width: number = 600
): string => {
  if (!url) return "";

  const trimmed = url.trim();

  // Kiểm tra nếu là URL ảnh Cloudinary
  if (trimmed.includes("res.cloudinary.com") && trimmed.includes("/image/upload/")) {
    if (trimmed.includes("/f_auto") || trimmed.includes("/w_") || trimmed.includes("/q_auto")) {
      return trimmed;
    }
    return trimmed.replace(
      "/image/upload/",
      `/image/upload/c_limit,w_${width},f_auto,q_auto/`
    );
  }

  // Hỗ trợ tối ưu ảnh Unsplash
  if (trimmed.includes("images.unsplash.com")) {
    try {
      const urlObj = new URL(trimmed);
      urlObj.searchParams.set("w", String(width));
      urlObj.searchParams.set("auto", "format");
      urlObj.searchParams.set("q", "80");
      return urlObj.toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
};

/**
 * Next.js Image Loader cho Cloudinary & External CDN
 * Đảm bảo kích thước tối thiểu 240px để ảnh thumbnail trên màn hình Retina/High-DPI không bị mờ/nhòe
 */
export const cloudinaryLoader = ({ src, width }: ImageLoaderProps): string => {
  const safeWidth = Math.max(width, 240);
  return getOptimizedImageUrl(src, safeWidth);
};
