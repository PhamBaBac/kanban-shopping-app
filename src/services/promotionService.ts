import handleAPI from "@/apis/handleApi";

export const promotionService = {
  checkPromotionCode: async (code: string, userId?: string): Promise<any> => {
    const url = userId ? `/promotions/check/${code}?userId=${encodeURIComponent(userId)}` : `/promotions/check/${code}`;
    const res = await handleAPI(url);
    return res.data;
  },

  getPromotionByCode: async (code: string): Promise<any> => {
    const res = await handleAPI(`/promotions/code/${code}`);
    return res.data;
  },
};
