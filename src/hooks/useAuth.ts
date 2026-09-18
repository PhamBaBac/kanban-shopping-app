import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { message } from "antd";
import { authService, LoginCredentials, SignupData } from "@/services";
import { addAuth } from "@/redux/reducers/authReducer";
import { localDataNames } from "@/constants/appInfos";
import { showErrorMessage } from "@/utils/errorHandler";

interface UseAuthReturn {
  isLoading: boolean;
  isMfaEnabled: boolean;
  login: (
    credentials: LoginCredentials
  ) => Promise<{ mfaEnabled: boolean } | void>;
  signup: (data: SignupData) => Promise<void>;
  verifyMFA: (email: string, code: string) => Promise<void>;
  verifyMFAAuth: (
    email: string,
    code: string,
    accessToken: string
  ) => Promise<void>;
  sendVerificationCode: (email: string) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  resetPassword: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<void>;
  handleOAuthLogin: (
    accessToken: string,
    redirectTo?: string
  ) => Promise<{ mfaEnabled: boolean; userInfo: any } | void>;
}

export const useAuth = (): UseAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);

      if (res.mfaEnabled) {
        setIsMfaEnabled(true);
        return { mfaEnabled: true };
      }

      const userInfo = await authService.getCurrentUser();
      const user = {
        accessToken: res.accessToken,
        userId: userInfo.id,
        mfaEnabled: userInfo.mfaEnabled,
        email: userInfo.email,
        firstName: userInfo.firstname,
        lastName: userInfo.lastname,
        avatar: userInfo.avatarUrl,
        role: userInfo.role,
        provider: userInfo.provider || "LOCAL",
      };

      dispatch(addAuth(user));
      localStorage.setItem(localDataNames.authData, JSON.stringify(user));
      localStorage.removeItem("sessionId");

      const { id, slug } = router.query;
      router.push(id && slug ? `/products/${slug}/${id}` : "/");
    } catch (error: any) {
      showErrorMessage(error, "Đăng nhập thất bại, vui lòng kiểm tra lại thông tin!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData) => {
    setIsLoading(true);
    try {
      await authService.signup(data);
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMFA = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      const res = await authService.verifyMFA(email, code);
      const userInfo = await authService.getCurrentUser();

      const user = {
        accessToken: res.accessToken,
        userId: userInfo.id,
        mfaEnabled: userInfo.mfaEnabled,
        email: userInfo.email,
        firstName: userInfo.firstname,
        lastName: userInfo.lastname,
        avatar: userInfo.avatarUrl,
      };

      dispatch(addAuth(user));
      localStorage.setItem(localDataNames.authData, JSON.stringify(user));
      localStorage.removeItem("sessionId");

      const { id, slug } = router.query;
      router.push(id && slug ? `/products/${slug}/${id}` : "/");
    } catch (error: any) {
      showErrorMessage(error, "Xác thực hai yếu tố (2FA) thất bại!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMFAAuth = async (
    email: string,
    code: string,
    accessToken: string
  ) => {
    setIsLoading(true);
    try {
      await authService.verifyMFAAuth(email, code, accessToken);
      const userInfo = await authService.getOAuthUser(accessToken);

      const user = {
        accessToken,
        userId: userInfo.id,
        mfaEnabled: userInfo.mfaEnabled,
        email: userInfo.email,
        firstName: userInfo.firstname,
        lastName: userInfo.lastname,
        avatar: userInfo.avatarUrl,
        role: userInfo.role,
      };

      dispatch(addAuth(user));
      localStorage.setItem(localDataNames.authData, JSON.stringify(user));
      localStorage.removeItem("sessionId");

      // Sync Redis cart to database
      await authService.syncRedisCart(userInfo.id);

      setTimeout(() => {
        router.replace("/");
      }, 300);
    } catch (error: any) {
      showErrorMessage(error, "Xác thực hai yếu tố (2FA) thất bại!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async (email: string) => {
    setIsLoading(true);
    try {
      await authService.sendVerificationCode(email);
      message.success("Mã xác thực đã được gửi đến email của bạn.");
    } catch (error: any) {
      showErrorMessage(error, "Không thể gửi mã xác thực. Vui lòng thử lại sau!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailCode = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      await authService.verifyEmailCode(email, code);
      message.success("Xác thực email thành công.");
    } catch (error: any) {
      showErrorMessage(error, "Xác thực email thất bại!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (
    email: string,
    code: string,
    newPassword: string
  ) => {
    setIsLoading(true);
    try {
      await authService.resetPassword(email, code, newPassword);
      message.success("Đặt lại mật khẩu thành công!");
      router.push("/auth/login");
    } catch (error: any) {
      showErrorMessage(error, "Đặt lại mật khẩu thất bại!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (accessToken: string, redirectTo?: string) => {
    setIsLoading(true);
    try {
      const userInfo = await authService.getOAuthUser(accessToken);

      if (userInfo.mfaEnabled) {
        message.info("Vui lòng xác thực hai yếu tố (2FA)");
        return { mfaEnabled: true, userInfo };
      }

      // Sync Redis cart to database
      await authService.syncRedisCart(userInfo.id);

      const user = {
        accessToken,
        userId: userInfo.id,
        mfaEnabled: userInfo.mfaEnabled,
        email: userInfo.email,
        firstName: userInfo.firstname,
        lastName: userInfo.lastname,
        avatar: userInfo.avatarUrl,
        role: userInfo.role,
        provider: userInfo.provider || "GOOGLE",
      };

      dispatch(addAuth(user));
      localStorage.setItem(localDataNames.authData, JSON.stringify(user));
      localStorage.removeItem("sessionId");

      setTimeout(() => {
        router.replace(redirectTo || "/");
      }, 300);
      return { mfaEnabled: false, userInfo };
    } catch (error: any) {
      showErrorMessage(error, "Đăng nhập bằng mạng xã hội thất bại!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isMfaEnabled,
    login,
    signup,
    verifyMFA,
    verifyMFAAuth,
    sendVerificationCode,
    verifyEmailCode,
    resetPassword,
    handleOAuthLogin,
  };
};
