/** @format */

import { Form, Input, Button, Upload, UploadFile } from "antd";
import { BiCamera, BiEdit } from "react-icons/bi";
import { FaLocationDot } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { addAuth, authSelector } from "@/redux/reducers/authReducer";
import { uploadFile } from "@/utils/uploadFile";
import { AddressModel } from "@/models/Products";
import AddressModal from "./AddNewAddress";
import { addressService, userService } from "@/services";
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
    form.setFieldsValue(auth);
    // Khởi tạo avatarList với avatar hiện tại nếu có
    if (auth.avatar) {
      setAvatarList([
        {
          uid: "-1",
          name: "avatar",
          status: "done",
          url: auth.avatar,
        } as UploadFile,
      ]);
    }
    // Lấy địa chỉ từ API
    getAddress();
  }, [auth.avatar]);

  const getAddress = async () => {
    try {
      const res = await addressService.getAddresses();
      if (res && res.length > 0) {
        const defaultAddress =
          res.find((addr: AddressModel) => addr.isDefault) || res[0];
        setAddress(defaultAddress);
        // Cập nhật form với địa chỉ mặc định
        form.setFieldValue("address", defaultAddress.address);
        form.setFieldValue("phoneNumber", defaultAddress.phoneNumber);
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

    try {
      if (avatarList.length > 0) {
        delete data.photoUrl;
        const file = avatarList[0];
        const url = await uploadFile(file.originFileObj);

        data.photoURL = url;

        await updateProfile(data);
      } else {
        await updateProfile(data);
      }
    } catch (error) {
      console.log(error);
      setIsUpdating(false);
    }
  };

  const updateProfile = async (data: any) => {
    try {
      const res = await userService.updateProfile({
        ...data,
        name: `${data.firstName} ${data.lastName}`,
      });

      // Cập nhật avatar trong state nếu có avatar mới
      const updatedAuth = { ...auth, ...res };
      if (data.photoURL) {
        updatedAuth.avatar = data.photoURL;
      }

      dispatch(addAuth(updatedAuth));
    } catch (error) {
      console.log(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Form
        disabled={isUpdating}
        layout="vertical"
        onFinish={handleVaues}
        size="large"
        form={form}
      >
        <div className="row d-flex">
          <div className="col">
            <Form.Item name={"photoUrl"}>
              <Upload
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
                style={{
                  width: 50,
                }}
              >
                {avatarList.length === 0 && (
                  <BiCamera size={28} className="text-muted" />
                )}
              </Upload>
            </Form.Item>
          </div>

          <div className="col text-right">
            <Button
              type="primary"
              onClick={() => form.submit()}
              icon={<BiEdit size={22} />}
            >
              Save
            </Button>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <Form.Item name={"firstName"} label="First name">
              <Input allowClear />
            </Form.Item>
          </div>
          <div className="col">
            <Form.Item name={"lastName"} label="Last name">
              <Input allowClear />
            </Form.Item>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <Form.Item name={"phoneNumber"} label="Phone number">
              <Input allowClear />
            </Form.Item>
          </div>
          <div className="col">
            <Form.Item name={"email"} label="Email address">
              <Input allowClear />
            </Form.Item>
          </div>
        </div>
        <Form.Item name={"address"} label="Address">
          <Input
            allowClear
            placeholder={address?.address || "Enter your address"}
            suffix={
              <FaLocationDot
                onClick={() => setIsVisibleModalAddress(true)}
                size={22}
                className="text-danger m-0 cursor-pointer"
                title="Select from saved addresses"
              />
            }
          />
        </Form.Item>
      </Form>

      <AddressModal
        onAddAddress={(val) => {
          form.setFieldValue("address", val);
          // Cập nhật lại danh sách địa chỉ sau khi thêm mới
          getAddress();
        }}
        visible={isVisibleModalAddress}
        onClose={() => setIsVisibleModalAddress(false)}
      />
    </>
  );
};

export default PersionalInfomations;
