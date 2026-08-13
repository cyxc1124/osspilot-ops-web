import { apiRequest } from './client';
import type {
  AccountBucketListResponse,
  AccountBucketUpdateRequest,
  BucketInventoryEnqueueResponse,
  BucketRegisterBatchRequest,
  BucketRegisterBatchResponse,
  PlatformBucketListResponse,
  S3BucketDiscoveryListResponse,
} from './types';

/** List all platform-registered buckets. */
export function listBuckets(token: string): Promise<PlatformBucketListResponse> {
  return apiRequest<PlatformBucketListResponse>('/api/buckets', { token });
}

/** Discover S3 buckets available for registration. */
export function listS3Buckets(
  token: string,
  unregisteredOnly = true,
): Promise<S3BucketDiscoveryListResponse> {
  const query = unregisteredOnly ? '?unregistered_only=true' : '?unregistered_only=false';
  return apiRequest<S3BucketDiscoveryListResponse>(`/api/s3/buckets${query}`, { token });
}

/** Register existing S3 buckets into the platform registry. */
export function registerBuckets(
  token: string,
  bucketNames: string[],
): Promise<BucketRegisterBatchResponse> {
  const body: BucketRegisterBatchRequest = { bucket_names: bucketNames };
  return apiRequest<BucketRegisterBatchResponse>('/api/buckets/import-batch', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

/** Enqueue background inventory scan for a registered bucket. */
export function enqueueBucketInventory(
  token: string,
  bucketId: number,
): Promise<BucketInventoryEnqueueResponse> {
  return apiRequest<BucketInventoryEnqueueResponse>(`/api/buckets/${bucketId}/inventory`, {
    method: 'POST',
    token,
  });
}

/** List buckets granted to a tenant account. */
export function listAccountBuckets(
  token: string,
  accountId: number,
): Promise<AccountBucketListResponse> {
  return apiRequest<AccountBucketListResponse>(`/api/tenant-users/${accountId}/buckets`, { token });
}

/** Replace bucket visibility grants for a tenant account. */
export function updateAccountBuckets(
  token: string,
  accountId: number,
  bucketIds: number[],
): Promise<AccountBucketListResponse> {
  const body: AccountBucketUpdateRequest = { bucket_ids: bucketIds };
  return apiRequest<AccountBucketListResponse>(`/api/tenant-users/${accountId}/buckets`, {
    method: 'PUT',
    token,
    body: JSON.stringify(body),
  });
}
