import { useState, useEffect } from "react";
import { message } from "antd";
import { addressService, CreateAddressData } from "@/services";
import { AddressModel } from "@/models/Products";

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
      message.success("Address created successfully");
      await fetchAddresses(); // Refresh addresses
    } catch (error: any) {
      message.error(error.message || "Failed to create address");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAddress = async (id: string, data: CreateAddressData) => {
    setIsLoading(true);
    try {
      await addressService.updateAddress(id, data);
      message.success("Address updated successfully");
      await fetchAddresses(); // Refresh addresses
    } catch (error: any) {
      message.error(error.message || "Failed to update address");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await addressService.deleteAddress(id);
      message.success("Address deleted successfully");
      await fetchAddresses(); // Refresh addresses
    } catch (error: any) {
      message.error("Failed to delete address");
      throw error;
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    try {
      await addressService.setDefaultAddress(addressId);
      message.success("Default address set successfully");
      await fetchAddresses(); // Refresh addresses
    } catch (error: any) {
      message.error("Failed to set default address");
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
