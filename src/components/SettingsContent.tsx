import { List, Select, Switch, message } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TwoFactorAuthSettings from "./TwoFactorAuthSettings";
import { authSelector, addAuth } from "@/redux/reducers/authReducer";
import { setTheme, themeSelector } from "@/redux/reducers/themeSlice";
import { authService } from "@/services";

const SettingsContent = () => {
  const auth = useSelector(authSelector);
  const dispatch = useDispatch();
  const { mode } = useSelector(themeSelector);

  const [show2faModal, setShow2faModal] = useState(false);
  const [is2faEnabled, setIs2faEnabled] = useState(auth.mfaEnabled);
  const [isLoading2fa, setIsLoading2fa] = useState(false);

  const handleThemeChange = (value: "light" | "dark") => {
    dispatch(setTheme(value));
  };

  const handle2FASwitch = async (checked: boolean) => {
    if (checked && !is2faEnabled) {
      // Enable TFA - show setup modal
      setShow2faModal(true);
    } else if (!checked && is2faEnabled) {
      // Disable TFA - call disable API
      try {
        setIsLoading2fa(true);
        await authService.disable2FA(auth.email);

        // Update local state
        const updatedAuth = { ...auth, mfaEnabled: false };
        dispatch(addAuth(updatedAuth));
        localStorage.setItem("authData", JSON.stringify(updatedAuth));
        setIs2faEnabled(false);

        message.success("Đã tắt xác thực hai yếu tố (2FA) thành công!");
      } catch (error) {
        console.error("Error disabling TFA:", error);
        message.error("Không thể tắt 2FA. Vui lòng thử lại!");
      } finally {
        setIsLoading2fa(false);
      }
    }
  };

  const settingsItems = [
    {
      key: "appearance",
      title: "Giao diện",
      description: "Tùy chỉnh chế độ hiển thị sáng / tối trên thiết bị của bạn",
      control: (
        <Select
          value={mode}
          onChange={handleThemeChange}
          style={{ width: 130 }}
        >
          <Select.Option value="light">Sáng</Select.Option>
          <Select.Option value="dark">Tối</Select.Option>
        </Select>
      ),
    },
    {
      key: "language",
      title: "Ngôn ngữ",
      description: "Chọn ngôn ngữ hiển thị hệ thống",
      control: (
        <Select defaultValue="vietnamese" style={{ width: 130 }}>
          <Select.Option value="vietnamese">Tiếng Việt</Select.Option>
          <Select.Option value="english">English</Select.Option>
        </Select>
      ),
    },
    {
      key: "push-notifications",
      title: "Thông báo đẩy",
      description: "Nhận thông báo đẩy trực tiếp từ hệ thống",
      control: <Switch defaultChecked />,
    },
    {
      key: "desktop-notification",
      title: "Thông báo trên máy tính",
      description: "Hiển thị thông báo nổi trên màn hình máy tính",
      control: <Switch defaultChecked />,
    },
    {
      key: "email-notifications",
      title: "Thông báo qua Email",
      description: "Nhận thông báo đơn hàng và ưu đãi qua email",
      control: <Switch />,
    },
  ];

  return (
    <>
      <List itemLayout="horizontal">
        <List.Item
          actions={[
            <Switch
              checked={is2faEnabled}
              onChange={handle2FASwitch}
              loading={isLoading2fa}
            />,
          ]}
          style={{ borderBottom: "1px solid #f0f0f0", padding: "1.5rem 0" }}
        >
          <List.Item.Meta
            title="Xác thực hai yếu tố (2FA)"
            description="Bảo vệ tài khoản an toàn hơn bằng xác thực 2 bước"
          />
        </List.Item>

        {settingsItems.map((item) => (
          <List.Item
            key={item.key}
            actions={[item.control]}
            style={{ borderBottom: "1px solid #f0f0f0", padding: "1.5rem 0" }}
          >
            <List.Item.Meta title={item.title} description={item.description} />
          </List.Item>
        ))}
      </List>

      {show2faModal && (
        <TwoFactorAuthSettings
          onSuccess={() => {
            setIs2faEnabled(true);
            setShow2faModal(false);
          }}
          onCancel={() => {
            setIs2faEnabled(false);
            setShow2faModal(false);
          }}
        />
      )}
    </>
  );
};

export default SettingsContent;
