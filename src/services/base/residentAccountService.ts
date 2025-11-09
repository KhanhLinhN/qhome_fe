import axios from '@/src/lib/axios';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';

export type AccountCreationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | string;

export interface AccountCreationRequest {
  id: string;
  residentId: string;
  residentName: string;
  residentEmail: string;
  residentPhone: string;
  householdId: string | null;
  unitId: string | null;
  unitCode: string | null;
  relation: string | null;
  requestedBy: string | null;
  requestedByName: string | null;
  username: string | null;
  email: string | null;
  autoGenerate: boolean;
  status: AccountCreationRequestStatus;
  approvedBy: string | null;
  approvedByName: string | null;
  rejectedBy: string | null;
  rejectedByName: string | null;
  rejectionReason: string | null;
  proofOfRelationImageUrl: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
}

export interface ApproveAccountRequestPayload {
  approve: boolean;
  rejectionReason?: string;
}

export interface ResidentWithoutAccount {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  nationalId: string | null;
  dob: string | null;
  status: string | null;
  relation: string | null;
  isPrimary: boolean;
}

export async function fetchPendingAccountRequests(): Promise<AccountCreationRequest[]> {
  const response = await axios.get<AccountCreationRequest[]>(
    `${BASE_URL}/api/admin/account-requests/pending`,
    { withCredentials: true },
  );
  return response.data;
}

export async function approveAccountRequest(
  requestId: string,
  payload: ApproveAccountRequestPayload,
): Promise<AccountCreationRequest> {
  const response = await axios.post<AccountCreationRequest>(
    `${BASE_URL}/api/admin/account-requests/${requestId}/approve`,
    payload,
    { withCredentials: true },
  );
  return response.data;
}

export async function fetchResidentsWithoutAccount(
  unitId: string,
): Promise<ResidentWithoutAccount[]> {
  const response = await axios.get<ResidentWithoutAccount[]>(
    `${BASE_URL}/api/residents/units/${unitId}/household/members/without-account`,
    { withCredentials: true },
  );
  return response.data;
}


