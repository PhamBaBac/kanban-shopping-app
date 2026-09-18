import { useState } from "react";
import { useRouter } from "next/router";
import { message } from "antd";
import { useAuth } from "./useAuth";
import { showErrorMessage } from "@/utils/errorHandler";

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
    const normalizedEmail = values.email?.trim() || "";
    try {
      await sendVerificationCode(normalizedEmail);
      message.success(`Mã xác thực đã được gửi đến ${normalizedEmail}.`);
      setEmail(normalizedEmail);
      setStep("verify-code");
    } catch (error: any) {
      showErrorMessage(error, "Không thể gửi mã xác thực. Vui lòng kiểm tra lại email!");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    const code = otpCode.join("");
    if (code.length !== 6) {
      message.error("Mã OTP phải bao gồm đúng 6 chữ số!");
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmailCode(email, code);
      message.success(
        "Xác thực email thành công! Bạn có thể đặt lại mật khẩu mới."
      );
      setStep("reset-password");
    } catch (error) {
      showErrorMessage(error, "Mã xác thực OTP không hợp lệ!");
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
      message.error("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }

    setIsLoading(true);
    try {
      await authResetPassword(email, otpCode.join(""), values.password);
      message.success("Đặt lại mật khẩu thành công!");
      router.push("/auth/login");
    } catch (error) {
      showErrorMessage(error, "Đã có lỗi xảy ra khi đặt lại mật khẩu!");
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
