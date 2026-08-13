import { apiRequest } from './client';

export interface BucketPolicyResponse {
  bucket_id: number;
  bucket_name: string;
  tenant_id: number;
  policy: Record<string, unknown> | null;
  has_policy: boolean;
}

export function getBucketPolicy(token: string, bucketId: number): Promise<BucketPolicyResponse> {
  return apiRequest<BucketPolicyResponse>(`/api/buckets/${bucketId}/policy`, { token });
}

export function putBucketPolicy(
  token: string,
  bucketId: number,
  policy: Record<string, unknown>,
): Promise<BucketPolicyResponse> {
  return apiRequest<BucketPolicyResponse>(`/api/buckets/${bucketId}/policy`, {
    token,
    method: 'PUT',
    body: JSON.stringify({ policy }),
  });
}

export function deleteBucketPolicy(token: string, bucketId: number): Promise<void> {
  return apiRequest<void>(`/api/buckets/${bucketId}/policy`, {
    token,
    method: 'DELETE',
  });
}
