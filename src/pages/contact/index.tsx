import React from 'react';
import HeadComponent from "@/components/HeadComponent";

const Contact = () => {
  return (
    <>
      <HeadComponent title="Liên hệ" />
      <div className="container py-5 text-center" style={{ minHeight: "60vh" }}>
        <h2 style={{ fontFamily: "var(--font-heading, sans-serif)", fontWeight: 700 }}>Liên hệ với chúng tôi</h2>
        <p className="text-muted mt-3">Mọi thắc mắc và góp ý, xin vui lòng liên hệ hotline hoặc gửi về hòm thư hỗ trợ khách hàng của chúng tôi.</p>
      </div>
    </>
  );
};

export default Contact;