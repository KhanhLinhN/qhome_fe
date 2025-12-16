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
    const residents = await getAllResidents();
    
    // Check if nationalId exists in the list
    const exists = residents.some((resident) => {
      if (!resident.nationalId) return false;
      const residentNationalId = resident.nationalId.trim().replace(/\s+/g, '');
      return residentNationalId.toLowerCase() === cleanedId.toLowerCase();
    });
    
    return exists;
  } catch (err: any) {
<<<<<<< Updated upstream
    console.warn('Error checking national ID:', err?.response?.status || err?.message);
    return false; // Return false để không block submit, backend sẽ validate khi submit form
  }
}

export async function checkPhoneExists(phone: string): Promise<boolean> {
  if (!phone || !phone.trim()) {
    return false;
  }

  try {
    const cleanedPhone = phone.trim().replace(/\s+/g, '');
    const residents = await getAllResidents();
    
    // Check if phone exists in the list
    const exists = residents.some((resident) => {
      if (!resident.phone) return false;
      const residentPhone = resident.phone.trim().replace(/\s+/g, '');
      return residentPhone === cleanedPhone;
    });
    
    return exists;
  } catch (err: any) {
    console.warn('Error checking phone:', err?.response?.status || err?.message);
    return false; // Return false để không block submit, backend sẽ validate khi submit form
  }
}

export async function checkResidentEmailExists(email: string): Promise<boolean> {
  if (!email || !email.trim()) {
    return false;
  }

  try {
    const cleanedEmail = email.trim().toLowerCase();
    const residents = await getAllResidents();
    
    // Check if email exists in the list
    const exists = residents.some((resident) => {
      if (!resident.email) return false;
      const residentEmail = resident.email.trim().toLowerCase();
      return residentEmail === cleanedEmail;
    });
    
    return exists;
  } catch (err: any) {
    console.warn('Error checking resident email:', err?.response?.status || err?.message);
    return false; // Return false để không block submit, backend sẽ validate khi submit form


    // Nếu là 404, đây là expected behavior (CCCD không tồn tại) - không log như error
    if (err?.response?.status === 404) {
      return false;
    }
    // Chỉ log các lỗi không phải 404 (network, 500, etc.)
=======
>>>>>>> Stashed changes
    // Nếu là 404, đây là expected behavior (CCCD không tồn tại) - không log như error
    if (err?.response?.status === 404) {
      return false;
    }
    // Chỉ log các lỗi không phải 404 (network, 500, etc.)
    // Return false để không block submit, backend sẽ validate khi submit form
    // Backend có unique constraint trên national_id nên sẽ báo lỗi nếu trùng
    console.warn('Error checking national ID (non-404):', err?.response?.status || err?.message);
    return false;

  }
}

