interface ErrorMeta {
  status: number;
  message: string;
}

const errorMap: Record<string, ErrorMeta> = {
  INVALID_CREDENTIALS: { status: 401, message: 'Invalid email or password' },
  USER_INACTIVE: { status: 403, message: 'Account is inactive. Contact your administrator' },
  USER_NOT_FOUND: { status: 404, message: 'User not found' },
  EMAIL_ALREADY_EXISTS: { status: 409, message: 'This email is already registered' },
  USER_ALREADY_INACTIVE: { status: 409, message: 'Account is already inactive' },
  ROLE_UNCHANGED: { status: 409, message: 'User already has this role' },

  EMAIL_EMPTY: { status: 400, message: 'Email is required' },
  EMAIL_INVALID_FORMAT: { status: 400, message: 'Invalid email format' },
  PASSWORD_TOO_SHORT: { status: 400, message: 'Password must be at least 8 characters' },
  PASSWORD_TOO_WEAK: { status: 400, message: 'Password must contain uppercase, number, and special character' },

  TOKEN_INVALID: { status: 401, message: 'Token is invalid' },
  TOKEN_EXPIRED: { status: 401, message: 'Token has expired' },
  TOKEN_REVOKED: { status: 401, message: 'Token has been revoked' },
  TOKEN_ALREADY_USED: { status: 401, message: 'Token has already been used' },
  REFRESH_TOKEN_REUSED: { status: 401, message: 'Security violation detected. Please log in again' },
};

export function mapAuthError(code: string): ErrorMeta {
  return errorMap[code] ?? { status: 500, message: 'An unexpected error occurred' };
}
