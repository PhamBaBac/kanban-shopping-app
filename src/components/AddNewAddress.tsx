/** @format */

import { addressService } from "@/services";
import { AddressModel } from "@/models/Products";
import { authSelector } from "@/redux/reducers/authReducer";
import { Button, Checkbox, Form, Input, Select, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { replaceName } from "@/utils/replaceName";

interface Props {
  visible?: boolean;
  onAddAddress?: (val: AddressModel) => void;
  onAddnew?: (val: AddressModel) => void;
  values?: AddressModel;
  onSelectAddress?: (val: string) => void;
  onClose?: (val: string) => void;
}

const AddNewAddress = (props: Props) => {
  const { onAddnew, values, onSelectAddress } = props;
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [locationValues, setLocationValues] = useState({
    ward: "",
    district: "",
    province: "",
  });
  const [locationData, setLocationData] = useState<{
    provinces: any[];
    districts: any[];
    wards: any[];
  }>({
    provinces: [],
    districts: [],
    wards: [],
  });

  const auth = useSelector(authSelector);

  useEffect(() => {
    getProvinces();
  }, []);

  useEffect(() => {
    if (values) {
      form.setFieldsValue({
        name: values.name,
        phoneNumber: values.phoneNumber,
        houseNo: values.address,
        province: values.province,
        district: values.district,
        ward: values.ward,
      });
      setLocationValues({
        ward: values.ward,
        district: values.district,
        province: values.province,
      });
      setIsDefault(values.isDefault);
    }
  }, [values, form]);

  const handleFormatForms = async (vals: string[]) => {
    const items: any[] = [];
    for (const i in vals) {
      // Tìm trong provinces
      let item = locationData.provinces.find(
        (element) => element.value === vals[i]
      );

      // Nếu không tìm thấy trong provinces, tìm trong districts
      if (!item) {
        item = locationData.districts.find(
          (element) => element.value === vals[i]
        );
      }

      // Nếu không tìm thấy trong districts, tìm trong wards
      if (!item) {
        item = locationData.wards.find((element) => element.value === vals[i]);
      }

      if (item) {
        items.push(item);
      }
    }
    return items;
  };

  const getProvinces = async () => {
    setIsLoadingProvinces(true);
    try {
      const result = await addressService.getProvinces();
      setLocationData((prev) => ({
        ...prev,
        provinces: result,
      }));
    } catch (error) {
      console.error("Failed to fetch provinces:", error);
    } finally {
      setIsLoadingProvinces(false);
    }
  };

  const handleProvinceChange = async (val: string) => {
    console.log("Selected province value:", val);

    // Tìm province object để lấy thông tin chi tiết
    const selectedProvince = locationData.provinces.find(
      (p) => p.value === val
    );
    console.log("Selected province object:", selectedProvince);

    setLocationValues({
      ...locationValues,
      province: val,
      district: "",
      ward: "",
    });

    // Reset form fields
    form.setFieldsValue({
      district: undefined,
      ward: undefined,
    });

    setLocationData((prev) => ({
      ...prev,
      districts: [],
      wards: [],
    }));

    setIsLoadingDistricts(true);
    try {
      const result = await addressService.getDistricts(val);
      console.log("Districts result:", result);
      setLocationData((prev) => ({
        ...prev,
        districts: result,
      }));
    } catch (error) {
      console.error("Failed to fetch districts:", error);
    } finally {
      setIsLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (val: string) => {
    console.log("Selected district value:", val);

    setLocationValues({ ...locationValues, district: val, ward: "" });

    // Reset ward form field
    form.setFieldsValue({
      ward: undefined,
    });

    setLocationData((prev) => ({
      ...prev,
      wards: [],
    }));

    setIsLoadingWards(true);
    try {
      const result = await addressService.getWards(val);
      console.log("Wards result:", result);
      setLocationData((prev) => ({
        ...prev,
        wards: result,
      }));
    } catch (error) {
      console.error("Failed to fetch wards:", error);
    } finally {
      setIsLoadingWards(false);
    }
  };

  const handleAddNewAddress = async (datas: any) => {
    console.log("Form data received:", datas);
    console.log("Location values:", locationValues);

    const items = await handleFormatForms([
      datas.province,
      datas.district,
      datas.ward,
    ]);

    let address = datas.houseNo;
    // Add province, district, ward to address
    if (datas.province) {
      const provinceItem = items.find(
        (element) => element.value === datas.province
      );
      if (provinceItem) {
        address += `, ${provinceItem.label}`;
      }
    }
    if (datas.district) {
      const districtItem = items.find(
        (element) => element.value === datas.district
      );
      if (districtItem) {
        address += `, ${districtItem.label}`;
      }
    }
    if (datas.ward) {
      const wardItem = items.find((element) => element.value === datas.ward);
      if (wardItem) {
        address += `, ${wardItem.label}`;
      }
    }

    delete datas.houseNo;
    datas["address"] = address;

    // Thêm thông tin location vào datas để lưu xuống database
    datas["province"] = datas.province;
    datas["district"] = datas.district;
    datas["ward"] = datas.ward;

    console.log("Final data to save:", datas);

    for (const i in datas) {
      datas[i] = datas[i] || datas[i] === false ? datas[i] : "";
    }

    datas["isDefault"] = isDefault;
    datas["createdBy"] = auth.userId;

    if (onSelectAddress) {
      let val = datas["address"];
      onSelectAddress(val);
    } else {
      setIsLoading(true);
      try {
        let result;
        if (values) {
          result = await addressService.updateAddress(values.id!, datas);
        } else {
          result = await addressService.createAddress(datas);
        }

        onAddnew && onAddnew(result);
        form.resetFields();
        setLocationValues({ ward: "", district: "", province: "" });
        setLocationData((prev) => ({
          ...prev,
          districts: [],
          wards: [],
        }));
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <Typography.Title level={3}>Add a new address</Typography.Title>
      <Form
        form={form}
        onFinish={handleAddNewAddress}
        disabled={isLoading}
        size="large"
        layout="vertical"
      >
        <Form.Item
          name={"name"}
          label="Full Name"
          rules={[{ required: true, message: "Please enter your full name" }]}
        >
          <Input allowClear placeholder="Enter recipient's full name" />
        </Form.Item>
        <Form.Item
          name={"phoneNumber"}
          label="Phone Number"
          rules={[
            { required: true, message: "Please enter your phone number" },
            {
              pattern: /^[0-9]{10,11}$/,
              message: "Invalid phone number",
            },
          ]}
        >
          <Input type="tel" allowClear placeholder="Enter phone number" />
        </Form.Item>
        <Form.Item
          name={"houseNo"}
          label="Detailed Address"
          rules={[
            { required: true, message: "Please enter your detailed address" },
          ]}
        >
          <Input allowClear placeholder="House number, street name, etc." />
        </Form.Item>
        <Form.Item
          name={"province"}
          rules={[{ required: true, message: "Please select a province/city" }]}
          label="Province/City"
        >
          <Select
            disabled={locationData.provinces.length === 0}
            options={locationData["provinces"]}
            optionLabelProp="label"
            onChange={handleProvinceChange}
            showSearch
            placeholder="Select a province/city"
            notFoundContent={
              isLoadingProvinces ? <Spin size="small" /> : "Not found"
            }
            filterOption={(input, option) =>
              (replaceName(option?.label as string) ?? "").includes(
                replaceName(input)
              )
            }
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? "")
                .toLowerCase()
                .localeCompare((optionB?.label ?? "").toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item
          name={"district"}
          rules={[{ required: true, message: "Please select a district" }]}
          label="District"
        >
          <Select
            disabled={
              locationData.districts.length === 0 || !locationValues.province
            }
            onChange={handleDistrictChange}
            options={locationData["districts"]}
            optionLabelProp="label"
            showSearch
            placeholder="Select a district"
            notFoundContent={
              isLoadingDistricts ? <Spin size="small" /> : "Not found"
            }
            filterOption={(input, option) =>
              (replaceName(option?.label as string) ?? "").includes(
                replaceName(input)
              )
            }
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? "")
                .toLowerCase()
                .localeCompare((optionB?.label ?? "").toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item
          name={"ward"}
          rules={[{ required: true, message: "Please select a ward/commune" }]}
          label="Ward/Commune"
        >
          <Select
            disabled={
              locationData.wards.length === 0 || !locationValues.district
            }
            onChange={(val) =>
              setLocationValues({ ...locationValues, ward: val })
            }
            options={locationData["wards"]}
            optionLabelProp="label"
            showSearch
            placeholder="Select a ward/commune"
            notFoundContent={
              isLoadingWards ? <Spin size="small" /> : "Not found"
            }
            filterOption={(input, option) =>
              (replaceName(option?.label as string) ?? "").includes(
                replaceName(input)
              )
            }
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? "")
                .toLowerCase()
                .localeCompare((optionB?.label ?? "").toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item name={"isDefault"}>
          <Checkbox
            checked={isDefault}
            onChange={() => setIsDefault(!isDefault)}
          >
            Use as my default address
          </Checkbox>
        </Form.Item>
      </Form>

      <Button
        type="primary"
        size="large"
        onClick={() => form.submit()}
        loading={isLoading}
        style={{ width: "40%", marginBottom: 16 }}
      >
        {isLoading ? "Adding..." : "Add new address"}
      </Button>
    </div>
  );
};

export default AddNewAddress;
