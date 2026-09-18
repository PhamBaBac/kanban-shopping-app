import { useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { message } from "antd";
import { useAuth } from "./useAuth";
import { showErrorMessage } from "@/utils/errorHandler";

interface UseLoginReturn {
  isLoading: boolean;
  isMfaEnabled: boolean;
  emailMfa: string;
  isEmailVerificationMode: boolean;
  emailVerificationCode: string;
  otpCode: string[];
  login: (values: { email: string; password: string }) => Promise<void>;
  verifyMFA: (code: string) => Promise<void>;
  sendEmailCode: () => Promise<void>;
  handleVerifyEmailCode: (code: string) => Promise<void>;
  setOtpCode: (code: string[]) => void;
  setEmailVerificationCode: (code: string) => void;
  setIsEmailVerificationMode: (mode: boolean) => void;
  resetMFA: () => void;
}

export const useLogin = (): UseLoginReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [emailMfa, setEmailMfa] = useState("");
  const [isEmailVerificationMode, setIsEmailVerificationMode] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));

  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    login: authLogin,
    verifyMFA: authVerifyMFA,
    sendVerificationCode,
    verifyEmailCode,
  } = useAuth();

  const id = searchParams.get("productId");
  const slug = searchParams.get("slug");

  const login = async (values: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const result = await authLogin(values);

      if (result && typeof result === "object" && "mfaEnabled" in result) {
        setIsMfaEnabled(true);
        setEmailMfa(values.email);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMFA = async (code: string) => {
    if (code.length !== 6) {
      message.error("Mã OTP phải bao gồm đúng 6 chữ số!");
      return;
    }

    setIsLoading(true);
    try {
      await authVerifyMFA(emailMfa, code);
      message.success("Xác thực thành công!");
      router.push(id && slug ? `/products/${slug}/${id}` : "/");
    } catch (error) {
      showErrorMessage(error, "Mã xác thực OTP không chính xác!");
      router.push("/auth/login");
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailCode = async () => {
    setIsLoading(true);
    try {
      await sendVerificationCode(emailMfa);
      message.success(`Mã xác thực đã được gửi đến ${emailMfa}`);
      setIsEmailVerificationMode(true);
    } catch (error) {
      showErrorMessage(error, "Không thể gửi email xác thực. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailCode = async (code: string) => {
    if (code.length !== 6) {
      message.error("Mã xác thực phải bao gồm đúng 6 chữ số!");
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmailCode(emailMfa, code);
      message.success("Xác thực thành công!");
      router.push(id && slug ? `/products/${slug}/${id}` : "/");
    } catch (error) {
      showErrorMessage(error, "Mã xác thực OTP không hợp lệ!");
    } finally {
      setIsLoading(false);
    }
  };

  const resetMFA = () => {
    setIsMfaEnabled(false);
    setEmailMfa("");
    setIsEmailVerificationMode(false);
    setEmailVerificationCode("");
    setOtpCode(Array(6).fill(""));
  };

  return {
    isLoading,
    isMfaEnabled,
    emailMfa,
    isEmailVerificationMode,
    emailVerificationCode,
    otpCode,
    login,
    verifyMFA,
    sendEmailCode,
    handleVerifyEmailCode,
    setOtpCode,
    setEmailVerificationCode,
    setIsEmailVerificationMode,
    resetMFA,
  };
};
