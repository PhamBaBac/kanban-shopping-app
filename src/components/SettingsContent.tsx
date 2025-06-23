import { List, Select, Switch, message } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TwoFactorAuthSettings from "./TwoFactorAuthSettings";
import { authSelector, addAuth } from "@/redux/reducers/authReducer";
import { setTheme, themeSelector } from "@/redux/reducers/themeSlice";
import handleAPI from "@/apis/handleApi";

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
        await handleAPI(`/users/disable-tfa?email=${auth.email}`, {}, "put");

        // Update local state
        const updatedAuth = { ...auth, mfaEnabled: false };
        dispatch(addAuth(updatedAuth));
        localStorage.setItem("authData", JSON.stringify(updatedAuth));
        setIs2faEnabled(false);

        message.success("Two-factor authentication disabled successfully!");
      } catch (error) {
        console.error("Error disabling TFA:", error);
        message.error("Could not disable 2FA. Please try again.");
      } finally {
        setIsLoading2fa(false);
      }
    }
  };

  const settingsItems = [
    {
      key: "appearance",
      title: "Appearance",
      description: "Customize how your theme looks on your device",
      control: (
        <Select
          value={mode}
          onChange={handleThemeChange}
          style={{ width: 120 }}
        >
          <Select.Option value="light">Light</Select.Option>
          <Select.Option value="dark">Dark</Select.Option>
        </Select>
      ),
    },
    {
      key: "language",
      title: "Language",
      description: "Select your language",
      control: (
        <Select defaultValue="english" style={{ width: 120 }}>
          <Select.Option value="english">English</Select.Option>
          <Select.Option value="vietnamese">Vietnamese</Select.Option>
        </Select>
      ),
    },
    {
      key: "push-notifications",
      title: "Push Notifications",
      description: "Receive push notification",
      control: <Switch defaultChecked />,
    },
    {
      key: "desktop-notification",
      title: "Desktop Notification",
      description: "Receive push notification in desktop",
      control: <Switch defaultChecked />,
    },
    {
      key: "email-notifications",
      title: "Email Notifications",
      description: "Receive email notification",
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
            title="Two-factor Authentication"
            description="Keep your account secure by enabling 2FA via mail"
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
