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
  recordUserActivity: async (data: UserActivity): Promise<any> => {
    const res = await handleAPI("/users/userActivity", data, "post");
    return res.data;
  },

  getCurrentUser: async (): Promise<any> => {
    const res = await handleAPI("/users/me");
    return res.data;
  },

  updateUser: async (data: any): Promise<any> => {
    const res = await handleAPI("/users/update", data, "put");
    return res.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<any> => {
    const res = await handleAPI("/customers/update", data, "put");
    return res.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmationPassword?: string;
  }): Promise<any> => {
    const payload = {
      ...data,
      confirmationPassword: data.confirmationPassword || data.newPassword,
    };
    const res: any = await handleAPI("/users/changePassword", payload, "patch");
    return res;
  },

  toggleTwoFactorAuth: async (enabled: boolean): Promise<any> => {
    const res = await handleAPI(
      `/users/two-factor-auth?enabled=${enabled}`,
      {},
      "patch"
    );
    return res.data;
  },

  verifyTwoFactorAuth: async (code: string): Promise<any> => {
    const res = await handleAPI("/users/verify-2fa", { code }, "post");
    return res.data;
  },

  getSecretImageUri: async (): Promise<any> => {
    const res = await handleAPI("/users/secretImageUri");
    return res.data;
  },

  enable2FA: async (email: string, code: string): Promise<any> => {
    const res = await handleAPI("/auth/enable-tfa", { email, code }, "post");
    return res.data;
  },

  uploadAvatar: async (file: File): Promise<any> => {
    const res = await handleAPI("/users/upload-avatar", { file }, "post");
    return res.data;
  },
};
