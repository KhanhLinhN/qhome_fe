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
}

export interface AssetInspection {
  id: string;
  contractId: string;
  unitId: string;
  unitCode?: string;
  inspectionDate: string;
  status: InspectionStatus;
  inspectorName?: string;
  inspectorNotes?: string;
  completedAt?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
  items: AssetInspectionItem[];
}

export interface CreateAssetInspectionRequest {
  contractId: string;
  unitId: string;
  inspectionDate: string;
  inspectorName?: string;
}

export interface UpdateAssetInspectionItemRequest {
  conditionStatus?: string;
  notes?: string;
  checked?: boolean;
  checkedBy?: string;
}

export async function getInspectionByContractId(contractId: string): Promise<AssetInspection | null> {
  try {
    const response = await axios.get<AssetInspection>(
      `${BASE_URL}/api/asset-inspections/contract/${contractId}`,
    );
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
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




