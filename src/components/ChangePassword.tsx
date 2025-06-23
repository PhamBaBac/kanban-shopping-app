/** @format */

import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Space,
  Divider,
  Modal,
} from "antd";
import {
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import handleAPI from "@/apis/handleApi";
import { useDispatch, useSelector } from "react-redux";
import { authSelector, removeAuth } from "@/redux/reducers/authReducer";
import { useRouter } from "next/router";
import { removeCarts } from "@/redux/reducers/cartReducer";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const auth = useSelector(authSelector);
  const dispatch = useDispatch();
const router = useRouter();
  const onFinish = async (values: ChangePasswordForm) => {
    console.log("Form submitted with values:", values);

    if (values.newPassword !== values.confirmPassword) {
      message.error("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }

    if (values.currentPassword === values.newPassword) {
      message.error("Mật khẩu mới không được trùng với mật khẩu hiện tại!");
      return;
    }

    try {
      setLoading(true);
      const response: any = await handleAPI(
        "/users/changePassword",
        {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          confirmationPassword: values.confirmPassword,
        },
        "patch"
      );

      if (response) {
        Modal.confirm({
          type: "success",
          title: "Thành công",
          //Dung tiep hay dang xuat
          content: "Đổi mật khẩu thành công! Bạn có muốn đăng xuất không?",
          onOk: async () =>{ await axios.post(`http://localhost:8080/api/v1/auth/logout`, null, {
            headers: {
              Authorization: `Bearer ${auth.accessToken}`,
            },
            withCredentials: true,
          });

          localStorage.clear();
          router.push("/");
          dispatch(removeAuth({}));
          dispatch(removeCarts());},
          cancelText: "Back to home",
          onCancel: () => router.push("/"),
        });
        form.resetFields();
      } else {
        message.error("Đổi mật khẩu thất bại!");
      }
    } catch (error: any) {
      console.error("Đổi mật khẩu lỗi:", error);
      message.error(error?.message || "Đổi mật khẩu thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    form.submit();
  };

  return (
    <Card
      title={
        <Space>
          <LockOutlined />
          <span>Đổi mật khẩu</span>
        </Space>
      }
      style={{ maxWidth: 600, margin: "20px auto" }}
    >
      <Paragraph>
        Đổi mật khẩu để bảo mật tài khoản của bạn. Mật khẩu mới phải đáp ứng các
        yêu cầu bảo mật.
      </Paragraph>

      <Divider />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="Mật khẩu hiện tại"
          name="currentPassword"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu hiện tại!" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Nhập mật khẩu hiện tại"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item
          label="Mật khẩu mới"
          name="newPassword"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới!" },
            { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự!" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Nhập mật khẩu mới"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item
          label="Xác nhận mật khẩu mới"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Mật khẩu xác nhận không khớp!")
                );
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Nhập lại mật khẩu mới"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            <strong>Yêu cầu mật khẩu:</strong>
          </Text>
          <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
            <li>Ít nhất 8 ký tự</li>
            <li>Bao gồm chữ hoa và chữ thường</li>
            <li>Bao gồm ít nhất 1 số</li>
            <li>Bao gồm ít nhất 1 ký tự đặc biệt (@$!%*?&)</li>
          </ul>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ width: "100%" }}
            onClick={handleSubmit}
          >
            Đổi mật khẩu
          </Button>
        </Form.Item>
      </Form>

      <Divider />

      <div style={{ textAlign: "center" }}>
        <Text type="secondary">
          <strong>Lưu ý:</strong> Sau khi đổi mật khẩu thành công, bạn sẽ cần
          đăng nhập lại với mật khẩu mới.
        </Text>
      </div>
    </Card>
  );
};

export default ChangePassword;
