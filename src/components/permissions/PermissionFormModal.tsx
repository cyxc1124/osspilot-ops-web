import { Form, Input, InputNumber, Modal, Radio, Select, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { listAccountBuckets } from '../../api/buckets';
import {
  createTenantPermission,
  updateTenantPermission,
  listTenantUserGroups,
  type OpsPermission,
} from '../../api/rbac';
import { listTenantUsers } from '../../api/tenantUsers';
import { ApiError } from '../../api/client';
import { useT } from '../../i18n';
import PermissionActionsPicker from './PermissionActionsPicker';
import {
  ASSIGNABLE_TENANT_ROLES,
  PERMISSION_ACTIONS,
  permissionActionLabel,
  tenantRoleLabel,
  tenantRolePresetActions,
  userSelectLabel,
  usersForAccount,
} from '../../utils/roles';
import { useAuthStore } from '../../stores/authStore';

type SubjectType = 'user' | 'role' | 'group';

interface PresetSubject {
  type: 'group' | 'user';
  id: number;
}

interface PermissionFormModalProps {
  open: boolean;
  accountId: number;
  editing?: OpsPermission | null;
  roleIdMap: Record<string, number>;
  presetSubject?: PresetSubject | null;
  onClose: () => void;
}

interface PermissionFormValues {
  subject_type: SubjectType;
  user_id?: number;
  role_name?: string;
  role_id?: number;
  group_id?: number;
  bucket_name?: string;
  prefix?: string;
  actions: string[];
}

function bucketSelectLabel(bucket: { bucket_name: string; display_name: string | null }): string {
  return bucket.display_name?.trim()
    ? `${bucket.bucket_name}（${bucket.display_name}）`
    : bucket.bucket_name;
}

export default function PermissionFormModal({
  open,
  accountId,
  editing,
  roleIdMap,
  presetSubject,
  onClose,
}: PermissionFormModalProps) {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const [form] = Form.useForm<PermissionFormValues>();
  const queryClient = useQueryClient();
  const subjectType = Form.useWatch('subject_type', form);
  const selectedRole = Form.useWatch('role_name', form);
  const selectedActions = Form.useWatch('actions', form) as string[] | undefined;
  const selectedBucket = Form.useWatch('bucket_name', form) as string | undefined;

  const usersQuery = useQuery({
    queryKey: ['tenant-users'],
    queryFn: () => listTenantUsers(token),
    enabled: open && !editing,
  });

  const bucketsQuery = useQuery({
    queryKey: ['account-buckets', accountId],
    queryFn: () => listAccountBuckets(token, accountId),
    enabled: open,
  });

  const groupsQuery = useQuery({
    queryKey: ['ops-rbac-groups', accountId],
    queryFn: () => listTenantUserGroups(token, accountId),
    enabled: open && !editing,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    if (editing) {
      form.setFieldsValue({
        bucket_name: editing.bucket_name ?? undefined,
        prefix: editing.prefix ?? undefined,
        actions: editing.actions,
      });
      return;
    }
    form.resetFields();
    if (presetSubject) {
      form.setFieldsValue({
        subject_type: presetSubject.type,
        user_id: presetSubject.type === 'user' ? presetSubject.id : undefined,
        group_id: presetSubject.type === 'group' ? presetSubject.id : undefined,
        actions: ['read'],
      });
      return;
    }
    form.setFieldsValue({ subject_type: 'user', actions: ['read'] });
  }, [open, editing, presetSubject, form]);

  const mutation = useMutation({
    mutationFn: async ({
      accountId: targetAccountId,
      permissionId,
      roleIdMap: targetRoleIdMap,
      values,
    }: {
      accountId: number;
      permissionId?: number;
      roleIdMap: Record<string, number>;
      values: PermissionFormValues;
    }) => {
      const bucketName = values.bucket_name?.trim() || null;
      const prefix = values.prefix?.trim() || null;

      if (permissionId != null) {
        return updateTenantPermission(token, targetAccountId, permissionId, {
          bucket_name: bucketName,
          prefix,
          actions: values.actions,
        });
      }

      const body: Parameters<typeof createTenantPermission>[2] = {
        actions: values.actions,
        bucket_name: bucketName,
        prefix,
      };

      if (values.subject_type === 'user') {
        body.user_id = values.user_id;
      } else if (values.subject_type === 'role') {
        const roleId = values.role_id ?? targetRoleIdMap[values.role_name ?? ''];
        if (!roleId) {
          throw new ApiError(400, t('permissions.roleIdResolveFailed'));
        }
        body.role_id = roleId;
      } else {
        body.group_id = values.group_id;
      }

      return createTenantPermission(token, targetAccountId, body);
    },
    onSuccess: (_result, { permissionId }) => {
      message.success(permissionId != null ? t('permissions.updated') : t('permissions.created'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-permissions'] });
      form.resetFields();
      onClose();
    },
    onError: (error) => {
      const text = error instanceof ApiError ? error.message : t('common.saveFailed');
      message.error(text);
    },
  });

  const userOptions = useMemo(
    () =>
      usersForAccount(usersQuery.data?.items ?? [], accountId).map((item) => ({
        label: userSelectLabel(item),
        value: item.id,
      })),
    [usersQuery.data, accountId],
  );

  const bucketOptions = useMemo(
    () =>
      (bucketsQuery.data?.items ?? []).map((item) => ({
        label: bucketSelectLabel(item),
        value: item.bucket_name,
      })),
    [bucketsQuery.data],
  );

  const groupOptions = useMemo(
    () =>
      (groupsQuery.data?.items ?? []).map((item) => ({
        label: item.name,
        value: item.id,
      })),
    [groupsQuery.data],
  );

  const roleOptions = ASSIGNABLE_TENANT_ROLES.map((role) => ({
    value: role,
    label: tenantRoleLabel(role),
  }));

  const rolePresetHint = useMemo(() => {
    if (subjectType !== 'role' || !selectedRole) {
      return null;
    }
    const presetActions = tenantRolePresetActions(selectedRole);
    if (!presetActions) {
      return null;
    }
    if (presetActions.length === PERMISSION_ACTIONS.length) {
      return t('permissions.rolePresetHelperAll', { role: tenantRoleLabel(selectedRole) });
    }
    const labels = presetActions.map((action) => permissionActionLabel(action)).join('、');
    return t('permissions.rolePresetHelper', { role: tenantRoleLabel(selectedRole), actions: labels });
  }, [selectedRole, subjectType, t]);

  const bucketCreateScopeHint =
    selectedActions?.includes('bucket_create') && selectedBucket
      ? t('permissions.bucketCreateAccountLevelHint')
      : undefined;

  const handleOk = async () => {
    const values = await form.validateFields();
    if (values.actions?.includes('bucket_create') && values.bucket_name?.trim()) {
      message.error(t('permissions.bucketCreateAccountLevelHint'));
      return;
    }
    await mutation.mutateAsync({
      accountId,
      permissionId: editing?.id,
      roleIdMap,
      values,
    });
  };

  return (
    <Modal
      title={editing ? t('permissions.editRule') : t('permissions.addRuleTitle')}
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={() => void handleOk()}
      confirmLoading={mutation.isPending}
      destroyOnClose
      width={760}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        {!editing ? (
          <>
            <Form.Item name="subject_type" label={t('permissions.subject')} rules={[{ required: true }]}>
              <Radio.Group>
                <Radio value="user">{t('permissions.subjectUser')}</Radio>
                <Radio value="role">{t('permissions.subjectRole')}</Radio>
                <Radio value="group">{t('permissions.subjectGroup')}</Radio>
              </Radio.Group>
            </Form.Item>
            {subjectType === 'user' ? (
              <Form.Item
                name="user_id"
                label={t('permissions.user')}
                rules={[{ required: true, message: t('permissions.userRequired') }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={t('permissions.selectUser')}
                  options={userOptions}
                  loading={usersQuery.isLoading}
                />
              </Form.Item>
            ) : subjectType === 'role' ? (
              <>
                <Form.Item
                  name="role_name"
                  label={t('permissions.role')}
                  rules={[{ required: true, message: t('permissions.roleRequired') }]}
                  extra={rolePresetHint ?? undefined}
                >
                  <Select placeholder={t('permissions.selectRole')} options={roleOptions} />
                </Form.Item>
                <Form.Item
                  name="role_id"
                  label={t('permissions.roleId')}
                  tooltip={t('permissions.roleIdTooltip')}
                >
                  <InputNumber
                    min={1}
                    style={{ width: '100%' }}
                    placeholder={t('permissions.roleIdPlaceholder')}
                  />
                </Form.Item>
              </>
            ) : (
              <Form.Item
                name="group_id"
                label={t('permissions.group')}
                rules={[{ required: true, message: t('permissions.groupRequired') }]}
              >
                <Select
                  placeholder={t('permissions.selectGroup')}
                  options={groupOptions}
                  loading={groupsQuery.isLoading}
                />
              </Form.Item>
            )}
          </>
        ) : null}

        <Form.Item
          name="bucket_name"
          label={t('permissions.bucket')}
          extra={bucketCreateScopeHint}
          validateStatus={bucketCreateScopeHint ? 'warning' : undefined}
        >
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={t('permissions.allBuckets')}
            options={bucketOptions}
            loading={bucketsQuery.isLoading}
          />
        </Form.Item>
        <Form.Item name="prefix" label={t('permissions.prefix')}>
          <Input placeholder={t('permissions.prefixPlaceholder')} />
        </Form.Item>
        <Form.Item
          name="actions"
          label={t('permissions.allowedActions')}
          rules={[
            {
              validator: async (_, actions: string[] | undefined) => {
                if (!actions || actions.length === 0) {
                  throw new Error(t('permissions.actionsRequired'));
                }
              },
            },
          ]}
        >
          <PermissionActionsPicker />
        </Form.Item>
      </Form>
    </Modal>
  );
}
