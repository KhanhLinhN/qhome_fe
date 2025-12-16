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

export async function fetchResidentByUserId(userId: string): Promise<ResidentSummary> {
  const response = await axios.get<ResidentSummary>(`${BASE_URL}/api/residents/by-user/${userId}`, {
    withCredentials: true,
  });
  return response.data;
}

export async function fetchResidentById(residentId: string): Promise<ResidentDto> {
  const response = await axios.get<ResidentDto>(`${BASE_URL}/api/residents/${residentId}`, {
    withCredentials: true,
  });
  return response.data;
}

export async function getAllResidents(): Promise<ResidentDto[]> {
  const response = await axios.get<ResidentDto[]>(`${BASE_URL}/api/residents`, {
    withCredentials: true,
  });
  return response.data;
}


export async function checkNationalIdExists(nationalId: string): Promise<boolean> {
  if (!nationalId || !nationalId.trim()) {
    return false;
  }

  try {
    const cleanedId = nationalId.trim().replace(/\s+/g, '');
    const response = await axios.get<ResidentDto>(
      `${BASE_URL}/api/residents/by-national-id/${encodeURIComponent(cleanedId)}`,
      { 
        withCredentials: true,
        validateStatus: (status) => status === 200 || status === 404 // Không throw error cho 404
      }
    );
    return response.status === 200; // Số CCCD tồn tại nếu status 200
  } catch (err: any) {
    // Chỉ catch các lỗi không phải 404 (network, 500, etc.)
    // Return false để không block submit, backend sẽ validate khi submit form
    // Backend có unique constraint trên national_id nên sẽ báo lỗi nếu trùng
    console.warn('Error checking national ID (non-404):', err?.response?.status || err?.message);
    return false;
  }
}

