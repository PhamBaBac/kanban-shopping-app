import React, { useEffect, useState } from "react";
import { Modal, Image, Typography, message, Input, Button } from "antd";
import handleAPI from "@/apis/handleApi";
import { useDispatch, useSelector } from "react-redux";
import { addAuth, authSelector } from "@/redux/reducers/authReducer";

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
      const response: any = await handleAPI("/users/secretImageUri");
      setQrCodeUrl(response);
    } catch (error) {
      console.error("Error getting QR Code:", error);
      message.error("Không thể lấy mã QR");
      handleClose();
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      return message.warning("Vui lòng nhập đúng mã gồm 6 số.");
    }

    try {
      setLoading(true);
      const res: any = await handleAPI(
        "/auth/verify",
        { email: auth.email, code: verificationCode },
        "post"
      );

      if (res.result) {
        const updated = { ...res.result, email: auth.email };
        dispatch(addAuth(updated));
        localStorage.setItem("authData", JSON.stringify(updated));
        message.success("Bật xác thực 2 yếu tố thành công!");
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        message.error("Mã xác thực không chính xác.");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      message.error("Xác thực thất bại.");
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
      title="Thiết lập xác thực 2 yếu tố"
      open={qrModalVisible}
      footer={null}
      onCancel={handleClose}
      width={400}
    >
      <div style={{ textAlign: "center" }}>
        <Title level={4}>Quét mã QR</Title>
        <Paragraph>
          Dùng ứng dụng như Google Authenticator hoặc Authy để quét mã bên dưới:
        </Paragraph>

        {qrCodeUrl && (
          <Image
            src={qrCodeUrl}
            alt="QR Code"
            style={{ maxWidth: "100%", marginBottom: 20 }}
            preview={false}
          />
        )}

        <Paragraph>Nhập mã 6 số từ ứng dụng để hoàn tất:</Paragraph>

        <Input
          placeholder="Nhập mã 6 số"
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
          Xác nhận
        </Button>
      </div>
    </Modal>
  );
};

export default TwoFactorAuthSettings;
