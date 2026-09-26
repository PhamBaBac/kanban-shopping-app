import handleAPI from "@/apis/handleApi";

export const promotionService = {
  checkPromotionCode: async (code: string): Promise<any> => {
    const res = await handleAPI(`/promotions/check/${code}`);
    return res.data;
  },

  getPromotionByCode: async (code: string): Promise<any> => {
    const res = await handleAPI(`/promotions/code/${code}`);
    return res.data;
  },
};
