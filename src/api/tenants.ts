/**
 * @deprecated Tenant entity APIs removed in account-centric model.
 * Use tenantUsers.ts for account management and buckets.ts for bucket registry.
 */
import { apiRequest } from './client';
import type {
  TenantCreateRequest,
  TenantDetail,
  TenantListResponse,
  TenantSummary,
  TenantUpdateRequest,
} from './types';

/** @deprecated */
export function listTenants(token: string): Promise<TenantListResponse> {
  return apiRequest<TenantListResponse>('/api/tenants', { token });
}

/** @deprecated */
export function getTenant(token: string, tenantId: number): Promise<TenantDetail> {
  return apiRequest<TenantDetail>(`/api/tenants/${tenantId}`, { token });
}

/** @deprecated */
export function createTenant(
  token: string,
  body: TenantCreateRequest,
): Promise<TenantSummary> {
  return apiRequest<TenantSummary>('/api/tenants', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

/** @deprecated */
export function updateTenant(
  token: string,
  tenantId: number,
  body: TenantUpdateRequest,
): Promise<TenantDetail> {
  return apiRequest<TenantDetail>(`/api/tenants/${tenantId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(body),
  });
}

/** @deprecated */
export function deleteTenant(token: string, tenantId: number): Promise<void> {
  return apiRequest<void>(`/api/tenants/${tenantId}`, {
    method: 'DELETE',
    token,
  });
}
