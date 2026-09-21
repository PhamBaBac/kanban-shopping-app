/** @format */

import { AddressModel } from "@/models/Products";
import { addressService } from "@/services";
import {
  Button,
  Divider,
  message,
  Modal,
  Spin,
} from "antd";
import React, { useEffect, useState } from "react";
import { BiEdit } from "react-icons/bi";
import { IoCheckmarkCircle, IoCheckmarkCircleOutline } from "react-icons/io5";
import { TbTrash } from "react-icons/tb";
import AddNewAddress from "@/components/AddNewAddress";

interface Props {
  onSelectAddress: (val: AddressModel) => void;
}

const ShipingAddress = (props: Props) => {
  const { onSelectAddress } = props;

  const [addressSelected, setAddressSelected] = useState<AddressModel>();
  const [address, setAddress] = useState<AddressModel[]>([]);
  const [isloading, setIsloading] = useState(false);
  const [isEditAddress, setIsEditAddress] = useState<AddressModel>();

  useEffect(() => {
    getAddress();
  }, []);

  useEffect(() => {
    if (address && address.length > 0) {
      const item = address.find((element) => element.isDefault);
      item && setAddressSelected(item);
    }
  }, [address]);

  const getAddress = async () => {
    setIsloading(true);
    try {
      const res = await addressService.getAddresses();
      setAddress(res);
    } catch (error) {
      console.log(error);
    } finally {
      setIsloading(false);
    }
  };

  const handleRemoveAddress = async (item: AddressModel) => {
    try {
      await addressService.deleteAddress(item.id);

      const items = [...address];
      const index = items.findIndex((element) => element.id === item.id);
      if (index !== -1) {
        items.splice(index, 1);
      }

      if (item.isDefault && items.length > 0) {
        const val = items[0];

        await addressService.setDefaultAddress(val.id);

        items[0].isDefault = true;
      }
      setAddress(items);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeliverAddress = () => {
    // Check if there are any addresses
    if (address.length === 0) {
      message.warning(
        "Bạn chưa có địa chỉ nào. Vui lòng tạo địa chỉ mới trước khi tiếp tục."
      );
      return;
    }

    // Check if an address is selected
    if (!addressSelected) {
      message.warning("Vui lòng chọn một địa chỉ giao hàng để tiếp tục.");
      return;
    }

    // If both conditions are met, proceed with address selection
    onSelectAddress(addressSelected);
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "20px",
            fontWeight: 700,
            color: "#131118",
            margin: 0,
          }}
        >
          Chọn địa chỉ nhận hàng
        </h2>
        <span style={{ fontSize: "13px", color: "#6B7280" }}>
          Chọn một trong các địa chỉ có sẵn dưới đây hoặc tạo địa chỉ mới để nhận hàng
        </span>
      </div>

      {isloading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {address.length === 0 ? (
            <div
              style={{
                background: "#FAFAFA",
                border: "1px dashed #D1D5DB",
                borderRadius: "12px",
                padding: "32px 16px",
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              <span style={{ color: "#6B7280", fontSize: "14px" }}>
                Bạn chưa có địa chỉ nhận hàng nào. Vui lòng nhập thông tin địa chỉ mới bên dưới.
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {address.map((item) => {
                const isSelected = item.id === addressSelected?.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setAddressSelected(item)}
                    style={{
                      cursor: "pointer",
                      padding: "16px",
                      borderRadius: "12px",
                      background: isSelected ? "#FAFAFA" : "#FFFFFF",
                      border: isSelected ? "2px solid #131118" : "1px solid #E5E7EB",
                      boxShadow: isSelected
                        ? "0 4px 12px rgba(0, 0, 0, 0.08)"
                        : "0 1px 3px rgba(0, 0, 0, 0.03)",
                      transition: "all 0.2s ease",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-heading)",
                              fontSize: "15px",
                              fontWeight: 700,
                              color: "#131118",
                            }}
                          >
                            {item.name}
                          </span>
                          {item.isDefault && (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                background: "#131118",
                                color: "#FFFFFF",
                                padding: "2px 8px",
                                borderRadius: "4px",
                              }}
                            >
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div>
                          {isSelected ? (
                            <IoCheckmarkCircle size={22} color="#131118" />
                          ) : (
                            <IoCheckmarkCircleOutline size={22} color="#D1D5DB" />
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "6px" }}>
                        Số điện thoại: <strong style={{ color: "#131118" }}>{item.phoneNumber}</strong>
                      </div>

                      <div
                        style={{
                          fontSize: "13px",
                          color: "#374151",
                          lineHeight: "1.4",
                          marginBottom: "12px",
                        }}
                      >
                        {item.address}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                        borderTop: "1px solid #F3F4F6",
                        paddingTop: "10px",
                        marginTop: "auto",
                      }}
                    >
                      <Button
                        size="small"
                        icon={<BiEdit size={16} />}
                        type="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditAddress(item);
                        }}
                        style={{ fontSize: "12px", color: "#4B5563" }}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        icon={<TbTrash size={16} />}
                        danger
                        type="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          Modal.confirm({
                            title: "Xác nhận xóa",
                            content: "Bạn có chắc chắn muốn xóa địa chỉ này không?",
                            okText: "Xóa",
                            cancelText: "Hủy",
                            okButtonProps: { danger: true },
                            onOk: () => handleRemoveAddress(item),
                          });
                        }}
                        style={{ fontSize: "12px" }}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginBottom: "32px" }}>
            <Button
              onClick={handleDeliverAddress}
              size="large"
              type="primary"
              disabled={!addressSelected}
              style={{
                background: "#131118",
                color: "#FFFFFF",
                borderRadius: "8px",
                fontWeight: 600,
                height: "44px",
                padding: "0 28px",
                cursor: !addressSelected ? "not-allowed" : "pointer",
              }}
            >
              Giao đến địa chỉ này
            </Button>
          </div>
        </>
      )}

      <Divider style={{ borderColor: "#E5E7EB", margin: "24px 0" }} />

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <AddNewAddress
          onAddnew={(val) => {
            const items = [...address];
            if (isEditAddress) {
              const index = items.findIndex(
                (element) => element.id === isEditAddress.id
              );

              if (index !== -1) {
                items[index] = val;
              }

              setIsEditAddress(undefined);
            } else {
              items.push(val);
            }

            setAddress(items);
          }}
          values={isEditAddress}
        />
      </div>
    </div>
  );
};

export default ShipingAddress;
