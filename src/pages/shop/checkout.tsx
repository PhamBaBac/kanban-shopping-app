/** @format */

import { paymentService, orderService } from "@/services";
import { promotionService } from "@/services";
import { CartItemModel, removeCarts, removeSelectedItems } from "@/redux/reducers/cartReducer";
import { showErrorMessage } from "@/utils/errorHandler";
import { DateTime } from "@/utils/dateTime";
import { VND } from "@/utils/handleCurrency";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { authSelector } from "@/redux/reducers/authReducer";
import { useCartOperations } from "@/hooks/useCartOperations";
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
import { useCartValidation, isItemInvalid } from "@/hooks";

const { Title, Paragraph } = Typography;

const CheckoutPage = () => {
  const [selectedItems, setSelectedItems] = useState<CartItemModel[]>([]);
  const [currentStep, setCurrentStep] = useState<number | undefined>(0);
  const { hasInvalidItems, invalidItems } = useCartValidation();
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
  const auth = useSelector(authSelector);
  const { getCartInDatabase, getRedisCart } = useCartOperations();

  // Đồng bộ giỏ hàng mới nhất khi vào trang checkout
  useEffect(() => {
    if (auth.userId) {
      getCartInDatabase();
    } else {
      getRedisCart();
    }
  }, [auth.userId]);

  // Xử lý khi quay lại trang bằng nút Back trình duyệt (BFCache)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      setCurrentStep(0);
      setIsLoading(false);
      if (auth.userId) {
        getCartInDatabase();
      } else {
        getRedisCart();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [auth.userId]);

  // Xử lý khi quay lại từ trang kết quả thanh toán VNPay
  useEffect(() => {
    if (router.query.from_payment) {
      setCurrentStep(0);
      setIsLoading(false);
      if (auth.userId) {
        getCartInDatabase();
      } else {
        getRedisCart();
      }
      message.info("Giao dịch thanh toán chưa hoàn tất. Sản phẩm của bạn vẫn được lưu nguyên vẹn trong giỏ hàng.");
      router.replace("/shop/checkout", undefined, { shallow: true });
    }
  }, [router.query.from_payment, auth.userId]);

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
        message.success("Mã khuyến mãi hợp lệ!");
      } else {
        message.warning("Mã không hợp lệ, đã hết hạn hoặc hết lượt sử dụng!");
        setDiscountValue(undefined);
      }
    } catch (error) {
      showErrorMessage(error, "Không thể kiểm tra mã khuyến mãi. Vui lòng thử lại!");
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
    if (method === "vnpay" || method === "momo") {
      setIsLoading(true);
      const gatewayName = method === "momo" ? "MoMo" : "VNPay";
      try {
        const res = await paymentService.createPayment({
          ...body,
          paymentType: method.toUpperCase(),
        });

        if (res?.paymentUrl) {
          // Lưu ý: Không xóa giỏ hàng ở đây vì giao dịch chưa hoàn tất.
          // Đặt lại step về 0 trước khi chuyển hướng để nếu người dùng nhấn nút Back sẽ quay về bước giỏ hàng
          setCurrentStep(0);
          window.location.href = res.paymentUrl;
          return; // Do not proceed with order creation
        } else {
          setIsLoading(false);
          message.error(`Không thể tạo liên kết thanh toán ${gatewayName}.`);
          return;
        }
      } catch (error) {
        setIsLoading(false);
        console.error(`${gatewayName} error:`, error);
        message.error(`Đã xảy ra lỗi khi kết nối với cổng thanh toán ${gatewayName}.`);
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

      // Chỉ xóa các sản phẩm đã chọn mua khỏi giỏ hàng
      const selectedSubProductIds = selectedItems.map((item) => item.subProductId);
      dispatch(removeSelectedItems(selectedSubProductIds));
    } catch (error: any) {
      console.log(error);

      // Handle specific error codes from backend
      if (error?.code === 1021 || error?.code === 5002) {
        showErrorMessage(
          error,
          "Một số sản phẩm trong giỏ hàng đã hết hàng. Vui lòng kiểm tra lại giỏ hàng!"
        );
        router.push("/shop");
      } else if (error?.code === 1031 || error?.code === 7001) {
        showErrorMessage(
          error,
          "Không tìm thấy địa chỉ giao hàng. Vui lòng chọn địa chỉ hợp lệ!"
        );
        setCurrentStep(0);
      } else {
        showErrorMessage(
          error,
          "Đã có lỗi xảy ra trong quá trình xử lý đơn hàng. Vui lòng thử lại!"
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
                  if (hasInvalidItems && val > 0) {
                    message.warning(
                      "Vui lòng xóa các sản phẩm đã hết hàng hoặc bị xóa khỏi giỏ hàng trước khi tiếp tục!"
                    );
                    return;
                  }
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
                    >{`${discountValue?.value}${discountValue?.type === "percent" ? "%" : ""
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
                {currentStep === 0 && (
                  <>
                    {hasInvalidItems && (
                      <div
                        className="p-3 mb-3"
                        style={{
                          backgroundColor: "#fff2f0",
                          border: "1px solid #ffccc7",
                          borderRadius: 8,
                          textAlign: "center",
                        }}
                      >
                        <Typography.Text
                          type="danger"
                          strong
                          style={{ fontSize: "0.85rem", display: "block" }}
                        >
                          ⚠️ Giỏ hàng có {invalidItems.length} sản phẩm đã hết hàng hoặc bị xóa. Bạn cần xóa chúng để tiếp tục mua hàng.
                        </Typography.Text>
                      </div>
                    )}
                    <Button
                      type="primary"
                      onClick={() => {
                        if (hasInvalidItems) {
                          message.error(
                            "Vui lòng xóa các sản phẩm hết hàng hoặc đã bị xóa trước khi tiếp tục!"
                          );
                          return;
                        }
                        if (selectedItems.length === 0) {
                          message.warning("Vui lòng chọn ít nhất 1 sản phẩm để mua!");
                          return;
                        }
                        setCurrentStep(1);
                      }}
                      disabled={selectedItems.length === 0 || hasInvalidItems}
                      size="large"
                      style={{ width: "100%" }}
                    >
                      {hasInvalidItems ? "Vui lòng xóa sản phẩm lỗi" : "Continue"}
                    </Button>
                  </>
                )}
                {selectedItems.length > 0 && currentStep === 3 && (
                  <Button
                    type="primary"
                    onClick={handlePaymentOrder}
                    size="large"
                    style={{ width: "100%" }}
                    disabled={
                      hasInvalidItems ||
                      selectedItems.some(isItemInvalid) ||
                      isLoading
                    }
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
