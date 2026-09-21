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
      <Title>Quên mật khẩu?</Title>
      <Paragraph type="secondary">
        Nhập email của bạn và chúng tôi sẽ gửi mã xác thực để đặt lại mật khẩu.
      </Paragraph>
      <Form
        onFinish={handleSendCode}
        layout="vertical"
        size="large"
        disabled={isLoading}
      >
        <Form.Item
          name="email"
          label="Địa chỉ email"
          rules={[
            { required: true, message: "Vui lòng nhập địa chỉ email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input allowClear autoFocus />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Gửi mã xác thực
          </Button>
        </Form.Item>
      </Form>
    </>
  );

  const renderVerifyCodeStep = () => (
    <>
      <Title>Kiểm tra email của bạn</Title>
      <Paragraph type="secondary">
        Chúng tôi đã gửi mã xác thực 6 chữ số tới {email}. Vui lòng nhập mã bên dưới.
      </Paragraph>
      <Form
        onFinish={handleVerifyCode}
        layout="vertical"
        size="large"
        disabled={isLoading}
      >
        <Form.Item label="Mã xác thực">
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
            Xác thực mã
          </Button>
        </Form.Item>
      </Form>
    </>
  );

  const renderResetPasswordStep = () => (
    <>
      <Title>Đặt lại mật khẩu mới</Title>
      <Paragraph type="secondary">
        Email của bạn đã được xác minh. Vui lòng thiết lập mật khẩu mới.
      </Paragraph>
      <Form
        onFinish={handleResetPassword}
        layout="vertical"
        size="large"
        disabled={isLoading}
      >
        <Form.Item
          name="password"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới" },
            { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Hai mật khẩu không trùng khớp!")
                );
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Đặt lại mật khẩu
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
              <Link href="/auth/login">Quay lại đăng nhập</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
