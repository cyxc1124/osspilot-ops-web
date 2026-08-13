import { t } from '../i18n';
import { apiRequest } from './client';

const RULE_TYPE_VALUES = [
  'bucket_capacity_80',
  'bucket_capacity_90',
  'tenant_quota_exceeded',
  'rgw_5xx_rate',
  'upload_failure_rate',
  'download_failure_rate',
  'frequent_delete',
  'frequent_download',
  'edit_save_failure',
  'audit_write_failure',
] as const;

const CHANNEL_TYPE_VALUES = ['email', 'webhook', 'wecom', 'feishu', 'alertmanager'] as const;

export interface AlertRule {
  id: number;
  name: string;
  rule_type: string;
  enabled: boolean;
  severity: string;
  config: Record<string, unknown>;
  channel_ids: number[];
  notify_tenant: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertRuleList {
  items: AlertRule[];
}

export interface AlertRuleCreateRequest {
  name: string;
  rule_type: string;
  enabled?: boolean;
  severity?: string;
  config?: Record<string, unknown>;
  channel_ids?: number[];
  notify_tenant?: boolean;
  description?: string | null;
}

export interface AlertRuleUpdateRequest {
  name?: string;
  enabled?: boolean;
  severity?: string;
  config?: Record<string, unknown>;
  channel_ids?: number[];
  notify_tenant?: boolean;
  description?: string | null;
}

export interface NotificationChannel {
  id: number;
  name: string;
  channel_type: string;
  enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NotificationChannelList {
  items: NotificationChannel[];
}

export interface NotificationChannelCreateRequest {
  name: string;
  channel_type: string;
  enabled?: boolean;
  config: Record<string, unknown>;
}

export interface NotificationChannelUpdateRequest {
  name?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
}

export interface AlertEvent {
  id: number;
  rule_id: number | null;
  rule_type: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  tenant_id: number | null;
  bucket_id: number | null;
  bucket_name: string | null;
  details: Record<string, unknown>;
  notify_tenant: boolean;
  fired_at: string;
  acknowledged_at: string | null;
  acknowledged_by: number | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AlertEventList {
  items: AlertEvent[];
  total: number;
}

export interface AlertEvaluateResult {
  evaluated_rules: number;
  new_events: number;
  resolved_events: number;
}

export function getRuleTypeOptions(): { value: string; label: string }[] {
  return RULE_TYPE_VALUES.map((value) => ({
    value,
    label: t(`alerts.ruleTypes.${value}`),
  }));
}

export function getChannelTypeOptions(): { value: string; label: string }[] {
  return CHANNEL_TYPE_VALUES.map((value) => ({
    value,
    label: t(`alerts.channelTypes.${value}`),
  }));
}

export async function listAlertRules(token: string): Promise<AlertRuleList> {
  return apiRequest<AlertRuleList>('/api/alerts/rules', { token });
}

export async function createAlertRule(
  token: string,
  payload: AlertRuleCreateRequest,
): Promise<AlertRule> {
  return apiRequest<AlertRule>('/api/alerts/rules', {
    token,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAlertRule(
  token: string,
  ruleId: number,
  payload: AlertRuleUpdateRequest,
): Promise<AlertRule> {
  return apiRequest<AlertRule>(`/api/alerts/rules/${ruleId}`, {
    token,
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAlertRule(token: string, ruleId: number): Promise<void> {
  return apiRequest<void>(`/api/alerts/rules/${ruleId}`, { token, method: 'DELETE' });
}

export async function listNotificationChannels(token: string): Promise<NotificationChannelList> {
  return apiRequest<NotificationChannelList>('/api/alerts/channels', { token });
}

export async function createNotificationChannel(
  token: string,
  payload: NotificationChannelCreateRequest,
): Promise<NotificationChannel> {
  return apiRequest<NotificationChannel>('/api/alerts/channels', {
    token,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateNotificationChannel(
  token: string,
  channelId: number,
  payload: NotificationChannelUpdateRequest,
): Promise<NotificationChannel> {
  return apiRequest<NotificationChannel>(`/api/alerts/channels/${channelId}`, {
    token,
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteNotificationChannel(token: string, channelId: number): Promise<void> {
  return apiRequest<void>(`/api/alerts/channels/${channelId}`, { token, method: 'DELETE' });
}

export async function listAlertEvents(
  token: string,
  params: { status?: string; tenant_id?: number; page?: number; page_size?: number } = {},
): Promise<AlertEventList> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.tenant_id) search.set('tenant_id', String(params.tenant_id));
  if (params.page) search.set('page', String(params.page));
  if (params.page_size) search.set('page_size', String(params.page_size));
  const query = search.toString();
  return apiRequest<AlertEventList>(`/api/alerts/events${query ? `?${query}` : ''}`, { token });
}

export async function listRecentAlertEvents(token: string, limit = 5): Promise<AlertEventList> {
  return apiRequest<AlertEventList>(`/api/alerts/events/recent?limit=${limit}`, { token });
}

export async function acknowledgeAlertEvent(token: string, eventId: number): Promise<AlertEvent> {
  return apiRequest<AlertEvent>(`/api/alerts/events/${eventId}/acknowledge`, {
    token,
    method: 'POST',
  });
}

export async function resolveAlertEvent(token: string, eventId: number): Promise<AlertEvent> {
  return apiRequest<AlertEvent>(`/api/alerts/events/${eventId}/resolve`, {
    token,
    method: 'POST',
  });
}

export async function evaluateAlerts(token: string): Promise<AlertEvaluateResult> {
  return apiRequest<AlertEvaluateResult>('/api/alerts/evaluate', { token, method: 'POST' });
}
