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
  signup: (values: SignUpData) => Promise<void>;
  verify: () => Promise<void>;
  resendCode: () => Promise<void>;
  changeNumsCode: (val: string, index: number) => void;
  setIsAgree: (agree: boolean) => void;
  setSignValues: (values: any) => void;
}

export const useSignup = (): UseSignupReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAgree, setIsAgree] = useState(true);
  const [signValues, setSignValues] = useState<any>();
  const [numsOfCode, setNumsOfCode] = useState<string[]>([]);
  const [times, setTimes] = useState(160);

  const router = useRouter();
  const { signup: authSignup, verifyEmailCode, sendVerificationCode } = useAuth();

  useEffect(() => {
    const time = setInterval(() => {
      setTimes((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(time);
  }, []);

  const signup = async (values: SignUpData) => {
    if (!isAgree) {
      message.error("Bạn phải đồng ý với Điều khoản và Điều kiện sử dụng!");
      return;
    }

    setIsLoading(true);
    try {
      await authSignup(values);
      setSignValues({ email: values.email });
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
    if (numsOfCode.length === 6 && numsOfCode.every((c) => c)) {
      const code = numsOfCode.join("");
      try {
        await verifyEmailCode(signValues.email, code);
        router.push("/");
      } catch (error: any) {
        showErrorMessage(error, "Mã xác thực OTP không đúng hoặc đã hết hạn!");
      }
    } else {
      message.error("Vui lòng nhập đầy đủ 6 chữ số mã OTP!");
    }
  };

  const resendCode = async () => {
    setNumsOfCode([]);
    try {
      await sendVerificationCode(signValues.email);
      setTimes(300);
      message.success("Mã xác thực mới đã được gửi đến email của bạn.");
    } catch (error: any) {
      showErrorMessage(error, "Không thể gửi lại mã xác thực. Vui lòng thử lại sau!");
    }
  };

  return {
    isLoading,
    isAgree,
    signValues,
    numsOfCode,
    times,
    signup,
    verify,
    resendCode,
    changeNumsCode,
    setIsAgree,
    setSignValues,
  };
}; 