/** @format */

import handleAPI from "@/apis/handleApi";
import { addAuth } from "@/redux/reducers/authReducer";
import { getOrCreateSessionId } from "@/utils/session";
import { Button, Divider, Form, Input, message, Typography, Space } from "antd";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import SocialLogin from "./components/SocialLogin";
import { BsArrowLeft } from "react-icons/bs";

const { Title, Paragraph } = Typography;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [emailMfa, setEmailMfa] = useState("");
  const [form] = Form.useForm();
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));

  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const id = searchParams.get("productId");
  const slug = searchParams.get("slug");

  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    // Chỉ xử lý OAuth callback nếu có accessToken và đang ở trang oauth-callback
    // Không xử lý ở trang login để tránh race condition
  }, [searchParams]);

  const handleLogin = async (values: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const sessionId = getOrCreateSessionId();
      const res: any = await handleAPI("/auth/authenticate", values, "post", {
        "X-Session-Id": sessionId,
      });

      if (res.result.mfaEnabled) {
        setIsMfaEnabled(true);
        setEmailMfa(values.email);
        return;
      }

      dispatch(addAuth({ ...res.result, email: values.email }));
      localStorage.setItem(
        "authData",
        JSON.stringify({ ...res.result, email: values.email })
      );
      localStorage.removeItem("sessionId");
      router.push(id && slug ? `/products/${slug}/${id}` : "/");
    } catch (error) {
      message.error("Đăng nhập thất bại, vui lòng kiểm tra email/password.");
    } finally {
      setIsLoading(false);
    }
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
    if (code.length !== 6) {
      message.error("Mã OTP phải gồm 6 số.");
      return;
    }

    setIsLoading(true);
    try {
      const res: any = await handleAPI(
        "/auth/verify",
        { email: emailMfa, code },
        "post"
      );
      dispatch(addAuth({ ...res.result, email: emailMfa }));
      localStorage.setItem(
        "authData",
        JSON.stringify({ ...res.result, email: emailMfa })
      );
      message.success("Xác thực thành công!");
      router.push("/");
    } catch (error) {
      message.error("Mã xác thực không đúng.");
      router.push("/auth/login");
    } finally {
      setIsLoading(false);
    }
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
                  <SocialLogin provider="google" />
                  <Divider type="vertical" />
                  <SocialLogin provider="github" />
                </div>
                <Divider />
                <div className="text-center">
                  <Link href="/auth/signup">
                    Don't have an account? Sign Up
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Button
                  type="link"
                  onClick={() => setIsMfaEnabled(false)}
                  icon={<BsArrowLeft />}
                >
                  Back
                </Button>

                <Title level={3}>Enter OTP</Title>
                <Paragraph>
                  We've sent a 6-digit verification code to your email.
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
