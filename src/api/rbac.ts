import { apiRequest } from './client';

export interface OpsUserGroup {
  id: number;
  account_id: number;
  name: string;
  description: string | null;
  member_count: number;
  members: Array<{ user_id: number; username: string; display_name: string | null }>;
  created_at: string;
  updated_at: string;
}

export interface OpsPermissionTemplate {
  id: number;
  account_id: number;
  name: string;
  description: string | null;
  rules: Array<{
    id: number;
    template_id: number;
    bucket_name: string | null;
    prefix: string | null;
    actions: string[];
  }>;
  assignments: Array<{
    id: number;
    user_id: number | null;
    group_id: number | null;
  }>;
}

export interface OpsPermission {
  id: number;
  account_id: number;
  user_id: number | null;
  role_id: number | null;
  role_name: string | null;
  group_id: number | null;
  group_name: string | null;
  bucket_id: number | null;
  bucket_name: string | null;
  prefix: string | null;
  actions: string[];
  created_at: string;
  updated_at: string;
}

export function listTenantUserGroups(
  token: string,
  accountId: number,
): Promise<{ items: OpsUserGroup[] }> {
  return apiRequest<{ items: OpsUserGroup[] }>(`/api/tenant-users/${accountId}/rbac/user-groups`, {
    token,
  });
}

