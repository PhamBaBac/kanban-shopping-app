/** @format */

import React from "react";
import Head from "next/head";
import { Typography } from "antd";
import { useSelector } from "react-redux";
import { themeSelector } from "@/redux/reducers/themeSlice";

const { Title, Paragraph } = Typography;

const NotFound: React.FC & { noLayout?: boolean; isErrorPage?: boolean } = () => {
  const { mode } = useSelector(themeSelector);
  const isDark = mode === "dark";

  return (
    <>
      <Head>
        <title>404 - Không tìm thấy trang | Kanban Shopping</title>
        <meta
          name="description"
          content="Trang bạn đang tìm kiếm không tồn tại hoặc đã đổi tên."
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
          404
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
          404 - Không tìm thấy trang
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
          Trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc đường dẫn không chính xác.
        </Paragraph>
      </div>
    </>
  );
};

NotFound.noLayout = true;
NotFound.isErrorPage = true;

export default NotFound;
