/** @format */

import React from 'react';
import HeadComponent from "@/components/HeadComponent";

const StoryPage = () => {
  return (
    <>
      <HeadComponent title="Về chúng tôi" />
      <div className="container py-5 text-center" style={{ minHeight: "60vh" }}>
        <h2 style={{ fontFamily: "var(--font-heading, sans-serif)", fontWeight: 700 }}>Câu chuyện thương hiệu</h2>
        <p className="text-muted mt-3">Chúng tôi mang đến những sản phẩm thời trang chất lượng cao với phong cách hiện đại và tối giản.</p>
      </div>
    </>
  );
};

export default StoryPage;
