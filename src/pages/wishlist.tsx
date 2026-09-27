/** @format */

import React from "react";
import HeadComponent from "@/components/HeadComponent";
import { ProfileWishlist } from "@/components";
import { Breadcrumb } from "antd";
import Link from "next/link";

const WishlistPage = () => {
  return (
    <>
      <HeadComponent title="Bộ sưu tập yêu thích | Kanban Shop" />
      <div className="container py-4" style={{ minHeight: "70vh" }}>
        <div className="mb-3">
          <Breadcrumb
            items={[
              {
                title: <Link href="/">Trang chủ</Link>,
              },
              {
                title: "Bộ sưu tập yêu thích",
              },
            ]}
          />
        </div>
        <ProfileWishlist />
      </div>
    </>
  );
};

export default WishlistPage;
