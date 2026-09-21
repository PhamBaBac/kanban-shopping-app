import React from "react";
import { ProductModel } from "@/models/Products";
import ProductItem from "./ProductItem";

interface ProductListProps {
  products: ProductModel[];
  columnClassName?: string;
}

const ProductList = React.memo(({ products, columnClassName }: ProductListProps) => {
  return (
    <div className="row mx-0 g-2 g-sm-3">
      {products.map((item) => (
        <ProductItem
          item={item}
          key={item.id}
          className={columnClassName || "col-6 col-sm-6 col-md-4 col-lg-4 col-xl-3 mb-3 mb-md-4 px-1 px-sm-2"}
        />
      ))}
    </div>
  );
});

export default ProductList;
