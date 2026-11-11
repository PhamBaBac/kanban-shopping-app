/** @format */

import { useState, useEffect } from "react";
import { PromotionModel } from "@/models/PromotionModel";
import { homeService, promotionService } from "@/services";
import { filterActivePromotions, isPromotionActive } from "@/utils/promotionHelper";

// In-memory cache cho promotions để không spam API khi nhiều ProductItem cùng render
let cachedActivePromotions: PromotionModel[] | null = null;
let fetchPromise: Promise<PromotionModel[]> | null = null;

export const getOrFetchActivePromotions = async (): Promise<PromotionModel[]> => {
  if (cachedActivePromotions) {
    return filterActivePromotions(cachedActivePromotions);
  }

  if (!fetchPromise) {
    fetchPromise = (async () => {
      try {
        // Thử lấy trực tiếp từ endpoint active của backend
        const directCampaign = await promotionService.getActiveCampaign();
        if (directCampaign) {
          cachedActivePromotions = [directCampaign];
          return [directCampaign];
        }
        const list = await homeService.getPromotions();
        const campaignsOnly = (list || []).filter(
          (p) => p.isCampaign === true || (p.code && p.code.startsWith("CAMPAIGN_"))
        );
        cachedActivePromotions = campaignsOnly;
        return filterActivePromotions(cachedActivePromotions);
      } catch (err) {
        console.error("Error fetching active promotions for campaign ribbon:", err);
        return [];
      } finally {
        fetchPromise = null;
      }
    })();
  }

  return fetchPromise;
};

/**
 * Hook trả về chiến dịch khuyến mãi đang hoạt động (active campaign)
 * Dùng để render banner/ribbon trên thẻ sản phẩm
 */
export const useActiveCampaign = (overridePromotion?: PromotionModel | null) => {
  const [activeCampaign, setActiveCampaign] = useState<PromotionModel | null>(() => {
    if (overridePromotion && isPromotionActive(overridePromotion)) {
      return overridePromotion;
    }
    if (cachedActivePromotions && cachedActivePromotions.length > 0) {
      const activeList = filterActivePromotions(cachedActivePromotions);
      return activeList.length > 0 ? activeList[0] : null;
    }
    return null;
  });

  useEffect(() => {
    if (overridePromotion) {
      setActiveCampaign(isPromotionActive(overridePromotion) ? overridePromotion : null);
      return;
    }

    let isMounted = true;
    getOrFetchActivePromotions().then((list) => {
      if (!isMounted) return;
      if (list && list.length > 0) {
        setActiveCampaign(list[0]);
      } else {
        setActiveCampaign(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [overridePromotion]);

  return { activeCampaign };
};

