/** @format */

import React from "react";
import Head from "next/head";
import { Typography } from "antd";
import { useSelector } from "react-redux";
import { themeSelector } from "@/redux/reducers/themeSlice";

const { Title, Paragraph } = Typography;

const ServerError: React.FC & { noLayout?: boolean; isErrorPage?: boolean } = () => {
  const { mode } = useSelector(themeSelector);
  const isDark = mode === "dark";

  return (
    <>
      <Head>
        <title>500 - Máy chủ đang gặp sự cố | Kanban Shopping</title>
        <meta
          name="description"
          content="Máy chủ đang gặp sự cố gián đoạn. Đội ngũ kỹ thuật đang tiến hành xử lý."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          backgroundColor: isDark ? "#0e0e12" : "#f9fafb",
          color: isDark ? "#ffffff" : "#111827",
          textAlign: "center",
          userSelect: "none",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontSize: "clamp(5.5rem, 15vw, 9rem)",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            marginBottom: 8,
            color: isDark ? "#23232e" : "#e2e8f0",
          }}
        >
          500
        </div>

        <Title
          level={1}
          style={{
            fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
            fontWeight: 700,
            margin: "0 0 12px 0",
            color: isDark ? "#f3f4f6" : "#1f2937",
            letterSpacing: "-0.02em",
          }}
        >
          500 - Máy chủ đang gặp sự cố
        </Title>

        <Paragraph
          style={{
            fontSize: "1rem",
            color: isDark ? "#9ca3af" : "#6b7280",
            maxWidth: 460,
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Hệ thống tạm thời không thể xử lý yêu cầu do sự cố máy chủ hoặc đang bảo trì. Vui lòng quay lại sau ít phút.
        </Paragraph>
      </div>
    </>
  );
};

(ServerError as any).noLayout = true;
(ServerError as any).isErrorPage = true;

export default ServerError;
