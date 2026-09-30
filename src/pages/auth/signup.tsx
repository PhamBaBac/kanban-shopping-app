/** @format */

import { Button, Checkbox, Divider, Form, Input, Typography } from "antd";
import Link from "next/link";
import { useRef } from "react";
import { BsArrowLeft, BsClockHistory, BsArrowRepeat } from "react-icons/bs";
import { useSignup } from "@/hooks";

interface SignUp {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "USER";
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
};

const SignUp = () => {
  const [form] = Form.useForm();
  const refs = useRef<Array<any>>([]);

  const {
    isLoading,
    isAgree,
    signValues,
    numsOfCode,
    expireTime,
    resendCooldown,
    signup,
    verify,
    resendCode,
    changeNumsCode,
    setIsAgree,
    setSignValues,
  } = useSignup();
  const handleSignUp = async (values: SignUp) => {
    await signup({
      ...values,
      firstName: values.firstName?.trim(),
      lastName: values.lastName?.trim(),
      email: values.email?.trim(),
    });
    form.resetFields();
  };

  const handleChangeNumsCode = (val: string, index: number) => {
    changeNumsCode(val, index);
    if (val && index < 5) refs.current[index + 1]?.focus();
    if (!val && index > 0) refs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      e.preventDefault();
      pasted.split("").forEach((d, i) => changeNumsCode(d, i));
      refs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleVerify = async () => {
    await verify();
  };

  const handleResendCode = async () => {
    await resendCode();
  };

  return (
    <div className="container-fluid p-0" style={{ minHeight: "100vh" }}>
      <div className="row g-0" style={{ minHeight: "100vh" }}>
        <div
          className="d-none d-md-block col-md-6 p-0"
          style={{
            backgroundImage: `url(/images/bg-auth-${
              signValues ? "2" : "1"
            }.png)`,
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
            {signValues ? (
              <>
                <Button
                  onClick={() => setSignValues(undefined)}
                  type="text"
                  icon={<BsArrowLeft size={20} className="text-muted" />}
                  style={{ paddingLeft: 0 }}
                >
                  <Typography.Text>Quay lại</Typography.Text>
                </Button>

                <div className="mt-4">
                  <Typography.Title level={2}>Nhập mã OTP</Typography.Title>
                  <Typography.Paragraph type="secondary" className="mb-2">
                    Chúng tôi đã gửi mã xác thực tới email:{" "}
                    <b>{signValues.email}</b>
                  </Typography.Paragraph>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 14px",
                      borderRadius: 20,
                      backgroundColor: expireTime <= 60 ? "#fff2f0" : "#f0f5ff",
                      border: `1px solid ${expireTime <= 60 ? "#ffccc7" : "#d6e4ff"}`,
                      color: expireTime <= 60 ? "#cf1322" : "#1d39c4",
                      fontSize: 13,
                      fontWeight: 500,
                      marginTop: 4,
                    }}
                  >
                    <BsClockHistory size={15} />
                    {expireTime > 0 ? (
                      <span>
                        Mã có hiệu lực trong:{" "}
                        <strong
                          style={{
                            fontFamily: "monospace",
                            fontSize: 15,
                            letterSpacing: "0.5px",
                          }}
                        >
                          {formatTime(expireTime)}
                        </strong>
                      </span>
                    ) : (
                      <span style={{ fontWeight: 600 }}>
                        Mã xác thực đã hết hạn! Vui lòng bấm &quot;Gửi lại mã&quot;.
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 d-flex justify-content-between" style={{ gap: 6 }}>
                  {[0, 1, 2, 3, 4, 5].map((_, index) => (
                    <Input
                      key={index}
                      maxLength={1}
                      value={numsOfCode[index] || ""}
                      size="large"
                      style={{
                        fontSize: "clamp(18px, 5vw, 26px)",
                        fontWeight: "bold",
                        width: "clamp(36px, 12vw, 52px)",
                        height: "clamp(46px, 14vw, 56px)",
                        textAlign: "center",
                        padding: 0,
                      }}
                      onChange={(e) =>
                        handleChangeNumsCode(e.target.value, index)
                      }
                      onPaste={handlePaste}
                      ref={(el) => {
                        refs.current[index] = el;
                      }}
                    />
                  ))}
                </div>

                <div className="mt-4">
                  <Button
                    loading={isLoading}
                    type="primary"
                    size="large"
                    style={{ width: "100%" }}
                    onClick={handleVerify}
                    disabled={expireTime <= 0}
                  >
                    Xác thực
                  </Button>
                  <div className="mt-3 text-center">
                    {resendCooldown <= 0 ? (
                      <Button
                        type="link"
                        onClick={handleResendCode}
                        icon={<BsArrowRepeat size={16} />}
                        style={{ fontWeight: 500 }}
                      >
                        Gửi lại mã
                      </Button>
                    ) : (
                      <Typography.Text type="secondary">
                        Gửi lại mã sau: <b>{resendCooldown}s</b>
                      </Typography.Text>
                    )}
                  </div>
                </div>
              </>
            ) : (
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
                <Typography.Title level={2} style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "clamp(1.4rem, 4vw, 1.9rem)", marginBottom: 4 }}>
                  Tạo tài khoản mới
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
                  Vui lòng nhập thông tin của bạn
                </Typography.Paragraph>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSignUp}
                  size="large"
                  disabled={isLoading}
                >
                  <Form.Item
                    name="firstName"
                    label="Họ và tên đệm"
                    rules={[
                      { required: true, message: "Vui lòng nhập họ và tên đệm!" },
                    ]}
                  >
                    <Input allowClear />
                  </Form.Item>
                  <Form.Item
                    name="lastName"
                    label="Tên"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên của bạn!" },
                    ]}
                  >
                    <Input allowClear />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Vui lòng nhập email!" },
                      { type: "email", message: "Email không hợp lệ!" },
                    ]}
                  >
                    <Input type="email" allowClear />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập mật khẩu!",
                      },
                      {
                        min: 6,
                        message: "Mật khẩu tối thiểu 6 ký tự!",
                      },
                    ]}
                  >
                    <Input.Password allowClear />
                  </Form.Item>
                </Form>

                <div className="mt-3">
                  <Checkbox
                    checked={isAgree}
                    onChange={(e) => setIsAgree(e.target.checked)}
                  >
                    Tôi đồng ý với Điều khoản và Điều kiện
                  </Checkbox>
                </div>

                <div className="mt-4">
                  <Button
                    loading={isLoading}
                    type="primary"
                    size="large"
                    style={{ width: "100%" }}
                    onClick={() => form.submit()}
                  >
                    Đăng ký
                  </Button>
                </div>

                <Divider />
                <div className="text-center">
                  <Typography.Text type="secondary">
                    Đã có tài khoản?{" "}
                  </Typography.Text>
                  <Link href="/auth/login" style={{ fontWeight: 500 }}>
                    Đăng nhập ngay
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
