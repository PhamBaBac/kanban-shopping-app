import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { message } from "antd";
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
  const { handleOAuthLogin, verifyMFAAuth } = useAuth();

  useEffect(() => {
    const { accessToken: token } = router.query;

    // Nếu chưa có token hoặc đã fetch rồi thì return
    if (!token || hasFetchedRef.current) return;

    hasFetchedRef.current = true;
    setAccessToken(token as string);

    const processOAuth = async () => {
      try {
        const result = await handleOAuthLogin(token as string);

        // Nếu có MFA, set state để hiển thị UI nhập mã
        if (result && typeof result === "object" && "mfaEnabled" in result) {
          setIsMfaEnabled(true);
          setUserInfo(result.userInfo);
        }
        // Nếu không có MFA, redirect sẽ được xử lý trong handleOAuthLogin
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError("Login failed! Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    processOAuth();
  }, [router.query, handleOAuthLogin]);

  const verifyMFA = async (code: string) => {
    if (code.length !== 6) {
      message.error("The OTP code must consist of 6 digits.");
      return;
    }

    setIsLoading(true);
    try {
      await verifyMFAAuth(userInfo.email, code, accessToken);
      message.success("Verification successful!");
      // Redirect sẽ được xử lý trong verifyMFAAuth
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
