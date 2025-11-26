/**
 * Finance Service - Catalog APIs
 * Tương ứng với finance-service backend
 */
import { http } from "../http";
import { Building, BillingCycle, NotificationTemplate } from "@/src/types/domain";

const BASE = "/api";

export const CatalogApi = {
  /**
   * Lấy danh sách buildings active
   * GET /api/buildings?active=true
   */
  buildings() {
    return http<Building[]>(`${BASE}/buildings?active=true`);
  },

  /**
   * Lấy billing cycles đang mở
   * GET /api/billing-cycles?status=OPEN
   */
  billingCyclesOpen() {
    return http<BillingCycle[]>(`${BASE}/billing-cycles?status=OPEN`);
  },

  /**
   * Lấy notification templates cho phí
   * GET /api/notification-templates?type=FEE
   */
  feeTemplates() {
    return http<NotificationTemplate[]>(`${BASE}/notification-templates?type=FEE`);
  }
};

