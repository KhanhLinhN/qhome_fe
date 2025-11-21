import axios from "@/src/lib/axios";
import type { Unit } from "./unitService";

export type Building = {
  id: string;
  code: string;
  name: string;
  address: string;
  floorsMax: number;
  totalApartmentsAll: number;
  totalApartmentsActive: number;
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';


export async function getBuildings(): Promise<Building[]> {
  const response = await axios.get(
    `${BASE_URL}/api/buildings`,
    { 
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
 * POST /api/buildings
 */
export async function createBuilding(data: Partial<Building>): Promise<Building> {
  const response = await axios.post(
    `${BASE_URL}/api/buildings`,
    data,
    { 
      withCredentials: true 
    }
  );
  return response.data;
}

/**
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
 * GET /api/units/building/:buildingId
 */
export async function getUnitsByBuildingId(buildingId: string): Promise<Unit[]> {
  const response = await axios.get(
    `${BASE_URL}/api/units/building/${buildingId}`,
    { 
      withCredentials: true 
    }
  );
  return response.data;
}

/**
 * GET /api/buildings?tenantId=:tenantId
 * Lấy danh sách buildings theo tenantId
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
 * GET /api/buildings/check-code?code=:code
 */
export async function checkBuildingCodeExists(code: string): Promise<boolean> {
  try {
    const buildings = await getBuildings();
    return buildings.some(building => building.code.toLowerCase() === code.toLowerCase());
  } catch (error) {
    console.error('Error checking building code:', error);
    return false;
  }
}
