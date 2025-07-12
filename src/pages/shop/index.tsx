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
  Typography,
} from "antd";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const dispatch = useDispatch();
  const filterValues = useSelector(
    (state: RootState) => state.filter.filterValues
  );
  const [page, setPage] = useState(1);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const params = useSearchParams();
  const catId = params.get("catId");

  // Use shop hook
  const { products, totalItems, isLoading, error, fetchProducts } = useShop();

  useEffect(() => {
    if (catId) {
      // Update Redux state with category ID from URL
      dispatch(updateFilterValues({ catIds: [catId] }));
    }
  }, [catId, dispatch]);

  useEffect(() => {
    // Build filters from filterValues
    const filters: any = {
      page,
      pageSize: 12,
    };

    // Map category IDs
    if (filterValues.catIds && filterValues.catIds.length > 0) {
      filters.catIds = filterValues.catIds;
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
  }, [filterValues, page]); // Removed fetchProducts from dependencies

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
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Button
              className="d-lg-none"
              icon={<BsFilterLeft />}
              onClick={() => setDrawerVisible(true)}
            >
              Filter
            </Button>
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
            <Empty description="No products found matching your criteria." />
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
