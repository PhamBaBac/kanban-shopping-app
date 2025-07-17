import React, { useEffect, useState } from "react";
import { Modal, Image, Typography, message, Input, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { addAuth, authSelector } from "@/redux/reducers/authReducer";
import { userService, authService } from "@/services";

const { Title, Paragraph } = Typography;

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TwoFactorAuthSettings = ({ onSuccess, onCancel }: Props) => {
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);

  const [qrModalVisible, setQrModalVisible] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const getQRCode = async () => {
    try {
      const response = await userService.getSecretImageUri();
      setQrCodeUrl(response);
    } catch (error) {
      console.error("Error getting QR Code:", error);
      message.error("Could not fetch QR code.");
      handleClose();
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      return message.warning("Please enter a valid 6-digit code.");
    }

    try {
      setLoading(true);
     const res = await userService.enable2FA(auth.email, verificationCode);

      if (res) {
        // const updated = { ...res, email: auth.email };
        // dispatch(addAuth(updated));
        // localStorage.setItem("authData", JSON.stringify(updated));
        message.success("Two-factor authentication enabled successfully!");
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        message.error("The verification code is incorrect.");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      message.error("Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQrModalVisible(false);
    if (onCancel) onCancel();
  };

  useEffect(() => {
    getQRCode();
  }, []);

  return (
    <Modal
      title="Set up Two-Factor Authentication"
      open={qrModalVisible}
      footer={null}
      onCancel={handleClose}
      width={400}
    >
      <div style={{ textAlign: "center" }}>
        <Title level={4}>Scan QR Code</Title>
        <Paragraph>
          Use an authenticator app like Google Authenticator or Authy to scan
          the code below:
        </Paragraph>

        {qrCodeUrl && (
          <Image
            src={qrCodeUrl}
            alt="QR Code"
            style={{ maxWidth: "100%", marginBottom: 20 }}
            preview={false}
          />
        )}

        <Paragraph>Enter the 6-digit code from your app to complete:</Paragraph>

        <Input
          placeholder="Enter 6-digit code"
          maxLength={6}
          value={verificationCode}
          onChange={(e) =>
            setVerificationCode(e.target.value.replace(/\D/g, ""))
          }
          style={{
            width: "200px",
            textAlign: "center",
            fontSize: "18px",
            letterSpacing: "2px",
            marginBottom: "16px",
          }}
        />

        <br />

        <Button
          type="primary"
          onClick={handleVerify}
          loading={loading}
          disabled={verificationCode.length !== 6}
        >
          Verify
        </Button>
      </div>
    </Modal>
  );
};

export default TwoFactorAuthSettings;
