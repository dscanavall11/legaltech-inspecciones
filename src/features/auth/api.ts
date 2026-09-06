import { apiFetch } from '@/shared/api/client';

/** Contrato del microservicio de autenticación (mismo del frontend anterior). */
export interface LoginResponseDTO {
  status: string;
  message: string;
  username?: string;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  mfaRequired?: boolean;
  mfaToken?: string;
}

export interface RegisterRequestDTO {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  municipalityCode: string;
}

export interface RegisterResponseDTO {
  status: string;
  message: string;
}

export function login(username: string, password: string) {
  return apiFetch<LoginResponseDTO>('/public/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function loginMfa(mfaToken: string, code: string) {
  return apiFetch<LoginResponseDTO>('/public/auth/login/mfa', {
    method: 'POST',
    body: JSON.stringify({ mfaToken, code }),
  });
}

export function register(payload: RegisterRequestDTO) {
  return apiFetch<RegisterResponseDTO>('/public/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
