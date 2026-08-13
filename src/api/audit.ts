import { apiDownload, apiRequest } from './client';
import type { AuditLogFilters, AuditLogListResponse } from './types';

function buildQuery(filters: AuditLogFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function listAuditLogs(
  token: string,
  filters: AuditLogFilters = {},
): Promise<AuditLogListResponse> {
  return apiRequest<AuditLogListResponse>(`/api/audit-logs${buildQuery(filters)}`, { token });
}

export function exportAuditLogs(token: string, filters: AuditLogFilters = {}): Promise<Blob> {
  return apiDownload(`/api/audit-logs/export${buildQuery(filters)}`, token);
}
