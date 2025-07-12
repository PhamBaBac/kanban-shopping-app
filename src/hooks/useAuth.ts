import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { message } from "antd";
import { authService, LoginCredentials, SignupData } from "@/services";
import { addAuth } from "@/redux/reducers/authReducer";
import { localDataNames } from "@/constants/appInfos";

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
      };

      dispatch(addAuth(user));
      localStorage.setItem(localDataNames.authData, JSON.stringify(user));
      localStorage.removeItem("sessionId");

      const { id, slug } = router.query;
      router.push(id && slug ? `/products/${slug}/${id}` : "/");
    } catch (error: any) {
      message.error("Login failed, please check your email/password.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData) => {
    setIsLoading(true);
    try {
      await authService.signup(data);
      message.success(
        "Registration successful! Please check your email to verify your account."
      );
    } catch (error: any) {
      message.error(error.message || "Registration failed");
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
      message.error("MFA verification failed");
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
      const res = await authService.verifyMFAAuth(email, code, accessToken);
      const userInfo = await authService.getOAuthUser(accessToken);

      const user = {
        accessToken,
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

      // Sync Redis cart to database
      await authService.syncRedisCart(userInfo.id);

      setTimeout(() => {
        router.replace("/");
      }, 300);
    } catch (error: any) {
      message.error("MFA verification failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async (email: string) => {
    setIsLoading(true);
    try {
      await authService.sendVerificationCode(email);
      message.success("Verification code sent to your email");
    } catch (error: any) {
      message.error(error.message || "Failed to send verification code");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailCode = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      await authService.verifyEmailCode(email, code);
      message.success("Email verified successfully");
    } catch (error: any) {
      message.error(error.message || "Email verification failed");
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
      message.success("Password reset successfully");
      router.push("/auth/login");
    } catch (error: any) {
      message.error(error.message || "Password reset failed");
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
        message.info("Please verify with MFA");
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
      };

      dispatch(addAuth(user));
      localStorage.setItem(localDataNames.authData, JSON.stringify(user));
      localStorage.removeItem("sessionId");

      setTimeout(() => {
        router.replace(redirectTo || "/");
      }, 300);
      return { mfaEnabled: false, userInfo };
    } catch (error: any) {
      message.error("OAuth login failed");
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
