import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { addAuth } from "@/redux/reducers/authReducer";
import handleAPI from "@/apis/handleApi";
import { message, Spin, Typography, Button } from "antd";

const { Title, Paragraph } = Typography;

const OAuthCallbackPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { accessToken } = router.query;

    if (!accessToken) {
      setError("Không tìm thấy token xác thực");
      setIsLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const res: any = await handleAPI("/auth/me", undefined, "get", {
          Authorization: `Bearer ${accessToken}`,
        });

        const user = {
          accessToken,
          userId: res.result.id,
          mfaEnabled: res.result.mfaEnabled,
          email: res.result.email,
        };

        dispatch(addAuth(user));
        localStorage.setItem("authData", JSON.stringify(user));
        localStorage.removeItem("sessionId");

        message.success("Đăng nhập thành công!");
        router.replace("/");
      } catch (error) {
        console.error("OAuth callback error:", error);
        setError("Đăng nhập thất bại! Vui lòng thử lại.");
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router.query, dispatch, router]);

  const handleRetry = () => {
    router.push("/auth/login");
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
          Lỗi xác thực
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          {error}
        </Paragraph>
        <Button type="primary" onClick={handleRetry}>
          Quay lại trang đăng nhập
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
        <Title level={4}>Đang xử lý đăng nhập...</Title>
        <Paragraph type="secondary">
          Vui lòng đợi trong giây lát, chúng tôi đang xác thực thông tin từ
          Google/GitHub.
        </Paragraph>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
