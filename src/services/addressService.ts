import handleAPI from "@/apis/handleApi";
import { AddressModel } from "@/models/Products";
import axios from "axios";

const VIETNAM_PROVINCES_API = `https://provinces.open-api.vn/api/v2`;

export interface AdministrativeUnit {
  label: string;
  value: string;
  code?: string | number;
  name?: string;
  id?: string | number;
}

const cache = {
  provinces: [] as AdministrativeUnit[],
  wards: new Map<string, AdministrativeUnit[]>(),
};

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

  // Lấy danh sách tỉnh/thành phố từ OpenAPI v2
  getProvinces: async (): Promise<AdministrativeUnit[]> => {
    if (cache.provinces.length > 0) {
      return cache.provinces;
    }
    try {
      let res;
      try {
        res = await axios.get(`${VIETNAM_PROVINCES_API}/p/`);
      } catch {
        res = await axios.get(`${VIETNAM_PROVINCES_API}/`);
      }
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const formatted: AdministrativeUnit[] = data.map((item: any) => ({
        label: item.name,
        value: String(item.code),
        name: item.name,
        code: item.code,
      }));
      cache.provinces = formatted;
      return formatted;
    } catch (error) {
      console.error("Failed to fetch provinces:", error);
      return [];
    }
  },

  // Lấy danh sách quận/huyện theo tỉnh từ OpenAPI
  getDistricts: async (provinceId: string): Promise<AdministrativeUnit[]> => {
    try {
      const res = await axios.get(
        `${VIETNAM_PROVINCES_API}/p/${provinceId}?depth=2`
      );
      const districts = res.data?.districts || [];
      return districts.map((item: any) => ({
        label: item.name,
        value: String(item.code),
        name: item.name,
        code: item.code,
      }));
    } catch (error) {
      console.error("Failed to fetch districts:", error);
      return [];
    }
  },

  // Lấy danh sách phường/xã theo mã quận/huyện
  getWards: async (districtCode: string): Promise<AdministrativeUnit[]> => {
    if (!districtCode) return [];
    const cacheKey = String(districtCode);
    if (cache.wards.has(cacheKey)) {
      return cache.wards.get(cacheKey)!;
    }
    try {
      const res = await axios.get(
        `${VIETNAM_PROVINCES_API}/d/${districtCode}?depth=2`
      );
      const wards: any[] = res.data?.wards || [];
      const formatted: AdministrativeUnit[] = wards.map((item: any) => ({
        label: item.name,
        value: String(item.code),
        code: item.code,
        name: item.name,
      }));
      cache.wards.set(cacheKey, formatted);
      return formatted;
    } catch (error) {
      console.error(
        `Failed to fetch wards for district ${districtCode}:`,
        error
      );
      return [];
    }
  },

  // Lấy danh sách phường/xã/thị trấn trực tiếp theo tỉnh/thành phố (Mô hình chính quyền 2 cấp: Tỉnh -> Xã/Phường)
  getWardsByProvince: async (
    provinceCode: string
  ): Promise<AdministrativeUnit[]> => {
    if (!provinceCode) return [];
    const cacheKey = `prov_${provinceCode}`;
    if (cache.wards.has(cacheKey)) {
      return cache.wards.get(cacheKey)!;
    }
    try {
      // v2 hỗ trợ wards trực tiếp dưới province qua depth=2
      let res = await axios.get(
        `${VIETNAM_PROVINCES_API}/p/${provinceCode}?depth=2`
      );
      let directWards: any[] = res.data?.wards || [];
      let districts: any[] = res.data?.districts || [];

      // Nếu không có direct wards và không có districts, thử depth=3
      if (directWards.length === 0 && districts.length === 0) {
        res = await axios.get(
          `${VIETNAM_PROVINCES_API}/p/${provinceCode}?depth=3`
        );
        directWards = res.data?.wards || [];
        districts = res.data?.districts || [];
      }

      const allWards: AdministrativeUnit[] = [];

      if (directWards.length > 0) {
        directWards.forEach((w: any) => {
          allWards.push({
            label: w.name,
            value: String(w.code),
            code: w.code,
            name: w.name,
          });
        });
      } else if (districts.length > 0) {
        districts.forEach((dist: any) => {
          const wards: any[] = dist.wards || [];
          wards.forEach((w: any) => {
            allWards.push({
              label: w.name,
              value: String(w.code),
              code: w.code,
              name: w.name,
            });
          });
        });
      }

      // Sắp xếp theo tên Phường/Xã
      allWards.sort((a, b) =>
        (a.name || a.label).localeCompare(b.name || b.label, "vi")
      );

      cache.wards.set(cacheKey, allWards);
      return allWards;
    } catch (error) {
      console.error(
        `Failed to fetch wards for province ${provinceCode}:`,
        error
      );
      return [];
    }
  },
};
