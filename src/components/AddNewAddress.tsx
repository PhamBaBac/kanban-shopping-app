/** @format */

import handleAPI from "@/apis/handleApi";
import { SelectModel } from "@/models/FormModel";
import { AddressModel } from "@/models/Products";
import { authSelector } from "@/redux/reducers/authReducer";
import { replaceName } from "@/utils/replaceName";
import { Button, Checkbox, Form, Input, Select, Typography, Spin } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const OPENAPILOCATION = `https://open.oapi.vn/location`;

interface Props {
  onAddnew?: (val: AddressModel) => void;
  values?: AddressModel;
  onSelectAddress?: (val: string) => void;
}

const AddNewAddress = (props: Props) => {
  const { onAddnew, values, onSelectAddress } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [locationData, setLocationData] = useState<{
    provinces: SelectModel[];
    districts: SelectModel[];
    wards: SelectModel[];
  }>({
    provinces: [],
    districts: [],
    wards: [],
  });
  const [locationValues, setLocationValues] = useState<any>({
    ward: "",
    district: "",
    province: "",
  });
  const [isDefault, setIsDefault] = useState(false);

  const [form] = Form.useForm();
  const auth = useSelector(authSelector);

  useEffect(() => {
    getProvinces(`provinces`);
  }, []);

  useEffect(() => {
    if (values) {
      form.setFieldsValue(values);
      setIsDefault(values?.isDefault ?? false);
      const vals = values.address.split(",");

      handleFormatForms(vals);

      vals.splice(vals.length - 3);
      form.setFieldValue("houseNo", vals.toString());
    }
  }, [values]);

  const handleFormatForms = async (vals: string[]) => {
    try {
      const provinceVal = vals[vals.length - 1];

      const provinceSelect = locationData.provinces.find(
        (element) => element.label === provinceVal.trim()
      );

      if (provinceSelect) {
        form.setFieldValue("province", provinceSelect.value);
        setLocationValues({
          ...locationValues,
          province: provinceSelect.value,
        });
        await getProvinces(`districts`, provinceSelect.value);
      }

      const districtVal = vals[vals.length - 2];
      const districtSelect = locationData.districts.find(
        (element) => element.label === districtVal.trim()
      );

      if (districtSelect) {
        setLocationValues({
          ...locationValues,
          district: districtSelect.value,
        });

        form.setFieldValue("district", districtSelect.value);
        await getProvinces(`wards`, districtSelect.value);
      }

      const wardVal = vals[vals.length - 3];

      const wardSelect = locationData.wards.find(
        (element) => element.label === wardVal.trim()
      );

      if (wardSelect) {
        setLocationValues({ ...locationValues, ward: wardSelect.value });
        form.setFieldValue("ward", wardSelect.value);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getProvinces = async (url: string, id?: string) => {
    const api = `${OPENAPILOCATION}/${url}${
      id ? `/${id}` : ""
    }?page=0&size=1000`;

    // Set loading state based on type
    if (url === "provinces") setIsLoadingProvinces(true);
    else if (url === "districts") setIsLoadingDistricts(true);
    else if (url === "wards") setIsLoadingWards(true);

    try {
      const res: any = await axios(api);

      // Handle the new API response structure
      const data = res.data?.data || res.data || res;
      const formattedData = data.map((item: any) => ({
        label: item.name,
        value: item.id,
      }));

      const val: any = {};
      val[url] = formattedData;

      setLocationData({ ...locationData, ...val });
    } catch (error) {
      console.log(error);
    } finally {
      // Clear loading state
      if (url === "provinces") setIsLoadingProvinces(false);
      else if (url === "districts") setIsLoadingDistricts(false);
      else if (url === "wards") setIsLoadingWards(false);
    }
  };

  const handleProvinceChange = async (val: string) => {
    // Reset district and ward when province changes
    form.setFieldsValue({ district: undefined, ward: undefined });
    setLocationValues({
      ...locationValues,
      province: val,
      district: "",
      ward: "",
    });
    setLocationData((prev) => ({
      ...prev,
      districts: [],
      wards: [],
    }));

    await getProvinces(`districts`, val);
  };

  const handleDistrictChange = async (val: string) => {
    // Reset ward when district changes
    form.setFieldValue("ward", undefined);
    setLocationValues({
      ...locationValues,
      district: val,
      ward: "",
    });
    setLocationData((prev) => ({
      ...prev,
      wards: [],
    }));

    await getProvinces(`wards`, val);
  };

  const handleAddNewAddress = async (datas: any) => {
    let address = datas.houseNo ? `${datas.houseNo}` : "";

    const items: any = { ...locationData };

    for (const i in locationValues) {
      const seletecs: SelectModel[] = items[`${i}s`];
      const item = seletecs.find(
        (element) => element.value === locationValues[i]
      );

      if (item) {
        address += `, ${item.label}`;
      }
    }
    delete datas.houseNo;
    datas["address"] = address;

    for (const i in datas) {
      datas[i] = datas[i] || datas[i] === false ? datas[i] : "";
    }

    datas["isDefault"] = isDefault;
    datas["createdBy"] = auth.userId;
    if (onSelectAddress) {
      let val = datas["address"];

      for (const i in locationValues) {
        val += items[i] ? items[i].val : "";
      }

      onSelectAddress(val);
    } else {
      setIsLoading(true);
      try {
        const res: any = await handleAPI(
          `/addresses/${values ? `update-address?id=${values.id}` : "create"}`,
          datas,
          values ? "put" : "post"
        );

        onAddnew && onAddnew(res.result);
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
