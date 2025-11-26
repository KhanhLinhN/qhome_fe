/**
 * IAM Service - Authentication & Authorization
 * Tương ứng với iam-service backend (port 8088)
 */
import axios from "@/src/lib/axios";

export type LoginPayload = { 
  username: string; 
  password: string; 
  tenantId?: string;
  remember?: boolean;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  userInfo: {
    userId: string;
    username: string;
    email: string;
    tenantId: string;
    tenantName?: string;
    roles: string[];
    permissions: string[];
  };
};

/**
 * Login API
 * POST /api/auth/login
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_IAM_URL || 'http://localhost:8088';
  const endpoint = `${apiUrl}/api/auth/login`;
  
  const requestBody = {
    username: payload.username,
    password: payload.password,
    tenantId: payload.tenantId || null
  };

  const response = await axios.post(
    endpoint, 
    requestBody,
    {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  
  // Lưu JWT token vào localStorage
  if (response.data?.accessToken) {
    localStorage.setItem('accessToken', response.data.accessToken);
  }
  
  return response.data;
}

/**
 * Logout API
 */
export async function logout(): Promise<void> {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  // TODO: Call backend logout API if needed
}

/**
 * Forgot Password API
 * POST /api/users/forgot-password
 */
export async function forgotPassword(email: string): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_IAM_URL || 'http://localhost:8088';
  const endpoint = `${apiUrl}/api/users/forgot-password`;
  
  const response = await axios.post(
    endpoint,
    { email },
    {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}

