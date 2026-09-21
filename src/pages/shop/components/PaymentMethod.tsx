/** @format */

import { Button, Modal } from "antd";
import React, { useEffect, useState } from "react";
import CreditCardPayment from "./CreditCardPayment";
import {
  IoCashOutline,
  IoCardOutline,
  IoWalletOutline,
  IoLogoPaypal,
  IoCheckmarkCircle,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";

interface Props {
  onContinue: (val: any) => void;
}

export const methods = [
  {
    key: "cod",
    title: "Thanh toán khi nhận hàng (COD)",
    desc: "Thanh toán tiền mặt trực tiếp cho nhân viên giao hàng khi nhận hàng",
    icon: <IoCashOutline size={24} />,
    recommended: true,
  },
  {
    key: "vnpay",
    title: "Cổng thanh toán VNPay",
    desc: "Hỗ trợ quét mã VNPAY-QR, thẻ ATM nội địa và Internet Banking mọi ngân hàng",
    icon: <IoCardOutline size={24} />,
  },
  {
    key: "momo",
    title: "Ví điện tử MoMo",
    desc: "Thanh toán an toàn, liền mạch và tiện lợi qua ứng dụng Ví MoMo",
    icon: <IoWalletOutline size={24} />,
  },
  {
    key: "debit",
    title: "Thẻ tín dụng / Ghi nợ (Visa, Mastercard, JCB)",
    desc: "Hỗ trợ các loại thẻ thanh toán quốc tế phổ biến",
    icon: <IoCardOutline size={24} />,
  },
  {
    key: "paypal",
    title: "PayPal",
    desc: "Thanh toán quốc tế bảo mật qua tài khoản PayPal",
    icon: <IoLogoPaypal size={24} />,
  },
];

const PaymentMethod = (props: Props) => {
  const { onContinue } = props;

  const [methodSelected, setMethodSelected] = useState("cod");
  const [isVisibleModalPayment, setIsVisibleModalPayment] = useState(false);
  const [isEnableContineu, setIsEnableContineu] = useState(true);

  const renderPaymentDetail = () => {
    switch (methodSelected) {
      case "debit":
        return (
          <div
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px dashed #E5E7EB",
            }}
          >
            <CreditCardPayment onPayment={() => {}} />
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (methodSelected === "cod" || methodSelected === "vnpay" || methodSelected === "momo") {
      setIsEnableContineu(true);
    }
  }, [methodSelected]);

  const handlePayment = () => {
    if (methodSelected === "cod" || methodSelected === "vnpay" || methodSelected === "momo") {
      onContinue({ methodSelected });
    } else {
      setIsVisibleModalPayment(true);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "20px",
            fontWeight: 700,
            color: "#131118",
            margin: 0,
          }}
        >
          Chọn phương thức thanh toán
        </h2>
        <span style={{ fontSize: "13px", color: "#6B7280" }}>
          Lựa chọn phương thức thanh toán an toàn và thuận tiện nhất cho bạn
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
        {methods.map((item) => {
          const isSelected = item.key === methodSelected;
          return (
            <div
              key={item.key}
              onClick={() => setMethodSelected(item.key)}
              style={{
                cursor: "pointer",
                padding: "16px 18px",
                borderRadius: "12px",
                background: isSelected ? "#FAFAFA" : "#FFFFFF",
                border: isSelected ? "2px solid #131118" : "1px solid #E5E7EB",
                boxShadow: isSelected
                  ? "0 4px 12px rgba(0, 0, 0, 0.06)"
                  : "0 1px 3px rgba(0, 0, 0, 0.02)",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: isSelected ? "#131118" : "#F3F4F6",
                      color: isSelected ? "#FFFFFF" : "#4B5563",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#131118",
                        }}
                      >
                        {item.title}
                      </span>
                      {item.recommended && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            background: "#ECFDF5",
                            color: "#059669",
                            border: "1px solid #A7F3D0",
                            padding: "1px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          Khuyên dùng
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "12px", color: "#6B7280", display: "block", marginTop: "2px" }}>
                      {item.desc}
                    </span>
                  </div>
                </div>

                <div>
                  {isSelected ? (
                    <IoCheckmarkCircle size={22} color="#131118" />
                  ) : (
                    <IoCheckmarkCircleOutline size={22} color="#D1D5DB" />
                  )}
                </div>
              </div>

              {isSelected && renderPaymentDetail()}
            </div>
          );
        })}
      </div>

      <div>
        <Button
          disabled={!isEnableContineu}
          type="primary"
          onClick={handlePayment}
          size="large"
          style={{
            background: "#131118",
            color: "#FFFFFF",
            borderRadius: "8px",
            fontWeight: 600,
            height: "44px",
            padding: "0 28px",
            cursor: !isEnableContineu ? "not-allowed" : "pointer",
          }}
        >
          Tiếp tục xác nhận đơn
        </Button>
      </div>

      <Modal
        title="Thông báo thanh toán"
        open={isVisibleModalPayment}
        onCancel={() => setIsVisibleModalPayment(false)}
        footer={null}
        centered
      >
        <div style={{ padding: "16px 0", textAlign: "center" }}>
          <p style={{ color: "#6B7280" }}>
            Phương thức thanh toán này hiện đang bảo trì hoặc cập nhật cổng kết nối. Vui lòng chọn COD, VNPay hoặc MoMo để tiếp tục!
          </p>
          <Button
            type="primary"
            onClick={() => setIsVisibleModalPayment(false)}
            style={{
              background: "#131118",
              color: "#FFFFFF",
              borderRadius: "8px",
              marginTop: "8px",
            }}
          >
            Đã hiểu
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentMethod;
