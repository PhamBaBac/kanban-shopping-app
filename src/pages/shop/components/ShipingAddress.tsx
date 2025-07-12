/** @format */

import { AddressModel } from "@/models/Products";
import { addressService } from "@/services";
import {
  Button,
  Card,
  Divider,
  List,
  message,
  Modal,
  Space,
  Spin,
  Typography,
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
      <Typography.Title level={3}>Select delivery address</Typography.Title>
      <Typography.Paragraph type="secondary">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem et
        architecto laudantium dolores rerum itaque officia totam exercitationem
        voluptate magnam, aliquid omnis. Perferendis quos doloremque itaque
        minima laudantium iste consequuntur.
      </Typography.Paragraph>
      {isloading ? (
        <Spin />
      ) : (
        <>
          <List
            grid={{ gutter: 16, column: 2 }}
            dataSource={address}
            renderItem={(item) => (
              <List.Item key={item.id}>
                <a>
                  <Card
                    actions={[
                      <Button
                        key="btnEditAddress"
                        icon={<BiEdit size={18} />}
                        type="link"
                        onClick={() => setIsEditAddress(item)}
                      >
                        Edit
                      </Button>,
                      <Button
                        onClick={() =>
                          Modal.confirm({
                            title: "Confirm",
                            content:
                              "Are you sure you want to remove this address?",
                            onOk: () => handleRemoveAddress(item),
                          })
                        }
                        key="btnEditAddress"
                        icon={<TbTrash size={18} />}
                        danger
                        type="text"
                      >
                        Delete
                      </Button>,
                    ]}
                    className="shadow-hover"
                    color="#e0e0e0"
                    onClick={() => setAddressSelected(item)}
                  >
                    <Space
                      className="d-flex"
                      style={{ justifyContent: "space-between" }}
                    >
                      <Typography.Title level={5}>{item.name}</Typography.Title>
                      {item.id === addressSelected?.id ? (
                        <IoCheckmarkCircle size={24} />
                      ) : (
                        <IoCheckmarkCircleOutline size={24} />
                      )}
                    </Space>
                    <Typography.Paragraph>{item.address}</Typography.Paragraph>
                  </Card>
                </a>
              </List.Item>
            )}
          />
        </>
      )}

      <Button
        className="mt-4"
        onClick={handleDeliverAddress}
        size="large"
        type="primary"
      >
        Deliver address
      </Button>

      <Divider />
      <div className="mt-4">
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
