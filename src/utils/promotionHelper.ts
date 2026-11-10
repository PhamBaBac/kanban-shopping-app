/** @format */

import { PromotionModel } from "@/models/PromotionModel";

/**
 * Parses a backend datetime string as UTC when no explicit timezone offset is present.
 * Matches backend `ZoneOffset.UTC` serialization for `LocalDateTime`.
 */
export const parsePromotionUtcTime = (val?: string | null): number | null => {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  const hasTimezone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(trimmed);
  const timestamp = new Date(hasTimezone ? trimmed : `${trimmed}Z`).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

/**
 * Returns true if the promotion is currently active (started, not expired, and has remaining stock).
 */
export const isPromotionActive = (
  promo: PromotionModel,
  nowMs: number = Date.now()
): boolean => {
  if (!promo) return false;

  if (
    promo.numOfAvailable !== undefined &&
    promo.numOfAvailable !== null &&
    promo.numOfAvailable <= 0
  ) {
    return false;
  }

  const startTs = parsePromotionUtcTime(promo.startAt);
  if (startTs !== null && nowMs < startTs) {
    return false;
  }

  const endTs = parsePromotionUtcTime(promo.endAt);
  if (endTs !== null && nowMs > endTs) {
    return false;
  }

  return true;
};

export const filterActivePromotions = (
  promotions: PromotionModel[] = [],
  nowMs: number = Date.now()
): PromotionModel[] => {
  if (!Array.isArray(promotions)) return [];
  return promotions.filter((promo) => isPromotionActive(promo, nowMs));
};

