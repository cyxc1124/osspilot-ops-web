import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  createTenantUser,
  deleteTenantUser,
  listTenantUsers,
  resetTenantUserPassword,
  updateTenantUser,
} from '../api/tenantUsers';
import { listRegions } from '../api/regions';
import { ApiError } from '../api/client';
import type { TenantUserResponse } from '../api/types';
import AccountBucketsDrawer from '../components/accounts/AccountBucketsDrawer';
import CreatePasswordFields from '../components/accounts/CreatePasswordFields';
import { useT } from '../i18n';
import { useAuthStore } from '../stores/authStore';
import { formatBytes, formatDateTime, userStatusLabel } from '../utils/format';

const { Title } = Typography;

interface CreateForm {
  username: string;
  password: string;
  display_name?: string;
  email?: string;
  phone?: string;
  quota_gb?: number;
  storage_region_id?: number;
  skip_must_change?: boolean;
  confirm_password?: string;
}

interface EditForm {
  display_name?: string;
  email?: string;
  phone?: string;
  status?: string;
  quota_gb?: number;
  storage_region_id?: number;
}

export default function TenantAccountsPage() {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<TenantUserResponse | null>(null);
  const [resetAccount, setResetAccount] = useState<TenantUserResponse | null>(null);
  const [bucketsAccount, setBucketsAccount] = useState<TenantUserResponse | null>(null);
  const [createForm] = Form.useForm<CreateForm>();
  const [editForm] = Form.useForm<EditForm>();
  const [resetForm] = Form.useForm<{ new_password: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-users'],
    queryFn: () => listTenantUsers(token),
  });

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: () => listRegions(token),
  });

  const regionOptions = (regionsQuery.data?.items ?? []).map((region) => ({
    value: region.id,
    label: `${region.name} (${region.code})`,
  }));

  const createMutation = useMutation({
    mutationFn: (values: CreateForm) =>
      createTenantUser(token, {
        username: values.username.trim(),
        password: values.password,
        display_name: values.display_name ?? null,
        email: values.email ?? null,
        phone: values.phone ?? null,
        quota_bytes: values.quota_gb != null ? Math.round(values.quota_gb * 1024 ** 3) : null,
        storage_region_id: values.storage_region_id ?? null,
        must_change_password: !values.skip_must_change,
        confirm_password: values.skip_must_change ? values.confirm_password : undefined,
      }),
    onSuccess: () => {
      message.success(t('tenantAccounts.created'));
      setCreateOpen(false);
      createForm.resetFields();
      void queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
    },
    onError: (err: Error) => message.error(err instanceof ApiError ? err.message : t('common.createFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateTenantUser>[2] }) =>
      updateTenantUser(token, id, body),
    onSuccess: () => {
      message.success(t('tenantAccounts.updated'));
      setEditAccount(null);
      editForm.resetFields();
      void queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
    },
    onError: (err: Error) => message.error(err instanceof ApiError ? err.message : t('common.updateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTenantUser(token, id),
    onSuccess: () => {
      message.success(t('tenantAccounts.deleted'));
      void queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
    },
    onError: (err: Error) => message.error(err instanceof ApiError ? err.message : t('common.deleteFailed')),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      resetTenantUserPassword(token, id, password),
    onSuccess: () => {
      message.success(t('users.passwordReset'));
      setResetAccount(null);
      resetForm.resetFields();
    },
    onError: (err: Error) => message.error(err instanceof ApiError ? err.message : t('common.resetFailed')),
  });

  const handleToggleStatus = (account: TenantUserResponse) => {
    const nextStatus = account.status === 'active' ? 'disabled' : 'active';
    updateMutation.mutate({ id: account.id, body: { status: nextStatus } });
  };

  const openEdit = (account: TenantUserResponse) => {
    setEditAccount(account);
    editForm.setFieldsValue({
      display_name: account.display_name ?? undefined,
      email: account.email ?? undefined,
      phone: account.phone ?? undefined,
      status: account.status,
      quota_gb: account.quota_bytes != null ? account.quota_bytes / 1024 ** 3 : undefined,
      storage_region_id: account.storage_region_id ?? undefined,
    });
  };

  const columns: ColumnsType<TenantUserResponse> = [
    { title: t('common.id'), dataIndex: 'id', width: 72 },
    { title: t('users.username'), dataIndex: 'username' },
    {
      title: t('users.displayName'),
      dataIndex: 'display_name',
      render: (v) => v ?? t('common.emDash'),
    },
    {
      title: t('tenantAccounts.storageRegion'),
      dataIndex: 'storage_region',
      render: (region: TenantUserResponse['storage_region']) =>
        region ? `${region.name} (${region.code})` : t('tenantAccounts.storageRegionDefault'),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>{userStatusLabel(status)}</Tag>
      ),
    },
    {
      title: t('tenantAccounts.quota'),
      dataIndex: 'quota_bytes',
      render: (v: number | null) => (v != null ? formatBytes(v) : t('common.unlimited')),
    },
    {
      title: t('users.lastLogin'),
      dataIndex: 'last_login_at',
      render: (v: string | null) => (v ? formatDateTime(v) : t('common.emDash')),
    },
    { title: t('tenantAccounts.createdAt'), dataIndex: 'created_at', render: formatDateTime },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space wrap>
          <Button type="link" size="small" onClick={() => setBucketsAccount(record)}>
            {t('tenantAccounts.manageBuckets')}
          </Button>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            {t('common.edit')}
          </Button>
          <Button type="link" size="small" onClick={() => setResetAccount(record)}>
            {t('users.resetPassword')}
          </Button>
          <Button type="link" size="small" onClick={() => handleToggleStatus(record)}>
            {record.status === 'active' ? t('tenantAccounts.disable') : t('tenantAccounts.enable')}
          </Button>
          <Popconfirm
            title={t('tenantAccounts.deleteConfirm')}
            description={t('tenantAccounts.deleteDesc')}
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button type="link" size="small" danger>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          {t('tenantAccounts.title')}
        </Title>
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          {t('tenantAccounts.create')}
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={{ pageSize: 10, showTotal: (total) => t('common.totalAccounts', { total }) }}
        scroll={{ x: 1100 }}
      />

      <Modal
        title={t('tenantAccounts.createModalTitle')}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createMutation.isPending}
        destroyOnClose
        width={560}
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ skip_must_change: false }}
          onFinish={(v) => createMutation.mutate(v)}
        >
          <Form.Item
            name="username"
            label={t('users.username')}
            rules={[{ required: true, message: t('users.usernameRequired') }]}
          >
            <Input placeholder={t('tenantAccounts.usernamePlaceholder')} />
          </Form.Item>
          <CreatePasswordFields />
          <Form.Item name="display_name" label={t('users.displayName')}>
            <Input placeholder={t('tenantAccounts.displayNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="email" label={t('users.email')}>
            <Input type="email" />
          </Form.Item>
          <Form.Item name="phone" label={t('users.phone')}>
            <Input />
          </Form.Item>
          <Form.Item name="quota_gb" label={t('tenantAccounts.storageQuotaGb')}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder={t('tenantAccounts.quotaUnlimitedPlaceholder')} />
          </Form.Item>
          <Form.Item name="storage_region_id" label={t('tenantAccounts.storageRegion')}>
            <Select allowClear options={regionOptions} placeholder={t('tenantAccounts.storageRegionPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('tenantAccounts.editModalTitle', { username: editAccount?.username ?? '' })}
        open={editAccount != null}
        onCancel={() => setEditAccount(null)}
        onOk={() => editForm.submit()}
        confirmLoading={updateMutation.isPending}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (!editAccount) return;
            updateMutation.mutate({
              id: editAccount.id,
              body: {
                display_name: values.display_name ?? null,
                email: values.email ?? null,
                phone: values.phone ?? null,
                status: values.status,
                quota_bytes:
                  values.quota_gb != null ? Math.round(values.quota_gb * 1024 ** 3) : null,
                storage_region_id: values.storage_region_id ?? null,
              },
            });
          }}
        >
          <Form.Item name="display_name" label={t('users.displayName')}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label={t('users.email')}>
            <Input type="email" />
          </Form.Item>
          <Form.Item name="phone" label={t('users.phone')}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label={t('common.status')}>
            <Select
              options={[
                { label: t('common.statusActive'), value: 'active' },
                { label: t('common.statusDisabled'), value: 'disabled' },
              ]}
            />
          </Form.Item>
          <Form.Item name="quota_gb" label={t('tenantAccounts.storageQuotaGb')}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder={t('tenantAccounts.quotaUnlimitedPlaceholder')} />
          </Form.Item>
          <Form.Item name="storage_region_id" label={t('tenantAccounts.storageRegion')}>
            <Select allowClear options={regionOptions} placeholder={t('tenantAccounts.storageRegionPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('users.resetModalTitle', { username: resetAccount?.username ?? '' })}
        open={resetAccount != null}
        onCancel={() => setResetAccount(null)}
        onOk={() => resetForm.submit()}
        confirmLoading={resetMutation.isPending}
        destroyOnClose
      >
        <Form
          form={resetForm}
          layout="vertical"
          onFinish={(values) => {
            if (!resetAccount) return;
            resetMutation.mutate({ id: resetAccount.id, password: values.new_password });
          }}
        >
          <Form.Item
            name="new_password"
            label={t('users.newPassword')}
            rules={[
              { required: true, message: t('users.newPasswordRequired') },
              { min: 8, message: t('users.passwordMinLength') },
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      <AccountBucketsDrawer
        open={bucketsAccount != null}
        account={bucketsAccount}
        token={token}
        onClose={() => setBucketsAccount(null)}
      />
    </>
  );
}
