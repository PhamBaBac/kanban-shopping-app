/**
 * Utility sắp xếp phân loại và kích thước biến thể sản phẩm (Variant & Size Sorter)
 * Hỗ trợ chuẩn thời trang & thương mại điện tử:
 * - Size chữ: XXS -> XS -> S -> M -> L -> XL -> 2XL/XXL -> 3XL -> 4XL -> FreeSize
 * - Size số (quần jeans, giày dép): 26, 27, 28, 29, 30... hoặc 35, 36, 37, 38, 39, 40, 41, 42...
 * - Dung lượng bộ nhớ: 64GB -> 128GB -> 256GB -> 512GB -> 1TB
 * - Hỗ trợ các biến thể có kèm nhãn hoặc ghi chú: "Size S", "L (50-60kg)", "38 EU"
 *
 * @format
 */

const LETTER_SIZE_ORDER: Record<string, number> = {
  "4XS": 1,
  XXXXS: 1,
  "3XS": 2,
  XXXS: 2,
  "2XS": 3,
  XXS: 3,
  XS: 4,
  S: 5,
  M: 6,
  L: 7,
  XL: 8,
  "2XL": 9,
  XXL: 9,
  "3XL": 10,
  XXXL: 10,
  "4XL": 11,
  XXXXL: 11,
  "5XL": 12,
  XXXXXL: 12,
  "6XL": 13,
  FREESIZE: 9999,
  "FREE SIZE": 9999,
  "FREE-SIZE": 9999,
  OS: 9999,
  "ONE SIZE": 9999,
  ONESIZE: 9999,
  "ONE-SIZE": 9999,
};

/**
 * Làm sạch chuỗi kích thước bằng cách loại bỏ các tiền tố thông dụng:
 * "Size S" -> "S", "Cỡ 29" -> "29", "Kích cỡ: XL" -> "XL"
 */
export const cleanSizeToken = (raw: string): string => {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/^(size|cỡ|kích\s*cỡ|kích\s*thước|kích|phân\s*loại)\s*:?\s*/i, "")
    .trim();
};

/**
 * Trích xuất thứ bậc của size chữ (nếu khớp S, M, L, XL...)
 */
const getLetterSizeRank = (token: string): number | null => {
  const upper = token.toUpperCase();
  // 1. Khớp chính xác hoàn toàn
  if (LETTER_SIZE_ORDER[upper] !== undefined) {
    return LETTER_SIZE_ORDER[upper];
  }

  // 2. Khớp từ đầu (VD: "S (45-50kg)", "XL - Vừa", "2XL/XXL")
  const match = upper.match(
    /^(4XS|3XS|2XS|XXS|XS|S|M|L|XL|2XL|XXL|3XL|XXXL|4XL|5XL|6XL|FREESIZE|FREE\s*SIZE|FREE-SIZE|OS|ONE\s*SIZE|ONESIZE)\b/
  );
  if (match && LETTER_SIZE_ORDER[match[1]] !== undefined) {
    return LETTER_SIZE_ORDER[match[1]];
  }

  return null;
};

/**
 * Trích xuất giá trị byte cho các biến thể dung lượng (GB, TB, MB)
 */
