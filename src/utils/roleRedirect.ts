/**
 * Xác định trang redirect dựa vào roles của user
 */
export function getRedirectPathByRole(roles: string[]): string {
  // Priority order: admin > tenant_owner > specific roles
  
  if (roles.includes('admin')) {
    return '/dashboard';  // Admin có thể vào mọi trang
  }
  
  if (roles.includes('tenant_owner')) {
    return '/dashboard';  // Chủ tòa nhà vào quản lý tài chính
  }
  
  if (roles.includes('account')) {
    return '/dashboard';  // Kế toán vào trang accounting
  }
  
  if (roles.includes('technician') || roles.includes('supporter')) {
    return '/customer-interaction/request';  // Kỹ thuật viên/supporter vào trang xử lý request
  }
  
  // Default: nếu không match role nào, vào customer interaction
  return '/customer-interaction/request';
}


