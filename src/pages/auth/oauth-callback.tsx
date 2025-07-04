import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { addAuth } from "@/redux/reducers/authReducer";
import handleAPI from "@/apis/handleApi";
import { message, Spin, Typography, Button, Form, Input } from "antd";
import { BsArrowLeft } from "react-icons/bs";
import { getOrCreateSessionId } from "@/utils/session";

const { Title, Paragraph } = Typography;

const OAuthCallbackPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [emailMfa, setEmailMfa] = useState("");
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));
  const [isEmailVerificationMode, setIsEmailVerificationMode] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [userData, setUserData] = useState<any>(null);

  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    const { accessToken } = router.query;

    if (!accessToken) {
      setError("Authentication token not found");
      setIsLoading(false);
      return;
    }

    const fetchUser = async () => {
      const sessionId = getOrCreateSessionId();
      try {
        setIsLoading(true);
        const res: any = await handleAPI("/users/me", undefined, "get", {
          Authorization: `Bearer ${accessToken}`,
        });
      
        const user = {
          accessToken,
          userId: res.result.id,
          mfaEnabled: res.result.mfaEnabled,
          email: res.result.email,
          firstName: res.result.firstname,
          lastName: res.result.lastname,
          avatar: res.result.avatarUrl,
        };
       
        // Nếu MFA được bật, hiển thị màn hình xác thực TFA
        if (res.result.mfaEnabled) {
          setIsMfaEnabled(true);
          setEmailMfa(res.result.email);
          setUserData(user);
          setIsLoading(false);
          return;
        }

        // Nếu không có MFA, đăng nhập trực tiếp
        dispatch(addAuth(user));
          await handleAPI(
            `/redisCarts/syncToDatabase?userId=${res.result.id}`,
            undefined,
            "put",
            {
              "X-Session-Id": sessionId,
            }
          );
        localStorage.setItem("authData", JSON.stringify(user));
        localStorage.removeItem("sessionId");

        router.replace("/");
      } catch (error) {
        console.error("OAuth callback error:", error);
        setError("Login failed! Please try again.");
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router.query, dispatch, router]);

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
      message.error("The OTP code must consist of 6 digits.");
      return;
    }

    setIsLoading(true);
    try {
      const res: any = await handleAPI(
        "/auth/verify",
        { email: emailMfa, code },
        "post"
      );

      const finalUser = {
        ...userData,
        ...res.result,
      };

      dispatch(addAuth(finalUser));
      localStorage.setItem("authData", JSON.stringify(finalUser));
      message.success("Verification successful!");
      router.push("/");
    } catch (error) {
      message.error("The verification code is incorrect.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailCode = async () => {
    console.log("Sending code to email:", emailMfa);

    if (!emailMfa) {
      message.error(
        "Could not find an email to send the verification code to."
      );
      return;
    }

    setIsLoading(true);
    try {
      await handleAPI("/auth/send-code-email", { email: emailMfa }, "post");
      message.success(`A verification code has been sent to ${emailMfa}`);
      setIsEmailVerificationMode(true);
    } catch (error) {
      message.error("Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    if (emailVerificationCode.length !== 6) {
      message.error("The verification code must be 6 digits.");
      return;
    }
    setIsLoading(true);
    try {
      const res: any = await handleAPI(
        "/auth/verify-code-email",
        {
          email: emailMfa,
          code: emailVerificationCode,
        },
        "post"
      );

      const finalUser = {
        ...userData,
        ...res.result,
      };

      dispatch(addAuth(finalUser));
      localStorage.setItem("authData", JSON.stringify(finalUser));
      message.success("Verification successful!");
      router.push("/");
    } catch (error) {
      message.error("Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    router.push("/auth/login");
  };

  // Màn hình xác thực TFA
  if (isMfaEnabled) {
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
              {isEmailVerificationMode ? (
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
                    We've sent a 6-digit verification code to your email
                    address: {emailMfa}.
                  </Paragraph>
                  <Form
                    onFinish={handleVerifyEmailCode}
                    layout="vertical"
                    size="large"
                  >
                    <Form.Item label="Verification Code">
                      <Input
                        value={emailVerificationCode}
                        onChange={(e) =>
                          setEmailVerificationCode(e.target.value)
                        }
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
                  <Button
                    type="link"
                    onClick={() => {
                      setIsMfaEnabled(false);
                      setOtpCode(Array(6).fill(""));
                    }}
                    icon={<BsArrowLeft />}
                  >
                    Back
                  </Button>

                  <Title level={3}>Enter OTP</Title>
                  <Paragraph>
                    Please open your Authentication app to retrieve the 6-digit
                    verification code
                  </Paragraph>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 16,
                      gap: 8,
                    }}
                  >
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

                  <div style={{ marginTop: 16, textAlign: "center" }}>
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
  }

  if (error) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          backgroundColor: "#f9f9f9",
        }}
      >
        <Title level={4} style={{ color: "#ff4d4f" }}>
          Authentication Error
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          {error}
        </Paragraph>
        <Button type="primary" onClick={handleRetry}>
          Back to Login Page
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        backgroundColor: "#f9f9f9",
      }}
    >
      <Spin size="large" />
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <Title level={4}>Processing login...</Title>
        <Paragraph type="secondary">
          Please wait a moment, we are verifying your information from
          Google/GitHub.
        </Paragraph>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
