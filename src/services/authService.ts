import handleAPI from "@/apis/handleApi";
import { getOrCreateSessionId } from "@/utils/session";

export interface AuthUser {
  accessToken: string;
  userId: string;
  mfaEnabled: boolean;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const authService = {
  // Đăng nhập
  login: async (credentials: LoginCredentials): Promise<any> => {
    const sessionId = getOrCreateSessionId();
    const res = await handleAPI("/auth/authenticate", credentials, "post", {
      "X-Session-Id": sessionId,
    });
    return res.data;
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async (): Promise<any> => {
    const res = await handleAPI("/users/me");
    return res.data;
  },

  // Đăng ký
  signup: async (data: SignupData): Promise<any> => {
    const res = await handleAPI("/auth/register", data, "post");
    return res.data;
  },

  // Gửi mã xác thực email
  sendVerificationCode: async (email: string): Promise<any> => {
    const res = await handleAPI("/auth/send-code-email", { email }, "post");
    return res.data;
  },

  // Xác thực mã email
  verifyEmailCode: async (email: string, code: string): Promise<any> => {
    const res = await handleAPI(
      "/auth/verify-code-email",
      { email, code },
      "post"
    );
    return res.data;
  },

  // Reset password
  resetPassword: async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<any> => {
    const res = await handleAPI(
      "/users/reset-password",
      {
        email,
        code,
        newPassword,
      },
      "put"
    );
    return res.data;
  },

  // Xác thực MFA
  verifyMFA: async (email: string, code: string): Promise<any> => {
    const res = await handleAPI("/auth/enable-tfa", { email, code }, "post");
    return res.data;
  },

  // Xác thực MFA cho OAuth
  verifyMFAAuth: async (
    email: string,
    code: string,
    accessToken: string
  ): Promise<any> => {
    const res = await handleAPI("/auth/enable-tfa", { email, code }, "post", {
      Authorization: `Bearer ${accessToken}`,
    });
    return res.data;
  },

  // OAuth callback - lấy user info
  getOAuthUser: async (accessToken: string): Promise<any> => {
    const res = await handleAPI("/users/me", undefined, "get", {
      Authorization: `Bearer ${accessToken}`,
    });
    return res.data;
  },

  // Sync Redis cart to database
  syncRedisCart: async (userId: string): Promise<any> => {
    const sessionId = getOrCreateSessionId();
    const res = await handleAPI(
      `/redisCarts/syncToDatabase?userId=${userId}`,
      undefined,
      "put",
      {
        "X-Session-Id": sessionId,
      }
    );
    return res.data;
  },

  // Disable 2FA
  disable2FA: async (email: string): Promise<any> => {
    const res = await handleAPI(`/users/disable-tfa?email=${email}`, {}, "put");
    return res.data;
  },
};
