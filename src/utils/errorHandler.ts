/** @format */

import { message } from "antd";

/**
 * Bản đồ mã lỗi hệ thống sang tiếng Việt chuẩn
 */
export const ERROR_CODE_MAP: Record<number, string> = {
  // 1xxx - Hệ thống
  1001: "Khóa hoặc trường dữ liệu không hợp lệ.",
  1002: "Dữ liệu đầu vào không hợp lệ.",
  1003: "Đã xảy ra lỗi không xác định.",
  1999: "Lỗi hệ thống chưa được phân loại. Vui lòng thử lại sau.",

  // 2xxx - Tài khoản & Xác thực
  2001: "Không tìm thấy thông tin tài khoản.",
  2002: "Tài khoản hoặc email này đã tồn tại trên hệ thống.",
  2003: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
  2004: "Tên người dùng không đủ độ dài quy định.",
  2005: "Ngày sinh không hợp lệ.",
  2006: "Độ tuổi không đáp ứng yêu cầu tối thiểu.",
  2007: "Tài khoản hoặc mật khẩu không chính xác.",
  2008: "Phiên đăng nhập đã hết hạn hoặc chưa được xác thực.",
  2009: "Bạn không có quyền thực hiện thao tác này.",
  2010: "Xác thực hai yếu tố (2FA) chưa được kích hoạt.",
  2011: "Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại!",
  2012: "Mật khẩu mới và xác nhận mật khẩu không khớp!",
  2013: "Mã xác thực OTP không hợp lệ hoặc đã hết hạn!",
  2014: "Định dạng email không hợp lệ.",
  2015: "Tên vượt quá số ký tự cho phép.",
  2016: "Tên chỉ được chứa các chữ cái và khoảng trắng.",
  2017: "Họ vượt quá số ký tự cho phép.",
  2018: "Bạn đã nhập sai mã OTP quá số lần quy định. Vui lòng yêu cầu mã mới.",
  2019: "Vui lòng đợi 60 giây trước khi yêu cầu gửi lại mã xác thực.",
  2020: "Mã xác thực không hợp lệ hoặc đã hết hạn.",
  2021: "Tài khoản này được đăng nhập bằng mạng xã hội (Google/GitHub). Vui lòng sử dụng nút Đăng nhập mạng xã hội.",
  2022: "Tài khoản mạng xã hội không có mật khẩu nội bộ. Vui lòng quản lý bảo mật trên tài khoản mạng xã hội của bạn.",

  // 3xxx - Sản phẩm & Danh mục
  3001: "Không tìm thấy sản phẩm yêu cầu.",
  3002: "Không tìm thấy biến thể sản phẩm.",
  3003: "Không tìm thấy danh mục sản phẩm.",
  3004: "Không tìm thấy thông tin nhà cung cấp.",
  3005: "Đường dẫn sản phẩm không hợp lệ.",

  // 4xxx - Khuyến mãi
  4001: "Mã khuyến mãi không tồn tại.",
  4002: "Mã khuyến mãi này đã được sử dụng.",
  4003: "Mã khuyến mãi đã hết lượt sử dụng.",
  4004: "Mã khuyến mãi đã hết hạn sử dụng.",
  4005: "Loại khuyến mãi không hợp lệ.",
  4006: "Giá trị khuyến mãi không hợp lệ.",

  // 5xxx - Đơn hàng & Giỏ hàng
  5001: "Không tìm thấy giỏ hàng của bạn.",
  5002: "Số lượng sản phẩm trong kho không đủ đáp ứng.",
  5003: "Không tìm thấy thông tin hóa đơn.",
  5004: "Không thể hủy đơn hàng ở trạng thái hiện tại.",
  5005: "Trạng thái đơn hàng không hợp lệ.",

  // 6xxx - Đánh giá & Tin nhắn
  6001: "Nội dung tin nhắn quá dài. Vui lòng rút gọn lại.",
  6002: "Không tìm thấy lịch sử cuộc trò chuyện.",
  6003: "Bạn chỉ có thể đánh giá sau khi đơn hàng đã hoàn thành.",
  6004: "Bạn đã gửi đánh giá cho đơn hàng này rồi.",
  6005: "Đánh giá bị từ chối do vi phạm quy tắc cộng đồng.",

  // 7xxx - Địa chỉ
  7001: "Không tìm thấy thông tin địa chỉ.",
};

/**
 * Từ điển chuyển đổi các cụm từ tiếng Anh sang tiếng Việt thân thiện
 */
