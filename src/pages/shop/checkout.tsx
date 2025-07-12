/** @format */

import { paymentService, orderService } from "@/services";
import { promotionService } from "@/services";
import { CartItemModel, removeCarts } from "@/redux/reducers/cartReducer";
import { DateTime } from "@/utils/dateTime";
import { VND } from "@/utils/handleCurrency";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { BiEdit, BiCreditCard } from "react-icons/bi";
import { FaStar } from "react-icons/fa6";
import { HiHome } from "react-icons/hi";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Input,
  List,
  message,
  Modal,
  Space,
  Steps,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import ListCart from "./components/ListCart";
import PaymentMethod, { methods } from "./components/PaymentMethod";
import ShipingAddress from "./components/ShipingAddress";

const { Title, Paragraph } = Typography;

const CheckoutPage = () => {
  const [selectedItems, setSelectedItems] = useState<CartItemModel[]>([]);
  const [currentStep, setCurrentStep] = useState<number | undefined>(0);
  const [paymentDetail, setPaymentDetail] = useState<any>({});
  const [paymentMethod, setPaymentMethod] = useState<any>();
  const [discountCode, setDiscountCode] = useState("");
  const [discountValue, setDiscountValue] = useState<any>();
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const total = selectedItems.reduce((a, b) => a + b.count * b.price, 0);
    setSubtotal(total);

    if (discountValue && selectedItems.length > 0) {
      setGrandTotal(
        discountValue.type === "PERCENT"
          ? Math.ceil(total - total * (discountValue.value / 100))
          : total - discountValue.value
      );
    } else {
      setGrandTotal(total);
    }
  }, [discountValue, selectedItems]);

  const handleCheckDiscountCode = async () => {
    setIsCheckingCode(true);
    try {
      const res = await promotionService.checkPromotionCode(discountCode);
      if (res) {
        const detail = await promotionService.getPromotionByCode(discountCode);
        setDiscountValue({
          value: detail.value,
          type: detail.type,
        });
        message.success("Code is valid!");
      } else {
        message.warning("Invalid, expired, or out of stock code!");
        setDiscountValue(undefined);
      }
    } catch (error) {
      message.error("Could not check code. Please try again.");
      setDiscountValue(undefined);
    } finally {
      setIsCheckingCode(false);
    }
  };

  const handlePaymentOrder = async () => {
    const method = paymentMethod?.methodSelected ?? "";
    const body = {
      addressId: paymentDetail?.address?.id,
      items: selectedItems.map((item) => ({
        ...item,
        discountValue: discountValue,
      })),
    };
    if (method === "vnpay") {
      try {
        const res = await paymentService.createPayment(body);

        if (res?.paymentUrl) {
          window.location.href = res.paymentUrl;
          dispatch(removeCarts());
          return; // Do not proceed with order creation
        } else {
          message.error("Could not create VNPay payment link.");
          return;
        }
      } catch (error) {
        console.error("VNPay error:", error);
        message.error("An error occurred while connecting to VNPay.");
        return;
      }
    }

    setIsLoading(true);
    try {
      const orderResult = await orderService.createOrder({
        ...body,
        paymentType: method,
      });
      //nhan Ok vao order con nhan cancel vae home
      Modal.confirm({
        title: "Order created successfully",
        content: "Do you want to go to the order page?",
        onOk: () => {
          router.push(`/profile?tab=orders`);
        },
      });

      dispatch(removeCarts());
    } catch (error: any) {
      console.log(error);

      // Handle specific error codes from backend
      if (error?.code === 1021) {
        message.error(
          "Some items in your cart are out of stock. Please check your cart and try again."
        );
        // Optionally refresh cart data or redirect to cart page
        router.push("/shop");
      } else if (error?.code === 1031) {
        message.error(
          "Shipping address not found. Please select a valid address."
        );
        setCurrentStep(0); // Go back to address selection
      } else if (error?.code === 1022) {
        message.error("Promotion code has already been used.");
      } else if (error?.code === 1023) {
        message.error("Promotion is out of stock.");
      } else if (error?.code === 1024) {
        message.error("Promotion has expired.");
      } else if (error?.message) {
        message.error(error.message);
      } else {
        message.error(
          "An error occurred while processing your order. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderComponents = () => {
    switch (currentStep) {
      case 0:
        return <ListCart onSelectItems={setSelectedItems} />;
      case 1:
        return (
          <>
            <Button
              type="default"
              onClick={() => setCurrentStep(0)}
              style={{ marginBottom: 16 }}
            >
              Back
            </Button>
            <ShipingAddress
              onSelectAddress={(val) => {
                setPaymentDetail({ ...paymentDetail, address: val });
                setCurrentStep(2);
              }}
            />
          </>
        );
      case 2:
        return (
          <PaymentMethod
            onContinue={(val) => {
              setPaymentMethod(val);
              setCurrentStep(3);
            }}
          />
        );
      case 3:
        return (
          <>
            <div>
              <Title level={4}>
                Estimated delivery:{" "}
                {DateTime.getShortDateEng(
                  new Date(
                    new Date().getTime() + 3 * 24 * 60 * 60 * 1000
                  ).toISOString()
                )}
              </Title>
              <List
                dataSource={selectedItems}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      avatar={
                        <Avatar src={item.image} shape="square" size={72} />
                      }
                      title={
                        <Title level={4} className="mb-1">
                          {item.title}
                        </Title>
                      }
                      description={
                        <>
                          <Paragraph type="secondary" className="m-0">
                            ${VND.format(item.price)}
                          </Paragraph>
                          <Paragraph type="secondary" className="m-0">
                            size: {item.size}
                          </Paragraph>
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
            <div>
              <Title level={4}>Shipping address</Title>
              <List
                dataSource={[paymentDetail]}
                renderItem={(item) => (
                  <List.Item
                    extra={
                      <Button
                        onClick={() => setCurrentStep(1)}
                        icon={<BiEdit size={20} />}
                        className="text-muted"
                        type="text"
                      />
                    }
                  >
                    <List.Item.Meta
                      title={`${item.address.name} ${item.address.phoneNumber}`}
                      description={item.address.address}
                    />
                  </List.Item>
                )}
              />
            </div>
            <div>
              <Title level={4}>Paymen method</Title>
              <Paragraph>
                {paymentMethod &&
                  methods.find(
                    (element) => element.key === paymentMethod.methodSelected
                  )?.title}
              </Paragraph>
            </div>
          </>
        );
      default:
        return <ListCart onSelectItems={setSelectedItems} />;
    }
  };

  return (
    <div className="container-fluid">
      <div className="container mt-4">
        <div className="row">
          <div className="col-sm-12 col-md-8">
            <div className="mb-4">
              <Steps
                current={currentStep}
                labelPlacement="vertical"
                onChange={(val: number) => {
                  if (val <= (currentStep ?? 0)) {
                    setCurrentStep(val);
                  }
                }}
                items={[
                  {
                    title: "Cart",
                    icon: (
                      <span>
                        <HiHome size={18} />
                      </span>
                    ),
                  },
                  {
                    title: "Address",
                    icon: (
                      <span>
                        <BiEdit size={20} />
                      </span>
                    ),
                  },
                  {
                    title: "Payment Method",
                    icon: (
                      <span>
                        <BiCreditCard size={20} />
                      </span>
                    ),
                  },
                  {
                    title: "Review",
                    icon: (
                      <span>
                        <FaStar size={18} />
                      </span>
                    ),
                  },
                ]}
              />
            </div>

            {renderComponents()}
          </div>
          <div className="col-sm-12 col-md-4 mt-5 ">
            <Card
              title="Subtotal"
              extra={
                <Typography.Title level={3} className="m-0">
                  {VND.format(subtotal)}
                </Typography.Title>
              }
            >
              <div className="mt-3">
                <Typography.Text type="secondary">
                  Discount code
                </Typography.Text>
                <Space.Compact className="mb-3">
                  <Input
                    size="large"
                    placeholder="code"
                    allowClear
                    value={discountCode}
                    onChange={(val) =>
                      setDiscountCode(val.target.value.toUpperCase())
                    }
                    disabled={!!discountValue}
                  />
                  <Button
                    loading={isCheckingCode}
                    onClick={handleCheckDiscountCode}
                    disabled={!discountCode || !!discountValue}
                    type="primary"
                    size="large"
                  >
                    Apply
                  </Button>
                </Space.Compact>
                <Space style={{ justifyContent: "space-between" }}>
                  <Typography.Text style={{ fontSize: 18 }}>
                    Delivery charge:
                  </Typography.Text>
                  {discountValue && (
                    <Typography.Text
                      style={{
                        fontSize: 18,
                      }}
                    >{`${discountValue?.value}${
                      discountValue?.type === "percent" ? "%" : ""
                    }`}</Typography.Text>
                  )}
                </Space>
                <Divider />
                <Space style={{ justifyContent: "space-between" }}>
                  <Typography.Title level={4}>Grand Total:</Typography.Title>
                  <Typography.Title level={4}>{`${VND.format(
                    grandTotal
                  )}`}</Typography.Title>
                </Space>
              </div>
              <div className="mt-3">
                {currentStep === 0 && selectedItems.length > 0 && (
                  <Button
                    type="primary"
                    onClick={() => setCurrentStep(1)}
                    size="large"
                    style={{ width: "100%", marginTop: 16 }}
                  >
                    Continue
                  </Button>
                )}
                {selectedItems.length > 0 && currentStep === 3 && (
                  <Button
                    type="primary"
                    onClick={handlePaymentOrder}
                    size="large"
                    style={{ width: "100%" }}
                  >
                    Process to Checkout
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
