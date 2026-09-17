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
  Typography,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { BsArrowDown, BsFilterLeft } from "react-icons/bs";
import { FaElementor } from "react-icons/fa";
import ProductList from "@/components/ProductList";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { useShop } from "@/hooks";
import { updateFilterValues } from "@/redux/reducers/filterSlice";

const { Sider, Content } = Layout;

const ShopPageContent = () => {
  const router = useRouter();
  const { isReady, query } = router;
  const dispatch = useDispatch();
  const filterValues = useSelector(
    (state: RootState) => state.filter.filterValues
  );
  const [page, setPage] = useState(1);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Use shop hook
  const { products, totalItems, isLoading, error, fetchProducts } = useShop();

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

    console.log("Sending filters:", filters); // Debug log
    fetchProducts(filters);
  }, [filterValues, page, isReady, query.catId, query.search, query.q]);

  return (
    <div className="container">
      <div className="mt-4 mb-3">
        <Breadcrumb
          items={[
            {
              title: <Link href={"/"}>Home</Link>,
            },
            {
              title: "Shop",
            },
          ]}
        />
      </div>

      <Layout style={{ background: "transparent" }}>
        <Sider
          width={260}
          className="d-none d-lg-block"
          style={{ background: "transparent", paddingRight: 20 }}
        >
          <FilterPanel />
        </Sider>

        <Content style={{ padding: "0 24px", minHeight: 850 }}>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <Button
                className="d-lg-none"
                icon={<BsFilterLeft />}
                onClick={() => setDrawerVisible(true)}
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
                style={{ width: 240 }}
              />
            </div>
            <Typography.Text type="secondary" className="d-none d-md-block">
              Showing 1–{products.length} of {totalItems} results
            </Typography.Text>
            <Button type="text" icon={<BsArrowDown size={14} />}>
              Sort by latest
            </Button>
          </div>
          {error ? (
            <div>Error: {error}</div>
          ) : isLoading ? (
            <Skeleton active />
          ) : products.length > 0 ? (
            <>
              <ProductList products={products} />
              <div className="mt-4 mb-4" style={{ textAlign: "right" }}>
                <Pagination
                  current={page}
                  total={totalItems}
                  onChange={(val) => setPage(val)}
                  pageSize={12}
                  showSizeChanger={false}
                />
              </div>
            </>
          ) : (
            <Empty description="Không tìm thấy sản phẩm nào trong danh mục này." />
          )}
        </Content>
      </Layout>

      <Drawer
        title="Filter Products"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        className="d-lg-none"
      >
        <FilterPanel />
      </Drawer>
    </div>
  );
};

export default ShopPageContent;
