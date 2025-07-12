import { Button, Form, Input, Typography } from "antd";
import Link from "next/link";
import { useRef } from "react";
import { useForgotPassword } from "@/hooks";

const { Title, Paragraph } = Typography;

const ForgotPassword = () => {
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const {
    isLoading,
    step,
    email,
    otpCode,
    sendCode,
    verifyCode,
    resetPassword,
    handleOtpChange,
  } = useForgotPassword();

  const handleSendCode = async (values: { email: string }) => {
    await sendCode(values);
  };

  const handleVerifyCode = async () => {
    await verifyCode();
  };

  const onOtpChange = (val: string, index: number) => {
    handleOtpChange(val, index);
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleResetPassword = async (values: any) => {
    await resetPassword(values);
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
                onChange={(e) => onOtpChange(e.target.value, i)}
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
