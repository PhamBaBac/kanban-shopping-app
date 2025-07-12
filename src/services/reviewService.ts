import handleAPI from "@/apis/handleApi";
import { uploadFile } from "@/utils/uploadFile";

export interface CreateReviewData {
  createdBy: string;
  subProductId: string;
  orderId: string;
  comment: string;
  star: number;
  images?: string[];
}

export const reviewService = {
  // Tạo review
  createReview: async (data: CreateReviewData): Promise<any> => {
    const res = await handleAPI("/reviewProducts", data, "post");
    return res.data;
  },

  // Upload review images
  uploadReviewImages: async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map((file) => uploadFile(file));
    return await Promise.all(uploadPromises);
  },
};
