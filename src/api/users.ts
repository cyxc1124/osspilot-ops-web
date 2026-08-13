import { apiRequest } from './client';
import type {
  UserCreateRequest,
  UserListResponse,
  UserResponse,
  UserUpdateRequest,
} from './types';

export function listUsers(token: string): Promise<UserListResponse> {
  return apiRequest<UserListResponse>('/api/users', { token });
}

export function getUser(token: string, userId: number): Promise<UserResponse> {
  return apiRequest<UserResponse>(`/api/users/${userId}`, { token });
}

export function createUser(token: string, body: UserCreateRequest): Promise<UserResponse> {
  return apiRequest<UserResponse>('/api/users', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

export function updateUser(
  token: string,
  userId: number,
  body: UserUpdateRequest,
): Promise<UserResponse> {
  return apiRequest<UserResponse>(`/api/users/${userId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(body),
  });
}

export function deleteUser(token: string, userId: number): Promise<void> {
  return apiRequest<void>(`/api/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}

export function resetUserPassword(
  token: string,
  userId: number,
  newPassword: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/users/${userId}/password/reset`, {
    method: 'POST',
    token,
    body: JSON.stringify({ new_password: newPassword }),
  });
}
