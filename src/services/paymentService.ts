import handleAPI from "@/apis/handleApi";

export interface PaymentData {
  addressId: string;
  items: any[];
}

export const paymentService = {
  // Tạo payment
  createPayment: async (data: any): Promise<any> => {
    const res = await handleAPI("/payment/create", data, "post");
    return res.data;
  },
};
