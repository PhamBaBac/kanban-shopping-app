import handleAPI from "@/apis/handleApi";
import { AddressModel } from "@/models/Products";
import axios from "axios";

const OPENAPILOCATION = `https://open.oapi.vn/location`;

export interface CreateAddressData {
  name: string;
  phoneNumber: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  isDefault: boolean;
  createdBy: string;
}

export const addressService = {
  // Lấy tất cả địa chỉ của user
  getAddresses: async (): Promise<AddressModel[]> => {
    const res = await handleAPI("/addresses/all");
    return res.data || [];
  },

  // Lấy địa chỉ theo ID
  getAddressById: async (id: string): Promise<AddressModel> => {
    const res = await handleAPI(`/addresses/${id}`);
    return res.data;
  },

  // Tạo địa chỉ mới
  createAddress: async (data: CreateAddressData): Promise<AddressModel> => {
    const res = await handleAPI("/addresses/create", data, "post");
    return res.data;
  },

  // Cập nhật địa chỉ
  updateAddress: async (
    id: string,
    data: CreateAddressData
  ): Promise<AddressModel> => {
    const res = await handleAPI(
      `/addresses/update-address?id=${id}`,
      data,
      "put"
    );
    return res.data;
  },

  // Xóa địa chỉ
  deleteAddress: async (id: string): Promise<any> => {
    const res = await handleAPI(`/addresses/${id}`, {}, "delete");
    return res.data;
  },

  // Đặt địa chỉ làm mặc định
  setDefaultAddress: async (id: string): Promise<any> => {
    const res = await handleAPI(`/addresses/${id}/set-default`, {}, "patch");
    return res.data;
  },

  // Lấy danh sách tỉnh/thành phố từ OpenAPI
  getProvinces: async (): Promise<any[]> => {
    try {
      const res = await axios.get(
        `${OPENAPILOCATION}/provinces?page=0&size=1000`
      );
      const data = res.data?.data || res.data || res;
      return data.map((item: any) => ({
        label: item.name,
        value: item.id,
      }));
    } catch (error) {
      console.error("Failed to fetch provinces:", error);
      return [];
    }
  },

  // Lấy danh sách quận/huyện theo tỉnh từ OpenAPI
  getDistricts: async (provinceId: string): Promise<any[]> => {
    try {
      const res = await axios.get(
        `${OPENAPILOCATION}/districts/${provinceId}?page=0&size=1000`
      );
      const data = res.data?.data || res.data || res;
      return data.map((item: any) => ({
        label: item.name,
        value: item.id,
      }));
    } catch (error) {
      console.error("Failed to fetch districts:", error);
      return [];
    }
  },

  // Lấy danh sách phường/xã theo quận từ OpenAPI
  getWards: async (districtId: string): Promise<any[]> => {
    try {
      const res = await axios.get(
        `${OPENAPILOCATION}/wards/${districtId}?page=0&size=1000`
      );
      const data = res.data?.data || res.data || res;
      return data.map((item: any) => ({
        label: item.name,
        value: item.id,
      }));
    } catch (error) {
      console.error("Failed to fetch wards:", error);
      return [];
    }
  },
};
