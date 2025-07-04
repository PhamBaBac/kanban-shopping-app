/** @format */

import React from "react";
import { Button, Result } from "antd";
import { useRouter } from "next/router";

const NotFoundPage = () => {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Result
        status="404"
        title={<span style={{ color: "#fff", fontSize: 80 }}>404</span>}
        subTitle={
          <span style={{ color: "#aaa", fontSize: 20 }}>
            Oops! Không tìm thấy trang bạn yêu cầu.
          </span>
        }
        extra={
          <Button type="primary" onClick={() => router.push("/")}>
            Về trang chủ
          </Button>
        }
        style={{
          background: "#222",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
};

export default NotFoundPage;
