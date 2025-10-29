/**
 * Base Service - Vehicle Management
 * Tương ứng với base-service backend (port 8081)
 */
import axios from "@/src/lib/axios";
import { Vehicle } from "@/src/types/vehicle";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';

/**
 * Lấy danh sách vehicles theo unitId
 * GET /api/vehicles/unit/:unitId
 */
export async function getVehiclesByUnit(unitId: string): Promise<Vehicle[]> {
  const response = await axios.get(
    `${BASE_URL}/api/vehicles/unit/${unitId}`,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Lấy danh sách vehicles theo buildingId
 * GET /api/vehicles/building/:buildingId
 */
export async function getVehiclesByBuilding(buildingId: string): Promise<Vehicle[]> {
  const response = await axios.get(
    `${BASE_URL}/api/vehicles/building/${buildingId}`,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Lấy danh sách vehicles theo tenantId
 * GET /api/vehicles/tenant/:tenantId
 */
export async function getVehiclesByTenant(tenantId: string): Promise<Vehicle[]> {
  const response = await axios.get(
    `${BASE_URL}/api/vehicles/tenant/${tenantId}`,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Lấy danh sách vehicles đã đăng ký thành công (active = true)
 * GET /api/vehicles/tenant/:tenantId/active
 */
export async function getActiveVehicles(tenantId: string): Promise<Vehicle[]> {
  const response = await axios.get(
    `${BASE_URL}/api/vehicles/tenant/${tenantId}/active`,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Lấy danh sách vehicles chờ phê duyệt (registrationApprovedAt = null)
 * GET /api/vehicles/tenant/:tenantId/pending
 */
export async function getPendingVehicles(tenantId: string): Promise<Vehicle[]> {
  const response = await axios.get(
    `${BASE_URL}/api/vehicles/tenant/${tenantId}/pending`,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Lấy thông tin 1 vehicle
 * GET /api/vehicles/:id
 */
export async function getVehicle(id: string): Promise<Vehicle> {
  const response = await axios.get(
    `${BASE_URL}/api/vehicles/${id}`,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Tạo vehicle mới
 * POST /api/vehicles
 */
export async function createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
  const response = await axios.post(
    `${BASE_URL}/api/vehicles`,
    data,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Cập nhật vehicle
 * PUT /api/vehicles/:id
 */
export async function updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
  const response = await axios.put(
    `${BASE_URL}/api/vehicles/${id}`,
    data,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Phê duyệt đơn đăng ký vehicle
 * POST /api/vehicles/:id/approve
 */
export async function approveVehicle(id: string): Promise<Vehicle> {
  const response = await axios.post(
    `${BASE_URL}/api/vehicles/${id}/approve`,
    {},
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Xóa vehicle
 * DELETE /api/vehicles/:id
 */
export async function deleteVehicle(id: string): Promise<void> {
  const response = await axios.delete(
    `${BASE_URL}/api/vehicles/${id}`,
    { withCredentials: true }
  );
  return response.data;
}

