import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { addAuth } from "@/redux/reducers/authReducer";
import handleAPI from "@/apis/handleApi";
import { message, Spin, Typography, Button } from "antd";
import { getOrCreateSessionId } from "@/utils/session";

const { Title, Paragraph } = Typography;

const OAuthCallbackPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false); // ✅ chặn gọi 2 lần

  useEffect(() => {
    const { accessToken } = router.query;

    // Nếu chưa có token hoặc đã fetch rồi thì return
    if (!accessToken || hasFetchedRef.current) return;

    hasFetchedRef.current = true; // ✅ đánh dấu đã gọi

    const fetchUser = async () => {
      const sessionId = getOrCreateSessionId();
      try {
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

        if (res.result.mfaEnabled) {
          // Có MFA thì xử lý riêng
          message.info("Please verify with MFA");
          // setMfaEnabled(...) nếu có xử lý MFA
          return;
        }

        // Đồng bộ cart (nếu cần)
        await handleAPI(
          `/redisCarts/syncToDatabase?userId=${res.result.id}`,
          undefined,
          "put",
          {
            "X-Session-Id": sessionId,
          }
        );

        dispatch(addAuth(user));
        localStorage.setItem("authData", JSON.stringify(user));
        localStorage.removeItem("sessionId");


        setTimeout(() => {
          router.replace("/");
        }, 300); // ✅ Delay để UX mượt
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError("Login failed! Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router.query]);

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
