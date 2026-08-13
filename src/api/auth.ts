import { apiRequest } from './client';
import type { LoginRequest, LoginResponse, MeResponse } from './types';

export function login(body: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function fetchMe(token: string): Promise<MeResponse> {
  return apiRequest<MeResponse>('/api/me', { token });
}

export function logout(token: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/logout', {
    method: 'POST',
    token,
  });
}

export function changePassword(
  token: string,
  body: { old_password: string; new_password: string },
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/password/change', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}
