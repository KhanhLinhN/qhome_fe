import axios from "@/src/lib/axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';

export enum InspectionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface AssetInspectionItem {
  id: string;
  assetId: string;
  assetCode?: string;
  assetName?: string;
  assetType?: string;
  conditionStatus?: string;
  notes?: string;
  checked: boolean;
  checkedAt?: string;
  checkedBy?: string;
  damageCost?: number;
  purchasePrice?: number;
}

export interface AssetInspection {
  id: string;
  contractId: string;
  unitId: string;
  unitCode?: string;
  inspectionDate: string;
  status: InspectionStatus;
  inspectorName?: string;
  inspectorId?: string;
  inspectorNotes?: string;
  completedAt?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
  items: AssetInspectionItem[];
  totalDamageCost?: number;
  invoiceId?: string;
}

export interface CreateAssetInspectionRequest {
  contractId: string;
  unitId: string;
  inspectionDate?: string | null;
  inspectorName?: string;
  inspectorId?: string;
}

export interface UpdateAssetInspectionItemRequest {
  conditionStatus?: string;
  notes?: string;
  checked?: boolean;
  checkedBy?: string;
  damageCost?: number;
}

export async function getInspectionByContractId(contractId: string): Promise<AssetInspection | null> {
  try {
    const response = await axios.get<AssetInspection>(
      `${BASE_URL}/api/asset-inspections/contract/${contractId}`,
    );
    return response.data;
  } catch (error: any) {
    const status = error?.response?.status;
    const errorMessage = error?.response?.data?.message || error?.message || '';
    
    if (status === 404) {
      return null;
    }
    
    if (status === 400) {
      const isNotFoundError = errorMessage.toLowerCase().includes('not found') || 
                              errorMessage.toLowerCase().includes('không tìm thấy');
      if (isNotFoundError) {
        return null;
      }
      throw error;
    }
    
    throw error;
  }
}

export async function createInspection(request: CreateAssetInspectionRequest): Promise<AssetInspection> {
  const response = await axios.post<AssetInspection>(
    `${BASE_URL}/api/asset-inspections`,
    request,
  );
  return response.data;
}

export async function updateInspectionItem(
  itemId: string,
  request: UpdateAssetInspectionItemRequest
): Promise<AssetInspectionItem> {
  const response = await axios.put<AssetInspectionItem>(
    `${BASE_URL}/api/asset-inspections/items/${itemId}`,
    request,
  );
  return response.data;
}

export async function startInspection(inspectionId: string): Promise<AssetInspection> {
  const response = await axios.put<AssetInspection>(
    `${BASE_URL}/api/asset-inspections/${inspectionId}/start`,
  );
  return response.data;
}

export async function completeInspection(
  inspectionId: string,
  inspectorNotes?: string
): Promise<AssetInspection> {
  const response = await axios.put<AssetInspection>(
    `${BASE_URL}/api/asset-inspections/${inspectionId}/complete`,
    inspectorNotes,
    {
      headers: {
        'Content-Type': 'text/plain',
      },
    }
  );
  return response.data;
}

export interface GetAllInspectionsParams {
  inspectorId?: string;
  status?: InspectionStatus;
}

export async function getAllInspections(
  params?: GetAllInspectionsParams
): Promise<AssetInspection[]> {
  const queryParams = new URLSearchParams();
  if (params?.inspectorId) {
    queryParams.append('inspectorId', params.inspectorId);
  }
  if (params?.status) {
    queryParams.append('status', params.status);
  }
  
  const url = `${BASE_URL}/api/asset-inspections${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await axios.get<AssetInspection[]>(url);
  return response.data;
}

export async function getInspectionsByTechnicianId(
  technicianId: string
): Promise<AssetInspection[]> {
  const response = await axios.get<AssetInspection[]>(
    `${BASE_URL}/api/asset-inspections/technician/${technicianId}`
  );
  return response.data;
}

export async function getMyAssignments(): Promise<AssetInspection[]> {
  try {
    const response = await axios.get<AssetInspection[]>(
      `${BASE_URL}/api/asset-inspections/my-assignments`
    );
    return response.data || [];
  } catch (error: any) {
    console.error('Failed to get my assignments:', error);
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return [];
    }
    throw error;
  }
}

export async function recalculateDamageCost(inspectionId: string): Promise<AssetInspection> {
  const response = await axios.post<AssetInspection>(
    `${BASE_URL}/api/asset-inspections/${inspectionId}/recalculate-damage`
  );
  return response.data;
}

export async function generateInvoice(inspectionId: string): Promise<AssetInspection> {
  const response = await axios.post<AssetInspection>(
    `${BASE_URL}/api/asset-inspections/${inspectionId}/generate-invoice`
  );
  return response.data;
}

export async function getInspectionsPendingApproval(): Promise<AssetInspection[]> {
  const response = await axios.get<AssetInspection[]>(
    `${BASE_URL}/api/asset-inspections/pending-approval`
  );
  return response.data;
}

export async function approveInspection(inspectionId: string): Promise<AssetInspection> {
  const response = await axios.post<AssetInspection>(
    `${BASE_URL}/api/asset-inspections/${inspectionId}/approve`
  );
  return response.data;
}

export async function rejectInspection(inspectionId: string, rejectionNotes?: string): Promise<AssetInspection> {
  const response = await axios.post<AssetInspection>(
    `${BASE_URL}/api/asset-inspections/${inspectionId}/reject`,
    rejectionNotes,
    {
      headers: {
        'Content-Type': 'text/plain',
      },
    }
  );
  return response.data;
}








