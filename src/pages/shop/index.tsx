/** @format */

import { ProductItem, FilterPanel } from "@/components";
import { ProductModel } from "@/models/Products";
import {
  Breadcrumb,
  Button,
  Drawer,
  Empty,
  Input,
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
import React, { useEffect, useRef, useState } from "react";
import { BsArrowDown, BsFilterLeft } from "react-icons/bs";
import { FaElementor } from "react-icons/fa";
import ProductList from "@/components/ProductList";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { useShop } from "@/hooks";
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
  // rootCatId: danh mục gốc (root parent) của context hiện tại
  // Được FilterPanel set khi load branch, dùng để "Xóa bộ lọc" không bị mất danh mục
  const rootCatId = useSelector((state: RootState) => state.filter.rootCatId);
  const [page, setPage] = useState(1);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const lastFiltersRef = useRef<string>("");

  // Use shop hook
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
    // Giữ lại category hiện tại / danh mục ban đầu (không xóa category),
    // chỉ xóa khoảng giá, màu sắc, kích thước, tìm kiếm.
    // Tránh trường hợp load toàn bộ sản phẩm mọi danh mục hoặc đổi sang danh mục khác.
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
      // Không có danh mục (ví dụ đang ở trang tìm kiếm): reset hoàn toàn
      dispatch(resetFilterValues());
      if (router && router.isReady) {
        router.replace({ pathname: "/shop" }, undefined, { shallow: true });
      }
    }
  };

  const hasActivePrice = Boolean(
    filterValues.price && filterValues.price.length === 2
  );
  const hasActiveSearch = Boolean(
    filterValues.search && filterValues.search.trim()
  );
  const hasActiveFilters = hasActivePrice || hasActiveSearch;

  // 1. Khi router sẵn sàng (load trang / refresh F5), đọc query từ URL đưa vào Redux
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

  // 2. Fetch sản phẩm theo filterValues khi router đã sẵn sàng
  useEffect(() => {
    if (!isReady) return;

    // Luôn ưu tiên catId từ URL query nếu có để tránh stale state từ Redux khi click danh mục mới
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

    const urlSearch = query.search || query.q;
    if (urlSearch && !filterValues.search) {
      return;
    }

    // Build filters from filterValues
    const filters: any = {
      page,
      pageSize: 12,
    };

    // Map search
    if (filterValues.search && filterValues.search.trim()) {
      filters.search = filterValues.search.trim();
    }

    // Map category IDs
    if (catIdsToFilter.length > 0) {
      filters.catIds = catIdsToFilter;
    }

    // Map price range
    if (filterValues.price && filterValues.price.length === 2) {
      filters.price = filterValues.price;
    }

    // Map colors
    if (filterValues.colors && filterValues.colors.length > 0) {
      filters.colors = filterValues.colors;
    }

    // Map sizes (clean up spaces)
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

    console.log("Sending filters:", filters); // Debug log
    fetchProducts(filters);
  }, [filterValues, page, isReady, query.catId, query.search, query.q]);

  return (
    <div className="container py-3">
      <div className="py-2 mb-3 border-bottom" style={{ borderColor: "#F3F4F6" }}>
        <Breadcrumb
          items={[
            {
              title: (
                <Link
                  href={"/"}
                  style={{ color: "#6B7280", textDecoration: "none" }}
                >
                  Home
                </Link>
              ),
            },
            {
              title: (
                <span style={{ color: "#131118", fontWeight: 600 }}>Shop</span>
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

        <Content style={{ padding: "0 8px", minHeight: 800 }}>
          <div
            className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 bg-white p-3 rounded-3 border shadow-sm"
            style={{ borderColor: "#E5E7EB" }}
          >
            <div className="d-flex align-items-center gap-2">
              <Button
                className="d-lg-none"
                icon={<BsFilterLeft />}
                onClick={() => setDrawerVisible(true)}
                style={{ borderRadius: 8, borderColor: "#E5E7EB" }}
              >
                Filter
              </Button>
              <Input.Search
                placeholder="Tìm kiếm sản phẩm..."
                allowClear
                value={filterValues.search || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  dispatch(updateFilterValues({ search: val }));
                  if (!val && router && router.isReady) {
                    const newQuery = { ...router.query };
                    delete newQuery.search;
                    delete newQuery.q;
                    router.replace(
                      { pathname: router.pathname, query: newQuery },
                      undefined,
                      { shallow: true }
                    );
                  }
                }}
                onSearch={(value) => {
                  const val = value.trim();
                  dispatch(updateFilterValues({ search: val }));
                  if (router && router.isReady) {
                    const newQuery = { ...router.query };
                    if (val) {
                      newQuery.search = val;
                    } else {
                      delete newQuery.search;
                    }
                    delete newQuery.q;
                    router.replace(
                      { pathname: router.pathname, query: newQuery },
                      undefined,
                      { shallow: true }
                    );
                  }
                }}
                style={{ width: 280 }}
              />
            </div>
            <Typography.Text
              type="secondary"
              className="d-none d-md-block"
              style={{ color: "#6B7280" }}
            >
              Showing <strong style={{ color: "#131118" }}>1–{products.length}</strong> of {totalItems} results
            </Typography.Text>
            <Button
              type="default"
              icon={<BsArrowDown size={14} />}
              style={{
                borderRadius: 8,
                borderColor: "#E5E7EB",
                fontWeight: 500,
              }}
            >
              Sort by latest
            </Button>
          </div>

          {hasActiveFilters && (
            <div
              className="d-flex align-items-center gap-2 mb-4 flex-wrap bg-white px-3 py-2 rounded-3 border shadow-sm"
              style={{ borderColor: "#E5E7EB", fontSize: "0.88rem" }}
            >
              <span style={{ color: "#6B7280", fontWeight: 500 }}>Bộ lọc đang áp dụng:</span>
              {hasActivePrice && (
                <Tag
                  closable
                  onClose={handleRemovePriceFilter}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    backgroundColor: "#F3F4F6",
                    borderColor: "#E5E7EB",
                    color: "#1F2937",
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
                    backgroundColor: "#F3F4F6",
                    borderColor: "#E5E7EB",
                    color: "#1F2937",
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

          {error ? (
            <div
              className="bg-white rounded-3 border p-4 text-center text-danger"
              style={{ borderColor: "#FECACA" }}
            >
              Error: {error}
            </div>
          ) : isLoading && products.length === 0 ? (
            <div className="row">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="col-sm-6 col-md-4 col-lg-3 mb-4">
                  <div
                    className="bg-white p-3 rounded-3 border shadow-sm"
                    style={{ height: 350 }}
                  >
                    <Skeleton.Image
                      active
                      style={{ width: "100%", height: 200, display: "block" }}
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
                  <div className="mt-4 mb-4 d-flex justify-content-end">
                    <Pagination
                      current={page}
                      total={totalItems}
                      onChange={(val) => setPage(val)}
                      pageSize={12}
                      showSizeChanger={false}
                      className="custom-pagination"
                    />
                  </div>
                </>
              ) : (
                <div
                  className="bg-white rounded-3 border p-5 text-center shadow-sm"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <Empty
                    description={
                      <div style={{ marginTop: 8 }}>
                        <Typography.Text style={{ color: "#374151", fontSize: "0.95rem", fontWeight: 500, display: "block" }}>
                          Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
                        </Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: "0.85rem", marginTop: 4, display: "block" }}>
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
                        backgroundColor: "#131118",
                        borderColor: "#131118",
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
        title="Filter Products"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        className="d-lg-none"
        destroyOnClose
      >
        {drawerVisible && <FilterPanel />}
      </Drawer>
    </div>
  );
};

export default ShopPageContent;
