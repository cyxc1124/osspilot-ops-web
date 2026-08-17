import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Form,
  Input,
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
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
  updateUser,
} from '../api/users';
import { ApiError } from '../api/client';
import type { UserResponse } from '../api/types';
import { useT } from '../i18n';
import { useAuthStore } from '../stores/authStore';
import { formatDateTime, userStatusLabel } from '../utils/format';
import CreatePasswordFields from '../components/accounts/CreatePasswordFields';
import { getOpsRoleOptions, opsRoleLabel } from '../utils/roles';

const { Title } = Typography;

interface OpsUserFormValues {
  username?: string;
  password?: string;
  display_name?: string;
  email?: string;
  phone?: string;
  status?: string;
  ops_roles?: string[];
  skip_must_change?: boolean;
  confirm_password?: string;
}

export default function UsersPage() {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [resetUser, setResetUser] = useState<UserResponse | null>(null);
  const [form] = Form.useForm<OpsUserFormValues>();
  const [resetForm] = Form.useForm<{ new_password: string }>();

  const usersQuery = useQuery({
    queryKey: ['ops-users'],
    queryFn: () => listUsers(token),
  });

  const users = usersQuery.data?.items ?? [];

  const renderOpsRoles = (roles: string[]) =>
    roles.length ? roles.map((r) => <Tag key={r}>{opsRoleLabel(r)}</Tag>) : t('common.emDash');

  const saveMutation = useMutation({
    mutationFn: async ({
      userId,
      values,
    }: {
      userId?: number;
      values: OpsUserFormValues;
    }) => {
      if (userId != null) {
        return updateUser(token, userId, {
          display_name: values.display_name ?? null,
          email: values.email ?? null,
          phone: values.phone ?? null,
          status: values.status,
          ops_roles: values.ops_roles ?? [],
        });
      }
      return createUser(token, {
        username: values.username!,
        password: values.password!,
        display_name: values.display_name ?? null,
        email: values.email ?? null,
        phone: values.phone ?? null,
        ops_roles: values.ops_roles ?? [],
        must_change_password: !values.skip_must_change,
        confirm_password: values.skip_must_change ? values.confirm_password : undefined,
      });
    },
    onSuccess: (_result, { userId }) => {
      message.success(userId != null ? t('users.updated') : t('users.created'));
      closeModal();
      void queryClient.invalidateQueries({ queryKey: ['ops-users'] });
    },
    onError: (err: Error) => message.error(err instanceof ApiError ? err.message : t('common.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(token, id),
    onSuccess: () => {
      message.success(t('users.deleted'));
      void queryClient.invalidateQueries({ queryKey: ['ops-users'] });
    },
    onError: (err: Error) => message.error(err instanceof ApiError ? err.message : t('common.deleteFailed')),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      resetUserPassword(token, id, password),
    onSuccess: () => {
      message.success(t('users.passwordReset'));
      setResetUser(null);
      resetForm.resetFields();
    },
    onError: (err: Error) => message.error(err instanceof ApiError ? err.message : t('common.resetFailed')),
  });

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ ops_roles: [], skip_must_change: false });
    setModalOpen(true);
  };

  const openEdit = (user: UserResponse) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      display_name: user.display_name ?? undefined,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      status: user.status,
      ops_roles: user.ops_roles,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  const columns: ColumnsType<UserResponse> = [
    { title: t('common.id'), dataIndex: 'id', width: 72 },
    { title: t('users.username'), dataIndex: 'username' },
    {
      title: t('users.displayName'),
      dataIndex: 'display_name',
      render: (v: string | null) => v ?? t('common.emDash'),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>{userStatusLabel(status)}</Tag>
      ),
    },
    {
      title: t('users.opsRoles'),
      dataIndex: 'ops_roles',
      render: (roles: string[]) => renderOpsRoles(roles),
    },
    { title: t('users.lastLogin'), dataIndex: 'last_login_at', render: formatDateTime },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            {t('common.edit')}
          </Button>
          <Button type="link" size="small" onClick={() => setResetUser(record)}>
            {t('users.resetPassword')}
          </Button>
          <Popconfirm title={t('users.deleteConfirm')} onConfirm={() => deleteMutation.mutate(record.id)}>
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
          {t('users.title')}
        </Title>
        <Button type="primary" onClick={openCreate}>
          {t('users.createUser')}
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={usersQuery.isLoading}
        columns={columns}
        dataSource={users}
        pagination={{ pageSize: 10, showTotal: (total) => t('common.totalUsers', { total }) }}
        scroll={{ x: 900 }}
      />

      <Modal
        title={
          editingUser
            ? t('users.editModalTitle', { username: editingUser.username })
            : t('users.createOpsModalTitle')
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        width={720}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ skip_must_change: false }}
          onFinish={(values) => saveMutation.mutate({ userId: editingUser?.id, values })}
        >
          <Card size="small" title={t('users.basicInfoSection')} style={{ marginBottom: 16 }}>
            {!editingUser ? (
              <>
                <Form.Item
                  name="username"
                  label={t('users.username')}
                  rules={[{ required: true, message: t('users.usernameRequired') }]}
                >
                  <Input />
                </Form.Item>
                <CreatePasswordFields />
              </>
            ) : (
              <Form.Item name="status" label={t('common.status')}>
                <Select
                  options={[
                    { label: t('common.statusActive'), value: 'active' },
                    { label: t('common.statusDisabled'), value: 'disabled' },
                  ]}
                />
              </Form.Item>
            )}
            <Form.Item name="display_name" label={t('users.displayName')}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label={t('users.email')}>
              <Input type="email" />
            </Form.Item>
            <Form.Item name="phone" label={t('users.phone')} style={{ marginBottom: 0 }}>
              <Input />
            </Form.Item>
          </Card>

          <Card
            size="small"
            title={t('users.opsAccountSection')}
            extra={<Typography.Text type="secondary">{t('users.opsAccountSectionDesc')}</Typography.Text>}
          >
            <Form.Item name="ops_roles" label={t('users.opsRoleField')} style={{ marginBottom: 0 }}>
              <Select mode="multiple" options={getOpsRoleOptions()} placeholder={t('users.selectOpsRoles')} />
            </Form.Item>
          </Card>
        </Form>
      </Modal>

      <Modal
        title={t('users.resetModalTitle', { username: resetUser?.username ?? '' })}
        open={resetUser != null}
        onCancel={() => setResetUser(null)}
        onOk={() => resetForm.submit()}
        confirmLoading={resetMutation.isPending}
        destroyOnClose
      >
        <Form
          form={resetForm}
          layout="vertical"
          onFinish={(values) => {
            if (!resetUser) return;
            resetMutation.mutate({ id: resetUser.id, password: values.new_password });
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
    </>
  );
}
