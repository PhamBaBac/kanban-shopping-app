/** @format */

export interface ReviewModel {
  id?: string;
  _id?: string;
  comment: string;
  star: number;
  createdBy: string;
  userFirstname?: string;
  userLastname?: string;
  userAvatar?: string;
  subProductId?: string;
  color?: string;
  size?: string;
  images?: string[];
  like?: string[];
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

