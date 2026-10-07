/** @format */

import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Input,
  Rate,
  Upload,
  Avatar,
  Tag,
  Space,
  Typography,
  message,
} from "antd";
import type { UploadProps } from "antd";
import { StarFilled, CameraOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { authSelector } from "@/redux/reducers/authReducer";
import { reviewService } from "@/services";
import { uploadFile } from "@/utils/uploadFile";
import { showErrorMessage } from "@/utils/errorHandler";

interface Props {
  open?: boolean;
  onClose?: () => void;
  subProductId: string;
  orderId?: string;
  itemInfo?: {
    image?: string;
    title?: string;
    size?: string;
    color?: string;
    attributes?: Record<string, any>;
    price?: number;
  };
  onReviewed?: () => void;
  isReviewed?: boolean;
}

const STAR_LABELS: Record<number, string> = {
  1: "Rất tệ",
  2: "Chưa hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Tuyệt vời",
};

const Reviews: React.FC<Props> = ({
  open = true,
  onClose,
  subProductId,
  orderId,
  itemInfo,
  onReviewed,
  isReviewed = false,
}) => {
  const [starScore, setStarScore] = useState(5);
  const [comment, setComment] = useState("");
  const [fileList, setFileList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const auth = useSelector(authSelector);

  useEffect(() => {
    if (open) {
      setStarScore(5);
      setComment("");
      setFileList([]);
      setIsLoading(false);
    }
  }, [open]);

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    const items = newFileList.map((item) =>
      item.originFileObj
        ? {
            ...item,
            url: item.originFileObj
              ? URL.createObjectURL(item.originFileObj)
              : "",
            status: "done",
          }
        : { ...item }
    );
    setFileList(items);
  };

  const handleSubmitReview = async () => {
    if (!auth?.userId) {
      message.error("Vui lòng đăng nhập để gửi đánh giá!");
      return;
    }
    if (starScore === 0) {
      message.warning("Vui lòng chọn số sao đánh giá!");
      return;
    }
    if (!comment.trim()) {
      message.warning("Vui lòng nhập nhận xét của bạn!");
      return;
    }

    setIsLoading(true);
    try {
      let imageUrls: string[] = [];
      if (fileList.length > 0) {
        const uploadPromises = fileList.map(async (fileItem) => {
          if (fileItem.originFileObj) {
            return await uploadFile(fileItem.originFileObj);
          }
          return fileItem.url || "";
        });
        const uploaded = await Promise.all(uploadPromises);
        imageUrls = uploaded.filter(Boolean);
      }

      await reviewService.createReview({
        createdBy: auth.userId,
        subProductId,
        orderId: orderId || "",
        comment: comment.trim(),
        star: starScore,
        images: imageUrls,
      });

      message.success("Đã gửi đánh giá thành công! Cảm ơn bạn.");
      onReviewed?.();
      onClose?.();
    } catch (error: any) {
      showErrorMessage(error, "Gửi đánh giá thất bại. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      destroyOnClose
      centered
      width={540}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StarFilled style={{ color: "#F59E0B", fontSize: 18 }} />
          <span style={{ fontWeight: 700, fontSize: 16, color: "#131118" }}>
            Đánh giá sản phẩm
          </span>
        </div>
      }
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            paddingTop: 8,
          }}
        >
          <Button
            onClick={onClose}
            disabled={isLoading}
            style={{ borderRadius: 8, height: 38 }}
          >
            Hủy
          </Button>
          <Button
            type="primary"
            loading={isLoading}
            disabled={starScore === 0 || !comment.trim()}
            onClick={handleSubmitReview}
            style={{
              background: "#131118",
              borderRadius: 8,
              height: 38,
              fontWeight: 600,
              padding: "0 22px",
            }}
          >
            Gửi đánh giá
          </Button>
        </div>
      }
    >
      <div style={{ paddingTop: 12 }}>
        {/* Tóm tắt sản phẩm được đánh giá */}
        {itemInfo && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: "#F9FAFB",
              border: "1px solid #F3F4F6",
              borderRadius: 8,
              marginBottom: 18,
            }}
          >
            <Avatar
              src={itemInfo.image}
              size={48}
              shape="square"
              style={{
                borderRadius: 6,
                border: "1px solid #E5E7EB",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <Typography.Text
                strong
                style={{ fontSize: 13, color: "#1F2937", display: "block" }}
                ellipsis
              >
                {itemInfo.title || "Sản phẩm"}
              </Typography.Text>
              <Space wrap size={[4, 2]} style={{ marginTop: 4 }}>
                {itemInfo.color && (
                  <Tag color="default" style={{ margin: 0, fontSize: 11 }}>
                    Màu: {itemInfo.color}
                  </Tag>
                )}
                {itemInfo.size && (
                  <Tag color="cyan" style={{ margin: 0, fontSize: 11 }}>
                    Size: {itemInfo.size}
                  </Tag>
                )}
              </Space>
            </div>
          </div>
        )}

        {/* Khối chấm sao */}
        <div
          style={{
            textAlign: "center",
            padding: "10px 0 16px",
            background: "#FAFAFA",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Chất lượng sản phẩm
          </div>
          <Rate
            value={starScore}
            onChange={setStarScore}
            disabled={isLoading}
            style={{ fontSize: 32, color: "#F59E0B" }}
          />
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              fontWeight: 600,
              color: starScore > 0 ? "#D97706" : "#9CA3AF",
            }}
          >
            {STAR_LABELS[starScore] || "Chọn số sao"}
          </div>
        </div>

        {/* Khối nhận xét chi tiết */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Nhận xét chi tiết <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <Input.TextArea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isLoading}
            placeholder="Hãy chia sẻ trải nghiệm về chất lượng sản phẩm, kích cỡ thực tế, đóng gói và thời gian giao hàng..."
            rows={4}
            maxLength={500}
            showCount
            style={{ borderRadius: 8, fontSize: 13 }}
          />
        </div>

        {/* Khối tải hình ảnh thực tế */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Hình ảnh thực tế (Tối đa 4 ảnh)
          </label>
          <Upload
            fileList={fileList}
            onChange={handleChange}
            accept="image/*"
            listType="picture-card"
            multiple
            maxCount={4}
          >
            {fileList.length < 4 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <CameraOutlined style={{ fontSize: 20, color: "#6B7280" }} />
                <span style={{ fontSize: 11, color: "#6B7280" }}>Thêm ảnh</span>
              </div>
            )}
          </Upload>
        </div>
      </div>
    </Modal>
  );
};

export default Reviews;
