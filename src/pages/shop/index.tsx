/** @format */

import handleAPI from "@/apis/handleApi";
import { ProductItem, FilterPanel } from "@/components";
import { FilterValues } from "@/components/FilterPanel";
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
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const { Sider, Content } = Layout;

const ShopPageContent = () => {
  const filterValues = useSelector(
    (state: RootState) => state.filter.filterValues
  );
  const [api, setApi] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const params = useSearchParams();
  const catId = params.get("catId");

  useEffect(() => {
    if (catId) {
      // Đã chuyển sang Redux, không dùng setFilterValues ở đây nữa
      // Nếu muốn filter theo catId, hãy dispatch setFilterValues trong FilterPanel hoặc tại đây nếu thực sự cần
      // Có thể bỏ toàn bộ useEffect này nếu không cần tự động filter theo catId
    }
  }, [catId]);

  useEffect(() => {
    const filterParams = new URLSearchParams();
    // Build query string from filter values
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && Array.isArray(value) && value.length > 0) {
        const cleanedValues =
          key === "sizes"
            ? value.map((v) => v.replace(/\s+/g, "")) // remove all spaces for sizes
            : value;
        filterParams.append(key, cleanedValues.join(","));
      }
    });

    filterParams.append("page", page.toString());
    filterParams.append("pageSize", "12"); // Show 12 products per page (4x3 grid)

    const queryString = filterParams.toString();
    const hasFilters = Object.values(filterValues).some(
      (v) => v && v.length > 0
    );

    const endpoint = hasFilters
      ? "/public/products/filter"
      : "/public/products/page";
    setApi(`${endpoint}?${queryString}`);
  }, [filterValues, page]);

  useEffect(() => {
    if (api) {
      getProductsByFilterValues();
    }
  }, [api]);

  const getProductsByFilterValues = async () => {
    setIsLoading(true);
    try {
      const res: any = await handleAPI(api, undefined, "get");
      if (res.result && Array.isArray(res.result.data)) {
        setProducts(res.result.data);
        setTotalItems(res.result.totalElements || 0);
      } else {
        setProducts([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.log(error);
      setProducts([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

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
          {isLoading ? (
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
