/**
 * Helper type for error handling
 * Use this instead of `any` for catch blocks
 */
export interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
  error?: string;
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'message' in error)
  );
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown, defaultMessage = 'Đã xảy ra lỗi'): string {
  if (isApiError(error)) {
    return error.response?.data?.message || error.response?.data?.error || error.message || error.error || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  if (typeof error === 'string') {
    return error;
  }
  return defaultMessage;
}

