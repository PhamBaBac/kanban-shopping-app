/** @format */

import handleAPI from "@/apis/handleApi";
import { addAuth } from "@/redux/reducers/authReducer";
import { Button, Checkbox, Form, Input, message, Typography } from "antd";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { BsArrowLeft } from "react-icons/bs";
import { useDispatch } from "react-redux";

interface SignUp {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "USER";
}

const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAgree, setIsAgree] = useState(true);
  const [signValues, setSignValues] = useState<any>();
  const [numsOfCode, setNumsOfCode] = useState<string[]>([]);
  const [times, setTimes] = useState(160);

  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const router = useRouter();

  const refs = useRef<Array<any>>([]);

  useEffect(() => {
    const time = setInterval(() => {
      setTimes((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(time);
  }, []);
  const handleSignUp = async (values: SignUp) => {
    if (!isAgree) {
      message.error("You must agree to Terms and Conditions");
      return;
    }

    const api: any = `/auth/register`;
    setIsLoading(true);
    const submitData = {
      ...values,
      role: "USER",
    };
    try {
      const res: any = await handleAPI(api, submitData, "post");
      if (res) {
        setSignValues({ email: submitData.email });
        form.resetFields();
        message.success("Verification code sent to your email.");
      }
    } catch (error: any) {
      message.error(error?.message || "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeNumsCode = (val: string, index: number) => {
    const newValues = [...numsOfCode];
    newValues[index] = val;
    setNumsOfCode(newValues);

    if (val && index < 5) refs.current[index + 1]?.focus();
    if (!val && index > 0) refs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    if (numsOfCode.length === 6 && numsOfCode.every((c) => c)) {
      const code = numsOfCode.join("");
      try {
        const res: any = await handleAPI(
          "/auth/verify-code-email",
          {
            email: signValues.email,
            code,
          },
          "post"
        );

        dispatch(addAuth({ ...res.result, email: signValues.email }));
        localStorage.setItem(
          "authData",
          JSON.stringify({ ...res.result, email: signValues.email })
        );
        router.push("/");
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          "Invalid verification code. Please try again.";
        message.error(errorMessage);
      }
    } else {
      message.error("Please enter all 6 digits");
    }
  };

  const handleResendCode = async () => {
    setNumsOfCode([]);
    try {
      await handleAPI(
        "/auth/send-code-email",
        { email: form.getFieldValue("email") },
        "post"
      );
      setTimes(300);
      message.success("New verification code sent");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to resend code";
      message.error(errorMessage);
    }
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
                  <Typography.Text>Back</Typography.Text>
                </Button>

                <div className="mt-4">
                  <Typography.Title level={2}>Enter OTP</Typography.Title>
                  <Typography.Paragraph type="secondary">
                    We have sent a code to your registered email:
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
                    Verify
                  </Button>
                  <div className="mt-2 text-center">
                    {times <= 0 ? (
                      <Button type="link" onClick={handleResendCode}>
                        Resend
                      </Button>
                    ) : (
                      <Typography.Text type="secondary">
                        Resend a new code in: {times}s
                      </Typography.Text>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Typography.Title>Create new account</Typography.Title>
                <Typography.Paragraph type="secondary">
                  Please enter your details
                </Typography.Paragraph>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSignUp}
                  size="large"
                  disabled={isLoading}
                >
                  <Form.Item name="firstName" label="First Name">
                    <Input allowClear />
                  </Form.Item>
                  <Form.Item name="lastName" label="Last Name">
                    <Input allowClear />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Please enter your email!" },
                    ]}
                  >
                    <Input type="email" allowClear />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your password!",
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
                    I agree to Terms and Conditions
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
                    Sign Up
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
