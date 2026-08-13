import { t } from '../i18n';
import type { TenantUserResponse } from '../api/types';

interface UserLabelFields {
  username: string;
  display_name: string | null;
}

export const OPS_ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  OPS_OPERATOR: 'ops_operator',
} as const;

const OPS_ROLE_KEYS = Object.values(OPS_ROLES);

const TENANT_ROLE_KEYS = ['tenant_admin'] as const;

export const ASSIGNABLE_TENANT_ROLES = [...TENANT_ROLE_KEYS] as const;

/** Mirrors ``TENANT_ROLE_PRESETS`` in osspilot_common.permissions.roles. */
export const TENANT_ADMIN_ROLE = 'tenant_admin';

export const PERMISSION_ACTIONS = [
  'read',
  'write',
  'delete',
  'edit',
  'admin',
  'bucket_create',
  'bucket_delete',
  'share',
  'restore',
  'audit',
] as const;

export function opsRoleLabel(role: string): string {
  const key = `roles.ops.${role}`;
  const label = t(key);
  return label === key ? role : label;
}

export function tenantRoleLabel(role: string): string {
  const key = `roles.tenant.${role}`;
  const label = t(key);
  return label === key ? role : label;
}

export function getOpsRoleOptions(): { value: string; label: string }[] {
  return OPS_ROLE_KEYS.map((value) => ({ value, label: opsRoleLabel(value) }));
}

export function getTenantRoleOptions(): { value: string; label: string }[] {
  return TENANT_ROLE_KEYS.map((value) => ({ value, label: tenantRoleLabel(value) }));
}

export function isPlatformAdmin(roles: string[]): boolean {
  return roles.includes(OPS_ROLES.PLATFORM_ADMIN);
}

export function hasOpsAccess(roles: string[]): boolean {
  return roles.some((role) => OPS_ROLE_KEYS.includes(role as (typeof OPS_ROLE_KEYS)[number]));
}

export function permissionActionLabel(action: string): string {
  const key = `permissions.actionLabels.${action}`;
  const label = t(key);
  return label === key ? action : label;
}

export function tenantRolePresetActions(role: string): readonly string[] | null {
  if (role === TENANT_ADMIN_ROLE) {
    return PERMISSION_ACTIONS;
  }
  return null;
}

export function usersForAccount(users: TenantUserResponse[], accountId: number): TenantUserResponse[] {
  return users.filter((user) => user.id === accountId);
}

/** @deprecated Use usersForAccount */
export function usersForTenant(users: TenantUserResponse[], accountId: number): TenantUserResponse[] {
  return usersForAccount(users, accountId);
}

export function userSelectLabel(user: UserLabelFields): string {
  return user.display_name ? `${user.username}（${user.display_name}）` : user.username;
}
