/** @format */

import { Button, Divider, Form, Input, Typography, Space } from "antd";
import Link from "next/link";
import { useRef, useState } from "react";
import SocialLogin from "./components/SocialLogin";
import { BsArrowLeft } from "react-icons/bs";
import { useLogin } from "@/hooks";
import { TurnstileWidget } from "@/components";
import HeadComponent from "@/components/HeadComponent";

const { Title, Paragraph } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [showCaptcha, setShowCaptcha] = useState<boolean>(false);

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
    try {
      await login({
        ...values,
        captchaToken: captchaToken || undefined,
      });
    } catch (error: any) {
      // Bật Captcha nếu nhập sai mật khẩu hoặc server yêu cầu
      setShowCaptcha(true);
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

  const handleVerifyCode = async () => {
    const code = otpCode.join("");
    await verifyMFA(code);
  };

  const handleSendEmailCode = async () => {
    await sendEmailCode();
  };

  const onVerifyEmailCode = async () => {
    await handleVerifyEmailCode(emailVerificationCode);
  };

  return (
    <>
      <HeadComponent
        title="Đăng Nhập Tài Khoản | Kanban Fashion"
        noindex={true}
      />
      <div className="container-fluid p-0" style={{ minHeight: "100vh" }}>
      <div className="row g-0" style={{ minHeight: "100vh" }}>
        <div
          className="d-none d-md-block col-md-6 p-0"
          style={{
            backgroundImage: `url(/images/bg-auth-3.png)`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <div style={{ padding: "40px 0 0 40px" }}>
            <Link href="/">
              <img src="/images/logo.png" alt="Logo" style={{ cursor: "pointer", width: 110 }} />
            </Link>
          </div>
        </div>

        <div className="col-12 col-md-6 d-flex align-items-center justify-content-center py-4 py-md-5 px-3 px-sm-4">
          <div style={{ width: "100%", maxWidth: 440 }}>
            {/* Mobile Logo */}
            <div className="d-block d-md-none text-center mb-4">
              <Link href="/">
                <img src="/images/logo.png" alt="Logo" style={{ cursor: "pointer", width: 100 }} />
              </Link>
            </div>

            {!isMfaEnabled ? (
              <>
                <div className="mb-3">
                  <Link href="/" style={{ textDecoration: "none" }}>
                    <Button
                      type="text"
                      icon={<BsArrowLeft size={18} />}
                      style={{ paddingLeft: 0, display: "inline-flex", alignItems: "center" }}
                    >
                      Quay về trang chủ
                    </Button>
                  </Link>
                </div>
                <Title level={2} style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "clamp(1.4rem, 4vw, 1.9rem)", marginBottom: 4 }}>
                  Chào mừng trở lại
                </Title>
                <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                  Vui lòng đăng nhập vào tài khoản của bạn
                </Paragraph>

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
                    label="Địa chỉ email"
                    rules={[
                      { required: true, message: "Vui lòng nhập địa chỉ email" },
                      { type: "email", message: "Email không hợp lệ" },
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
                    label="Mật khẩu"
                    rules={[
                      { required: true, message: "Vui lòng nhập mật khẩu" },
                      {
                        min: 6,
                        message: "Mật khẩu tối thiểu 6 ký tự",
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
                    <Link href="/auth/forgot-password">Quên mật khẩu?</Link>
                  </div>

                  {showCaptcha && (
                    <div className="my-3 text-center">
                      <Typography.Text type="danger" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                        Vui lòng hoàn thành xác thực bảo mật bên dưới:
                      </Typography.Text>
                      <TurnstileWidget
                        onVerify={(token) => setCaptchaToken(token)}
                        onExpire={() => setCaptchaToken("")}
                      />
                    </div>
                  )}

                  <div className="mb-4"></div>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    block
                    size="large"
                  >
                    {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
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
                    Chưa có tài khoản? Đăng ký ngay
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
                  Quay lại nhập OTP
                </Button>
                <Title level={3}>Kiểm tra email của bạn</Title>
                <Paragraph>
                  Chúng tôi đã gửi mã xác thực 6 chữ số đến địa chỉ email:{" "}
                  {emailMfa}.
                </Paragraph>
                <Form
                  onFinish={onVerifyEmailCode}
                  layout="vertical"
                  size="large"
                >
                  <Form.Item label="Mã xác thực">
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
                    Xác thực
                  </Button>
                </Form>
              </>
            ) : (
              <>
                <Button type="link" onClick={resetMFA} icon={<BsArrowLeft />}>
                  Quay lại
                </Button>

                <Title level={3}>Nhập mã OTP</Title>
                <Paragraph>
                  Vui lòng mở ứng dụng Authenticator để lấy mã xác thực 6 chữ số
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
                  {isLoading ? "Đang xác thực..." : "Xác thực"}
                </Button>
                <Divider />
                <div className="text-center">
                  <Button
                    type="link"
                    onClick={handleSendEmailCode}
                    loading={isLoading}
                  >
                    Không thể dùng Authenticator? Xác thực qua Email
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;
