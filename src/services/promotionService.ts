import handleAPI from "@/apis/handleApi";

export const promotionService = {
  // Kiểm tra promotion code
  checkPromotionCode: async (code: string): Promise<any> => {
    const res = await handleAPI(`/promotions/check/${code}`);
    return res.data;
  },

  // Lấy chi tiết promotion theo code
  getPromotionByCode: async (code: string): Promise<any> => {
    const res = await handleAPI(`/promotions/code/${code}`);
    return res.data;
  },
};
