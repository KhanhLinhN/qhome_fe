import axios from '@/src/lib/axios';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';

export interface ResidentSummary {
  id: string;
  fullName: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ResidentDto {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  nationalId: string | null;
  dob: string | null;
  status: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchResidentByIdForAdmin(residentId: string): Promise<ResidentDto> {
  const response = await axios.get<ResidentDto>(`${BASE_URL}/api/residents/by-user/${residentId}`, {
    withCredentials: true,
  });
  return response.data;
}

