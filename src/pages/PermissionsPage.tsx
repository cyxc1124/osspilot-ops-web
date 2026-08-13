import { useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Popconfirm, Select, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ApiError } from '../api/client';
import {
  deleteTenantPermission,
  listTenantPermissions,
  type OpsPermission,
} from '../api/rbac';
import { listTenantUsers } from '../api/tenantUsers';
import PermissionActionsPanel from '../components/permissions/PermissionActionsPanel';
import PermissionFormModal from '../components/permissions/PermissionFormModal';
import PermissionTemplatesPanel from '../components/permissions/PermissionTemplatesPanel';
import RolePresetsPanel from '../components/permissions/RolePresetsPanel';
import UserGroupsPanel from '../components/permissions/UserGroupsPanel';
import { useT } from '../i18n';
import { formatDateTime } from '../utils/format';
import {
  permissionActionLabel,
  tenantRoleLabel,
  userSelectLabel,
  usersForAccount,
} from '../utils/roles';
import { useAuthStore } from '../stores/authStore';

const { Title, Paragraph } = Typography;

export default function PermissionsPage() {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const queryClient = useQueryClient();
  const [accountId, setAccountId] = useState<number | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OpsPermission | null>(null);
  const [presetSubject, setPresetSubject] = useState<
    { type: 'group' | 'user'; id: number } | null
  >(null);

  useEffect(() => {
    setModalOpen(false);
    setEditing(null);
    setPresetSubject(null);
  }, [accountId]);

  const accountsQuery = useQuery({
    queryKey: ['tenant-users'],
    queryFn: () => listTenantUsers(token),
  });

  const accountOptions = useMemo(
    () =>
      (accountsQuery.data?.items ?? []).map((item) => ({
        label: item.display_name ? `${item.username}（${item.display_name}）` : item.username,
        value: item.id,
      })),
    [accountsQuery.data],
  );

  const permissionsQuery = useQuery({
    queryKey: ['ops-rbac-permissions', accountId],
    queryFn: () => listTenantPermissions(token, accountId!),
    enabled: accountId !== undefined,
  });

  const usersQuery = useQuery({
    queryKey: ['tenant-users'],
    queryFn: () => listTenantUsers(token),
    enabled: accountId !== undefined,
  });

  const userNameById = useMemo(() => {
    const map: Record<number, string> = {};
    if (accountId === undefined) {
      return map;
    }
    for (const item of usersForAccount(usersQuery.data?.items ?? [], accountId)) {
      map[item.id] = userSelectLabel(item);
    }
    return map;
  }, [usersQuery.data?.items, accountId]);

  const roleIdMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of permissionsQuery.data?.items ?? []) {
      if (item.role_name && item.role_id != null) {
        map[item.role_name] = item.role_id;
      }
    }
    return map;
  }, [permissionsQuery.data?.items]);

  const deleteMutation = useMutation({
    mutationFn: ({
      accountId: targetAccountId,
      permissionId,
    }: {
      accountId: number;
      permissionId: number;
    }) => deleteTenantPermission(token, targetAccountId, permissionId),
    onSuccess: () => {
      message.success(t('permissions.deleted'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-permissions'] });
    },
    onError: (err) => {
      message.error(err instanceof ApiError ? err.message : t('common.deleteFailed'));
    },
  });

  const permissionColumns: ColumnsType<OpsPermission> = [
    {
      title: t('permissions.grantee'),
      key: 'subject',
      width: 160,
      render: (_: unknown, record) => {
        if (record.user_id != null) {
          const label = userNameById[record.user_id];
          return label ?? t('permissions.userSubject', { id: record.user_id });
        }
        if (record.role_name) {
          return tenantRoleLabel(record.role_name);
        }
        if (record.group_name) {
          return record.group_name;
        }
        return t('common.emDash');
      },
    },
    {
      title: t('permissions.bucket'),
      dataIndex: 'bucket_name',
      render: (value: string | null) => value ?? <Tag>{t('permissions.allBucketsTag')}</Tag>,
    },
    {
      title: t('permissions.pathPrefix'),
      dataIndex: 'prefix',
      render: (value: string | null) => value ?? t('common.emDash'),
    },
    {
      title: t('permissions.actions'),
      dataIndex: 'actions',
      render: (actions: string[]) =>
        actions.map((action) => <Tag key={action}>{permissionActionLabel(action)}</Tag>),
    },
    {
      title: t('permissions.updatedAt'),
      dataIndex: 'updated_at',
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: t('common.actions'),
      width: 140,
      render: (_: unknown, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              setPresetSubject(null);
              setModalOpen(true);
            }}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('permissions.confirmDelete')}
            okText={t('common.delete')}
            cancelText={t('common.cancel')}
            okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
            onConfirm={() => {
              if (accountId === undefined) return;
              deleteMutation.mutate({ accountId, permissionId: record.id });
            }}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const loadError =
    permissionsQuery.error instanceof ApiError
      ? permissionsQuery.error.message
      : permissionsQuery.error
        ? t('common.loadFailed')
        : null;

  return (
    <div>
      <Title level={4}>{t('permissions.title')}</Title>
      <Paragraph type="secondary">{t('permissions.description')}</Paragraph>

      <Space style={{ marginBottom: 16 }}>
        <span>{t('permissions.selectAccount')}</span>
        <Select
          style={{ minWidth: 260 }}
          placeholder={t('permissions.selectAccount')}
          options={accountOptions}
          loading={accountsQuery.isLoading}
          value={accountId}
          onChange={setAccountId}
          allowClear
        />
      </Space>

      {accountId === undefined ? (
        <Paragraph type="secondary">{t('permissions.selectAccountPrompt')}</Paragraph>
      ) : (
        <>
          <RolePresetsPanel />
          <PermissionActionsPanel />
          <Tabs
            items={[
              {
                key: 'permissions',
                label: t('permissions.tabRules'),
                children: (
                  <>
                    <div style={{ marginBottom: 16, textAlign: 'right' }}>
                      <Space>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => void permissionsQuery.refetch()}
                          loading={permissionsQuery.isFetching}
                        >
                          {t('common.refresh')}
                        </Button>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setEditing(null);
                            setPresetSubject(null);
                            setModalOpen(true);
                          }}
                        >
                          {t('permissions.addRule')}
                        </Button>
                      </Space>
                    </div>
                    <Table
                      rowKey="id"
                      loading={permissionsQuery.isLoading}
                      columns={permissionColumns}
                      dataSource={permissionsQuery.data?.items ?? []}
                      locale={{ emptyText: loadError ?? t('permissions.empty') }}
                      pagination={{ pageSize: 15, showSizeChanger: false }}
                      scroll={{ x: 900 }}
                    />
                  </>
                ),
              },
              {
                key: 'groups',
                label: t('permissions.tabGroups'),
                children: (
                  <UserGroupsPanel
                    accountId={accountId}
                    onAssignPermission={(groupId) => {
                      setPresetSubject({ type: 'group', id: groupId });
                      setEditing(null);
                      setModalOpen(true);
                    }}
                  />
                ),
              },
              {
                key: 'templates',
                label: t('permissions.tabTemplates'),
                children: <PermissionTemplatesPanel accountId={accountId} />,
              },
            ]}
          />
        </>
      )}

      {accountId !== undefined ? (
        <PermissionFormModal
          open={modalOpen}
          accountId={accountId}
          editing={editing}
          roleIdMap={roleIdMap}
          presetSubject={presetSubject}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
            setPresetSubject(null);
          }}
        />
      ) : null}
    </div>
  );
}
