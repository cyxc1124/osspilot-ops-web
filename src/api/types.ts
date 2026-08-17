export interface ApiErrorBody {
  detail?: string | { msg: string }[];
}

export interface LoginRequest {
  username: string;
  password: string;
  portal: 'ops';
}

export interface UserBrief {
  id: number;
  username: string;
  display_name: string | null;
  roles: string[];
  must_change_password?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  must_change_password: boolean;
  user: UserBrief;
}

export interface MeResponse {
  id: number;
  username: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  portal: 'ops';
  roles: string[];
  last_login_at: string | null;
  must_change_password: boolean;
}

export interface TenantSummary {
  id: number;
  name: string;
  display_name: string | null;
  status: string;
  quota_bytes: number | null;
  storage_region_id?: number | null;
  storage_region?: StorageRegionBrief | null;
  created_at: string;
  updated_at: string;
}

export interface StorageRegionBrief {
  id: number;
  code: string;
  name: string;
}

export interface TenantDetail extends TenantSummary {
  bucket_count: number;
  user_count: number;
  used_bytes: number;
}

export interface TenantListResponse {
  items: TenantSummary[];
  total: number;
}

export interface TenantCreateRequest {
  name: string;
  display_name?: string | null;
  quota_bytes?: number | null;
  storage_region_id?: number | null;
}

export interface TenantUpdateRequest {
  display_name?: string | null;
  status?: 'active' | 'disabled';
  quota_bytes?: number | null;
  storage_region_id?: number | null;
}

export interface S3BucketDiscoveryItem {
  name: string;
  creation_date: string | null;
  registered: boolean;
}

