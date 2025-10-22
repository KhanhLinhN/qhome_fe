/**
 * Base Service - Building Management
 * Tương ứng với base-service backend (port 8081)
 */
import axios from "@/src/lib/axios";

export type Building = {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  address: string;
  floorsMax: number;
  totalApartmentsAll: number;
  totalApartmentsActive: number;
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';

/**
 * Lấy danh sách buildings theo tenantId
 * GET /api/buildings?tenantId=xxx
 */
export async function getBuildingsByTenant(tenantId: string): Promise<Building[]> {
  const response = await axios.get(
    `${BASE_URL}/api/buildings`,
    { 
      params: { tenantId },
      withCredentials: true 
    }
  );
  return response.data;
}

/**
 * Lấy thông tin 1 building
 * GET /api/buildings/:id
 */
export async function getBuilding(id: string): Promise<Building> {
  const response = await axios.get(
    `${BASE_URL}/api/buildings/${id}`,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Tạo building mới
 * POST /api/buildings
 */
export async function createBuilding(data: Partial<Building>): Promise<Building> {
  const response = await axios.post(
    `${BASE_URL}/api/buildings`,
    data,
    { withCredentials: true }
  );
  return response.data;
}

