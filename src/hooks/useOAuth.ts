import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { authService } from "@/services";
import { addAuth } from "@/redux/reducers/authReducer";
import { localDataNames } from "@/constants/appInfos";

export const useOAuth = () => {
  const [isOAuthProcessing, setIsOAuthProcessing] = useState(false);
  const [isMfaModalVisible, setIsMfaModalVisible] = useState(false);
  const [mfaData, setMfaData] = useState<{ email: string } | null>(null);
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));
  const hasProcessedRef = useRef(false);
  const hasCleanedUrlRef = useRef(false);

  const router = useRouter();
  const dispatch = useDispatch();

  // 1. Xử lý đổi code thành token xác thực (chỉ chạy 1 lần duy nhất trong background)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");

    if (!code || hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const processCode = async () => {
      setIsOAuthProcessing(true);
      try {
        const authData = await authService.exchangeOAuthToken(code);

        // Trường hợp tài khoản có bật 2FA:
        // Server KHÔNG cấp accessToken hay refreshToken cookie tại bước này
        if (authData.mfaEnabled) {
          setMfaData({ email: authData.email });
          setIsMfaModalVisible(true);
          message.info("Vui lòng nhập mã xác thực OTP 2 bước");
          return;
        }

        const token = authData.accessToken;
        const user = await authService.getOAuthUser(token);
        const userData = {
          accessToken: token,
          userId: user.id,
          mfaEnabled: user.mfaEnabled,
          email: user.email,
          firstName: user.firstname || user.firstName || "",
          lastName: user.lastname || user.lastName || "",
          avatar: user.avatarUrl || user.avatar || user.picture || "",
          role: user.role,
          provider: user.provider || "GOOGLE",
        };

        dispatch(addAuth(userData));
        localStorage.setItem(localDataNames.authData, JSON.stringify(userData));
        localStorage.removeItem("sessionId");

        try {
          await authService.syncRedisCart(user.id);
        } catch (e) {
          // ignore
        }
      } catch (err: any) {
        console.error("OAuth exchange error:", err);
        message.error(err?.message || "Đăng nhập thất bại hoặc liên kết đã hết hạn!");
      } finally {
        setIsOAuthProcessing(false);
      }
    };

    processCode();
  }, [dispatch]);

  // 2. Xóa query ?code=... một lần duy nhất đồng bộ với Next.js router khi router đã sẵn sàng
  useEffect(() => {
    if (!router.isReady || hasCleanedUrlRef.current) return;

    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const hasCode = Boolean(router.query.code || searchParams?.has("code"));

    if (hasCode) {
      hasCleanedUrlRef.current = true;
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.isReady, router.pathname, router.query.code]);

  const handleVerifyMfa = async (codeStr: string) => {
    if (!mfaData || codeStr.length !== 6) {
      message.error("Mã OTP phải bao gồm đúng 6 chữ số!");
      return;
    }

    setIsOAuthProcessing(true);
    try {
      const res = await authService.verifyMFA(mfaData.email, codeStr);
      const token = res.accessToken;
      const user = await authService.getOAuthUser(token);
      const userData = {
        accessToken: token,
        userId: user.id,
        mfaEnabled: true,
        email: user.email,
        firstName: user.firstname || user.firstName || "",
        lastName: user.lastname || user.lastName || "",
        avatar: user.avatarUrl || user.avatar || user.picture || "",
        role: user.role,
        provider: user.provider || "GOOGLE",
      };

      dispatch(addAuth(userData));
      localStorage.setItem(localDataNames.authData, JSON.stringify(userData));
      localStorage.removeItem("sessionId");

      try {
        await authService.syncRedisCart(user.id);
      } catch (e) {
        // ignore
      }

      setIsMfaModalVisible(false);
      setOtpCode(Array(6).fill(""));
      message.success("Xác thực 2 bước thành công!");
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || "Mã xác thực OTP không chính xác!");
    } finally {
      setIsOAuthProcessing(false);
    }
  };

  return {
    isOAuthProcessing,
    isMfaModalVisible,
    setIsMfaModalVisible,
    otpCode,
    setOtpCode,
    handleVerifyMfa,
  };
};
