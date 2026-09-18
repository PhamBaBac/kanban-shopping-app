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
  Alert,
} from "antd";
import {
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { removeCarts } from "@/redux/reducers/cartReducer";
import axios from "axios";
import { userService } from "@/services";
import { useDispatch, useSelector } from "react-redux";
import { authSelector, removeAuth } from "@/redux/reducers/authReducer";
import { showErrorMessage } from "@/utils/errorHandler";

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

  const isOAuthUser = Boolean(auth?.provider && auth.provider !== "LOCAL");

  if (isOAuthUser) {
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
        <Alert
          type="info"
          showIcon
          message="Tài khoản đăng nhập mạng xã hội"
          description="Tài khoản của bạn được liên kết đăng nhập bằng mạng xã hội (Google / GitHub). Bạn không sử dụng mật khẩu nội bộ trên hệ thống nên không thể đổi mật khẩu tại đây. Mọi nhu cầu bảo mật vui lòng quản lý trực tiếp trên tài khoản Google / GitHub của bạn."
        />
        <div className="text-center mt-4">
          <Button type="primary" onClick={() => router.push("/profile?tab=edit")}>
            Quay lại thông tin cá nhân
          </Button>
        </div>
      </Card>
    );
  }

  const onFinish = async (values: ChangePasswordForm) => {
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
      await userService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmationPassword: values.confirmPassword,
      });

      // 1. Hiển thị thông báo toast thành công tức thì
      message.success("Đổi mật khẩu thành công!");

      // 2. Reset các ô nhập mật khẩu
      form.resetFields();

      // 3. Hiển thị hộp thoại xác nhận đăng xuất hoặc ở lại
      Modal.confirm({
        title: "Đổi mật khẩu thành công",
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        content:
          "Mật khẩu của bạn đã được thay đổi thành công! Bạn có muốn đăng xuất ngay để đăng nhập lại bằng mật khẩu mới không?",
        okText: "Đăng xuất ngay",
        cancelText: "Ở lại trang",
        okButtonProps: { type: "primary", danger: true },
        onOk: async () => {
          try {
            await axios.post(`http://localhost:8080/api/v1/auth/logout`, null, {
              headers: {
                Authorization: `Bearer ${auth?.accessToken}`,
              },
              withCredentials: true,
            });
          } catch (err) {
            console.error("Lỗi khi đăng xuất:", err);
          } finally {
            localStorage.clear();
            dispatch(removeAuth({}));
            dispatch(removeCarts());
            router.push("/auth/login");
          }
        },
        onCancel: () => {
          // Người dùng chọn ở lại trang hiện tại
        },
      });
    } catch (error: any) {
      console.error("Đổi mật khẩu lỗi:", error);
      showErrorMessage(error, "Đổi mật khẩu thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
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
