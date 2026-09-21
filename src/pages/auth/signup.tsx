/** @format */

import { Button, Checkbox, Form, Input, Typography } from "antd";
import { useRef } from "react";
import { BsArrowLeft } from "react-icons/bs";
import { useSignup } from "@/hooks";

interface SignUp {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "USER";
}

const SignUp = () => {
  const [form] = Form.useForm();
  const refs = useRef<Array<any>>([]);

  const {
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
  } = useSignup();
  const handleSignUp = async (values: SignUp) => {
    await signup(values);
    form.resetFields();
  };

  const handleChangeNumsCode = (val: string, index: number) => {
    changeNumsCode(val, index);
    if (val && index < 5) refs.current[index + 1]?.focus();
    if (!val && index > 0) refs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    await verify();
  };

  const handleResendCode = async () => {
    await resendCode();
  };

  return (
    <div className="container-fluid" style={{ height: "100vh" }}>
      <div className="row" style={{ height: "100vh" }}>
        <div
          className="d-none d-md-block col-6 p-0"
          style={{
            backgroundImage: `url(/images/bg-auth-${
              signValues ? "2" : "1"
            }.png)`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="mt-5 ml-5">
            <img src="/images/logo.png" alt="Logo" />
          </div>
        </div>
        <div className="col-sm-12 col-md-6 d-flex align-items-center">
          <div className="col-12 col-md-12 col-lg-8 offset-lg-2">
            {signValues ? (
              <>
                <Button
                  onClick={() => setSignValues(undefined)}
                  type="text"
                  icon={<BsArrowLeft size={20} className="text-muted" />}
                >
                  <Typography.Text>Quay lại</Typography.Text>
                </Button>

                <div className="mt-4">
                  <Typography.Title level={2}>Nhập mã OTP</Typography.Title>
                  <Typography.Paragraph type="secondary">
                    Chúng tôi đã gửi mã xác thực tới email:{" "}
                    <b>{signValues.email}</b>
                  </Typography.Paragraph>
                </div>

                <div className="mt-4 d-flex justify-content-between">
                  {[0, 1, 2, 3, 4, 5].map((_, index) => (
                    <Input
                      key={index}
                      maxLength={1}
                      value={numsOfCode[index] || ""}
                      size="large"
                      style={{
                        fontSize: 32,
                        fontWeight: "bold",
                        width: "calc((100% - 90px) / 6)",
                        textAlign: "center",
                      }}
                      onChange={(e) =>
                        handleChangeNumsCode(e.target.value, index)
                      }
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
                  >
                    Xác thực
                  </Button>
                  <div className="mt-2 text-center">
                    {times <= 0 ? (
                      <Button type="link" onClick={handleResendCode}>
                        Gửi lại mã
                      </Button>
                    ) : (
                      <Typography.Text type="secondary">
                        Gửi lại mã sau: {times}s
                      </Typography.Text>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Typography.Title>Tạo tài khoản mới</Typography.Title>
                <Typography.Paragraph type="secondary">
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
