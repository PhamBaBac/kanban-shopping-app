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
import { IoWarningOutline } from "react-icons/io5";
import {
  Avatar,
  Button,
  Divider,
  Input,
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

  useEffect(() => {
    if (auth.userId) {
      getCartInDatabase();
    } else {
      getRedisCart();
    }
  }, [auth.userId]);

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
          setCurrentStep(0);
          window.location.href = res.paymentUrl;
          return;
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
      Modal.confirm({
        title: "Đặt hàng thành công!",
        content: "Đơn hàng của bạn đã được ghi nhận. Bạn có muốn xem danh sách đơn hàng ngay không?",
        okText: "Xem đơn hàng",
        cancelText: "Về trang chủ",
        onOk: () => {
          router.push(`/profile?tab=orders`);
        },
        onCancel: () => {
          router.push("/");
        },
      });

      const selectedSubProductIds = selectedItems.map((item) => item.subProductId);
      dispatch(removeSelectedItems(selectedSubProductIds));
    } catch (error: any) {
      console.log(error);

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
          <div>
            <Button
              type="default"
              onClick={() => setCurrentStep(0)}
              style={{
                marginBottom: 16,
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              ← Quay lại giỏ hàng
            </Button>
            <ShipingAddress
              onSelectAddress={(val) => {
                setPaymentDetail({ ...paymentDetail, address: val });
                setCurrentStep(2);
              }}
            />
          </div>
        );
      case 2:
        return (
          <div>
            <Button
              type="default"
              onClick={() => setCurrentStep(1)}
              style={{
                marginBottom: 16,
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              ← Quay lại chọn địa chỉ
            </Button>
            <PaymentMethod
              onContinue={(val) => {
                setPaymentMethod(val);
                setCurrentStep(3);
              }}
            />
          </div>
        );
      case 3:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#131118",
                    margin: 0,
                  }}
                >
                  Xác nhận lại đơn hàng
                </h2>
                <span style={{ fontSize: "13px", color: "#6B7280" }}>
                  Vui lòng kiểm tra lại sản phẩm, địa chỉ nhận hàng và phương thức thanh toán trước khi đặt mua
                </span>
              </div>
              <Button
                type="default"
                onClick={() => setCurrentStep(2)}
                style={{
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                ← Quay lại
              </Button>
            </div>

            {/* Delivery Schedule & Items Card */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #F3F4F6",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <HiHome size={18} color="#131118" />
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#131118",
                    }}
                  >
                    Dự kiến nhận hàng:{" "}
                    {DateTime.getShortDateEng(
                      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
                    )}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "#F3F4F6",
                    color: "#131118",
                    padding: "2px 10px",
                    borderRadius: "20px",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  Giao Hàng Nhanh (GHN)
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "#FAFAFA",
                      borderRadius: "8px",
                      border: "1px solid #F3F4F6",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                      <Avatar
                        src={item.image}
                        shape="square"
                        size={52}
                        style={{
                          borderRadius: "6px",
                          border: "1px solid #E5E7EB",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <span
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#131118",
                            display: "block",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                          }}
                        >
                          {item.title}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px", flexWrap: "wrap" }}>
                          {item.size && (
                            <span style={{ fontSize: "12px", color: "#6B7280" }}>
                              Size: <strong style={{ color: "#131118" }}>{item.size}</strong>
                            </span>
                          )}
                          {item.color && (
                            <span style={{ fontSize: "12px", color: "#6B7280" }}>
                              Màu: <strong style={{ color: "#131118" }}>{item.color}</strong>
                            </span>
                          )}
                          <span style={{ fontSize: "12px", color: "#6B7280" }}>
                            x{item.count}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#131118",
                        marginLeft: "auto",
                      }}
                    >
                      {VND.format(item.price * item.count)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address Review Card */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                  paddingBottom: "10px",
                  borderBottom: "1px solid #F3F4F6",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <HiHome size={18} color="#131118" />
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#131118",
                    }}
                  >
                    Địa chỉ nhận hàng
                  </span>
                </div>
                <Button
                  type="text"
                  size="small"
                  icon={<BiEdit size={16} />}
                  onClick={() => setCurrentStep(1)}
                  style={{ color: "#4B5563", fontSize: "13px", fontWeight: 500 }}
                >
                  Thay đổi
                </Button>
              </div>

              {paymentDetail?.address ? (
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#131118", marginBottom: "4px" }}>
                    {paymentDetail.address.name}{" "}
                    <span style={{ color: "#6B7280", fontWeight: 400 }}>
                      ({paymentDetail.address.phoneNumber})
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#4B5563", lineHeight: 1.4 }}>
                    {paymentDetail.address.address}
                  </div>
                </div>
              ) : (
                <div style={{ color: "#DC2626", fontSize: "13px" }}>
                  Chưa chọn địa chỉ nhận hàng. Vui lòng bấm Thay đổi để chọn địa chỉ.
                </div>
              )}
            </div>

            {/* Payment Method Review Card */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                  paddingBottom: "10px",
                  borderBottom: "1px solid #F3F4F6",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <BiCreditCard size={18} color="#131118" />
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#131118",
                    }}
                  >
                    Phương thức thanh toán
                  </span>
                </div>
                <Button
                  type="text"
                  size="small"
                  icon={<BiEdit size={16} />}
                  onClick={() => setCurrentStep(2)}
                  style={{ color: "#4B5563", fontSize: "13px", fontWeight: 500 }}
                >
                  Thay đổi
                </Button>
              </div>

              <div>
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#131118",
                  }}
                >
                  {paymentMethod &&
                    methods.find(
                      (element) => element.key === paymentMethod.methodSelected
                    )?.title}
                </span>
                <span style={{ fontSize: "12px", color: "#6B7280", display: "block", marginTop: "2px" }}>
                  {paymentMethod &&
                    methods.find(
                      (element) => element.key === paymentMethod.methodSelected
                    )?.desc}
                </span>
              </div>
            </div>
          </div>
        );
      default:
        return <ListCart onSelectItems={setSelectedItems} />;
    }
  };

  const discountAmount = discountValue
    ? discountValue.type === "PERCENT"
      ? Math.ceil(subtotal * (discountValue.value / 100))
      : discountValue.value
    : 0;

  return (
    <div className="checkout-page-wrapper" style={{ background: "#FAFAFA", minHeight: "100vh", padding: "16px 0", overflowX: "hidden" }}>
      <div className="container px-2 px-md-3" style={{ maxWidth: "1200px" }}>
        {/* Step Indicator */}
        <div
          className="checkout-steps-wrapper"
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            padding: "16px 20px",
            marginBottom: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          <Steps
            current={currentStep}
            responsive={false}
            className="checkout-steps"
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
                title: "1. Giỏ hàng",
                icon: <HiHome size={18} />,
              },
              {
                title: "2. Địa chỉ",
                icon: <BiEdit size={18} />,
              },
              {
                title: "3. Thanh toán",
                icon: <BiCreditCard size={18} />,
              },
              {
                title: "4. Xác nhận",
                icon: <FaStar size={18} />,
              },
            ]}
          />
        </div>

        <div className="row mx-0">
          {/* Main Content Area */}
          <div className="col-12 col-md-8 px-0 px-md-3 mb-4">
            {renderComponents()}
          </div>

          {/* Right Sidebar: Order Summary */}
          <div className="col-12 col-md-4 px-0 px-md-3">
            <div
              className="checkout-summary-card"
              style={{
                background: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#131118",
                  margin: 0,
                  paddingBottom: "14px",
                  borderBottom: "1px solid #F3F4F6",
                }}
              >
                Tóm tắt đơn hàng
              </h3>

              {/* Promo Code Section */}
              <div style={{ marginTop: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "6px" }}>
                  Mã khuyến mãi / Giảm giá
                </span>
                <Space.Compact style={{ width: "100%", marginBottom: "8px" }}>
                  <Input
                    size="large"
                    placeholder="Nhập mã giảm giá..."
                    allowClear
                    value={discountCode}
                    onChange={(val) =>
                      setDiscountCode(val.target.value.toUpperCase())
                    }
                    disabled={!!discountValue}
                    style={{
                      borderRadius: "8px 0 0 8px",
                      borderColor: "#E5E7EB",
                      fontSize: "14px",
                    }}
                  />
                  
                  <Button
                    loading={isCheckingCode}
                    onClick={handleCheckDiscountCode}
                    disabled={!discountCode || !!discountValue}
                    type="primary"
                    size="large"
                    style={{
                      background: "#131118",
                      color: "#FFFFFF",
                      borderRadius: "0 8px 8px 0",
                      fontWeight: 600,
                      cursor: !discountCode || !!discountValue ? "not-allowed" : "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Áp dụng
                  </Button>
                </Space.Compact>

                {discountValue && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "#ECFDF5",
                      border: "1px solid #A7F3D0",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#059669", fontWeight: 600 }}>
                      ✓ Đã áp dụng mã ({discountValue.type === "PERCENT" ? `${discountValue.value}%` : VND.format(discountValue.value)})
                    </span>
                    <Button
                      type="text"
                      size="small"
                      danger
                      onClick={() => {
                        setDiscountValue(undefined);
                        setDiscountCode("");
                      }}
                      style={{ padding: 0, height: "auto", fontSize: "12px" }}
                    >
                      Bỏ áp dụng
                    </Button>
                  </div>
                )}

                {/* Price Breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ color: "#6B7280" }}>
                      Tạm tính ({selectedItems.length} sản phẩm):
                    </span>
                    <strong style={{ color: "#131118" }}>
                      {VND.format(subtotal)}
                    </strong>
                  </div>

                  {discountValue && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                      <span style={{ color: "#6B7280" }}>Giảm giá:</span>
                      <strong style={{ color: "#059669" }}>
                        -{VND.format(discountAmount)}
                      </strong>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ color: "#6B7280" }}>Phí vận chuyển:</span>
                    <span style={{ color: "#059669", fontWeight: 600 }}>
                      Miễn phí
                    </span>
                  </div>

                  <Divider style={{ borderColor: "#F3F4F6", margin: "8px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#131118",
                      }}
                    >
                      Tổng thanh toán:
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "#131118",
                      }}
                    >
                      {VND.format(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons depending on step */}
              <div style={{ marginTop: "20px" }}>
                {currentStep === 0 && (
                  <>
                    {hasInvalidItems && (
                      <div
                        style={{
                          backgroundColor: "#FEF2F2",
                          border: "1px solid #FECACA",
                          borderRadius: 8,
                          padding: "10px",
                          marginBottom: "12px",
                          textAlign: "center",
                        }}
                      >
                        <Typography.Text
                          type="danger"
                          strong
                          style={{ fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                        >
                          <IoWarningOutline size={16} /> Giỏ hàng có {invalidItems.length} sản phẩm hết hàng hoặc bị xóa.
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
                      style={{
                        width: "100%",
                        height: "46px",
                        background: "#131118",
                        color: "#FFFFFF",
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: "15px",
                        cursor: selectedItems.length === 0 || hasInvalidItems ? "not-allowed" : "pointer",
                      }}
                    >
                      {hasInvalidItems ? "Vui lòng xóa sản phẩm lỗi" : `Tiếp tục đặt hàng (${selectedItems.length})`}
                    </Button>
                  </>
                )}

                {currentStep === 3 && (
                  <Button
                    type="primary"
                    onClick={handlePaymentOrder}
                    size="large"
                    loading={isLoading}
                    style={{
                      width: "100%",
                      height: "48px",
                      background: "#131118",
                      color: "#FFFFFF",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "16px",
                      cursor: "pointer",
                    }}
                    disabled={
                      hasInvalidItems ||
                      selectedItems.some(isItemInvalid) ||
                      isLoading ||
                      !paymentDetail?.address
                    }
                  >
                    Xác nhận đặt hàng
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
