import { useRouter } from "next/router";
import { Spin, Typography, Button, Input, Form } from "antd";
import { useOAuth } from "@/hooks";
import { useRef } from "react";

const { Title, Paragraph } = Typography;

const OAuthCallbackPage = () => {
  const router = useRouter();
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const {
    isLoading,
    error,
    isMfaEnabled,
    userInfo,
    verifyMFA,
    otpCode,
    setOtpCode,
  } = useOAuth();

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
        <Button type="primary" onClick={() => router.push("/auth/login")}>
          Back to Login Page
        </Button>
      </div>
    );
  }

  if (isMfaEnabled) {
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
                marginRight: 8,
              }}
            />
          ))}
        </div>

        <Button
          type="primary"
          loading={isLoading}
          onClick={handleVerifyCode}
          disabled={otpCode.join("").length !== 6}
          size="large"
          style={{ width: 200 }}
        >
          {isLoading ? "Verifying..." : "Verify"}
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
      <Paragraph style={{ marginTop: 12 }}>Logging you in...</Paragraph>
    </div>
  );
};

export default OAuthCallbackPage;