const getStorageBytes = (str: string): number | null => {
  const match = str
    .trim()
    .toUpperCase()
    .match(/^(\d+(?:\.\d+)?)\s*(GB|TB|MB|KB)\b/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = match[2];
  if (unit === "KB") return num * 1024;
  if (unit === "MB") return num * 1024 * 1024;
  if (unit === "GB") return num * 1024 * 1024 * 1024;
  if (unit === "TB") return num * 1024 * 1024 * 1024 * 1024;
  return null;
};

/**
 * Trích xuất số đầu tiên trong chuỗi kích thước (VD: "28", "29", "38 EU", "38.5")
 */
const getLeadingNumber = (token: string): number | null => {
  const match = token.trim().match(/^(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
};

/**
 * Kiểm tra xem tên thuộc tính có phải là kích thước / size hay không
 */
export const isSizeAttributeKey = (key: string): boolean => {
  if (!key) return false;
  const k = key.trim().toLowerCase();
  return (
    k.includes("size") ||
    k.includes("kích") ||
    k.includes("cỡ") ||
    k.includes("chiều cao") ||
    k.includes("cân nặng") ||
    k.includes("dung lượng") ||
    k.includes("storage") ||
    k.includes("bộ nhớ")
  );
};

/**
 * Kiểm tra xem danh sách giá trị có chứa các đặc điểm của size hay không
 * (Phát hiện ngay cả khi tên thuộc tính đặt là "Phân loại", "Thuộc tính 1", "Loại", v.v.)
 */
export const hasSizeLikeValues = (values: string[]): boolean => {
  if (!values || values.length === 0) return false;
  let matches = 0;
  for (const v of values) {
    const cleaned = cleanSizeToken(v);
    if (
      getLetterSizeRank(cleaned) !== null ||
      getStorageBytes(cleaned) !== null ||
      getLeadingNumber(cleaned) !== null
    ) {
      matches++;
    }
  }
  return matches >= Math.ceil(values.length / 2);
};

/**
 * Hàm so sánh 2 giá trị kích thước theo chuẩn tự nhiên
 */
export const compareSizeValues = (a: string, b: string): number => {
  const aClean = cleanSizeToken(a);
  const bClean = cleanSizeToken(b);

  // 1. So sánh size chữ (S, M, L, XL, XXL...)
  const aLetterRank = getLetterSizeRank(aClean);
  const bLetterRank = getLetterSizeRank(bClean);

  if (aLetterRank !== null && bLetterRank !== null) {
    return aLetterRank - bLetterRank;
  }
  if (aLetterRank !== null && bLetterRank === null) {
    return -1;
  }
  if (aLetterRank === null && bLetterRank !== null) {
    return 1;
  }

  // 2. So sánh dung lượng bộ nhớ (64GB, 128GB, 256GB, 1TB...)
  const aBytes = getStorageBytes(aClean);
  const bBytes = getStorageBytes(bClean);
  if (aBytes !== null && bBytes !== null) {
    return aBytes - bBytes;
  }
  if (aBytes !== null) return -1;
  if (bBytes !== null) return 1;

  // 3. So sánh size số (28, 29, 30... hoặc 36, 37, 38, 38.5, 39, 40...)
  const aNum = getLeadingNumber(aClean);
  const bNum = getLeadingNumber(bClean);
  if (aNum !== null && bNum !== null) {
    if (aNum !== bNum) {
      return aNum - bNum;
    }
  } else if (aNum !== null) {
    return -1;
  } else if (bNum !== null) {
    return 1;
  }

  // 4. Mặc định so sánh tự nhiên chuỗi tiếng Việt (numeric: true để 2 đứng trước 10)
  return a.localeCompare(b, "vi", { numeric: true, sensitivity: "base" });
};

/**
 * Sắp xếp danh sách giá trị thuộc tính biến thể:
 * - Nếu là Size (hoặc chứa các giá trị kiểu size): sắp xếp theo chuẩn thứ tự kích cỡ
 * - Nếu không phải Size (VD: Màu sắc): sắp xếp theo thứ tự chữ cái tự nhiên
 */
export const sortVariantValues = (
  values: string[],
  attributeKey?: string
): string[] => {
  if (!values || values.length <= 1) return values || [];

  const shouldSortAsSize =
    (attributeKey && isSizeAttributeKey(attributeKey)) ||
    hasSizeLikeValues(values);

  if (shouldSortAsSize) {
    return [...values].sort(compareSizeValues);
  }

  return [...values].sort((a, b) =>
    a.localeCompare(b, "vi", { numeric: true, sensitivity: "base" })
  );
};

/**
 * Sắp xếp thứ tự các nhóm thuộc tính để UI hiển thị chuẩn:
 * 1. Màu sắc (Màu, Color, Colour) luôn đứng đầu
 * 2. Kích thước (Size, Kích cỡ, Dung lượng) đứng thứ 2
 * 3. Các thuộc tính khác (Phiên bản, Chất liệu...) xếp sau
 */
export const sortAttributeKeys = (keys: string[]): string[] => {
  const getOrder = (k: string): number => {
    const lower = k.trim().toLowerCase();
    if (
      lower.includes("màu") ||
      lower.includes("color") ||
      lower.includes("colour")
    ) {
      return 1;
    }
    if (isSizeAttributeKey(lower)) {
      return 2;
    }
    if (lower.includes("phiên bản") || lower.includes("version")) {
      return 3;
    }
    if (lower.includes("chất liệu") || lower.includes("material")) {
      return 4;
    }
    return 10;
  };

  return [...keys].sort((a, b) => getOrder(a) - getOrder(b));
};
