import { useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { message } from "antd";
import { useAuth } from "./useAuth";

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

      // If MFA is enabled, set the state
      if (result && typeof result === "object" && "mfaEnabled" in result) {
        setIsMfaEnabled(true);
        setEmailMfa(values.email);
      }
      // If login is successful and no MFA, redirect will be handled in useAuth
    } catch (error) {
      // Errors are already handled in useAuth
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMFA = async (code: string) => {
    if (code.length !== 6) {
      message.error("The OTP code must consist of 6 digits.");
      return;
    }

    setIsLoading(true);
    try {
      await authVerifyMFA(emailMfa, code);
      message.success("Verification successful!");
      router.push(id && slug ? `/products/${slug}/${id}` : "/");
    } catch (error) {
      message.error("The verification code is incorrect.");
      router.push("/auth/login");
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailCode = async () => {
    setIsLoading(true);
    try {
      await sendVerificationCode(emailMfa);
      message.success(`A verification code has been sent to ${emailMfa}`);
      setIsEmailVerificationMode(true);
    } catch (error) {
      message.error("Failed to send verification email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailCode = async (code: string) => {
    if (code.length !== 6) {
      message.error("The verification code must be 6 digits.");
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmailCode(emailMfa, code);
      message.success("Verification successful!");
      router.push(id && slug ? `/products/${slug}/${id}` : "/");
    } catch (error) {
      message.error("Invalid verification code.");
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
