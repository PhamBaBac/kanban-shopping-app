/** @format */

import { ReviewModel } from "@/models/ReviewModel";
import { authSelector } from "@/redux/reducers/authReducer";
import { handleChangeFile, uploadFile } from "@/utils/uploadFile";
import { reviewService } from "@/services";
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
  console.log("subProductId", subProductId);

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
      message.success("Review added successfully");
      setStarScore(0);
      setcomment("");
      setFileList([]);
      setHasReviewed(true);
      if (onReviewed) onReviewed();
    } catch (error: any) {
      message.error(error?.message || "Review failed");
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
    <div className="mb-5">
      {hasReviewed ? (
        <div style={{ color: "green", textAlign: "center", padding: "20px" }}>
          Bạn đã đánh giá sản phẩm này
        </div>
      ) : (
        <div className="row">
          <div className="col-sm-12 col-md-8 col-lg-6">
            <div className="mt-4 text-center">
              <Rate
                disabled={isLoading}
                count={5}
                defaultValue={starScore}
                onChange={(val) => setStarScore(val)}
                style={{ fontSize: 42 }}
              />
            </div>
            <div className="mt-4">
              <Input.TextArea
                disabled={isLoading}
                value={comment}
                onChange={(val) => setcomment(val.target.value)}
                allowClear
                rows={5}
              />
            </div>
            <div className="mt-3">
              <Upload
                fileList={fileList}
                onChange={handleChange}
                accept="image/*"
                listType="picture-card"
                multiple
              >
                {fileList.length <= 4 ? "Upload" : null}
              </Upload>
            </div>
            <div className="mt-3 text-right">
              <Button
                loading={isLoading}
                disabled={!auth.userId || !comment}
                type="primary"
                size="large"
                onClick={handleSubmitReview}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
