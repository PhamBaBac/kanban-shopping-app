/** @format */

import { addressService, AdministrativeUnit } from "@/services/addressService";
import { AddressModel } from "@/models/Products";
import { authSelector } from "@/redux/reducers/authReducer";
import { Button, Checkbox, Form, Input, message, Select, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface Props {
  visible?: boolean;
  onAddAddress?: (val: AddressModel) => void;
  onAddnew?: (val: AddressModel) => void;
  values?: AddressModel;
  onSelectAddress?: (val: string) => void;
  onClose?: () => void;
}

// Chuẩn hóa chuỗi tiếng Việt để tìm kiếm không dấu
const removeAccents = (str?: string): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
};

const AddNewAddress = (props: Props) => {
  const { onAddnew, values, onSelectAddress, onClose } = props;
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const [provinces, setProvinces] = useState<AdministrativeUnit[]>([]);
  const [wards, setWards] = useState<AdministrativeUnit[]>([]);

  const auth = useSelector(authSelector);

  useEffect(() => {
    loadProvinces();
  }, []);

  // Xử lý nạp dữ liệu khi sửa địa chỉ
  useEffect(() => {
    if (values) {
      let houseNo = values.address || "";
      // Loại bỏ phần hậu tố xã/phường, quận/huyện, tỉnh/thành khỏi chuỗi địa chỉ chi tiết
      if (values.ward && values.province) {
        const suffix2Tier = `, ${values.ward}, ${values.province}`;
        const suffix3Tier = values.district
          ? `, ${values.ward}, ${values.district}, ${values.province}`
          : "";

        if (suffix3Tier && houseNo.endsWith(suffix3Tier)) {
          houseNo = houseNo.slice(0, -suffix3Tier.length);
        } else if (houseNo.endsWith(suffix2Tier)) {
          houseNo = houseNo.slice(0, -suffix2Tier.length);
        }
      }

      form.setFieldsValue({
        name: values.name,
        phoneNumber: values.phoneNumber,
        houseNo: houseNo,
      });
      setIsDefault(values.isDefault ?? false);

      initializeForEdit(values);
    } else {
      form.resetFields();
      setIsDefault(false);
      setWards([]);
    }
  }, [values, form]);

  const loadProvinces = async () => {
    setIsLoadingProvinces(true);
    try {
      const res = await addressService.getProvinces();
      setProvinces(res);
      return res;
    } catch (error) {
      console.error("Failed to load provinces:", error);
      message.error("Không thể tải danh sách tỉnh/thành phố");
      return [];
    } finally {
      setIsLoadingProvinces(false);
    }
  };

  const initializeForEdit = async (addr: AddressModel) => {
    try {
      const provList =
        provinces.length > 0 ? provinces : await addressService.getProvinces();

      const prov = provList.find(
        (p) =>
          p.name === addr.province ||
          p.label === addr.province ||
          p.value === String(addr.province)
      );

      if (prov) {
        form.setFieldValue("province", prov.value);
        setIsLoadingWards(true);
        const wardList = await addressService.getWardsByProvince(prov.value);
        setWards(wardList);
        setIsLoadingWards(false);

        const w = wardList.find(
          (item) =>
            item.name === addr.ward ||
            item.label === addr.ward ||
            item.value === String(addr.ward)
        );
        if (w) {
          form.setFieldValue("ward", w.value);
        }
      }
    } catch (err) {
      console.error("Failed to initialize address for edit:", err);
    }
  };

  const handleProvinceChange = async (val: string) => {
    // Reset ward field
    form.setFieldsValue({
      ward: undefined,
    });
    setWards([]);

    if (!val) return;

    setIsLoadingWards(true);
    try {
      const wardList = await addressService.getWardsByProvince(val);
      setWards(wardList);
    } catch (error) {
      console.error("Failed to load wards for province:", error);
      message.error("Không thể tải danh sách phường/xã");
    } finally {
      setIsLoadingWards(false);
    }
  };

  const handleAddNewAddress = async (formData: any) => {
    setIsLoading(true);
    try {
      const selectedProvince = provinces.find(
        (p) => p.value === String(formData.province)
      );
      const selectedWard = wards.find(
        (w) => w.value === String(formData.ward)
      );

      const provinceName =
        selectedProvince?.name || selectedProvince?.label || formData.province;
      const wardName = selectedWard?.name || selectedWard?.label || formData.ward;

      const street = (formData.houseNo || "").trim();
      // Địa chỉ chuẩn chính quyền 2 cấp: [Số nhà/Đường], [Phường/Xã], [Tỉnh/Thành phố]
      const formattedAddress = `${street}, ${wardName}, ${provinceName}`;

      const payload = {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formattedAddress,
        province: provinceName,
        district: "", // Bỏ cấp huyện theo mô hình chính quyền 2 cấp
        ward: wardName,
        isDefault: !!isDefault,
        createdBy: auth.userId,
      };

      if (onSelectAddress) {
        onSelectAddress(formattedAddress);
      } else {
        let result: AddressModel;
        if (values && values.id) {
          result = await addressService.updateAddress(values.id, payload);
          message.success("Cập nhật địa chỉ thành công!");
        } else {
          result = await addressService.createAddress(payload);
          message.success("Thêm địa chỉ mới thành công!");
        }

        onAddnew && onAddnew(result);
        form.resetFields();
        setWards([]);
        onClose && onClose();
      }
    } catch (error: any) {
      console.error("Failed to save address:", error);
      message.error(error?.message || "Lỗi khi lưu địa chỉ. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const isEditing = !!values?.id;

  return (
    <div style={{ padding: "8px 4px" }}>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        {isEditing ? "Cập nhật địa chỉ nhận hàng" : "Thêm địa chỉ nhận hàng mới"}
      </Typography.Title>

      <Form
        form={form}
        onFinish={handleAddNewAddress}
        disabled={isLoading}
        size="large"
        layout="vertical"
        initialValues={{ isDefault: false }}
      >
        <Form.Item
          name="name"
          label="Họ và tên người nhận"
          rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
        >
          <Input allowClear placeholder="Ví dụ: Nguyễn Văn A" />
        </Form.Item>

        <Form.Item
          name="phoneNumber"
          label="Số điện thoại"
          rules={[
            { required: true, message: "Vui lòng nhập số điện thoại" },
            {
              pattern: /(84|0[3|5|7|8|9])+([0-9]{8})\b/,
              message: "Số điện thoại không hợp lệ (10 chữ số)",
            },
          ]}
        >
          <Input type="tel" allowClear placeholder="Ví dụ: 0912345678" />
        </Form.Item>

        {/* Phân cấp 2 tầng: Tỉnh/Thành phố -> Phường/Xã */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Form.Item
            name="province"
            label="Tỉnh / Thành phố"
            rules={[{ required: true, message: "Vui lòng chọn Tỉnh/Thành phố" }]}
          >
            <Select
              loading={isLoadingProvinces}
              options={provinces}
              onChange={handleProvinceChange}
              showSearch
              placeholder="Chọn Tỉnh / Thành phố"
              filterOption={(input, option) =>
                removeAccents(option?.label as string).includes(removeAccents(input))
              }
            />
          </Form.Item>

          <Form.Item
            name="ward"
            label="Phường / Xã / Thị trấn"
            rules={[{ required: true, message: "Vui lòng chọn Phường/Xã" }]}
          >
            <Select
              disabled={wards.length === 0}
              loading={isLoadingWards}
              options={wards}
              showSearch
              placeholder={
                wards.length === 0
                  ? "Chọn tỉnh/thành trước"
                  : "Chọn Phường / Xã / Thị trấn"
              }
              filterOption={(input, option) =>
                removeAccents(option?.label as string).includes(removeAccents(input))
              }
            />
          </Form.Item>
        </div>

        <Form.Item
          name="houseNo"
          label="Địa chỉ cụ thể (Số nhà, tên đường, thôn, xóm...)"
          rules={[{ required: true, message: "Vui lòng nhập địa chỉ cụ thể" }]}
        >
          <Input allowClear placeholder="Ví dụ: Số 12 ngõ 34, đường Giải Phóng" />
        </Form.Item>

        <Form.Item name="isDefault" valuePropName="checked" style={{ marginBottom: 20 }}>
          <Checkbox
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          >
            Đặt làm địa chỉ nhận hàng mặc định
          </Checkbox>
        </Form.Item>

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          {onClose && (
            <Button size="large" onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
          )}
          <Button
            type="primary"
            size="large"
            onClick={() => form.submit()}
            loading={isLoading}
            style={{ minWidth: 160 }}
          >
            {isEditing ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default AddNewAddress;
