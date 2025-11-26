import { http } from "../http";
import { Building, BillingCycle, NotificationTemplate } from "@/src/types/domain";

const BASE = "/api";

export const CatalogApi = {
  buildings() {
    return http<Building[]>(`${BASE}/buildings?active=true`);
  },
  billingCyclesOpen() {
    return http<BillingCycle[]>(`${BASE}/billing-cycles?status=OPEN`);
  },
  feeTemplates() {
    return http<NotificationTemplate[]>(`${BASE}/notification-templates?type=FEE`);
  }
};


