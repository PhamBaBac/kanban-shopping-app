/** @format */

export interface CategoyModel {
  id: string;
  title: string;
  parentId: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  image?: string;
  children: CategoyModel[];
  __v: number;
}

export interface ProductModel {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  categories: CategoyModel[];
  supplierId: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  v: number;
  isDeleted: boolean | null;
  subItems?: SubProductModel[];
  price?: number[];
}

export interface SubProductModel {
  size: string;
  color: string;
  price: number;
  stock: number;
  productId: string;
  images: any[];
  id: string;
  createdAt: string;
  discount?: number;
  updatedAt: string;
  v: number;
  imgURL?: string;
  count: number;
  createdBy: string;
}

export interface AddressModel {
  name: string;
  phoneNumber: string;
  address: string;
  createdBy: string;
  isDefault: boolean;
  id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
