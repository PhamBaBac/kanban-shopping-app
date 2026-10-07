/** @format */

import React from 'react';
import HeadComponent from "@/components/HeadComponent";
import { appInfo } from "@/constants/appInfos";

const StoryPage = () => {
  return (
    <>
      <HeadComponent
        title="Câu Chuyện Thương Hiệu | Kanban Fashion"
        description="Tìm hiểu hành trình kiến tạo phong cách thời trang hiện đại, tối giản và chất lượng cao cùng thương hiệu Kanban Fashion."
        url={`${appInfo.siteUrl}/story`}
      />
      <div className="container py-5 text-center" style={{ minHeight: "60vh" }}>
        <h2 style={{ fontFamily: "var(--font-heading, sans-serif)", fontWeight: 700 }}>Câu chuyện thương hiệu</h2>
        <p className="text-muted mt-3">Chúng tôi mang đến những sản phẩm thời trang chất lượng cao với phong cách hiện đại và tối giản.</p>
      </div>
    </>
  );
};

export default StoryPage;
