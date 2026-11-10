/** @format */

import { Form, Input, Button, Upload, UploadFile, message } from "antd";
import { BiCamera, BiEdit } from "react-icons/bi";
import { FaLocationDot } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { addAuth, authSelector } from "@/redux/reducers/authReducer";
import { uploadFile } from "@/utils/uploadFile";
import { AddressModel } from "@/models/Products";
import AddressModal from "./AddNewAddress";
import { addressService, userService } from "@/services";
import { localDataNames } from "@/constants/appInfos";
import { useEffect, useState } from "react";

const PersionalInfomations = () => {
  const auth = useSelector(authSelector);
  const [avatarList, setAvatarList] = useState<UploadFile[]>([]);
  const [isVisibleModalAddress, setIsVisibleModalAddress] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [address, setAddress] = useState<AddressModel>();
  const [phoneNumber, setPhoneNumber] = useState<string>();

  const [form] = Form.useForm();
  const dispatch = useDispatch();

  useEffect(() => {
    form.setFieldsValue({
      firstName: auth?.firstName || auth?.firstname || "",
      lastName: auth?.lastName || auth?.lastname || "",
      email: auth?.email || "",
      phoneNumber: auth?.phoneNumber || "",
    });
    if (auth?.avatar || auth?.avatarUrl) {
      const avatarUrl = auth?.avatar || auth?.avatarUrl;
      setAvatarList([
        {
          uid: "-1",
          name: "avatar",
          status: "done",
          url: avatarUrl,
        } as UploadFile,
      ]);
    }
    getAddress();
  }, [auth]);

  const getAddress = async () => {
    try {
      const res = await addressService.getAddresses();
      if (res && res.length > 0) {
        const defaultAddress =
          res.find((addr: AddressModel) => addr.isDefault) || res[0];
        setAddress(defaultAddress);
        form.setFieldValue("address", defaultAddress.address);
        if (!form.getFieldValue("phoneNumber") && defaultAddress.phoneNumber) {
          form.setFieldValue("phoneNumber", defaultAddress.phoneNumber);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleVaues = async (values: any) => {
    const data: any = {};

    for (const i in values) {
      data[i] = values[i] ?? "";
    }

    setIsUpdating(true);
    try {
      // Tải ảnh lên Cloudinary nếu người dùng đã chọn một tệp mới từ máy
      if (avatarList.length > 0 && avatarList[0]?.originFileObj) {
        delete data.photoUrl;
        const file = avatarList[0];
        const url = await uploadFile(file.originFileObj, "avatars");

        data.photoURL = url;
        data.avatarUrl = url;
      } else if (auth?.avatar || auth?.avatarUrl) {
        data.photoURL = auth?.avatar || auth?.avatarUrl;
        data.avatarUrl = auth?.avatar || auth?.avatarUrl;
      }

      await updateProfile(data);
      message.success("Cập nhật thông tin cá nhân thành công!");
    } catch (error: any) {
      console.error("Cập nhật profile lỗi:", error);
      message.error(error?.message || "Cập nhật thông tin thất bại!");
    } finally {
      setIsUpdating(false);
    }
  };

  const updateProfile = async (data: any) => {
    const res = await userService.updateProfile({
      ...data,
      name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
    });

    const updatedAuth = {
      ...auth,
      ...(res || {}),
      firstName: data.firstName || res?.firstname || auth.firstName,
      lastName: data.lastName || res?.lastname || auth.lastName,
      avatar: data.photoURL || res?.avatarUrl || auth.avatar,
      avatarUrl: data.photoURL || res?.avatarUrl || auth.avatar,
    };

    dispatch(addAuth(updatedAuth));
    if (typeof window !== "undefined") {
      localStorage.setItem(localDataNames.authData, JSON.stringify(updatedAuth));
    }
  };

  return (
    <>
      <div className="profile-info-card">
        <Form
          disabled={isUpdating}
          layout="vertical"
          onFinish={handleVaues}
          form={form}
          className="profile-info-form"
        >
          {/* Avatar and Save Button Header */}
          <div className="profile-avatar-header">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Form.Item name={"photoUrl"} style={{ marginBottom: 0 }}>
                <Upload
                  className="profile-avatar-upload"
                  onChange={(val) => {
                    const { fileList } = val;
                    setAvatarList(
                      fileList.map((item) => ({
                        ...item,
                        url: item.originFileObj
                          ? URL.createObjectURL(item.originFileObj)
                          : item.url || "",
                      }))
                    );
                  }}
                  fileList={avatarList}
                  listType="picture-circle"
                  accept="image/*"
                  maxCount={1}
                >
                  {avatarList.length === 0 && (
                    <BiCamera size={22} className="text-muted" />
                  )}
                </Upload>
              </Form.Item>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#131118", lineHeight: 1.25 }}>
                  Ảnh đại diện
                </div>
                <div style={{ fontSize: "0.76rem", color: "#6B7280", marginTop: 2 }}>
                  PNG, JPG (tối đa 5MB)
                </div>
              </div>
            </div>

            <div>
              <Button
                type="primary"
                onClick={() => form.submit()}
                icon={<BiEdit size={16} />}
                loading={isUpdating}
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  height: 36,
                  padding: "0 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.85rem",
                }}
              >
                Lưu thay đổi
              </Button>
            </div>
          </div>

          {/* Form Fields with compact CSS Grid */}
          <div className="profile-form-grid">
            <div>
              <Form.Item name={"firstName"} label="Họ và tên đệm">
                <Input allowClear />
              </Form.Item>
            </div>
            <div>
              <Form.Item name={"lastName"} label="Tên">
                <Input allowClear />
              </Form.Item>
            </div>
            <div>
              <Form.Item name={"phoneNumber"} label="Số điện thoại">
                <Input allowClear />
              </Form.Item>
            </div>
            <div>
              <Form.Item name={"email"} label="Địa chỉ email">
                <Input disabled />
              </Form.Item>
            </div>
            <div className="grid-col-full">
              <Form.Item name={"address"} label="Địa chỉ">
                <Input
                  allowClear
                  placeholder={address?.address || "Nhập địa chỉ của bạn"}
                  suffix={
                    <FaLocationDot
                      onClick={() => setIsVisibleModalAddress(true)}
                      size={18}
                      className="text-danger m-0 cursor-pointer"
                      title="Chọn từ địa chỉ đã lưu"
                    />
                  }
                />
              </Form.Item>
            </div>
          </div>
        </Form>
      </div>

      <AddressModal
        onAddAddress={(val) => {
          form.setFieldValue("address", val);
          getAddress();
        }}
        visible={isVisibleModalAddress}
        onClose={() => setIsVisibleModalAddress(false)}
      />
    </>
  );
};

export default PersionalInfomations;
