/** @format */

import handleAPI from "@/apis/handleApi";
import HeadComponent from "@/components/HeadComponent";
import {
  CartItemModel,
  cartSelector,
  removeCarts,
} from "@/redux/reducers/cartReducer";
import { VND } from "@/utils/handleCurrency";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Input,
  List,
  message,
  Modal,
  Result,
  Space,
  Steps,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { BiCreditCard, BiEdit } from "react-icons/bi";
import { FaStar } from "react-icons/fa6";
import { HiHome } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import ListCart from "./components/ListCart";
import PaymentMethod, { methods } from "./components/PaymentMethod";
import ShipingAddress from "./components/ShipingAddress";

import { Section } from "@/components";
import { AddressModel } from "@/models/Products";
import { DateTime } from "@/utils/dateTime";
import { authSelector } from "@/redux/reducers/authReducer";
import { useRouter } from "next/router";

const { Title, Text, Paragraph } = Typography;

interface PaymentDetail {
  address: AddressModel;
  paymentMethod: any;
}

const CheckoutPage = () => {
  const [discountCode, setDiscountCode] = useState("");
  const [discountValue, setDiscountValue] = useState<{
    value: number;
    type: string;
  }>();
  //grandTotal =gia trong cart - discountValue
  const [grandTotal, setGrandTotal] = useState(0);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>();
  const [paymentDetail, setPaymentDetail] = useState<any>();
  const [paymentMethod, setPaymentMethod] = useState<{
    methodSelected: string;
  }>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<CartItemModel[]>([]);

  const carts: CartItemModel[] = useSelector(cartSelector);
  const user = useSelector(authSelector);
  const router = useRouter();
  const dispatch = useDispatch();

  const [subtotal, setSubtotal] = useState(0);

  useEffect(() => {
    const total = selectedItems.reduce((a, b) => a + b.count * b.price, 0);
    setSubtotal(total);

    if (discountValue && selectedItems.length > 0) {
      setGrandTotal(
        discountValue.type === "percent"
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
      const res: any = await handleAPI(
        "/promotions/apply",
        {
          userId: user.userId,
          code: discountCode,
        },
        "post"
      );
      console.log("resCode", res);

      if (res.result === true) {
        // If applicable, call the API to get discount information
        console.log("discountCode", discountCode);
        const detail: any = await handleAPI(`/promotions/code/${discountCode}`);
        console.log("detail", detail);

        setDiscountValue({
          value: detail.result.numOfAvailable,
          type: detail.result.discountType, // 'percent' | 'amount'
        });
        message.success("Code applied successfully!");
      } else {
        message.warning("Invalid or already used code!");
        setDiscountValue(undefined);
      }
    } catch (error: any) {
      // If error has code 1022, show message from backend
      if (error?.code === 1022) {
        message.error(error.message || "Code has been fully used");
      } else {
        message.error("Code has been fully used");
      }
      setDiscountValue(undefined);
    } finally {
      setIsCheckingCode(false);
    }
  };

  const renderComponents = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Button
              type="default"
              onClick={() => setCurrentStep(undefined)}
              style={{ marginBottom: 16 }}
            >
              Back
            </Button>
            <ShipingAddress
              onSelectAddress={(val) => {
                setPaymentDetail({ ...paymentDetail, address: val });
                setCurrentStep(1);
              }}
            />
          </>
        );
      case 1:
        return (
          <PaymentMethod
            onContinue={(val) => {
              setPaymentMethod(val);
              setCurrentStep(2);
            }}
          />
        );
      case 2:
        return (
          <>
            <Section>
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
            </Section>
            <Section>
              <Title level={4}>Shipping address</Title>
              <List
                dataSource={[paymentDetail]}
                renderItem={(item) => (
                  <List.Item
                    extra={
                      <Button
                        onClick={() => setCurrentStep(0)}
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
            </Section>
            <Section>
              <Title level={4}>Paymen method</Title>
              <Paragraph>
                {paymentMethod &&
                  methods.find(
                    (element) => element.key === paymentMethod.methodSelected
                  )?.title}
              </Paragraph>
            </Section>
          </>
        );
      default:
        return <ListCart onSelectItems={setSelectedItems} />;
    }
  };

  const handlePaymentOrder = async () => {
    const method = paymentMethod?.methodSelected ?? "";
    const body = {
      addressId: paymentDetail?.address?.id,
      items: selectedItems,
    };
    // If it's VNPay, call the payment API and open the URL
    if (method === "vnpay") {
      try {
        const res: any = await handleAPI(
          `/payment/create?amount=${grandTotal}`,
          body,
          "post"
        );

        if (res?.result?.paymentUrl) {
          window.open(res.result.paymentUrl, "_blank");
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
      console.log("method", method);
      await handleAPI(`/orders/create?paymentType=${method}`, body, "post");
      Modal.success({
        title: "Success",
        content: "Thank you for your order, it is being processed",
        onOk: () => {
          router.push("/profile?tab=orders");
          dispatch(removeCarts());
        },
        onCancel: () => {
          router.push("/shop");
        },
      });
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

  return (
    <div className="container-fluid">
      <div className="container mt-4">
        <HeadComponent title="Checkout" />
        <div className="row">
          <div className="col-sm-12 col-md-8">
            <div className="mb-4">
              <Steps
                current={currentStep}
                labelPlacement="vertical"
                onChange={(val) => {
                  if (val <= (currentStep ?? 0)) {
                    setCurrentStep(val);
                  }
                }}
                items={[
                  {
                    title: "Address",
                    icon: (
                      <span>
                        <HiHome size={18} />
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
                    title: "Reviews",
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
                  />
                  <Button
                    loading={isCheckingCode}
                    onClick={handleCheckDiscountCode}
                    disabled={!discountCode}
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
                {currentStep === undefined && selectedItems.length > 0 && (
                  <Button
                    type="primary"
                    onClick={() => setCurrentStep(0)}
                    size="large"
                    style={{ width: "100%", marginTop: 16 }}
                  >
                    Continue
                  </Button>
                )}
                {selectedItems.length > 0 && currentStep === 2 && (
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
