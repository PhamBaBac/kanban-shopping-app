/** @format */

import { Button, DatePicker, Form, Input, Typography } from "antd";
import React, { useState } from "react";

const CreditCardPayment = ({ onPayment }: { onPayment: () => void }) => {
  const [form] = Form.useForm();

  const [cardNumber, setCardNumber] = useState("");

  const handlePayment = (values: any) => {
    console.log(values);
  };

  return (
    <div>
      <Form form={form} onFinish={handlePayment} layout="vertical" size="large">
        <Form.Item name={"cardNumber"} label="Card number">
          <Input
            value={cardNumber}
            onChange={(val) => console.log(val.target.value)}
            maxLength={19}
          />
        </Form.Item>
        <Form.Item name={"cardName"} label="Card name">
          <Input />
        </Form.Item>
        <div className="row">
          <div className="col">
            <Form.Item name={"expDate"} label="Expiry Date">
              <DatePicker
                mode="date"
                format={"MM/YY"}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </div>
          <div className="col">
            <Form.Item name={"cvv"} label="CVV">
              <Input.Password maxLength={3} />
            </Form.Item>
          </div>
        </div>
      </Form>
      <Typography.Paragraph type="secondary">
        Your payment information is not stored on our website and is not shared
        with any other third party.
      </Typography.Paragraph>
      <div className="mt-2">
        <Button
          type="primary"
          style={{
            padding: "10px 50px",
          }}
          onClick={() => form.submit()}
        >
          Add Card
        </Button>
      </div>
    </div>
  );
};

export default CreditCardPayment;
