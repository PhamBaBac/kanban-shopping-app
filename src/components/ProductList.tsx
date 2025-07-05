import React from "react";
import { ProductModel } from "@/models/Products";
import ProductItem from "./ProductItem";

const ProductList = React.memo(({ products }: { products: ProductModel[] }) => {
  return (
    <div className="row">
      {products.map((item) => (
        <ProductItem item={item} key={item.id} />
      ))}
    </div>
  );
});

export default ProductList;
