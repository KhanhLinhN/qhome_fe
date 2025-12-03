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


export async function checkNationalIdExists(nationalId: string): Promise<boolean> {
  if (!nationalId || !nationalId.trim()) {
    return false;
  }

  try {

    const cleanedId = nationalId.trim().replace(/\s+/g, '');
    await axios.get<ResidentDto>(
      `${BASE_URL}/api/residents/by-national-id/${encodeURIComponent(cleanedId)}`,
      { withCredentials: true }
    );
    return true; // Số CCCD tồn tại (status 200)
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404) {
      return false; // Số CCCD chưa tồn tại
    }
    // Nếu có lỗi khác (network, 500, endpoint không tồn tại), 
    // return false để không block submit, backend sẽ validate khi submit form
    // Backend có unique constraint trên national_id nên sẽ báo lỗi nếu trùng
    if (status !== 404) {
      console.warn('Error checking national ID (endpoint may not exist):', err?.response?.status || err?.message);
    }
    return false;
  }
}

