import { useState, useEffect } from "react";
import { message } from "antd";
import { addressService, CreateAddressData } from "@/services";
import { AddressModel } from "@/models/Products";
import { showErrorMessage } from "@/utils/errorHandler";

interface UseAddressReturn {
  addresses: AddressModel[];
  defaultAddress: AddressModel | null;
  isLoading: boolean;
  error: string | null;
  fetchAddresses: () => Promise<void>;
  createAddress: (data: CreateAddressData) => Promise<void>;
  updateAddress: (id: string, data: CreateAddressData) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
}

export const useAddress = (): UseAddressReturn => {
  const [addresses, setAddresses] = useState<AddressModel[]>([]);
  const [defaultAddress, setDefaultAddressState] =
    useState<AddressModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await addressService.getAddresses();
      setAddresses(result);

      // Set default address
      if (result.length > 0) {
        const defaultAddr = result.find((addr) => addr.isDefault) || result[0];
        setDefaultAddressState(defaultAddr);
      }
    } catch (error: any) {
      setError(error.message || "Failed to fetch addresses");
      console.error("Failed to fetch addresses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAddress = async (data: CreateAddressData) => {
    setIsLoading(true);
    try {
      await addressService.createAddress(data);
      message.success("Thêm địa chỉ thành công!");
      await fetchAddresses(); // Refresh addresses
    } catch (error: any) {
      showErrorMessage(error, "Không thể thêm địa chỉ mới!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAddress = async (id: string, data: CreateAddressData) => {
    setIsLoading(true);
    try {
      await addressService.updateAddress(id, data);
      message.success("Cập nhật địa chỉ thành công!");
      await fetchAddresses(); // Refresh addresses
    } catch (error: any) {
      showErrorMessage(error, "Không thể cập nhật địa chỉ!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await addressService.deleteAddress(id);
      message.success("Xóa địa chỉ thành công!");
      await fetchAddresses(); // Refresh addresses
    } catch (error: any) {
      showErrorMessage(error, "Không thể xóa địa chỉ!");
      throw error;
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    try {
      await addressService.setDefaultAddress(addressId);
      message.success("Đặt làm địa chỉ mặc định thành công!");
      await fetchAddresses(); // Refresh addresses
    } catch (error: any) {
      showErrorMessage(error, "Không thể đặt làm địa chỉ mặc định!");
      throw error;
    }
  };

  return {
    addresses,
    defaultAddress,
    isLoading,
    error,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
};
