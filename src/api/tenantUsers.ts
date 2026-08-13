import { apiRequest } from './client';
import type {
  TenantUserCreateRequest,
  TenantUserListResponse,
  TenantUserResponse,
  TenantUserUpdateRequest,
} from './types';

export function listTenantUsers(token: string): Promise<TenantUserListResponse> {
  return apiRequest<TenantUserListResponse>('/api/tenant-users', { token });
}

export function getTenantUser(token: string, userId: number): Promise<TenantUserResponse> {
  return apiRequest<TenantUserResponse>(`/api/tenant-users/${userId}`, { token });
}

export function createTenantUser(
  token: string,
  body: TenantUserCreateRequest,
): Promise<TenantUserResponse> {
  return apiRequest<TenantUserResponse>('/api/tenant-users', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

export function updateTenantUser(
  token: string,
  userId: number,
  body: TenantUserUpdateRequest,
): Promise<TenantUserResponse> {
  return apiRequest<TenantUserResponse>(`/api/tenant-users/${userId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(body),
  });
}

export function deleteTenantUser(token: string, userId: number): Promise<void> {
  return apiRequest<void>(`/api/tenant-users/${userId}`, {
    method: 'DELETE',
    token,
  });
}

export function resetTenantUserPassword(
  token: string,
  userId: number,
  newPassword: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/tenant-users/${userId}/password/reset`, {
    method: 'POST',
    token,
    body: JSON.stringify({ new_password: newPassword }),
  });
}

export {
  listAccountBuckets,
  updateAccountBuckets,
} from './buckets';