export interface PlatformBucketListItem {
  id: number;
  bucket_name: string;
  display_name: string | null;
  status: string;
  used_bytes: number;
  object_count: number;
  collected_at: string | null;
  storage_region_id: number | null;
  storage_region?: StorageRegionBrief | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformBucketListResponse {
  items: PlatformBucketListItem[];
  total: number;
}

export interface BucketRegisterBatchRequest {
  bucket_names: string[];
}

export interface BucketRegisterDetail {
  id: number;
  bucket_name: string;
  display_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BucketRegisterBatchResponse {
  imported: BucketRegisterDetail[];
  failed: Array<{ bucket_name: string; error: string }>;
}

export interface AccountBucketGrantItem {
  bucket_id: number;
  bucket_name: string;
  display_name: string | null;
  granted_at: string | null;
}

export interface AccountBucketListResponse {
  items: AccountBucketGrantItem[];
  total: number;
}

export interface AccountBucketUpdateRequest {
  bucket_ids: number[];
}

export interface S3BucketDiscoveryListResponse {
  items: S3BucketDiscoveryItem[];
  total: number;
}

export interface BucketImportDetail {
  id: number;
  tenant_id: number;
  bucket_name: string;
  display_name: string | null;
  versioning_enabled: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BucketImportBatchResponse {
  imported: BucketImportDetail[];
  failed: Array<{ bucket_name: string; error: string }>;
}

export interface TenantBucketListItem {
  id: number;
  tenant_id: number;
  bucket_name: string;
  display_name: string | null;
  status: string;
  used_bytes: number;
  object_count: number;
  collected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantBucketListResponse {
  items: TenantBucketListItem[];
  total: number;
}

export interface BucketInventoryEnqueueResponse {
  bucket_id: number;
  bucket_name: string;
  job_id: string;
  message: string;
}

export interface TenantRoleBinding {
  tenant_id: number;
  role: string;
}

export interface UserResponse {
  id: number;
  username: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  ops_roles: string[];
  last_login_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserListResponse {
  items: UserResponse[];
  total: number;
}

export interface UserCreateRequest {
  username: string;
  password: string;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  ops_roles?: string[];
  must_change_password?: boolean;
}

export interface UserUpdateRequest {
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string;
  ops_roles?: string[];
}

export interface TenantUserResponse {
  id: number;
  username: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  quota_bytes: number | null;
  object_limit: number | null;
  daily_upload_bytes: number | null;
  storage_region_id?: number | null;
  storage_region?: StorageRegionBrief | null;
  last_login_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TenantUserListResponse {
  items: TenantUserResponse[];
  total: number;
}

export interface TenantUserCreateRequest {
  username: string;
  password: string;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  quota_bytes?: number | null;
  object_limit?: number | null;
  daily_upload_bytes?: number | null;
  storage_region_id?: number | null;
  must_change_password?: boolean;
}

export interface TenantUserUpdateRequest {
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string;
  quota_bytes?: number | null;
  object_limit?: number | null;
  daily_upload_bytes?: number | null;
  storage_region_id?: number | null;
}

export interface SystemSettings {
  s3_endpoint: string | null;
  rgw_access_key: string | null;
  rgw_secret_key: string | null;
  rgw_access_key_configured: boolean;
  rgw_secret_key_configured: boolean;
  default_upload_presign_expires: number;
  default_download_presign_expires: number;
  max_upload_bytes: number;
  audit_enabled: boolean;
  office_url: string | null;
  download_cdn_url: string | null;
  preview_cdn_url: string | null;
  object_http_domain: string | null;
  object_https_domain: string | null;
  ceph_mgmt_api_url: string | null;
  tenant_login_logo_text: string;
  tenant_login_title: string;
  tenant_login_subtitle: string;
  trash_retention_days: number;
  trash_cleanup_enabled: boolean;
  lifecycle_cleanup_enabled: boolean;
  version_retention_days: number;
  version_cleanup_enabled: boolean;
  multipart_stale_days: number;
  multipart_cleanup_enabled: boolean;
  updated_at: string | null;
}

export interface SystemSettingsUpdateRequest {
  s3_endpoint?: string | null;
  rgw_access_key?: string | null;
  rgw_secret_key?: string | null;
  default_upload_presign_expires?: number;
  default_download_presign_expires?: number;
  max_upload_bytes?: number;
  audit_enabled?: boolean;
  office_url?: string | null;
  download_cdn_url?: string | null;
  preview_cdn_url?: string | null;
  object_http_domain?: string | null;
  object_https_domain?: string | null;
  ceph_mgmt_api_url?: string | null;
  tenant_login_logo_text?: string | null;
  tenant_login_title?: string | null;
  tenant_login_subtitle?: string | null;
  trash_retention_days?: number;
  trash_cleanup_enabled?: boolean;
  lifecycle_cleanup_enabled?: boolean;
  version_retention_days?: number;
  version_cleanup_enabled?: boolean;
  multipart_stale_days?: number;
  multipart_cleanup_enabled?: boolean;
}

export interface StorageRegion {
  id: number;
  code: string;
  name: string;
  s3_endpoint: string;
  s3_region_name: string;
  is_default: boolean;
  status: string;
  tenant_count: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface StorageRegionListResponse {
  items: StorageRegion[];
  total: number;
}

export interface StorageRegionCreateRequest {
  code: string;
  name: string;
  s3_endpoint: string;
  s3_region_name?: string;
  is_default?: boolean;
  status?: string;
}

export interface StorageRegionUpdateRequest {
  name?: string;
  s3_endpoint?: string;
  s3_region_name?: string;
  is_default?: boolean;
  status?: string;
}

export interface RgwInstance {
  id: string;
  hostname: string;
  status: 'running' | 'stopped' | 'unknown';
  port: number | null;
  zone: string | null;
}

export interface RgwInstancesResponse {
  available: boolean;
  error: string | null;
  instances: RgwInstance[];
  fetched_at: string;
}

export interface RgwStatsResponse {
  available: boolean;
  error: string | null;
  request_count: number | null;
  error_rate: number | null;
  p95_latency_ms: number | null;
  p99_latency_ms: number | null;
  fetched_at: string;
}

export interface ClusterInfoResponse {
  available: boolean;
  error: string | null;
  ceph_version: string | null;
  total_bytes: number | null;
  used_bytes: number | null;
  avail_bytes: number | null;
  fetched_at: string;
}

export interface S3ConnectionTestResponse {
  ok: boolean;
  endpoint: string | null;
  bucket_count: number | null;
  error: string | null;
}

export interface RgwRestartRequest {
  instance_id?: string | null;
}

export interface RgwRollingRestartRequest {
  wait_seconds?: number;
}

export interface RgwRestartResponse {
  ok: boolean;
  message: string;
  restarted: string[];
  error: string | null;
}

export interface ClusterHealthResponse {
  available: boolean;
  error: string | null;
  status: 'HEALTH_OK' | 'HEALTH_WARN' | 'HEALTH_ERR' | null;
  summary: string[];
  fetched_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id: number | null;
  username: string | null;
  tenant_id: number | null;
  tenant_name: string | null;
  bucket_name: string | null;
  object_key: string | null;
  action: string;
  source_ip: string | null;
  user_agent: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AuditLogFilters {
  tenant_id?: number;
  tenant_name?: string;
  user_id?: number;
  username?: string;
  bucket_name?: string;
  object_key?: string;
  action?: string;
  status?: string;
  source_ip?: string;
  keyword?: string;
  admin_only?: boolean;
  created_from?: string;
  created_to?: string;
  page?: number;
  page_size?: number;
}
