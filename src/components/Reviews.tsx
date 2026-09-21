/** @format */

import { ReviewModel } from "@/models/ReviewModel";
import { authSelector } from "@/redux/reducers/authReducer";
import { handleChangeFile, uploadFile } from "@/utils/uploadFile";
import { reviewService } from "@/services";
import { showErrorMessage } from "@/utils/errorHandler";
import {
  Avatar,
  Button,
  Input,
  List,
  message,
  Rate,
  Skeleton,
  Space,
  Spin,
  Typography,
  Upload,
  UploadFile,
  UploadProps,
} from "antd";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface Props {
  subProductId: string;
  orderId?: string;
  onReviewed?: () => void;
  isReviewed?: boolean;
}

const Reviews = (props: Props) => {
  const { subProductId, orderId, onReviewed, isReviewed } = props;

  const [starScore, setStarScore] = useState(0);
  const [comment, setcomment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [isGetting, setIsGetting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(isReviewed || false);

  const auth = useSelector(authSelector);

  // Cập nhật hasReviewed khi prop isReviewed thay đổi
  useEffect(() => {
    setHasReviewed(isReviewed || false);
  }, [isReviewed]);

  const handleSubmitReview = async () => {
    const data = {
      createdBy: auth.userId,
      subProductId: subProductId,
      orderId: orderId,
      comment,
      star: starScore,
    };
    setIsLoading(true);
    if (fileList.length > 0) {
      try {
        const items: string[] = [];
        fileList.forEach(async (item) => {
          const url = await uploadFile(item.originFileObj);

          items.push(url);

          if (items.length === fileList.length) {
            await handleAddReview({ ...data, images: items });
          }
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      await handleAddReview(data);
    }
  };

  const handleAddReview = async (data: any) => {
    console.log("data", data);

    try {
      await reviewService.createReview(data);
      message.success("Đã gửi đánh giá thành công!");
      setStarScore(0);
      setcomment("");
      setFileList([]);
      setHasReviewed(true);
      if (onReviewed) onReviewed();
    } catch (error: any) {
      showErrorMessage(error, "Gửi đánh giá thất bại. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

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
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "10px",
        padding: "20px",
        margin: "10px 0",
      }}
    >
      {hasReviewed ? (
        <div
          style={{
            color: "#059669",
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            borderRadius: "8px",
            textAlign: "center",
            padding: "16px",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          ✓ Cảm ơn bạn đã gửi đánh giá cho sản phẩm này!
        </div>
      ) : (
        <div style={{ maxWidth: 640 }}>
          <div style={{ marginBottom: "16px" }}>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "14px",
                fontWeight: 600,
                color: "#131118",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Chấm điểm chất lượng sản phẩm
            </span>
            <Rate
              disabled={isLoading}
              count={5}
              defaultValue={starScore}
              onChange={(val) => setStarScore(val)}
              style={{ fontSize: 28 }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Nhận xét chi tiết
            </span>
            <Input.TextArea
              disabled={isLoading}
              value={comment}
              onChange={(val) => setcomment(val.target.value)}
              placeholder="Hãy chia sẻ cảm nhận của bạn về chất lượng sản phẩm, dịch vụ đóng gói và giao hàng..."
              allowClear
              rows={4}
              style={{
                borderRadius: "8px",
                borderColor: "#E5E7EB",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Hình ảnh thực tế (tối đa 4 ảnh)
            </span>
            <Upload
              fileList={fileList}
              onChange={handleChange}
              accept="image/*"
              listType="picture-card"
              multiple
            >
              {fileList.length < 4 ? "+ Tải ảnh" : null}
            </Upload>
          </div>

          <div style={{ textAlign: "right" }}>
            <Button
              loading={isLoading}
              disabled={!auth.userId || !comment || starScore === 0}
              type="primary"
              size="middle"
              onClick={handleSubmitReview}
              style={{
                background: "#131118",
                color: "#FFFFFF",
                borderRadius: "8px",
                fontWeight: 600,
                padding: "0 24px",
                height: "40px",
                cursor: "pointer",
              }}
            >
              Gửi đánh giá
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
