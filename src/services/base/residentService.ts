import axios from '@/src/lib/axios';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';

export interface ResidentSummary {
  id: string;
  fullName: string | null;
  phone?: string | null;
  email?: string | null;
}

export async function fetchResidentById(residentId: string): Promise<ResidentSummary> {
  const response = await axios.get<ResidentSummary>(`${BASE_URL}/api/residents/${residentId}`, {
    withCredentials: true,
  });
  return response.data;
}

export async function fetchResidentByUserId(userId: string): Promise<ResidentSummary> {
  const response = await axios.get<ResidentSummary>(`${BASE_URL}/api/residents/by-user/${userId}`, {
    withCredentials: true,
  });
  return response.data;
}

