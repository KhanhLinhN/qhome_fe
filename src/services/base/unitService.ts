/**
 * Base Service - Unit Management
 * Tương ứng với base-service backend (port 8081)
 */
import axios from "@/src/lib/axios";

export type Unit = {
  id: string;
  buildingId: string;
  tenantId: string;
  code: string;
  name: string;
  floor: number;
  areaM2?: number;
  bedrooms?: number;
  status?: string;
  ownerName?: string;
  ownerContact?: string;
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';

/**
 * Lấy danh sách units theo buildingId
 * GET /api/units/building/:buildingId
 */
export async function getUnitsByBuilding(buildingId: string): Promise<Unit[]> {
  const response = await axios.get(
    `${BASE_URL}/api/units/building/${buildingId}`,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Lấy thông tin 1 unit
 * GET /api/units/:id
 */
export async function getUnit(id: string): Promise<Unit> {
  const response = await axios.get(
    `${BASE_URL}/api/units/${id}`,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Tạo unit mới
 * POST /api/units
 */
export async function createUnit(data: Partial<Unit>): Promise<Unit> {
  if (!data.buildingId || !data.tenantId) {
    throw new Error('buildingId and tenantId are required in data');
  }

  console.log("Creating unit with data:", JSON.stringify(data, null, 2));
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/units`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error("Create unit error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

/**
 * Cập nhật unit
 * PUT /api/units/:id
 */
export async function updateUnit(id: string, data: Partial<Unit>): Promise<Unit> {
  const response = await axios.put(
    `${BASE_URL}/api/units/${id}`,
    data,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Xóa unit
 * DELETE /api/units/:id
 */
export async function deleteUnit(id: string): Promise<void> {
  const response = await axios.delete(
    `${BASE_URL}/api/units/${id}`,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Kiểm tra code unit có tồn tại trong building không
 * @param code - Unit code cần check
 * @param buildingId - Building ID
 * @returns true nếu code đã tồn tại, false nếu chưa
 */
export async function checkUnitCodeExists(code: string, buildingId: string): Promise<boolean> {
  try {
    const units = await getUnitsByBuilding(buildingId);
    return units.some(unit => unit.code.toLowerCase() === code.toLowerCase());
  } catch (error) {
    console.error('Error checking unit code:', error);
    return false;
  }
}

