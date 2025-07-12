/** @format */

import { Button, Divider, Form, Input, Typography, Space } from "antd";
import Link from "next/link";
import { useRef } from "react";
import SocialLogin from "./components/SocialLogin";
import { BsArrowLeft } from "react-icons/bs";
import { useLogin } from "@/hooks";

const { Title, Paragraph } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const {
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
  } = useLogin();

  const handleLogin = async (values: { email: string; password: string }) => {
    await login(values);
  };

  const handleOtpChange = (val: string, index: number) => {
    const newOtp = [...otpCode];
    newOtp[index] = val;
    setOtpCode(newOtp);

    // Focus next input
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const code = otpCode.join("");
    await verifyMFA(code);
  };

  const handleSendEmailCode = async () => {
    await sendEmailCode();
  };

  // Đổi tên hàm nội bộ để tránh conflict
  const onVerifyEmailCode = async () => {
    await handleVerifyEmailCode(emailVerificationCode);
  };

  return (
    <div className="container-fluid" style={{ height: "100vh" }}>
      <div className="row h-100">
        <div
          className="d-none d-md-block col-md-6 p-0"
          style={{
            backgroundImage: `url(/images/bg-auth-3.png)`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="mt-5 ml-5">
            <img src="/images/logo.png" alt="Logo" />
          </div>
        </div>

        <div className="col-sm-12 col-md-6 d-flex align-items-center">
          <div className="col-sm-12 col-md-10 col-lg-8 offset-lg-2">
            {!isMfaEnabled ? (
              <>
                <Title>Welcome</Title>
                <Paragraph type="secondary">Please login here</Paragraph>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleLogin}
                  size="large"
                  disabled={isLoading}
                  autoComplete="off"
                >
                  <Form.Item
                    name="email"
                    label="Email address"
                    rules={[
                      { required: true, message: "Please enter your email" },
                      { type: "email", message: "Please enter a valid email" },
                    ]}
                  >
                    <Input
                      allowClear
                      autoFocus
                      onPressEnter={() =>
                        form.validateFields(["password"]).then(() => {
                          const passwordInput = document.querySelector(
                            'input[type="password"]'
                          ) as HTMLInputElement;
                          passwordInput?.focus();
                        })
                      }
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      { required: true, message: "Please enter your password" },
                      {
                        min: 6,
                        message: "Password must be at least 6 characters",
                      },
                    ]}
                  >
                    <Input.Password
                      allowClear
                      onPressEnter={() => {
                        form.validateFields().then(() => {
                          handleLogin(form.getFieldsValue());
                        });
                      }}
                    />
                  </Form.Item>

                  <div className="text-right">
                    <Link href="/auth/forgot-password">Forgot Password?</Link>
                  </div>
                  <div className="mb-4"></div>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    block
                    size="large"
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </Form>

                <div className="mt-4">
                  <div className="mb-4">
                    <SocialLogin provider="google" />
                  </div>
                  <SocialLogin provider="github" />
                </div>
                <Divider />
                <div className="text-center">
                  <Link href="/auth/signup">
                    Don't have an account? Sign Up
                  </Link>
                </div>
              </>
            ) : isEmailVerificationMode ? (
              <>
                <Button
                  type="link"
                  onClick={() => setIsEmailVerificationMode(false)}
                  icon={<BsArrowLeft />}
                >
                  Back to OTP
                </Button>
                <Title level={3}>Check your email</Title>
                <Paragraph>
                  We've sent a 6-digit verification code to your email address:{" "}
                  {emailMfa}.
                </Paragraph>
                <Form
                  onFinish={onVerifyEmailCode}
                  layout="vertical"
                  size="large"
                >
                  <Form.Item label="Verification Code">
                    <Input
                      value={emailVerificationCode}
                      onChange={(e) => setEmailVerificationCode(e.target.value)}
                      maxLength={6}
                      autoFocus
                    />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    block
                    size="large"
                  >
                    Verify
                  </Button>
                </Form>
              </>
            ) : (
              <>
                <Button type="link" onClick={resetMFA} icon={<BsArrowLeft />}>
                  Back
                </Button>

                <Title level={3}>Enter OTP</Title>
                <Paragraph>
                  Please open your Authentication app to retrieve the 6-digit
                  verification code
                </Paragraph>

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
                      onPressEnter={() => {
                        if (otpCode.join("").length === 6) {
                          handleVerifyCode();
                        }
                      }}
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

                <Button
                  type="primary"
                  loading={isLoading}
                  onClick={handleVerifyCode}
                  disabled={otpCode.join("").length !== 6}
                  block
                  size="large"
                >
                  {isLoading ? "Verifying..." : "Verify"}
                </Button>
                <Divider />
                <div className="text-center">
                  <Button
                    type="link"
                    onClick={handleSendEmailCode}
                    loading={isLoading}
                  >
                    Can't use your authenticator? Verify by Email
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
