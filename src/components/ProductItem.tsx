/** @format */

import { colors } from "@/constants/colors";
import { ProductModel, SubProductModel } from "@/models/Products";
import { SupplierModel } from "@/models/SupplierModel";
import { VND } from "@/utils/handleCurrency";
import { Button, Card, Space, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { BiTransfer } from "react-icons/bi";
import { BsEye } from "react-icons/bs";
import { FaRegStar } from "react-icons/fa";
import { MdImage } from "react-icons/md";
import { useSelector } from "react-redux";
import { authSelector } from "@/redux/reducers/authReducer";
import { productService } from "@/services";
import { userService } from "@/services/userService";

interface Props {
  item: ProductModel;
}

const { Title, Text, Paragraph } = Typography;

const ProductItem = (props: Props) => {
  const { item } = props;
  const [elementWidth, setElementWidth] = useState();
  const [supplier, setSupplier] = useState<SupplierModel | null>(null);
  const [subProducts, setSubProducts] = useState<SubProductModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const ref = useRef<any>();
  const router = useRouter();
  const auth = useSelector(authSelector);

  useEffect(() => {
    const width = ref.current?.offsetWidth;
    setElementWidth(width);
  }, []);

  useEffect(() => {
    if (item.supplierId) {
      fetchSupplierInfo();
    }
    if (item.id) {
      fetchSubProducts();
    }
  }, [item.supplierId, item.id]);

  const fetchSupplierInfo = async () => {
    try {
      const res = await productService.getSupplier(item.supplierId);
      if (res) {
        setSupplier(res);
      }
    } catch (error) {
      console.log("Error fetching supplier:", error);
    }
  };

  const fetchSubProducts = async () => {
    setIsLoading(true);
    try {
      const res = await productService.getSubProductsByProductId(item.id);
      if (res) {
        setSubProducts(res);
      }
    } catch (error) {
      console.log("Error fetching sub-products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const recordView = async () => {
    try {
      await userService.recordUserActivity({
        userId: auth.userId,
        productId: item.id,
        activityType: "view",
      });
    } catch (error) {
      console.error("Failed to record product view:", error);
    }
  };

  const handleClick = async () => {
    if (auth.userId) {
      await recordView(); // Gửi lịch sử xem trước khi chuyển trang
    }
    router.push(`/products/${item.slug}/${item.id}`);
  };

  const getPriceRange = () => {
    if (subProducts.length === 0) {
      if (item.price && item.price.length > 0) {
        const minPrice = Math.min(...item.price);
        const maxPrice = Math.max(...item.price);
        if (minPrice === maxPrice) {
          return <strong>{VND.format(minPrice)}</strong>;
        }
        return (
          <>
            <span
              style={{
                textDecoration: "line-through",
                color: "#999",
                marginRight: 8,
              }}
            >
              {VND.format(maxPrice)}
            </span>
            <strong style={{ color: "#d32f2f" }}>{VND.format(minPrice)}</strong>
          </>
        );
      }
      return <strong>Liên hệ</strong>;
    }

    // Kiểm tra nếu tất cả sub-product đều có discount < price và discount giống nhau, price giống nhau
    const allHaveDiscount = subProducts.every(
      (sub) => typeof sub.discount === "number" && sub.discount < sub.price
    );
    const allDiscountEqual = subProducts.every(
      (sub) => sub.discount === subProducts[0].discount
    );
    const allPriceEqual = subProducts.every(
      (sub) => sub.price === subProducts[0].price
    );

    if (allHaveDiscount && allDiscountEqual && allPriceEqual) {
      return (
        <>
          <span
            style={{
              textDecoration: "line-through",
              color: "#999",
              marginRight: 8,
            }}
          >
            {VND.format(subProducts[0].price)}
          </span>
          <strong style={{ color: "#d32f2f" }}>
            {VND.format(subProducts[0].discount!)}
          </strong>
        </>
      );
    }

    // Nếu không, hiển thị khoảng giá như cũ
    const prices = subProducts.map((sub) =>
      sub.discount && sub.discount < sub.price ? sub.discount : sub.price
    );
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return <strong>{VND.format(minPrice)}</strong>;
    }

    return (
      <>
        <span
          style={{
            textDecoration: "line-through",
            color: "#999",
            marginRight: 8,
          }}
        >
          {VND.format(maxPrice)}
        </span>
        <strong style={{ color: "#d32f2f" }}>{VND.format(minPrice)}</strong>
      </>
    );
  };

  return (
    <div
      onClick={handleClick}
      ref={ref}
      key={item.id}
      className="col-sm-6 col-md-4 col-lg-3 mb-4 cursor-pointer product-item"
    >
      <div>
        {item.images && item.images.length > 0 ? (
          <img
            style={{
              width: "100%",
              height: elementWidth ? elementWidth * 1.1 : 250,
            }}
            src={item.images[0]}
            alt={item.title}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: elementWidth ? elementWidth * 1.2 : 250,
              backgroundColor: `#e0e0e0`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MdImage size={32} color={colors.gray600} />
          </div>
        )}

        <div className="button-container">
          <div
            className="btn-list text-right pr-2"
            style={{
              height: (elementWidth ? elementWidth * 1.2 : 250) * 0.72,
            }}
          >
            <Space direction="vertical">
              <Button
                size="large"
                className="btn-icon"
                icon={<FaRegStar size={20} className="text-muted" />}
              />
              <Button
                size="large"
                className="btn-icon"
                icon={<BiTransfer size={20} className="text-muted" />}
              />
              <Button
                size="large"
                className="btn-icon"
                icon={<BsEye size={20} className="text-muted" />}
              />
            </Space>
          </div>

          {/* <div className="text-center">
            <Button
              onClick={() => router.push(`/products/${item.slug}/${item.id}`)}
              size="large"
              style={{ width: "80%" }}
            >
              Detail
            </Button>
          </div> */}
        </div>
      </div>
      <div className="p-2">
        <Paragraph style={{ fontWeight: "bold" }}>
          {supplier ? supplier.name : "Loading..."}
        </Paragraph>
        <Paragraph ellipsis={{ rows: 2, tooltip: item.title }}>
          {item.title}
        </Paragraph>
        <Paragraph style={{ fontSize: "1.1em" }}>
          {isLoading ? "Loading..." : getPriceRange()}
        </Paragraph>
      </div>
    </div>
  );
};

export default ProductItem;
