import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { message } from "antd";
import { useAuth } from "./useAuth";

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
      message.error("You must agree to Terms and Conditions");
      return;
    }

    setIsLoading(true);
    try {
      await authSignup(values);
      setSignValues({ email: values.email });
      message.success("Verification code sent to your email.");
    } catch (error: any) {
      error.message
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
        const errorMessage =
          error?.message ||
          "Invalid verification code. Please try again.";
        message.error(errorMessage);
      }
    } else {
      message.error("Please enter all 6 digits");
    }
  };

  const resendCode = async () => {
    setNumsOfCode([]);
    try {
      await sendVerificationCode(signValues.email);
      setTimes(300);
      message.success("New verification code sent");
    } catch (error: any) {
      const errorMessage =
        error?.message || "Failed to resend code";
      message.error(errorMessage);
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