import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { message } from "antd";
import { useAuth } from "./useAuth";
import { showErrorMessage } from "@/utils/errorHandler";

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "USER";
}

interface UseSignupReturn {
  isLoading: boolean;
  isAgree: boolean;
  signValues: any;
  numsOfCode: string[];
  times: number;
  expireTime: number;
  resendCooldown: number;
  signup: (values: SignUpData) => Promise<void>;
  verify: () => Promise<void>;
  resendCode: () => Promise<void>;
  changeNumsCode: (val: string, index: number) => void;
  setIsAgree: (agree: boolean) => void;
  setSignValues: (values: any) => void;
  resetOtp: () => void;
}

const OTP_EXPIRY_SECONDS = 300; // 5 phút (khớp TTL Redis backend)
const RESEND_COOLDOWN_SECONDS = 60; // 60 giây (khớp cooldown Redis backend)

export const useSignup = (): UseSignupReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAgree, setIsAgree] = useState(true);
  const [signValues, setSignValues] = useState<any>();
  const [numsOfCode, setNumsOfCode] = useState<string[]>([]);
  const [expireTime, setExpireTime] = useState(OTP_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const router = useRouter();
  const { signup: authSignup, verifyEmailCode, sendVerificationCode } = useAuth();

  useEffect(() => {
    if (!signValues) return;

    const timer = setInterval(() => {
      setExpireTime((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [signValues]);

  const resetOtp = () => {
    setNumsOfCode([]);
    setExpireTime(OTP_EXPIRY_SECONDS);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const signup = async (values: SignUpData) => {
    if (!isAgree) {
      message.error("Bạn phải đồng ý với Điều khoản và Điều kiện sử dụng!");
      return;
    }

    setIsLoading(true);
    try {
      await authSignup(values);
      setSignValues({ email: values.email });
      resetOtp();
      message.success(
        "Mã xác thực OTP đã được gửi đến email. Vui lòng nhập mã OTP để hoàn tất đăng ký."
      );
    } catch (error: any) {
      showErrorMessage(error, "Đăng ký thất bại, vui lòng kiểm tra lại thông tin!");
    } finally {
      setIsLoading(false);
    }
  };

  const changeNumsCode = (val: string, index: number) => {
    const newValues = [...numsOfCode];
    newValues[index] = val;
    setNumsOfCode(newValues);
  };

  const verify = async () => {
    if (expireTime <= 0) {
      message.error("Mã xác thực OTP đã hết hạn! Vui lòng bấm 'Gửi lại mã' để nhận mã mới.");
      return;
    }

    if (numsOfCode.length === 6 && numsOfCode.every((c) => c)) {
      const code = numsOfCode.join("");
      try {
        await verifyEmailCode(signValues.email, code);
        message.success("Xác thực tài khoản thành công!");
        router.push("/");
      } catch (error: any) {
        showErrorMessage(error, "Mã xác thực OTP không đúng hoặc đã hết hạn!");
      }
    } else {
      message.error("Vui lòng nhập đầy đủ 6 chữ số mã OTP!");
    }
  };

  const resendCode = async () => {
    if (resendCooldown > 0) {
      message.warning(`Vui lòng đợi ${resendCooldown} giây trước khi yêu cầu mã mới!`);
      return;
    }

    setIsLoading(true);
    try {
      await sendVerificationCode(signValues.email);
      resetOtp();
      message.success("Mã xác thực mới đã được gửi đến email của bạn.");
    } catch (error: any) {
      showErrorMessage(error, "Không thể gửi lại mã xác thực. Vui lòng thử lại sau!");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isAgree,
    signValues,
    numsOfCode,
    times: resendCooldown,
    expireTime,
    resendCooldown,
    signup,
    verify,
    resendCode,
    changeNumsCode,
    setIsAgree,
    setSignValues,
    resetOtp,
  };
}; 