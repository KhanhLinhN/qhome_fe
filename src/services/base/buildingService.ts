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


export async function getBuilding(id: string): Promise<Building> {
  const response = await axios.get(
    `${BASE_URL}/api/buildings/${id}`,
    { withCredentials: true }
  );
  console.log('Building', response.data);
  return response.data;
}

/**
 * Tạo building mới
 * POST /api/buildings?tenantId=xxx
 */
export async function createBuilding(id: string, data: Partial<Building>): Promise<Building> {
  if (!id) {
    throw new Error('tenantId is required');
  }
  
  const response = await axios.post(
    `${BASE_URL}/api/buildings`,
    data,
    { 
      params: { tenantId: id },
      withCredentials: true 
    }
  );
  return response.data;
}

/**
 * Cập nhật building
 * PUT /api/buildings/:id
 */
export async function updateBuilding(id: string, data: Partial<Building>): Promise<Building> {
  const response = await axios.put(
    `${BASE_URL}/api/buildings/${id}`,
    data,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Xóa building
 * DELETE /api/buildings/:id
 */
export async function deleteBuilding(id: string): Promise<void> {
  const response = await axios.delete(
    `${BASE_URL}/api/buildings/${id}/do`,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Lấy danh sách units theo buildingId
 * GET /api/units?buildingId=xxx
 */
export async function getUnitsByBuildingId(buildingId: string): Promise<any[]> {
  const response = await axios.get(
    `${BASE_URL}/api/units/building/${buildingId}`,
    { 
      withCredentials: true 
    }
  );
  return response.data;
}

/**
 * Kiểm tra code building có tồn tại trong tenant không
 * @param code - Building code cần check
 * @param tenantId - Tenant ID
 * @returns true nếu code đã tồn tại, false nếu chưa
 */
export async function checkBuildingCodeExists(code: string, tenantId: string): Promise<boolean> {
  try {
    const buildings = await getBuildingsByTenant(tenantId);
    return buildings.some(building => building.code.toLowerCase() === code.toLowerCase());
  } catch (error) {
    console.error('Error checking building code:', error);
    return false;
  }
}
