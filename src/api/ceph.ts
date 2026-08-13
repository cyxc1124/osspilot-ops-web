import { apiRequest } from './client';
import type {
  ClusterHealthResponse,
  ClusterInfoResponse,
  RgwInstancesResponse,
  RgwRestartRequest,
  RgwRestartResponse,
  RgwRollingRestartRequest,
  RgwStatsResponse,
  S3ConnectionTestResponse,
} from './types';

export function getRgwInstances(token: string): Promise<RgwInstancesResponse> {
  return apiRequest<RgwInstancesResponse>('/api/ops/rgw/instances', { token });
}

export function getRgwStats(token: string): Promise<RgwStatsResponse> {
  return apiRequest<RgwStatsResponse>('/api/ops/rgw/stats', { token });
}

export function getClusterHealth(token: string): Promise<ClusterHealthResponse> {
  return apiRequest<ClusterHealthResponse>('/api/ops/cluster/health', { token });
}

export function getClusterInfo(token: string): Promise<ClusterInfoResponse> {
  return apiRequest<ClusterInfoResponse>('/api/ops/cluster/info', { token });
}

export function testS3Connection(token: string): Promise<S3ConnectionTestResponse> {
  return apiRequest<S3ConnectionTestResponse>('/api/ops/s3/test', { token, method: 'POST' });
}

export function restartRgw(token: string, payload: RgwRestartRequest = {}): Promise<RgwRestartResponse> {
  return apiRequest<RgwRestartResponse>('/api/ops/rgw/restart', {
    token,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function rollingRestartRgw(
  token: string,
  payload: RgwRollingRestartRequest = {},
): Promise<RgwRestartResponse> {
  return apiRequest<RgwRestartResponse>('/api/ops/rgw/rolling-restart', {
    token,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
