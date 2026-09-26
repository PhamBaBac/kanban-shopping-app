/** @format */

import { CategoyModel } from "@/models/Products";
import {
  Card,
  Drawer,
  Empty,
  List,
  Menu,
  MenuProps,
  Skeleton,
  Typography,
  theme,
} from "antd";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { shopService } from "@/services";

const { useToken } = theme;

type MenuItem = Required<MenuProps>["items"][number];

interface Props {
  type: "card" | "menu";
  onItemClick?: () => void;
}

const CategoriesListCard = (props: Props) => {
  const { type, onItemClick } = props;
  const { token } = useToken();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoyModel[]>([]);

  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    getCategories();
  }, []);

  const getCategories = async () => {
    setIsLoading(true);
    try {
      const categoriesRes = await shopService.getCategoriesForFilter();
      changeListToTreeList(categoriesRes);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeListToTreeList = (datas: CategoyModel[]) => {
    const items = datas.filter((element) => !element.parentId);
    const values: CategoyModel[] = [];
    items.forEach((item) => {
      const vals = datas.filter((element) => element.parentId === item.id);
      if (vals.length > 0) {
        values.push({ ...item, children: vals });
      }
    });
    setCategories(values);
  };

  if (type === "card") {
    const colCount = Math.min(Math.max(categories.length, 1), 5);
    const cardWidth =
      categories.length >= 5
        ? Math.min(Math.max((width || 1200) * 0.9, 1100), 1320)
        : categories.length >= 3
        ? Math.min(Math.max((width || 1200) * 0.75, 860), 1050)
        : Math.min(Math.max((width || 1200) * 0.55, 640), 800);

    return (
      <div
        className="shadow mt-2"
        style={{
          width: cardWidth,
          maxWidth: "96vw",
          backgroundColor: token.colorBgContainer || "#FFFFFF",
          borderRadius: 14,
          border: `1px solid ${token.colorBorderSecondary || "#E5E7EB"}`,
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div style={{ padding: 24 }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </div>
        ) : categories.length > 0 ? (
          <div>
            <div
              style={{
                display: "flex",
                minHeight: 220,
                maxHeight: "calc(80vh - 140px)",
                overflowY: "auto",
              }}
            >
              {/* Categories Section */}
              <div
                style={{
                  flex: 1,
                  padding: "24px 28px",
                  display: "grid",
                  gridTemplateColumns:
                    categories.length >= 5
                      ? "repeat(5, minmax(0, 1fr))"
                      : `repeat(${colCount}, minmax(0, 1fr))`,
                  gap: "24px 28px",
                  alignContent: "start",
                }}
              >
                {categories.map((item) => {
                  const maxSub = 5;
                  const visibleChildren = item.children
                    ? item.children.slice(0, maxSub)
                    : [];
                  const remaining = item.children
                    ? item.children.length - maxSub
                    : 0;

                  return (
                    <div key={item.id}>
                      <div style={{ marginBottom: 12 }}>
                        <Link
                          href={`/shop?catId=${item.id}`}
                          style={{
                            fontFamily:
                              "var(--font-heading)",
                            fontSize: "0.92rem",
                            fontWeight: 700,
                            letterSpacing: "0.6px",
                            textTransform: "uppercase",
                            color: "#131118",
                            textDecoration: "none",
                            display: "inline-block",
                          }}
                        >
                          {item.title}
                        </Link>
                        <div
                          style={{
                            width: 28,
                            height: 2,
                            backgroundColor: "#131118",
                            marginTop: 4,
                            borderRadius: 1,
                          }}
                        />
                      </div>

                      {item.children && item.children.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                          }}
                        >
                          {visibleChildren.map((chil) => (
                            <Link
                              key={chil.id}
                              href={`/shop?catId=${chil.id}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "6px 10px",
                                borderRadius: 6,
                                fontSize: "0.88rem",
                                color: "#4B5563",
                                textDecoration: "none",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#F4F4F5";
                                e.currentTarget.style.color = "#131118";
                                e.currentTarget.style.transform =
                                  "translateX(3px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                                e.currentTarget.style.color = "#4B5563";
                                e.currentTarget.style.transform = "none";
                              }}
                            >
                              <span>{chil.title}</span>
                            </Link>
                          ))}
                          {remaining > 0 && (
                            <Link
                              href={`/shop?catId=${item.id}`}
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "#131118",
                                marginTop: 4,
                                padding: "4px 10px",
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span>+{remaining} mục khác</span>
                              <span>&rarr;</span>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Featured Promo Block - Only rendered if catalog is concise and under 5 categories */}
              {categories.length < 5 && (
                <div
                  style={{
                    width: 240,
                    backgroundColor: "#131118",
                    color: "#FFFFFF",
                    padding: "24px 20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    flexShrink: 0,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        color: "rgba(255, 255, 255, 0.7)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        padding: "2px 8px",
                        borderRadius: 4,
                        display: "inline-block",
                        marginBottom: 12,
                      }}
                    >
                      Bộ sưu tập mới
                    </span>
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        lineHeight: 1.35,
                        marginBottom: 8,
                        color: "#FFFFFF",
                      }}
                    >
                      Khám phá phong cách tối giản
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "rgba(255, 255, 255, 0.65)",
                        lineHeight: 1.5,
                      }}
                    >
                      Cập nhật các sản phẩm xu hướng mới nhất hàng tuần.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Quick Bar */}
            <div
              style={{
                padding: "10px 28px",
                backgroundColor: "#F9FAFB",
                borderTop: "1px solid #F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.82rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Link
                  href="/shop"
                  style={{
                    color: "#6B7280",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Hàng mới về
                </Link>
                <span style={{ color: "#E5E7EB" }}>|</span>
                <Link
                  href="/shop"
                  style={{
                    color: "#6B7280",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Ưu đãi hot
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 24 }}>
            <Empty description="Không tìm thấy dữ liệu" />
          </div>
        )}
      </div>
    );
  }

  return (
    <Menu
      mode="inline"
      style={{ backgroundColor: "transparent", border: "none" }}
      items={categories.map((item) => ({
        key: item.id,
        label: item.children && item.children.length > 0 ? (
          item.title
        ) : (
          <Link href={`/shop?catId=${item.id}`} onClick={onItemClick}>
            {item.title}
          </Link>
        ),
        children: item.children && item.children.length > 0
          ? item.children.map((child) => ({
            key: child.id,
            label: (
              <Link href={`/shop?catId=${child.id}`} onClick={onItemClick}>
                {child.title}
              </Link>
            ),
          }))
          : undefined,
      }))}
    />
  );
};

export default CategoriesListCard;
