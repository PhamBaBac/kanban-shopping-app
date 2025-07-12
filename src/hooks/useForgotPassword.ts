import { useState } from "react";
import { useRouter } from "next/router";
import { message } from "antd";
import { useAuth } from "./useAuth";

type Step = "enter-email" | "verify-code" | "reset-password";

interface UseForgotPasswordReturn {
  isLoading: boolean;
  step: Step;
  email: string;
  otpCode: string[];
  sendCode: (values: { email: string }) => Promise<void>;
  verifyCode: () => Promise<void>;
  resetPassword: (values: {
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  handleOtpChange: (val: string, index: number) => void;
}

export const useForgotPassword = (): UseForgotPasswordReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>("enter-email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));

  const router = useRouter();
  const {
    sendVerificationCode,
    verifyEmailCode,
    resetPassword: authResetPassword,
  } = useAuth();

  const sendCode = async (values: { email: string }) => {
    setIsLoading(true);
    try {
      await sendVerificationCode(values.email);
      message.success(`A verification code has been sent to ${values.email}.`);
      setEmail(values.email);
      setStep("verify-code");
    } catch (error) {
      message.error(
        "Failed to send verification code. Please check the email and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    const code = otpCode.join("");
    if (code.length !== 6) {
      message.error("The OTP code must consist of 6 digits.");
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmailCode(email, code);
      message.success(
        "Email verified successfully. You can now reset your password."
      );
      setStep("reset-password");
    } catch (error) {
      message.error("Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    const newOtp = [...otpCode];
    newOtp[index] = val;
    setOtpCode(newOtp);
  };

  const resetPassword = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    if (values.password !== values.confirmPassword) {
      message.error("Passwords do not match!");
      return;
    }

    setIsLoading(true);
    try {
      await authResetPassword(email, otpCode.join(""), values.password);
      message.success("Your password has been reset successfully!");
      router.push("/auth/login");
    } catch (error) {
      message.error("An error occurred while resetting the password.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    step,
    email,
    otpCode,
    sendCode,
    verifyCode,
    resetPassword,
    handleOtpChange,
  };
};
