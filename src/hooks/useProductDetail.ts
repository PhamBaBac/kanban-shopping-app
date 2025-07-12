import { useState, useEffect } from "react";
import { ProductModel, SubProductModel } from "@/models/Products";
import { SupplierModel } from "@/models/SupplierModel";
import { productService } from "@/services/productService";

interface UseProductDetailProps {
  product: ProductModel;
}

interface UseProductDetailReturn {
  subProducts: SubProductModel[];
  supplier: SupplierModel | null;
  reviews: any[];
  subProductSelected: SubProductModel | undefined;
  setSubProductSelected: (subProduct: SubProductModel) => void;
  loading: boolean;
  error: string | null;
}

export const useProductDetail = ({
  product,
}: UseProductDetailProps): UseProductDetailReturn => {
  const [subProducts, setSubProducts] = useState<SubProductModel[]>([]);
  const [supplier, setSupplier] = useState<SupplierModel | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [subProductSelected, setSubProductSelected] =
    useState<SubProductModel>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sub products
  useEffect(() => {
    const fetchSubProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const subProductsData = await productService.getSubProductsByProductId(
          product.id
        );
        setSubProducts(subProductsData);

        // Fetch reviews for all sub products
        const subProductIds = subProductsData.map(
          (item: SubProductModel) => item.id
        );
        if (subProductIds.length > 0) {
          const reviewsData = await productService.getReviews(subProductIds);
          setReviews(reviewsData);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch sub products");
        console.error("Error fetching sub products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubProducts();
  }, [product.id]);

  // Fetch supplier info
  useEffect(() => {
    const fetchSupplier = async () => {
      if (!product.supplierId) return;

      try {
        const supplierData = await productService.getSupplier(
          product.supplierId
        );
        setSupplier(supplierData);
      } catch (err: any) {
        console.error("Error fetching supplier:", err);
        // Don't set error for supplier as it's not critical
      }
    };

    fetchSupplier();
  }, [product.supplierId]);

  // Set initial sub product selected
  useEffect(() => {
    if (subProducts.length > 0) {
      setSubProductSelected({
        ...subProducts[0],
        imgURL:
          subProducts[0].images.length > 0 ? subProducts[0].images[0] : "",
      });
    }
  }, [subProducts]);

  return {
    subProducts,
    supplier,
    reviews,
    subProductSelected,
    setSubProductSelected,
    loading,
    error,
  };
};
