/** @format */

import { colors } from "@/constants/colors";
import { ProductModel, SubProductModel } from "@/models/Products";
import { SupplierModel } from "@/models/SupplierModel";
import { VND } from "@/utils/handleCurrency";
import { Button, Space, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { BiTransfer } from "react-icons/bi";
import { BsEye } from "react-icons/bs";
import { FaRegStar } from "react-icons/fa";
import { MdImage } from "react-icons/md";
import handleAPI from "@/apis/handleApi";

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
      const res: any = await handleAPI(`/suppliers/${item.supplierId}`);
      if (res && res.result) {
        setSupplier(res.result);
      }
    } catch (error) {
      console.log("Error fetching supplier:", error);
    }
  };

  const fetchSubProducts = async () => {
    setIsLoading(true);
    try {
      const res: any = await handleAPI(`/subProducts/get-all-sub-product/${item.id}`);
      if (res && res.result) {
        setSubProducts(res.result);
      }
    } catch (error) {
      console.log("Error fetching sub-products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceRange = () => {
    if (subProducts.length === 0) return null;

    const prices = subProducts.map((sub) => sub.price);
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
    <Link
      href={`/products/${item.slug}/${item.id}`}
      ref={ref}
      key={item.id}
      className="col-sm-6 col-md-4 col-lg-3 mb-4 product-item"
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
    </Link>
  );
};

export default ProductItem;