export function createTenantUserGroup(
  token: string,
  accountId: number,
  body: { name: string; description?: string | null },
): Promise<OpsUserGroup> {
  return apiRequest<OpsUserGroup>(`/api/tenant-users/${accountId}/rbac/user-groups`, {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

export function updateTenantUserGroup(
  token: string,
  accountId: number,
  groupId: number,
  body: { name?: string; description?: string | null },
): Promise<OpsUserGroup> {
  return apiRequest<OpsUserGroup>(`/api/tenant-users/${accountId}/rbac/user-groups/${groupId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(body),
  });
}

export function deleteTenantUserGroup(
  token: string,
  accountId: number,
  groupId: number,
): Promise<OpsUserGroup> {
  return apiRequest<OpsUserGroup>(`/api/tenant-users/${accountId}/rbac/user-groups/${groupId}`, {
    method: 'DELETE',
    token,
  });
}

export function addTenantGroupMembers(
  token: string,
  accountId: number,
  groupId: number,
  userIds: number[],
): Promise<OpsUserGroup> {
  return apiRequest<OpsUserGroup>(`/api/tenant-users/${accountId}/rbac/user-groups/${groupId}/members`, {
    method: 'POST',
    token,
    body: JSON.stringify({ user_ids: userIds }),
  });
}

export function removeTenantGroupMember(
  token: string,
  accountId: number,
  groupId: number,
  userId: number,
): Promise<OpsUserGroup> {
  return apiRequest<OpsUserGroup>(
    `/api/tenant-users/${accountId}/rbac/user-groups/${groupId}/members/${userId}`,
    { method: 'DELETE', token },
  );
}

export function listTenantPermissionTemplates(
  token: string,
  accountId: number,
): Promise<{ items: OpsPermissionTemplate[] }> {
  return apiRequest<{ items: OpsPermissionTemplate[] }>(
    `/api/tenant-users/${accountId}/rbac/permission-templates`,
    { token },
  );
}

export function createTenantPermissionTemplate(
  token: string,
  accountId: number,
  body: {
    name: string;
    description?: string | null;
    rules?: Array<{ bucket_name?: string | null; prefix?: string | null; actions: string[] }>;
  },
): Promise<OpsPermissionTemplate> {
  return apiRequest<OpsPermissionTemplate>(
    `/api/tenant-users/${accountId}/rbac/permission-templates`,
    {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    },
  );
}

export function updateTenantPermissionTemplate(
  token: string,
  accountId: number,
  templateId: number,
  body: { name?: string; description?: string | null },
): Promise<OpsPermissionTemplate> {
  return apiRequest<OpsPermissionTemplate>(
    `/api/tenant-users/${accountId}/rbac/permission-templates/${templateId}`,
    {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    },
  );
}

export function deleteTenantPermissionTemplate(
  token: string,
  accountId: number,
  templateId: number,
): Promise<OpsPermissionTemplate> {
  return apiRequest<OpsPermissionTemplate>(
    `/api/tenant-users/${accountId}/rbac/permission-templates/${templateId}`,
    { method: 'DELETE', token },
  );
}

export type OpsTemplateRule = OpsPermissionTemplate['rules'][number];

export function createTenantTemplateRule(
  token: string,
  accountId: number,
  templateId: number,
  body: { bucket_name?: string | null; prefix?: string | null; actions: string[] },
): Promise<OpsTemplateRule> {
  return apiRequest<OpsTemplateRule>(
    `/api/tenant-users/${accountId}/rbac/permission-templates/${templateId}/rules`,
    {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    },
  );
}

export function updateTenantTemplateRule(
  token: string,
  accountId: number,
  templateId: number,
  ruleId: number,
  body: { bucket_name?: string | null; prefix?: string | null; actions?: string[] },
): Promise<OpsTemplateRule> {
  return apiRequest<OpsTemplateRule>(
    `/api/tenant-users/${accountId}/rbac/permission-templates/${templateId}/rules/${ruleId}`,
    {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    },
  );
}

export function deleteTenantTemplateRule(
  token: string,
  accountId: number,
  templateId: number,
  ruleId: number,
): Promise<OpsTemplateRule> {
  return apiRequest<OpsTemplateRule>(
    `/api/tenant-users/${accountId}/rbac/permission-templates/${templateId}/rules/${ruleId}`,
    { method: 'DELETE', token },
  );
}

export function createTenantTemplateAssignment(
  token: string,
  accountId: number,
  templateId: number,
  body: { user_id?: number; group_id?: number },
): Promise<{ id: number; account_id: number; template_id: number; user_id: number | null; group_id: number | null }> {
  return apiRequest(
    `/api/tenant-users/${accountId}/rbac/permission-templates/${templateId}/assignments`,
    {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    },
  );
}

export function deleteTenantTemplateAssignment(
  token: string,
  accountId: number,
  templateId: number,
  assignmentId: number,
): Promise<{ id: number; account_id: number; template_id: number; user_id: number | null; group_id: number | null }> {
  return apiRequest(
    `/api/tenant-users/${accountId}/rbac/permission-templates/${templateId}/assignments/${assignmentId}`,
    { method: 'DELETE', token },
  );
}

export function listTenantPermissions(
  token: string,
  accountId: number,
): Promise<{ items: OpsPermission[] }> {
  return apiRequest<{ items: OpsPermission[] }>(
    `/api/tenant-users/${accountId}/rbac/permissions`,
    { token },
  );
}

export function createTenantPermission(
  token: string,
  accountId: number,
  body: {
    user_id?: number;
    role_id?: number;
    group_id?: number;
    bucket_name?: string | null;
    prefix?: string | null;
    actions: string[];
  },
): Promise<OpsPermission> {
  return apiRequest<OpsPermission>(`/api/tenant-users/${accountId}/rbac/permissions`, {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

export function updateTenantPermission(
  token: string,
  accountId: number,
  permissionId: number,
  body: {
    bucket_name?: string | null;
    prefix?: string | null;
    actions?: string[];
  },
): Promise<OpsPermission> {
  return apiRequest<OpsPermission>(`/api/tenant-users/${accountId}/rbac/permissions/${permissionId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(body),
  });
}

export function deleteTenantPermission(
  token: string,
  accountId: number,
  permissionId: number,
): Promise<OpsPermission> {
  return apiRequest<OpsPermission>(`/api/tenant-users/${accountId}/rbac/permissions/${permissionId}`, {
    method: 'DELETE',
    token,
  });
}
