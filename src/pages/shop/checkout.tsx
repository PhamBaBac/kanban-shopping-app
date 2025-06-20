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

  const carts: CartItemModel[] = useSelector(cartSelector);
  const user = useSelector(authSelector);
  const router = useRouter();
  const dispatch = useDispatch();

  const [subtotal, setSubtotal] = useState(0);
  useEffect(() => {
    // Bỏ qua bước address khi test
    setPaymentDetail({
      address: {
        name: "Test User",
        phoneNumber: "0123456789",
        address: "123 Test Street, HCMC",
      },
    });
    setCurrentStep(1); // Bắt đầu từ bước chọn phương thức thanh toán
  }, []);

  useEffect(() => {
    const total = carts.reduce((a, b) => a + b.count * b.price, 0);
    setSubtotal(total);

    if (discountValue && carts.length > 0) {
      setGrandTotal(
        discountValue.type === "percent"
          ? Math.ceil(total - total * (discountValue.value / 100))
          : total - discountValue.value
      );
    } else {
      setGrandTotal(total);
    }
  }, [discountValue, carts]);

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
        // Nếu được áp dụng, gọi API để lấy thông tin giảm
        console.log("discountCode", discountCode);
        const detail: any = await handleAPI(`/promotions/code/${discountCode}`);
        console.log("detail", detail);

        setDiscountValue({
          value: detail.result.numOfAvailable,
          type: detail.result.discountType, // 'percent' | 'amount'
        });
        message.success("Áp dụng mã thành công!");
      } else {
        message.warning("Mã không hợp lệ hoặc đã được sử dụng!");
        setDiscountValue(undefined);
      }
    } catch (error: any) {
      // Nếu error có code 1022 thì show message từ backend
      if (error?.code === 1022) {
        message.error(error.message || "Mã đã hết lượt sử dụng");
      } else {
        message.error("Mã đã hết lượt sử dụng");
      }
      setDiscountValue(undefined);
    } finally {
      setIsCheckingCode(false);
    }
  };

  const renderComponents = () => {
    switch (currentStep) {
      //   case 0:
      //     return (
      //       <ShipingAddress
      //         onSelectAddress={(val) => {
      //           setPaymentDetail({ ...paymentDetail, address: val });
      //           setCurrentStep(1);
      //         }}
      //       />
      //     );
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
                dataSource={carts}
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
        return <ListCart />;
    }
  };

  const handlePaymentOrder = async () => {
    const method = paymentMethod?.methodSelected ?? "";

    // Nếu là VNPay thì gọi API thanh toán và mở URL
    if (method === "vnpay") {
      try {
        const res: any = await handleAPI(
          `/payment/create?amount=${grandTotal}`,
          {},
          "post"
        );

        if (res?.result?.paymentUrl) {
          window.open(res.result.paymentUrl, "_blank");
          return; // Không tiếp tục tạo order nữa
        } else {
          message.error("Không thể tạo liên kết thanh toán VNPay.");
          return;
        }
      } catch (error) {
        console.error("VNPay error:", error);
        message.error("Có lỗi xảy ra khi kết nối VNPay.");
        return;
      }
    }

    setIsLoading(true);
    try {
      console.log("method", method);
      const res = await handleAPI(
        `/bills/create?paymentType=${method}`,
        {},
        "post"
      );
      console.log("res", res);

      dispatch(removeCarts());
      Modal.confirm({
        type: "success",
        title: "Thành công",
        content: "Cám ơn bạn đã đặt hàng, đơn hàng của bạn đang được xử lý",
        onOk: () => router.push("/profile?key=orders"),
        cancelText: "Back to home",
        onCancel: () => router.push("/"),
      });
    } catch (error) {
      console.log(error);
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
                onChange={(val) => setCurrentStep(val)}
                items={[
                  {
                    title: "Address",
                    icon: (
                      <Button
                        icon={<HiHome size={18} />}
                        type={currentStep === 0 ? "primary" : `text`}
                        onClick={() => setCurrentStep(0)}
                      />
                    ),
                  },
                  {
                    title: "Payment Method",
                    icon: (
                      <Button
                        icon={<BiCreditCard size={20} />}
                        type={currentStep === 1 ? "primary" : `text`}
                        onClick={() => setCurrentStep(1)}
                      />
                    ),
                  },
                  {
                    title: "Reviews",
                    icon: (
                      <Button
                        icon={<FaStar size={18} />}
                        type={currentStep === 2 ? "primary" : `text`}
                        onClick={undefined}
                      />
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
                  {VND.format(carts.reduce((a, b) => a + b.count * b.price, 0))}
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
                <Button
                  disabled={
                    currentStep !== undefined &&
                    (!paymentMethod || !paymentDetail)
                  }
                  type="primary"
                  onClick={() =>
                    !currentStep ? setCurrentStep(0) : handlePaymentOrder()
                  }
                  size="large"
                  style={{ width: "100%" }}
                >
                  Process to Checkout
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
