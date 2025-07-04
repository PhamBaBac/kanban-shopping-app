import { Button, Form, Input, message, Typography } from "antd";
import Link from "next/link";
import { useRef, useState } from "react";
import handleAPI from "@/apis/handleApi";
import { useRouter } from "next/router";

const { Title, Paragraph } = Typography;

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<
    "enter-email" | "verify-code" | "reset-password"
  >("enter-email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const router = useRouter();

  const handleSendCode = async (values: { email: string }) => {
    setIsLoading(true);
    try {
      await handleAPI("/auth/send-code-email", { email: values.email }, "post");
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

  const handleVerifyCode = async () => {
    const code = otpCode.join("");
    if (code.length !== 6) {
      message.error("The OTP code must consist of 6 digits.");
      return;
    }
    setIsLoading(true);
    try {
      await handleAPI("/auth/verify-code-email", { email, code }, "post");
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

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleResetPassword = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      message.error("Passwords do not match!");
      return;
    }
    setIsLoading(true);
    try {
      await handleAPI("/users/reset-password",
        { email, newPassword: values.password },
        "put"
      );
      console.log("Password reset for:", email);
      message.success("Your password has been reset successfully!");
      router.push("/auth/login");
    } catch (error) {
      message.error("An error occurred while resetting the password.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderEnterEmailStep = () => (
    <>
      <Title>Forgot Your Password?</Title>
      <Paragraph type="secondary">
        Enter your email and we'll send a code to verify your account.
      </Paragraph>
      <Form
        onFinish={handleSendCode}
        layout="vertical"
        size="large"
        disabled={isLoading}
      >
        <Form.Item
          name="email"
          label="Email address"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input allowClear autoFocus />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Send Verification Code
          </Button>
        </Form.Item>
      </Form>
    </>
  );

  const renderVerifyCodeStep = () => (
    <>
      <Title>Check Your Email</Title>
      <Paragraph type="secondary">
        We've sent a 6-digit code to {email}. Please enter it below.
      </Paragraph>
      <Form
        onFinish={handleVerifyCode}
        layout="vertical"
        size="large"
        disabled={isLoading}
      >
        <Form.Item label="Verification Code">
          <div className="d-flex justify-content-between mb-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Input
                key={i}
                maxLength={1}
                value={otpCode[i]}
                ref={(el) => {
                  if (el) inputRefs.current[i] = el.input!;
                }}
                onChange={(e) => handleOtpChange(e.target.value, i)}
                autoFocus={i === 0}
                style={{
                  width: 45,
                  height: 55,
                  fontSize: 24,
                  textAlign: "center",
                }}
              />
            ))}
          </div>
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            disabled={otpCode.join("").length !== 6}
            block
          >
            Verify Code
          </Button>
        </Form.Item>
      </Form>
    </>
  );

  const renderResetPasswordStep = () => (
    <>
      <Title>Set New Password</Title>
      <Paragraph type="secondary">
        Your email has been verified. Please set your new password.
      </Paragraph>
      <Form
        onFinish={handleResetPassword}
        layout="vertical"
        size="large"
        disabled={isLoading}
      >
        <Form.Item
          name="password"
          label="New Password"
          rules={[
            { required: true, message: "Please enter your new password" },
            { min: 6, message: "Password must be at least 6 characters" },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Confirm New Password"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm your new password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("The two passwords do not match!")
                );
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Reset Password
          </Button>
        </Form.Item>
      </Form>
    </>
  );

  const renderStep = () => {
    switch (step) {
      case "verify-code":
        return renderVerifyCodeStep();
      case "reset-password":
        return renderResetPasswordStep();
      case "enter-email":
      default:
        return renderEnterEmailStep();
    }
  };

  return (
    <div className="container-fluid" style={{ height: "100vh" }}>
      <div className="row h-100">
        <div
          className="d-none d-md-block col-md-6 p-0"
          style={{
            backgroundImage: `url(/images/bg-auth-2.png)`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
        <div className="col-sm-12 col-md-6 d-flex align-items-center">
          <div className="col-sm-12 col-md-10 col-lg-8 offset-lg-2">
            {renderStep()}
            <div className="text-center mt-3">
              <Link href="/auth/login">Back to Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
