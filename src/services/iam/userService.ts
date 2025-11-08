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



