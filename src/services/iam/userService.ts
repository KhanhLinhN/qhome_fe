import axios from '@/src/lib/axios';

const IAM_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://localhost:8088';

export interface UserProfileInfo {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface UserAccountInfo {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  active: boolean;
  buildingId?: string;
  buildingCode?: string;
  buildingName?: string;
  residentId?: string;
}

export interface UserStatusInfo {
  active: boolean;
  failedLoginAttempts: number;
  accountLocked: boolean;
  lastLogin: string | null;
}

export interface UpdateUserProfilePayload {
  username?: string;
  email?: string;
  active?: boolean;
}

export interface UpdateUserPasswordPayload {
  newPassword: string;
}

export interface UpdateStaffAccountPayload {
  username: string;
  email: string;
  active?: boolean;
  roles?: string[];
  newPassword?: string;
}

export interface UpdateResidentAccountPayload {
  username?: string;
  email?: string;
  active?: boolean;
}

export interface CreateStaffAccountPayload {
  username: string;
  email: string;
  password: string;
  roles: string[];
  active?: boolean;
}

export interface CreateResidentAccountPayload {
  username: string;
  email: string;
  residentId: string;
  autoGenerate?: boolean;
  password?: string;
}

export async function fetchUserProfile(userId: string): Promise<UserProfileInfo> {
  const response = await axios.get<UserProfileInfo>(
    `${IAM_URL}/api/users/${userId}`,
    { withCredentials: true }
  );
  return response.data;
}

export async function fetchUserAccount(userId: string): Promise<UserAccountInfo> {
  const response = await axios.get<UserAccountInfo>(
    `${IAM_URL}/api/users/${userId}/account-info`,
    { withCredentials: true }
  );
  return response.data;
}

export async function fetchUserStatus(userId: string): Promise<UserStatusInfo> {
  const response = await axios.get<UserStatusInfo>(
    `${IAM_URL}/api/users/${userId}/status`,
    { withCredentials: true }
  );
  return response.data;
}

export async function updateUserProfile(
  userId: string,
  payload: UpdateUserProfilePayload
): Promise<UserAccountInfo> {
  const response = await axios.put<UserAccountInfo>(
    `${IAM_URL}/api/users/${userId}`,
    payload,
    { withCredentials: true }
  );
  return response.data;
}

export async function updateUserPassword(
  userId: string,
  payload: UpdateUserPasswordPayload
): Promise<void> {
  await axios.patch<void>(
    `${IAM_URL}/api/users/${userId}/password`,
    payload,
    { withCredentials: true }
  );
}

export async function fetchStaffAccounts(): Promise<UserAccountInfo[]> {
  const response = await axios.get<UserAccountInfo[]>(
    `${IAM_URL}/api/users/staff`,
    { withCredentials: true }
  );
  return response.data;
}

export async function fetchResidentAccounts(): Promise<UserAccountInfo[]> {
  const response = await axios.get<UserAccountInfo[]>(
    `${IAM_URL}/api/users/residents`,
    { withCredentials: true }
  );
  return response.data;
}

export async function fetchStaffAccountDetail(userId: string): Promise<UserAccountInfo> {
  const response = await axios.get<UserAccountInfo>(
    `${IAM_URL}/api/users/staff/${userId}`,
    { withCredentials: true }
  );
  return response.data;
}

export async function fetchResidentAccountDetail(userId: string): Promise<UserAccountInfo> {
  return fetchUserAccount(userId);
}

export async function updateStaffAccount(
  userId: string,
  payload: UpdateStaffAccountPayload,
): Promise<UserAccountInfo> {
  const response = await axios.put<UserAccountInfo>(
    `${IAM_URL}/api/users/staff/${userId}`,
    payload,
    { withCredentials: true },
  );
  return response.data;
}

export async function updateResidentAccount(
  userId: string,
  payload: UpdateResidentAccountPayload,
): Promise<UserAccountInfo> {
  return updateUserProfile(userId, payload);
}

export async function createStaffAccount(
  payload: CreateStaffAccountPayload,
): Promise<UserAccountInfo> {
  const response = await axios.post<UserAccountInfo>(
    `${IAM_URL}/api/users/staff`,
    payload,
    { withCredentials: true },
  );
  return response.data;
}

export async function createResidentAccount(
  payload: CreateResidentAccountPayload,
): Promise<UserAccountInfo> {
  if (payload.email) {
    try {
      await axios.get(`${IAM_URL}/api/users/by-email/${encodeURIComponent(payload.email)}`, {
        withCredentials: true,
      });
      throw new Error('Email đã tồn tại.');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status && status !== 404) {
        throw err;
      }
    }
  }

  const response = await axios.post<UserAccountInfo>(
    `${IAM_URL}/api/users/create-for-resident`,
    payload,
    { withCredentials: true },
  );
  return response.data;
}

export async function deleteAccount(userId: string): Promise<void> {
  const response = await axios.delete(`${IAM_URL}/api/users/staff/${userId}`, 
    { withCredentials: true });
  return response.data;
}



