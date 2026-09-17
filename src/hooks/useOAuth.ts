import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { authService } from "@/services";
import { addAuth } from "@/redux/reducers/authReducer";
import { localDataNames } from "@/constants/appInfos";
import { useAuth } from "./useAuth";

interface UseOAuthReturn {
  isLoading: boolean;
  error: string | null;
  isMfaEnabled: boolean;
  userInfo: any;
  verifyMFA: (code: string) => Promise<void>;
  otpCode: string[];
  setOtpCode: (code: string[]) => void;
}

export const useOAuth = (): UseOAuthReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));
  const [accessToken, setAccessToken] = useState<string>("");
  const hasFetchedRef = useRef(false);

  const router = useRouter();
  const dispatch = useDispatch();
  const { verifyMFAAuth } = useAuth();

  useEffect(() => {
    // BE mới redirect về FE với ?code= (exchange code 1 lần, TTL 60s)
    const { code } = router.query;

    if (!code || hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const processOAuth = async () => {
      try {
        // React StrictMode (Next.js dev) chạy effect 2 lần.
        // Nếu auth đã được lưu từ lần chạy đầu, redirect luôn thay vì gọi API lại
        // (exchange code là one-time use — đã bị xóa khỏi Redis sau lần dùng đầu tiên)
        const existingAuth = localStorage.getItem(localDataNames.authData);
        if (existingAuth) {
          setIsLoading(false);
          router.replace("/");
          return;
        }

        // Đổi exchange code lấy { accessToken, userId, mfaEnabled }
        const authData = await authService.exchangeOAuthToken(code as string);

        const token = authData.accessToken;
        setAccessToken(token);

        if (authData.mfaEnabled) {
          // Lấy userInfo để có email cho verifyMFAAuth
          const user = await authService.getOAuthUser(token);
          setUserInfo(user);
          setIsMfaEnabled(true);
          message.info("Please verify with MFA");
          return;
        }

        // Không có MFA → lấy userInfo và lưu vào redux/localStorage
        const user = await authService.getOAuthUser(token);
        const userData = {
          accessToken: token,
          userId: user.id,
          mfaEnabled: user.mfaEnabled,
          email: user.email,
          firstName: user.firstname,
          lastName: user.lastname,
          avatar: user.avatarUrl,
          role: user.role,
        };

        dispatch(addAuth(userData));
        localStorage.setItem(localDataNames.authData, JSON.stringify(userData));
        localStorage.removeItem("sessionId");

        message.success("Login successful!");
        setTimeout(() => {
          router.replace("/");
        }, 300);
      } catch (err) {
        console.error("OAuth callback error:", err);
        // Fallback: nếu auth đã được lưu (do StrictMode double-invoke)
        const existingAuth = localStorage.getItem(localDataNames.authData);
        if (existingAuth) {
          router.replace("/");
          return;
        }
        setError("Login failed! The link may have expired. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    processOAuth();
  }, [router.query]);

  const verifyMFA = async (code: string) => {
    if (code.length !== 6) {
      message.error("The OTP code must consist of 6 digits.");
      return;
    }

    setIsLoading(true);
    try {
      await verifyMFAAuth(userInfo.email, code, accessToken);
      message.success("Verification successful!");
    } catch (error) {
      message.error("The verification code is incorrect.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    isMfaEnabled,
    userInfo,
    verifyMFA,
    otpCode,
    setOtpCode,
  };
};
