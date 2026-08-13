import { apiRequest } from './client';

export interface PlatformStatsOverview {
  total_used_bytes: number;
  total_quota_bytes: number | null;
  total_object_count: number;
  total_trash_bytes: number;
  total_trash_object_count: number;
  tenant_count: number;
  bucket_count: number;
  collected_at: string | null;
}

export interface TenantCapacityRankingItem {
  tenant_id: number;
  name: string;
  display_name: string | null;
  status: string;
  quota_bytes: number | null;
  used_bytes: number;
  object_count: number;
  trash_bytes: number;
  usage_percent: number | null;
}

export interface TenantCapacityRanking {
  items: TenantCapacityRankingItem[];
}

export interface StorageClassUsageItem {
  storage_class: string;
  used_bytes: number;
}

export interface StorageClassUsage {
  items: StorageClassUsageItem[];
  collected_at: string | null;
}

export type StatPeriod = '24h' | '7d' | '30d';

export interface TrafficStats {
  period: StatPeriod;
  upload_bytes: number;
  download_bytes: number;
  request_count: number;
  get_count: number;
  put_count: number;
  delete_count: number;
  error_count: number;
  active_users: number;
  collected_at: string | null;
}

export interface DailyTrafficItem {
  stat_date: string;
  upload_bytes: number;
  download_bytes: number;
  request_count: number;
  get_count: number;
  put_count: number;
  delete_count: number;
  error_count: number;
}

export interface DailyTraffic {
  items: DailyTrafficItem[];
  collected_at: string | null;
}

export interface PerformanceStats {
  available: boolean;
  error: string | null;
  request_count: number | null;
  error_rate: number | null;
  p95_latency_ms: number | null;
  p99_latency_ms: number | null;
  running_instances: number;
  total_instances: number;
  audit_error_count: number;
  audit_request_count: number;
  fetched_at: string | null;
}

export interface UserBehaviorItem {
  user_id: number;
  tenant_id: number;
  username: string | null;
  upload_count: number;
  download_count: number;
  delete_count: number;
  access_count: number;
  upload_bytes: number;
  download_bytes: number;
}

export interface UserBehaviorRanking {
  period: StatPeriod;
  items: UserBehaviorItem[];
  collected_at: string | null;
}

export interface BucketRankingItem {
  bucket_id: number;
  tenant_id: number;
  bucket_name: string;
  request_count: number;
  upload_bytes: number;
  download_bytes: number;
  get_count: number;
  put_count: number;
  delete_count: number;
}

export interface BucketRanking {
  period: StatPeriod;
  items: BucketRankingItem[];
  collected_at: string | null;
}

export interface PrefixRankingItem {
  bucket_id: number;
  tenant_id: number;
  bucket_name: string;
  prefix: string;
  access_count: number;
}

export interface PrefixRanking {
  period: StatPeriod;
  items: PrefixRankingItem[];
  collected_at: string | null;
}

export async function getPlatformStatsOverview(token: string): Promise<PlatformStatsOverview> {
  return apiRequest<PlatformStatsOverview>('/api/stats/overview', { token });
}

export async function getTenantCapacityRanking(
  token: string,
  limit = 10,
): Promise<TenantCapacityRanking> {
  return apiRequest<TenantCapacityRanking>(`/api/stats/tenants/ranking?limit=${limit}`, { token });
}

export async function getStorageClassUsage(token: string): Promise<StorageClassUsage> {
  return apiRequest<StorageClassUsage>('/api/stats/storage-classes', { token });
}

export async function getTrafficStats(
  token: string,
  period: StatPeriod = '24h',
): Promise<TrafficStats> {
  return apiRequest<TrafficStats>(`/api/stats/traffic?period=${period}`, { token });
}

export async function getDailyTraffic(token: string, days = 14): Promise<DailyTraffic> {
  return apiRequest<DailyTraffic>(`/api/stats/traffic/daily?days=${days}`, { token });
}

export async function getPerformanceStats(
  token: string,
  period: StatPeriod = '24h',
): Promise<PerformanceStats> {
  return apiRequest<PerformanceStats>(`/api/stats/performance?period=${period}`, { token });
}

export async function getUserBehaviorRanking(
  token: string,
  period: StatPeriod = '7d',
  sortBy: 'upload' | 'download' | 'delete' | 'access' = 'access',
  limit = 10,
): Promise<UserBehaviorRanking> {
  return apiRequest<UserBehaviorRanking>(
    `/api/stats/behavior/users?period=${period}&sort_by=${sortBy}&limit=${limit}`,
    { token },
  );
}

export async function getBucketRanking(
  token: string,
  period: StatPeriod = '7d',
  limit = 10,
): Promise<BucketRanking> {
  return apiRequest<BucketRanking>(`/api/stats/buckets/ranking?period=${period}&limit=${limit}`, {
    token,
  });
}

export async function getPrefixRanking(
  token: string,
  period: StatPeriod = '7d',
  limit = 10,
): Promise<PrefixRanking> {
  return apiRequest<PrefixRanking>(`/api/stats/prefixes/ranking?period=${period}&limit=${limit}`, {
    token,
  });
}
