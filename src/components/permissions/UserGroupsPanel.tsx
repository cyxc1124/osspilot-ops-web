import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SafetyOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import {
  addTenantGroupMembers,
  createTenantUserGroup,
  deleteTenantUserGroup,
  listTenantUserGroups,
  removeTenantGroupMember,
  updateTenantUserGroup,
  type OpsUserGroup,
} from '../../api/rbac';
import { listTenantUsers } from '../../api/tenantUsers';
import { ApiError } from '../../api/client';
import { useT } from '../../i18n';
import { userSelectLabel, usersForAccount } from '../../utils/roles';
import { useAuthStore } from '../../stores/authStore';

interface UserGroupsPanelProps {
  accountId: number;
  onAssignPermission?: (groupId: number) => void;
}

export default function UserGroupsPanel({ accountId, onAssignPermission }: UserGroupsPanelProps) {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<OpsUserGroup | null>(null);
  const [memberGroup, setMemberGroup] = useState<OpsUserGroup | null>(null);
  const [createForm] = Form.useForm<{ name: string; description?: string }>();
  const [editForm] = Form.useForm<{ name: string; description?: string }>();
  const [memberForm] = Form.useForm<{ user_ids: number[] }>();

  useEffect(() => {
    setCreateOpen(false);
    setEditGroup(null);
    setMemberGroup(null);
    createForm.resetFields();
    editForm.resetFields();
    memberForm.resetFields();
  }, [accountId, createForm, editForm, memberForm]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ops-rbac-groups', accountId],
    queryFn: () => listTenantUserGroups(token, accountId),
  });

  const usersQuery = useQuery({
    queryKey: ['tenant-users'],
    queryFn: () => listTenantUsers(token),
  });

  const userOptions = useMemo(
    () =>
      usersForAccount(usersQuery.data?.items ?? [], accountId).map((item) => ({
        label: userSelectLabel(item),
        value: item.id,
      })),
    [usersQuery.data, accountId],
  );

  const createMutation = useMutation({
    mutationFn: ({
      accountId: targetAccountId,
      values,
    }: {
      accountId: number;
      values: { name: string; description?: string };
    }) => createTenantUserGroup(token, targetAccountId, values),
    onSuccess: () => {
      message.success(t('permissions.groupCreated'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-groups'] });
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: (err) => message.error(err instanceof ApiError ? err.message : t('common.createFailed')),
  });

  const editMutation = useMutation({
    mutationFn: ({
      accountId: targetAccountId,
      groupId,
      values,
    }: {
      accountId: number;
      groupId: number;
      values: { name: string; description?: string };
    }) => updateTenantUserGroup(token, targetAccountId, groupId, values),
    onSuccess: () => {
      message.success(t('permissions.groupUpdated'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-groups'] });
      setEditGroup(null);
      editForm.resetFields();
    },
    onError: (err) => message.error(err instanceof ApiError ? err.message : t('common.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ accountId: targetAccountId, groupId }: { accountId: number; groupId: number }) =>
      deleteTenantUserGroup(token, targetAccountId, groupId),
    onSuccess: () => {
      message.success(t('permissions.groupDeleted'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-groups'] });
    },
    onError: (err) => message.error(err instanceof ApiError ? err.message : t('common.deleteFailed')),
  });

  const addMembersMutation = useMutation({
    mutationFn: ({
      accountId: targetAccountId,
      groupId,
      userIds,
    }: {
      accountId: number;
      groupId: number;
      userIds: number[];
    }) => addTenantGroupMembers(token, targetAccountId, groupId, userIds),
    onSuccess: () => {
      message.success(t('permissions.membersAdded'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-groups'] });
      setMemberGroup(null);
      memberForm.resetFields();
    },
    onError: (err) => message.error(err instanceof ApiError ? err.message : t('permissions.addMembersFailed')),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({
      accountId: targetAccountId,
      groupId,
      userId,
    }: {
      accountId: number;
      groupId: number;
      userId: number;
    }) => removeTenantGroupMember(token, targetAccountId, groupId, userId),
    onSuccess: () => {
      message.success(t('permissions.memberRemoved'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-groups'] });
    },
    onError: (err) => message.error(err instanceof ApiError ? err.message : t('permissions.removeMemberFailed')),
  });

  const columns: ColumnsType<OpsUserGroup> = [
    { title: t('permissions.groupName'), dataIndex: 'name', width: 160 },
    {
      title: t('permissions.groupDesc'),
      dataIndex: 'description',
      render: (v: string | null) => v ?? t('common.emDash'),
    },
    {
      title: t('permissions.members'),
      dataIndex: 'members',
      render: (members: OpsUserGroup['members'], record) => (
        <Space size={[4, 4]} wrap>
          {members.map((member) => (
            <Tag
              key={member.user_id}
              closable
              onClose={(event) => {
                event.preventDefault();
                removeMemberMutation.mutate({
                  accountId,
                  groupId: record.id,
                  userId: member.user_id,
                });
              }}
            >
              {member.display_name ?? member.username}
            </Tag>
          ))}
          {members.length === 0 ? <span>{t('permissions.noMembers')}</span> : null}
        </Space>
      ),
    },
    {
      title: t('common.actions'),
      width: 280,
      render: (_: unknown, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditGroup(record);
              editForm.setFieldsValue({
                name: record.name,
                description: record.description ?? undefined,
              });
            }}
          >
            {t('permissions.editGroup')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<UserAddOutlined />}
            onClick={() => {
              setMemberGroup(record);
              memberForm.resetFields();
            }}
          >
            {t('permissions.addMember')}
          </Button>
          {onAssignPermission ? (
            <Button
              type="link"
              size="small"
              icon={<SafetyOutlined />}
              onClick={() => onAssignPermission(record.id)}
            >
              {t('permissions.assignPermission')}
            </Button>
          ) : null}
          <Popconfirm
            title={t('permissions.confirmDeleteGroup')}
            onConfirm={() => deleteMutation.mutate({ accountId, groupId: record.id })}
            okText={t('common.delete')}
            cancelText={t('common.cancel')}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <Button onClick={() => void refetch()}>{t('common.refresh')}</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            {t('permissions.createGroup')}
          </Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={{ pageSize: 10, showSizeChanger: false }}
      />

      <Modal
        title={t('permissions.createGroupTitle')}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => void createForm.validateFields().then((values) => createMutation.mutate({ accountId, values }))}
        confirmLoading={createMutation.isPending}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="name"
            label={t('permissions.groupName')}
            rules={[{ required: true, message: t('permissions.groupNameRequired') }]}
          >
            <Input placeholder={t('permissions.groupNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('permissions.groupDesc')}>
            <Input.TextArea rows={2} placeholder={t('common.optional')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('permissions.editGroupTitle')}
        open={editGroup !== null}
        onCancel={() => setEditGroup(null)}
        onOk={() =>
          void editForm.validateFields().then((values) => {
            if (!editGroup) return;
            editMutation.mutate({ accountId, groupId: editGroup.id, values });
          })
        }
        confirmLoading={editMutation.isPending}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label={t('permissions.groupName')}
            rules={[{ required: true, message: t('permissions.groupNameRequired') }]}
          >
            <Input placeholder={t('permissions.groupNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('permissions.groupDesc')}>
            <Input.TextArea rows={2} placeholder={t('common.optional')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          memberGroup
            ? t('permissions.addMembersTitle', { name: memberGroup.name })
            : t('permissions.addMember')
        }
        open={memberGroup !== null}
        onCancel={() => setMemberGroup(null)}
        onOk={() =>
          void memberForm.validateFields().then((values) => {
            if (!memberGroup) return;
            addMembersMutation.mutate({ accountId, groupId: memberGroup.id, userIds: values.user_ids });
          })
        }
        confirmLoading={addMembersMutation.isPending}
        okText={t('common.add')}
        cancelText={t('common.cancel')}
      >
        <Form form={memberForm} layout="vertical">
          <Form.Item
            name="user_ids"
            label={t('permissions.user')}
            rules={[{ required: true, message: t('permissions.userRequired') }]}
          >
            <Select mode="multiple" options={userOptions} placeholder={t('permissions.selectUsersToAdd')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
