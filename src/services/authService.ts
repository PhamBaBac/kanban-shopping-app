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
  role: string;
  provider?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  captchaToken?: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  captchaToken?: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<any> => {
    const sessionId = getOrCreateSessionId();
    const res = await handleAPI("/auth/authenticate", credentials, "post", {
      "X-Session-Id": sessionId,
    });
    return res.data;
  },

  getCurrentUser: async (): Promise<any> => {
    const res = await handleAPI("/users/me");
    return res.data;
  },

  signup: async (data: SignupData): Promise<any> => {
    const payload = {
      ...data,
      role: data.role || "USER",
    };
    const res = await handleAPI("/auth/register", payload, "post");
    return res.data;
  },

  sendVerificationCode: async (email: string, captchaToken?: string): Promise<any> => {
    const res = await handleAPI("/auth/send-code-email", { email, captchaToken }, "post");
    return res.data;
  },

  verifyEmailCode: async (email: string, code: string): Promise<any> => {
    const res = await handleAPI(
      "/auth/verify-code-email",
      { email, code },
      "post"
    );
    return res.data;
  },

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

  verifyMFA: async (email: string, code: string): Promise<any> => {
    const res = await handleAPI("/auth/enable-tfa", { email, code }, "post");
    return res.data;
  },

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

  getOAuthUser: async (accessToken: string): Promise<any> => {
    const res = await handleAPI("/users/me", undefined, "get", {
      Authorization: `Bearer ${accessToken}`,
    });
    return res.data;
  },

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

  disable2FA: async (email: string): Promise<any> => {
    const res = await handleAPI(`/users/disable-tfa?email=${email}`, {}, "put");
    return res.data;
  },

  exchangeOAuthToken: async (code: string): Promise<any> => {
    const sessionId = getOrCreateSessionId();
    const res = await handleAPI("/auth/exchange-token", { code }, "post", {
      "X-Session-Id": sessionId,
    });
    return res.data;
  },
};
