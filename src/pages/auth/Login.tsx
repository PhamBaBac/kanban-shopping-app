/** @format */

import handleAPI from "@/apis/handleApi";
import { addAuth } from "@/redux/reducers/authReducer";
import { getOrCreateSessionId } from "@/utils/session";
import { Button, Divider, Form, Input, message, Typography } from "antd";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useState } from "react";
import { useDispatch } from "react-redux";

const { Title, Paragraph } = Typography;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();

  const [form] = Form.useForm();

  const searchParams = useSearchParams();

  const id = searchParams.get("productId");
  console.log("id", id);

  const slug = searchParams.get("slug");
  console.log("id", slug);
  const handleLogin = async (values: { email: string; password: string }) => {
    const api = `/auth/authenticate`;
    setIsLoading(true);

    try {
      const sessionId = getOrCreateSessionId();

      const res: any = await handleAPI(api, values, "post", {
        "X-Session-Id": sessionId,
      });
      

      dispatch(addAuth(res.result));
      localStorage.setItem("authData", JSON.stringify(res.result));
      localStorage.removeItem("sessionId");
      router.push(id && slug ? `/products/${slug}/${id}` : "/");
    } catch (error) {
      console.log(error);
      message.error(
        "Đăng nhập thất bại, vui lòng kiểm tra lại email/password và thử lại"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid" style={{ height: "100vh" }}>
      <div className="row" style={{ height: "100vh" }}>
        <div
          className="d-none d-md-block col-6 p-0"
          style={{
            backgroundImage: `url(/images/bg-auth-3.png)`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="mt-5 ml-5" style={{ backgroundColor: "transparent" }}>
            <img
              src="/images/logo.png"
              alt=""
              style={{ backgroundColor: "transparent" }}
            />
          </div>
        </div>
        <div className="col-sm-12 col-md-6">
          <div
            className="container d-flex"
            style={{ height: "100%", alignItems: "center" }}
          >
            <div className="col-sm-12 col-md-12 col-lg-8 offset-lg-2">
              <Title className="m-0">Welcome</Title>
              <Paragraph type="secondary">Please login here</Paragraph>

              <div className="mt-4">
                <Form
                  disabled={isLoading}
                  layout="vertical"
                  onFinish={handleLogin}
                  size="large"
                  form={form}
                >
                  <Form.Item
                    name={"email"}
                    label="Email address"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your email",
                      },
                    ]}
                  >
                    <Input placeholder="Email" allowClear />
                  </Form.Item>
                  <Form.Item
                    name={"password"}
                    label="Password"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your password",
                      },
                    ]}
                  >
                    <Input.Password placeholder="Password!!!" />
                  </Form.Item>
                </Form>

                <div className="mt-3 text-right">
                  <Link href={"/auth/forgot-password"}>Forgot Password</Link>
                </div>

                <div className="mt-3">
                  <Button
                    type="primary"
                    loading={isLoading}
                    size="large"
                    style={{ width: "100%" }}
                    onClick={() => form.submit()}
                  >
                    Login
                  </Button>
                </div>
                <Divider />
                <div className="mt-3 text-center">
                  <Link href={`/auth/signup`}>Sign Up</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
