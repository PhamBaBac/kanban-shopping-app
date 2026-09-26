/** @format */

import { ProductItem, FilterPanel } from "@/components";
import { ProductModel } from "@/models/Products";
import {
  Breadcrumb,
  Button,
  Drawer,
  Empty,
  Layout,
  Pagination,
  Skeleton,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { BsArrowDown, BsFilterLeft } from "react-icons/bs";
import { FaElementor } from "react-icons/fa";
import ProductList from "@/components/ProductList";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { themeSelector } from "@/redux/reducers/themeSlice";
import { useShop } from "@/hooks";
import { shopService } from "@/services";
import { findDefaultOrFeaturedCategory } from "@/utils/categoryHelper";
import {
  updateFilterValues,
  setFilterValues,
  resetFilterValues,
} from "@/redux/reducers/filterSlice";
import { VND } from "@/utils/handleCurrency";

const { Sider, Content } = Layout;

const ShopPageContent = () => {
  const router = useRouter();
  const { isReady, query } = router;
  const dispatch = useDispatch();
  const filterValues = useSelector(
    (state: RootState) => state.filter.filterValues
  );
  const rootCatId = useSelector((state: RootState) => state.filter.rootCatId);
  const { mode } = useSelector(themeSelector);
  const isDark = mode === "dark";
  const [page, setPage] = useState(1);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "latest" | "topsales" | "price_asc" | "price_desc">("relevance");
  const [priceDropdownOpen, setPriceDropdownOpen] = useState(false);
  const lastFiltersRef = useRef<string>("");

  const { products, totalItems, isLoading, error, fetchProducts } = useShop();

  const handleRemovePriceFilter = () => {
    const updated = { ...filterValues };
    delete updated.price;
    dispatch(setFilterValues(updated));
  };

  const handleRemoveSearchFilter = () => {
    dispatch(updateFilterValues({ search: "" }));
    if (router && router.isReady) {
      const newQuery = { ...router.query };
      delete newQuery.search;
      delete newQuery.q;
      router.replace(
        { pathname: router.pathname, query: newQuery },
        undefined,
        { shallow: true }
      );
    }
  };

  const handleClearAllFilters = () => {
    const activeCatId =
      (router.query.catId as string) ||
      (filterValues.catIds && filterValues.catIds.length > 0
        ? filterValues.catIds[0]
        : "") ||
      rootCatId;

    if (activeCatId) {
      dispatch(
        setFilterValues({
          catIds: [activeCatId],
          colors: [],
          sizes: [],
          search: "",
        })
      );
      if (router && router.isReady) {
        router.replace(
          { pathname: "/shop", query: { catId: activeCatId } },
          undefined,
          { shallow: true }
        );
      }
    } else {
      shopService.getCategoriesForFilter().then((cats) => {
        const defaultCat = findDefaultOrFeaturedCategory(cats);
        const defaultId = defaultCat?.id || (defaultCat as any)?._id;
        if (defaultId) {
          dispatch(
            setFilterValues({
              catIds: [defaultId],
              colors: [],
              sizes: [],
              search: "",
            })
          );
          if (router && router.isReady) {
            router.replace(
              { pathname: "/shop", query: { catId: defaultId } },
              undefined,
              { shallow: true }
            );
          }
        } else {
          dispatch(resetFilterValues());
        }
      });
    }
  };

  const hasActivePrice = Boolean(
    filterValues.price && filterValues.price.length === 2
  );
  const hasActiveSearch = Boolean(
    filterValues.search && filterValues.search.trim()
  );
  const hasActiveFilters = hasActivePrice || hasActiveSearch;

  useEffect(() => {
    if (!isReady) return;

    const rawCatId = query.catId;
    const hasSearch = Boolean(
      String(query.search || query.q || "").trim()
    );
    const hasExistingCat =
      Boolean(rawCatId) ||
      Boolean(filterValues.catIds && filterValues.catIds.length > 0);

    if (hasSearch) {
      setIsRedirecting(false);
      return;
    }

    if (!hasExistingCat) {
      setIsRedirecting(true);
      shopService
        .getCategoriesForFilter()
        .then((cats) => {
          const defaultCat = findDefaultOrFeaturedCategory(cats);
          const defaultId = defaultCat?.id || (defaultCat as any)?._id;
          if (defaultId) {
            const newQuery = { ...query, catId: defaultId };
            router.replace(
              { pathname: "/shop", query: newQuery },
              undefined,
              { shallow: false }
            );
          } else {
            setIsRedirecting(false);
          }
        })
        .catch((err) => {
          console.error("Lỗi khi lấy danh mục mặc định cho trang shop:", err);
          setIsRedirecting(false);
        });
    } else {
      setIsRedirecting(false);
    }
  }, [isReady, query.catId]);

  useEffect(() => {
    if (!isReady) return;

    const rawCatId = query.catId;
    const catIdsFromUrl = Array.isArray(rawCatId)
      ? rawCatId
      : typeof rawCatId === "string" && rawCatId.includes(",")
        ? rawCatId.split(",").map((s) => s.trim())
        : rawCatId
          ? [rawCatId]
          : [];

    const rawSearch = (query.search || query.q) as string | undefined;

    const updates: any = {
      catIds: catIdsFromUrl,
    };
    if (rawSearch !== undefined) {
      updates.search = rawSearch.trim();
    }

    dispatch(updateFilterValues(updates));
    setPage(1);
  }, [isReady, query.catId, query.search, query.q, dispatch]);

  useEffect(() => {
    if (!isReady) return;

    const rawCatId = query.catId;
    const catIdsFromUrl = Array.isArray(rawCatId)
      ? rawCatId
      : typeof rawCatId === "string" && rawCatId.includes(",")
        ? rawCatId.split(",").map((s) => s.trim())
        : rawCatId
          ? [rawCatId]
          : [];

    const catIdsToFilter =
      catIdsFromUrl.length > 0
        ? catIdsFromUrl
        : filterValues.catIds && filterValues.catIds.length > 0
          ? filterValues.catIds
          : [];

    const hasSearch = Boolean(
      String(query.search || query.q || filterValues.search || "").trim()
    );
    if (catIdsToFilter.length === 0 && !hasSearch) {
      return;
    }

    const urlSearch = query.search || query.q;
    if (urlSearch && !filterValues.search) {
      return;
    }

    const filters: any = {
      page,
      pageSize: 12,
    };

    if (filterValues.search && filterValues.search.trim()) {
      filters.search = filterValues.search.trim();
    }

    if (!filters.search && catIdsToFilter.length > 0) {
      filters.catIds = catIdsToFilter;
    }

    if (filterValues.price && filterValues.price.length === 2) {
      filters.price = filterValues.price;
    }

    if (filterValues.colors && filterValues.colors.length > 0) {
      filters.colors = filterValues.colors;
    }

    if (filterValues.sizes && filterValues.sizes.length > 0) {
      filters.sizes = filterValues.sizes.map((v: string) =>
        v.replace(/\s+/g, "")
      );
    }

    const filtersStr = JSON.stringify(filters);
    if (lastFiltersRef.current === filtersStr) {
      return;
    }
    lastFiltersRef.current = filtersStr;

    console.log("Sending filters:", filters);
    fetchProducts(filters);
  }, [filterValues, page, isReady, query.catId, query.search, query.q]);

  const hasUrlOrFilterSearch = Boolean(
    String(query.search || query.q || filterValues.search || "").trim()
  );

  if (
    !isReady ||
    isRedirecting ||
    (!hasUrlOrFilterSearch && !query.catId && (!filterValues.catIds || filterValues.catIds.length === 0))
  ) {
    return (
      <div
        className="container py-5 text-center d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: 600 }}
      >
        <Spin size="large" />
        <Typography.Text type="secondary" style={{ marginTop: 16 }}>
          Đang tải danh mục sản phẩm...
        </Typography.Text>
      </div>
    );
  }

  return (
    <div className="container px-3 px-sm-4 py-3">
      <div className="py-2 mb-3 border-bottom" style={{ borderColor: isDark ? "#303030" : "#F3F4F6" }}>
        <Breadcrumb
          items={[
            {
              title: (
                <Link
                  href={"/"}
                  style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280", textDecoration: "none" }}
                >
                  Trang chủ
                </Link>
              ),
            },
            {
              title: (
                <span style={{ color: isDark ? "rgba(255,255,255,0.85)" : "#131118", fontWeight: 600 }}>Cửa hàng</span>
              ),
            },
          ]}
        />
      </div>

      <Layout style={{ background: "transparent" }}>
        <Sider
          width={280}
          className="d-none d-lg-block"
          style={{ background: "transparent", paddingRight: 24 }}
        >
          <FilterPanel />
        </Sider>

        <Content style={{ padding: 0, minHeight: 800 }}>
          <div
            className="rounded-3 border shadow-sm mb-4"
            style={{
              borderColor: isDark ? "#303030" : "#E5E7EB",
              backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
              padding: "12px 14px",
              borderRadius: 14,
            }}
          >
            {/* Toolbar: Sort by bar & Mobile Filter toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div
                className="shop-sort-bar-scroll"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "nowrap",
                  overflowX: "auto",
                  paddingBottom: 4,
                  maxWidth: "100%",
                  WebkitOverflowScrolling: "touch",
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                }}
              >
                <Button
                  className="d-lg-none"
                  icon={<BsFilterLeft size={18} />}
                  onClick={() => setDrawerVisible(true)}
                  style={{
                    borderRadius: 8,
                    borderColor: isDark ? "#424242" : "#E5E7EB",
                    backgroundColor: isDark ? "#2a2a2a" : "#FFFFFF",
                    color: isDark ? "#FFFFFF" : "#131118",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    flexShrink: 0,
                    height: 34,
                  }}
                >
                  Bộ lọc
                </Button>

                <span style={{ color: isDark ? "#9CA3AF" : "#6B7280", fontWeight: 500, fontSize: "0.88rem", marginRight: 2, flexShrink: 0 }}>
                  Sắp xếp:
                </span>

                {/* Relevance */}
                <button
                  onClick={() => setSortBy("relevance")}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 8,
                    border: sortBy === "relevance" ? "none" : `1px solid ${isDark ? "#424242" : "#E5E7EB"}`,
                    backgroundColor: sortBy === "relevance" ? (isDark ? "#fff" : "#131118") : (isDark ? "#242424" : "#FFFFFF"),
                    color: sortBy === "relevance" ? (isDark ? "#131118" : "#FFFFFF") : (isDark ? "rgba(255,255,255,0.75)" : "#374151"),
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  Liên quan
                </button>

                {/* Latest */}
                <button
                  onClick={() => setSortBy("latest")}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 8,
                    border: sortBy === "latest" ? "none" : `1px solid ${isDark ? "#424242" : "#E5E7EB"}`,
                    backgroundColor: sortBy === "latest" ? (isDark ? "#fff" : "#131118") : (isDark ? "#242424" : "#FFFFFF"),
                    color: sortBy === "latest" ? (isDark ? "#131118" : "#FFFFFF") : (isDark ? "rgba(255,255,255,0.75)" : "#374151"),
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  Mới nhất
                </button>

                {/* Top Sales */}
                <button
                  onClick={() => setSortBy("topsales")}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 8,
                    border: sortBy === "topsales" ? "none" : `1px solid ${isDark ? "#424242" : "#E5E7EB"}`,
                    backgroundColor: sortBy === "topsales" ? (isDark ? "#fff" : "#131118") : (isDark ? "#242424" : "#FFFFFF"),
                    color: sortBy === "topsales" ? (isDark ? "#131118" : "#FFFFFF") : (isDark ? "rgba(255,255,255,0.75)" : "#374151"),
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  Bán chạy
                </button>

                {/* Price dropdown */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button
                    onClick={() => setPriceDropdownOpen((v) => !v)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 8,
                      border: `1px solid ${isDark ? "#424242" : "#E5E7EB"}`,
                      backgroundColor: (sortBy === "price_asc" || sortBy === "price_desc") ? (isDark ? "#fff" : "#131118") : (isDark ? "#242424" : "#FFFFFF"),
                      color: (sortBy === "price_asc" || sortBy === "price_desc") ? (isDark ? "#131118" : "#FFFFFF") : (isDark ? "rgba(255,255,255,0.75)" : "#374151"),
                      fontWeight: 500,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                    }}
                  >
                    Giá
                    <BsArrowDown
                      size={13}
                      style={{
                        transition: "transform 0.2s",
                        transform: priceDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>
                  {priceDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
                        border: `1px solid ${isDark ? "#424242" : "#E5E7EB"}`,
                        borderRadius: 8,
                        boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.08)",
                        minWidth: 160,
                        zIndex: 100,
                        overflow: "hidden",
                      }}
                    >
                      {[
                        { label: "Giá: Thấp đến Cao", value: "price_asc" as const },
                        { label: "Giá: Cao đến Thấp", value: "price_desc" as const },
                      ].map((opt) => (
                        <div
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value); setPriceDropdownOpen(false); }}
                          style={{
                            padding: "10px 16px",
                            fontSize: "0.88rem",
                            fontWeight: sortBy === opt.value ? 600 : 400,
                            color: sortBy === opt.value ? (isDark ? "#fff" : "#131118") : (isDark ? "rgba(255,255,255,0.75)" : "#374151"),
                            cursor: "pointer",
                            backgroundColor: sortBy === opt.value ? (isDark ? "#2a2a2a" : "#F3F4F6") : (isDark ? "#1d1d1d" : "#FFFFFF"),
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => { if (sortBy !== opt.value) (e.currentTarget as HTMLDivElement).style.backgroundColor = isDark ? "#252525" : "#F9FAFB"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = sortBy === opt.value ? (isDark ? "#2a2a2a" : "#F3F4F6") : (isDark ? "#1d1d1d" : "#FFFFFF"); }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active filter tags */}
            {hasActiveFilters && (
              <div
                className="d-flex align-items-center gap-2 flex-wrap mt-2 pt-2"
                style={{ borderTop: `1px solid ${isDark ? "#303030" : "#F3F4F6"}` }}
              >
                <span style={{ color: isDark ? "#9CA3AF" : "#6B7280", fontWeight: 500, fontSize: "0.85rem" }}>
                  Bộ lọc đang áp dụng:
                </span>
                {hasActivePrice && (
                  <Tag
                    closable
                    onClose={handleRemovePriceFilter}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      backgroundColor: isDark ? "#2a2a2a" : "#F3F4F6",
                      borderColor: isDark ? "#424242" : "#E5E7EB",
                      color: isDark ? "rgba(255,255,255,0.85)" : "#1F2937",
                      fontWeight: 500,
                    }}
                  >
                    Giá: {VND.format(filterValues.price![0])} - {VND.format(filterValues.price![1])}
                  </Tag>
                )}
                {hasActiveSearch && (
                  <Tag
                    closable
                    onClose={handleRemoveSearchFilter}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      backgroundColor: isDark ? "#2a2a2a" : "#F3F4F6",
                      borderColor: isDark ? "#424242" : "#E5E7EB",
                      color: isDark ? "rgba(255,255,255,0.85)" : "#1F2937",
                      fontWeight: 500,
                    }}
                  >
                    Tìm kiếm: "{filterValues.search}"
                  </Tag>
                )}
                <Button
                  type="link"
                  size="small"
                  onClick={handleClearAllFilters}
                  style={{ padding: 0, color: "#DC2626", fontWeight: 500, marginLeft: 4 }}
                >
                  Xóa tất cả bộ lọc
                </Button>
              </div>
            )}
          </div>

          {error ? (
            <div
              className="rounded-3 border p-4 text-center text-danger"
              style={{
                borderColor: "#FECACA",
                backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
              }}
            >
              Lỗi: {error}
            </div>
          ) : isLoading && products.length === 0 ? (
            <div className="row mx-0 g-2 g-sm-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="col-6 col-md-4 col-lg-3 mb-3 mb-md-4 px-1 px-sm-2">
                  <div
                    className="p-3 rounded-3 border shadow-sm"
                    style={{
                      height: 350,
                      backgroundColor: isDark ? "#1f1f1f" : "#FFFFFF",
                      borderColor: isDark ? "#303030" : "#E5E7EB",
                    }}
                  >
                    <Skeleton.Image
                      active
                      style={{ width: "100%", height: 180, display: "block" }}
                    />
                    <Skeleton
                      active
                      paragraph={{ rows: 2 }}
                      style={{ marginTop: 16 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Spin spinning={isLoading} size="large">
              {products.length > 0 ? (
                <>
                  <ProductList products={products} />
                  <div className="mt-4 mb-4 d-flex justify-content-center justify-content-md-end">
                    <Pagination
                      current={page}
                      total={totalItems}
                      onChange={(val) => setPage(val)}
                      pageSize={12}
                      showSizeChanger={false}
                      className="custom-pagination"
                      responsive
                      size="default"
                    />
                  </div>
                </>
              ) : (
                <div
                  className="rounded-3 border p-5 text-center shadow-sm"
                  style={{
                    borderColor: isDark ? "#303030" : "#E5E7EB",
                    backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
                  }}
                >
                  <Empty
                    description={
                      <div style={{ marginTop: 8 }}>
                        <Typography.Text
                          style={{
                            color: isDark ? "rgba(255,255,255,0.85)" : "#374151",
                            fontSize: "0.95rem",
                            fontWeight: 500,
                            display: "block",
                          }}
                        >
                          Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
                        </Typography.Text>
                        <Typography.Text
                          type="secondary"
                          style={{
                            fontSize: "0.85rem",
                            marginTop: 4,
                            display: "block",
                            color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280",
                          }}
                        >
                          {hasActivePrice
                            ? "Khoảng giá bạn chọn có thể chưa có sản phẩm nào. Hãy thử điều chỉnh hoặc bấm nút xóa bộ lọc giá."
                            : "Vui lòng chọn danh mục khác hoặc xóa bộ lọc để xem các sản phẩm có sẵn."}
                        </Typography.Text>
                      </div>
                    }
                  >
                    <Button
                      type="primary"
                      onClick={handleClearAllFilters}
                      style={{
                        marginTop: 16,
                        backgroundColor: isDark ? "#FFFFFF" : "#131118",
                        borderColor: isDark ? "#FFFFFF" : "#131118",
                        color: isDark ? "#131118" : "#FFFFFF",
                        borderRadius: 8,
                        fontWeight: 500,
                      }}
                    >
                      Xóa tất cả bộ lọc
                    </Button>
                  </Empty>
                </div>
              )}
            </Spin>
          )}
        </Content>
      </Layout>

      <Drawer
        title="Bộ lọc sản phẩm"
        placement="left"
        width={typeof window !== "undefined" && window.innerWidth < 400 ? "88vw" : 340}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        className="d-lg-none shop-filter-drawer"
        destroyOnClose
        styles={{
          body: { padding: "16px 16px 80px 16px", overflowY: "auto" },
          content: { backgroundColor: isDark ? "#16151a" : "#FFFFFF" },
          header: {
            backgroundColor: isDark ? "#1c1a22" : "#FFFFFF",
            borderBottom: `1px solid ${isDark ? "#2b2836" : "#E5E7EB"}`,
            color: isDark ? "#FFFFFF" : "#131118",
          },
        }}
      >
        {drawerVisible && (
          <FilterPanel
            isDrawer
            onClose={() => setDrawerVisible(false)}
            totalProducts={totalItems}
          />
        )}
      </Drawer>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { query } = context;
  const rawCatId = query.catId;
  const rawSearch = query.search || query.q;

  if (!rawCatId && !rawSearch) {
    try {
      const res = await axios.get(
        "http://localhost:8080/api/v1/public/categories/all",
        { timeout: 3000 }
      );
      const categories = res.data?.data || [];
      const defaultCat = findDefaultOrFeaturedCategory(categories);
      const defaultId = defaultCat?.id || (defaultCat as any)?._id;

      if (defaultId) {
        const nextQuery = new URLSearchParams();
        Object.entries(query).forEach(([k, v]) => {
          if (v) {
            nextQuery.set(k, Array.isArray(v) ? v.join(",") : String(v));
          }
        });
        nextQuery.set("catId", String(defaultId));

        return {
          redirect: {
            destination: `/shop?${nextQuery.toString()}`,
            permanent: false,
          },
        };
      }
    } catch (error) {
      console.error("getServerSideProps /shop redirect error:", error);
    }
  }

  return {
    props: {},
  };
};

export default ShopPageContent;
