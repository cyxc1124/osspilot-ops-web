import { apiRequest } from './client';
import type {
  StorageRegion,
  StorageRegionCreateRequest,
  StorageRegionListResponse,
  StorageRegionUpdateRequest,
} from './types';

export function listRegions(token: string): Promise<StorageRegionListResponse> {
  return apiRequest<StorageRegionListResponse>('/api/regions', { token });
}

export function createRegion(
  token: string,
  body: StorageRegionCreateRequest,
): Promise<StorageRegion> {
  return apiRequest<StorageRegion>('/api/regions', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

export function updateRegion(
  token: string,
  regionId: number,
  body: StorageRegionUpdateRequest,
): Promise<StorageRegion> {
  return apiRequest<StorageRegion>(`/api/regions/${regionId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(body),
  });
}

export function deleteRegion(token: string, regionId: number): Promise<void> {
  return apiRequest<void>(`/api/regions/${regionId}`, { method: 'DELETE', token });
}
