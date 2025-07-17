import handleAPI from "@/apis/handleApi";
import { uploadFile } from "@/utils/uploadFile";

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface UserActivity {
  userId: string;
  productId: string;
  activityType?: string;
  timestamp?: string;
}

export const userService = {
  // Ghi lại hoạt động của user
  recordUserActivity: async (data: UserActivity): Promise<any> => {
    const res = await handleAPI("/users/userActivity", data, "post");
    return res.data;
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async (): Promise<any> => {
    const res = await handleAPI("/users/me");
    return res.data;
  },

  // Cập nhật thông tin user
  updateUser: async (data: any): Promise<any> => {
    const res = await handleAPI("/users/update", data, "put");
    return res.data;
  },

  // Cập nhật profile
  updateProfile: async (data: UpdateProfileData): Promise<any> => {
    const res = await handleAPI("/customers/update", data, "put");
    return res.data;
  },

  // Thay đổi mật khẩu
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<any> => {
    const res = await handleAPI("/users/changePassword", data, "patch");
    return res.data;
  },

  // Bật/tắt 2FA
  toggleTwoFactorAuth: async (enabled: boolean): Promise<any> => {
    const res = await handleAPI(
      `/users/two-factor-auth?enabled=${enabled}`,
      {},
      "patch"
    );
    return res.data;
  },

  // Xác thực 2FA
  verifyTwoFactorAuth: async (code: string): Promise<any> => {
    const res = await handleAPI("/users/verify-2fa", { code }, "post");
    return res.data;
  },

  // Lấy secret image cho 2FA
  getSecretImageUri: async (): Promise<any> => {
    const res = await handleAPI("/users/secretImageUri");
    return res.data;
  },

  // Enable 2FA
  enable2FA: async (email: string, code: string): Promise<any> => {
    const res = await handleAPI("/auth/enable-tfa", { email, code }, "post");
    return res.data;
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<any> => {
    const res = await handleAPI("/users/upload-avatar", { file }, "post");
    return res.data;
  },
};
