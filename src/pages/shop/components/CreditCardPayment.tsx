/** @format */

import { Button, DatePicker, Form, Input } from "antd";
import React, { useState } from "react";

const CreditCardPayment = ({ onPayment }: { onPayment: () => void }) => {
  const [form] = Form.useForm();

  const [cardNumber, setCardNumber] = useState("");

  const handlePayment = (values: any) => {
    console.log(values);
  };

  return (
    <div style={{ maxWidth: 540 }}>
      <Form form={form} onFinish={handlePayment} layout="vertical" size="middle">
        <Form.Item
          name={"cardNumber"}
          label={<span style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Số thẻ thanh toán</span>}
        >
          <Input
            value={cardNumber}
            onChange={(val) => console.log(val.target.value)}
            maxLength={19}
            placeholder="xxxx xxxx xxxx xxxx"
            style={{ borderRadius: "8px" }}
          />
        </Form.Item>
        <Form.Item
          name={"cardName"}
          label={<span style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Tên chủ thẻ</span>}
        >
          <Input placeholder="NGUYEN VAN A" style={{ borderRadius: "8px" }} />
        </Form.Item>
        <div className="row">
          <div className="col-6">
            <Form.Item
              name={"expDate"}
              label={<span style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Ngày hết hạn (MM/YY)</span>}
            >
              <DatePicker
                mode="date"
                format={"MM/YY"}
                style={{ width: "100%", borderRadius: "8px" }}
                placeholder="Chọn ngày"
              />
            </Form.Item>
          </div>
          <div className="col-6">
            <Form.Item
              name={"cvv"}
              label={<span style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Mã bảo mật CVV</span>}
            >
              <Input.Password maxLength={3} placeholder="123" style={{ borderRadius: "8px" }} />
            </Form.Item>
          </div>
        </div>
      </Form>
      <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>
        Thông tin thanh toán của bạn được mã hóa an toàn và không bao giờ được chia sẻ với bất kỳ bên thứ ba nào.
      </div>
      <div className="mt-3">
        <Button
          type="primary"
          style={{
            background: "#131118",
            color: "#FFFFFF",
            borderRadius: "8px",
            fontWeight: 600,
            height: "40px",
            padding: "0 32px",
            cursor: "pointer",
          }}
          onClick={() => form.submit()}
        >
          Lưu thông tin thẻ
        </Button>
      </div>
    </div>
  );
};

export default CreditCardPayment;