export const ENGLISH_TO_VIETNAMESE_MAP: Record<string, string> = {
  // Xác thực & Tài khoản
  "wrong password": "Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại!",
  "passwords do not match": "Mật khẩu mới và xác nhận mật khẩu không khớp!",
  "user not found": "Không tìm thấy thông tin tài khoản!",
  "user already exists": "Tài khoản hoặc email này đã tồn tại trên hệ thống!",
  "invalid credentials": "Tài khoản hoặc mật khẩu không chính xác!",
  "unauthenticated": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!",
  "you do not have permission": "Bạn không có quyền thực hiện thao tác này!",
  "invalid verification code": "Mã xác thực OTP không đúng hoặc đã hết hạn!",
  "the verification code is incorrect.": "Mã xác thực OTP không chính xác!",
  "the otp code must consist of 6 digits.": "Mã OTP phải bao gồm đúng 6 chữ số!",
  "the verification code must be 6 digits.": "Mã OTP phải có độ dài 6 chữ số!",
  "please enter all 6 digits": "Vui lòng nhập đầy đủ 6 chữ số mã OTP!",
  "failed to send verification email. please try again.": "Không thể gửi email xác thực. Vui lòng thử lại sau ít phút!",
  "failed to send verification code": "Gửi mã xác thực thất bại. Vui lòng thử lại sau!",
  "email verification failed": "Xác thực email thất bại!",
  "password reset failed": "Đặt lại mật khẩu thất bại!",
  "oauth login failed": "Đăng nhập bằng mạng xã hội thất bại!",
  "login failed, please check your email/password.": "Đăng nhập thất bại, vui lòng kiểm tra email và mật khẩu!",
  "mfa verification failed": "Xác thực hai yếu tố (2FA) thất bại!",
  "tfa is not enabled": "Xác thực hai yếu tố chưa được kích hoạt.",

  // Giỏ hàng & Sản phẩm
  "please choose a product!": "Vui lòng chọn sản phẩm!",
  "this item is out of stock.": "Sản phẩm này hiện tại đã hết hàng!",
  "product not found.": "Không tìm thấy sản phẩm!",
  "product not found": "Không tìm thấy sản phẩm!",
  "add to cart failed!": "Thêm vào giỏ hàng thất bại. Vui lòng thử lại!",
  "could not check code. please try again.": "Không thể kiểm tra mã khuyến mãi. Vui lòng thử lại!",
  "promotion code has already been used.": "Mã khuyến mãi này đã được sử dụng!",
  "promotion is out of stock.": "Mã khuyến mãi đã hết lượt sử dụng!",
  "promotion has expired.": "Mã khuyến mãi đã hết hạn sử dụng!",

  // Địa chỉ & Dịch vụ
  "failed to create address": "Không thể thêm địa chỉ mới. Vui lòng thử lại!",
  "failed to update address": "Không thể cập nhật địa chỉ. Vui lòng thử lại!",
  "failed to delete address": "Không thể xóa địa chỉ. Vui lòng thử lại!",
  "failed to set default address": "Không thể đặt làm địa chỉ mặc định!",
  "failed to clear chat history": "Không thể xóa lịch sử cuộc trò chuyện!",

  // Lỗi mạng & HTTP
  "network error": "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối Internet!",
  "request failed with status code 401": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!",
  "request failed with status code 403": "Bạn không có quyền truy cập vào tài nguyên này!",
  "request failed with status code 404": "Không tìm thấy dữ liệu yêu cầu!",
  "request failed with status code 500": "Hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút!",
};

/**
 * Hàm trích xuất và chuyển đổi mọi định dạng lỗi sang tiếng Việt chuẩn
 */
export function getErrorMessage(
  error: any,
  fallbackMessage = "Đã có lỗi xảy ra. Vui lòng thử lại sau!"
): string {
  if (!error) return fallbackMessage;

  // 1. Kiểm tra mã code chuẩn (Backend ApiResponse: { code: 2011, message: ... })
  const code = error?.code || error?.response?.data?.code;
  if (typeof code === "number" && ERROR_CODE_MAP[code]) {
    return ERROR_CODE_MAP[code];
  }

  // 2. Lấy chuỗi thông báo thô
  let rawMsg = "";
  if (typeof error === "string") {
    rawMsg = error;
  } else if (error?.response?.data?.message) {
    rawMsg = error.response.data.message;
  } else if (error?.message) {
    rawMsg = error.message;
  } else if (error?.error) {
    rawMsg = error.error;
  }

  if (!rawMsg) return fallbackMessage;

  const normalized = rawMsg.trim().toLowerCase();

  // 3. Đối chiếu trong từ điển tiếng Anh sang tiếng Việt
  if (ENGLISH_TO_VIETNAMESE_MAP[normalized]) {
    return ENGLISH_TO_VIETNAMESE_MAP[normalized];
  }

  // Đối chiếu từng phần
  for (const [key, vnText] of Object.entries(ENGLISH_TO_VIETNAMESE_MAP)) {
    if (normalized.includes(key)) {
      return vnText;
    }
  }

  // 4. Nếu chuỗi đã chứa tiếng Việt (có dấu) hoặc là thông điệp hợp lệ từ Backend
  const hasVietnameseAccent = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(rawMsg);
  if (hasVietnameseAccent) {
    return rawMsg;
  }

  // 5. Trả về fallback
  return fallbackMessage;
}

/**
 * Hiển thị toast lỗi tiếng Việt tập trung
 */
export function showErrorMessage(error: any, fallbackMessage?: string): void {
  const msg = getErrorMessage(error, fallbackMessage);
  message.error(msg);
}

export default {
  getErrorMessage,
  showErrorMessage,
  ERROR_CODE_MAP,
  ENGLISH_TO_VIETNAMESE_MAP,
};
