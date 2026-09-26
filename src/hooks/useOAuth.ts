import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { authService } from "@/services";
import { addAuth } from "@/redux/reducers/authReducer";
import { localDataNames } from "@/constants/appInfos";
import { useAuth } from "./useAuth";

export const useOAuth = () => {
  const [isOAuthProcessing, setIsOAuthProcessing] = useState(false);
  const [isMfaModalVisible, setIsMfaModalVisible] = useState(false);
  const [mfaData, setMfaData] = useState<{ email: string; token: string } | null>(null);
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));
  const hasProcessedRef = useRef(false);

  const router = useRouter();
  const dispatch = useDispatch();
  const { verifyMFAAuth } = useAuth();

  const stripCodeFromUrl = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", window.location.pathname);
      }
      if (router.isReady) {
        router.replace(router.pathname, undefined, { shallow: true });
      }
    } catch (e) {
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [router]);

  useEffect(() => {
    if (router.isReady && router.query.code) {
      stripCodeFromUrl();
    }
  }, [router.isReady, router.query.code, stripCodeFromUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code") || (router.query.code as string);

    if (!code || hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    stripCodeFromUrl();

    const processCode = async () => {
      setIsOAuthProcessing(true);
      try {
        const authData = await authService.exchangeOAuthToken(code);
        const token = authData.accessToken;

        if (authData.mfaEnabled) {
          const user = await authService.getOAuthUser(token);
          setMfaData({ email: user.email, token });
          setIsMfaModalVisible(true);
          message.info("Vui lòng nhập mã xác thực OTP 2 bước");
          return;
        }

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

        message.success("Đăng nhập thành công!");
      } catch (err: any) {
        console.error("OAuth exchange error:", err);
        message.error(err?.message || "Đăng nhập thất bại hoặc liên kết đã hết hạn!");
      } finally {
        setIsOAuthProcessing(false);
        stripCodeFromUrl();
      }
    };

    processCode();
  }, [dispatch, router.query.code, stripCodeFromUrl]);

  const handleVerifyMfa = async (codeStr: string) => {
    if (!mfaData || codeStr.length !== 6) {
      message.error("Mã OTP phải bao gồm đúng 6 chữ số!");
      return;
    }

    setIsOAuthProcessing(true);
    try {
      await verifyMFAAuth(mfaData.email, codeStr, mfaData.token);
      const user = await authService.getOAuthUser(mfaData.token);
      const userData = {
        accessToken: mfaData.token,
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

      setIsMfaModalVisible(false);
      message.success("Xác thực và đăng nhập thành công!");
    } catch (error: any) {
      message.error("Mã xác thực OTP không chính xác!");
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
