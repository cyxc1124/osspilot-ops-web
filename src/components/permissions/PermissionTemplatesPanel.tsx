import { DeleteOutlined, EditOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { listAccountBuckets } from '../../api/buckets';
import {
  createTenantPermissionTemplate,
  createTenantTemplateAssignment,
  createTenantTemplateRule,
  deleteTenantPermissionTemplate,
  deleteTenantTemplateAssignment,
  deleteTenantTemplateRule,
  listTenantPermissionTemplates,
  listTenantUserGroups,
  updateTenantPermissionTemplate,
  updateTenantTemplateRule,
  type OpsPermissionTemplate,
  type OpsTemplateRule,
} from '../../api/rbac';
import { listTenantUsers } from '../../api/tenantUsers';
import { ApiError } from '../../api/client';
import { useT } from '../../i18n';
import PermissionActionsPicker from './PermissionActionsPicker';
import { permissionActionLabel, userSelectLabel, usersForAccount } from '../../utils/roles';
import { useAuthStore } from '../../stores/authStore';

interface PermissionTemplatesPanelProps {
  accountId: number;
}

function bucketSelectLabel(bucket: { bucket_name: string; display_name: string | null }): string {
  return bucket.display_name?.trim()
    ? `${bucket.bucket_name}（${bucket.display_name}）`
    : bucket.bucket_name;
}

export default function PermissionTemplatesPanel({ accountId }: PermissionTemplatesPanelProps) {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [assignTemplate, setAssignTemplate] = useState<OpsPermissionTemplate | null>(null);
  const [rulesTemplate, setRulesTemplate] = useState<OpsPermissionTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState<OpsPermissionTemplate | null>(null);
  const [editingRule, setEditingRule] = useState<OpsTemplateRule | null>(null);
  const [ruleFormOpen, setRuleFormOpen] = useState(false);
  const [createForm] = Form.useForm<{
    name: string;
    description?: string;
    bucket_name?: string;
    prefix?: string;
    actions: string[];
  }>();
  const [assignForm] = Form.useForm<{
    subject_type: 'user' | 'group';
    user_id?: number;
    group_id?: number;
  }>();
  const [editTemplateForm] = Form.useForm<{ name: string; description?: string }>();
  const [ruleForm] = Form.useForm<{
    bucket_name?: string;
    prefix?: string;
    actions: string[];
  }>();

  useEffect(() => {
    setCreateOpen(false);
    setAssignTemplate(null);
    setRulesTemplate(null);
    setEditTemplate(null);
    setEditingRule(null);
    setRuleFormOpen(false);
    createForm.resetFields();
    assignForm.resetFields();
    editTemplateForm.resetFields();
    ruleForm.resetFields();
  }, [accountId, createForm, assignForm, editTemplateForm, ruleForm]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ops-rbac-templates', accountId],
    queryFn: () => listTenantPermissionTemplates(token, accountId),
  });

  const usersQuery = useQuery({
    queryKey: ['tenant-users'],
    queryFn: () => listTenantUsers(token),
  });
  const groupsQuery = useQuery({
    queryKey: ['ops-rbac-groups', accountId],
    queryFn: () => listTenantUserGroups(token, accountId),
  });
  const bucketsQuery = useQuery({
    queryKey: ['account-buckets', accountId],
    queryFn: () => listAccountBuckets(token, accountId),
    enabled: createOpen || ruleFormOpen,
  });

  const userNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const item of usersForAccount(usersQuery.data?.items ?? [], accountId)) {
      map[item.id] = userSelectLabel(item);
    }
    return map;
  }, [usersQuery.data?.items, accountId]);

  const groupNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const item of groupsQuery.data?.items ?? []) {
      map[item.id] = item.name;
    }
    return map;
  }, [groupsQuery.data?.items]);

  const userOptions = useMemo(
    () =>
      usersForAccount(usersQuery.data?.items ?? [], accountId).map((item) => ({
        label: userSelectLabel(item),
        value: item.id,
      })),
    [usersQuery.data, accountId],
  );
  const groupOptions = useMemo(
    () =>
      (groupsQuery.data?.items ?? []).map((item) => ({
        label: item.name,
        value: item.id,
      })),
    [groupsQuery.data],
  );
  const bucketOptions = useMemo(
    () =>
      (bucketsQuery.data?.items ?? []).map((item) => ({
        label: bucketSelectLabel(item),
        value: item.bucket_name,
      })),
    [bucketsQuery.data],
  );
  const actionRequiredRule = {
    validator: async (_: unknown, actions: string[] | undefined) => {
      if (!actions || actions.length === 0) {
        throw new Error(t('permissions.actionsRequired'));
      }
    },
  };

  const assignmentLabel = (item: OpsPermissionTemplate['assignments'][number]) => {
    if (item.user_id != null) {
      const name = userNameById[item.user_id];
      return name
        ? t('permissions.userAssignmentName', { name })
        : t('permissions.userAssignment', { id: item.user_id });
    }
    const name = item.group_id != null ? groupNameById[item.group_id] : undefined;
    return name
      ? t('permissions.groupAssignmentName', { name })
      : t('permissions.groupAssignment', { id: item.group_id ?? '—' });
  };

  const createMutation = useMutation({
    mutationFn: ({
      accountId: targetAccountId,
      values,
    }: {
      accountId: number;
      values: {
        name: string;
        description?: string;
        bucket_name?: string;
        prefix?: string;
        actions: string[];
      };
    }) =>
      createTenantPermissionTemplate(token, targetAccountId, {
        name: values.name,
        description: values.description,
        rules: [
          {
            bucket_name: values.bucket_name?.trim() || null,
            prefix: values.prefix?.trim() || null,
            actions: values.actions,
          },
        ],
      }),
    onSuccess: () => {
      message.success(t('permissions.templateCreated'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-templates'] });
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: (err) => message.error(err instanceof ApiError ? err.message : t('common.createFailed')),
  });

  const editTemplateMutation = useMutation({
    mutationFn: ({
      accountId: targetAccountId,
      templateId,
      values,
    }: {
      accountId: number;
      templateId: number;
      values: { name: string; description?: string };
    }) => updateTenantPermissionTemplate(token, targetAccountId, templateId, values),
    onSuccess: () => {
      message.success(t('permissions.templateUpdated'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-templates'] });
      setEditTemplate(null);
      editTemplateForm.resetFields();
    },
    onError: (err) => message.error(err instanceof ApiError ? err.message : t('common.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: ({
      accountId: targetAccountId,
      templateId,
    }: {
      accountId: number;
      templateId: number;
    }) => deleteTenantPermissionTemplate(token, targetAccountId, templateId),
    onSuccess: () => {
      message.success(t('permissions.templateDeleted'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-templates'] });
    },
    onError: (err) => message.error(err instanceof ApiError ? err.message : t('common.deleteFailed')),
  });

  const assignMutation = useMutation({
    mutationFn: async ({
      accountId: targetAccountId,
      templateId,
      values,
    }: {
      accountId: number;
      templateId: number;
      values: {
        subject_type: 'user' | 'group';
        user_id?: number;
        group_id?: number;
      };
    }) =>
      createTenantTemplateAssignment(
        token,
        targetAccountId,
        templateId,
        values.subject_type === 'user'
          ? { user_id: values.user_id }
          : { group_id: values.group_id },
      ),
    onSuccess: () => {
      message.success(t('permissions.templateAssigned'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-templates'] });
      setAssignTemplate(null);
      assignForm.resetFields();
    },
    onError: (err) => message.error(err instanceof ApiError ? err.message : t('permissions.assignFailed')),
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: ({
      accountId: targetAccountId,
      templateId,
      assignmentId,
    }: {
      accountId: number;
      templateId: number;
      assignmentId: number;
    }) => deleteTenantTemplateAssignment(token, targetAccountId, templateId, assignmentId),
    onSuccess: () => {
      message.success(t('permissions.assignmentRemoved'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-templates'] });
    },
    onError: (err) => message.error(err instanceof ApiError ? err.message : t('permissions.removeAssignmentFailed')),
  });

  const createRuleMutation = useMutation({
    mutationFn: async ({
      accountId: targetAccountId,
      templateId,
      values,
    }: {
      accountId: number;
      templateId: number;
      values: { bucket_name?: string; prefix?: string; actions: string[] };
    }) =>
      createTenantTemplateRule(token, targetAccountId, templateId, {
        bucket_name: values.bucket_name?.trim() || null,
        prefix: values.prefix?.trim() || null,
        actions: values.actions,
      }),
    onSuccess: () => {
      message.success(t('permissions.ruleCreated'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-templates'] });
      setRuleFormOpen(false);
      setEditingRule(null);
      ruleForm.resetFields();
    },
    onError: (err) => message.error(err instanceof ApiError ? err.message : t('common.saveFailed')),
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({
      accountId: targetAccountId,
      templateId,
      ruleId,
      values,
    }: {
      accountId: number;
      templateId: number;
      ruleId: number;
      values: { bucket_name?: string; prefix?: string; actions: string[] };
    }) =>
      updateTenantTemplateRule(token, targetAccountId, templateId, ruleId, {
        bucket_name: values.bucket_name?.trim() || null,
        prefix: values.prefix?.trim() || null,
        actions: values.actions,
      }),
    onSuccess: () => {
      message.success(t('permissions.ruleUpdated'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-templates'] });
      setRuleFormOpen(false);
      setEditingRule(null);
      ruleForm.resetFields();
    },
    onError: (err) => message.error(err instanceof ApiError ? err.message : t('common.saveFailed')),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: ({
      accountId: targetAccountId,
      templateId,
      ruleId,
    }: {
      accountId: number;
      templateId: number;
      ruleId: number;
    }) => deleteTenantTemplateRule(token, targetAccountId, templateId, ruleId),
    onSuccess: () => {
      message.success(t('permissions.ruleDeleted'));
      void queryClient.invalidateQueries({ queryKey: ['ops-rbac-templates'] });
    },
    onError: (err) => message.error(err instanceof ApiError ? err.message : t('common.deleteFailed')),
  });

  const currentRulesTemplate = useMemo(() => {
    if (!rulesTemplate) return null;
    return (data?.items ?? []).find((item) => item.id === rulesTemplate.id) ?? rulesTemplate;
  }, [data?.items, rulesTemplate]);

  const ruleColumns: ColumnsType<OpsTemplateRule> = [
    {
      title: t('permissions.bucket'),
      dataIndex: 'bucket_name',
      render: (value: string | null) => value ?? <Tag>{t('permissions.allBucketTag')}</Tag>,
    },
    {
      title: t('permissions.prefix'),
      dataIndex: 'prefix',
      render: (value: string | null) => value ?? '*',
    },
    {
      title: t('permissions.actions'),
      dataIndex: 'actions',
      render: (actions: string[]) =>
        actions.map((action) => <Tag key={action}>{permissionActionLabel(action)}</Tag>),
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
              setEditingRule(record);
              ruleForm.setFieldsValue({
                bucket_name: record.bucket_name ?? undefined,
                prefix: record.prefix ?? undefined,
                actions: record.actions,
              });
              setRuleFormOpen(true);
            }}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('permissions.confirmDeleteRule')}
            onConfirm={() => {
              if (!rulesTemplate) return;
              deleteRuleMutation.mutate({
                accountId,
                templateId: rulesTemplate.id,
                ruleId: record.id,
              });
            }}
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

  const columns: ColumnsType<OpsPermissionTemplate> = [
    { title: t('permissions.templateName'), dataIndex: 'name', width: 160 },
    {
      title: t('permissions.templateDesc'),
      dataIndex: 'description',
      render: (v: string | null) => v ?? t('common.emDash'),
    },
    {
      title: t('permissions.templateRules'),
      dataIndex: 'rules',
      render: (rules: OpsPermissionTemplate['rules']) =>
        rules.map((rule) => (
          <div key={rule.id}>
            <Tag>{rule.bucket_name ?? t('permissions.allBucketTag')}</Tag>
            <Tag>{rule.prefix ?? '*'}</Tag>
            {rule.actions.map((action) => (
              <Tag key={action}>{permissionActionLabel(action)}</Tag>
            ))}
          </div>
        )),
    },
    {
      title: t('permissions.templateAssign'),
      dataIndex: 'assignments',
      render: (assignments: OpsPermissionTemplate['assignments'], record) => (
        <Space direction="vertical" size={4}>
          {assignments.map((item) => (
            <Tag
              key={item.id}
              closable
              onClose={(event) => {
                event.preventDefault();
                removeAssignmentMutation.mutate({
                  accountId,
                  templateId: record.id,
                  assignmentId: item.id,
                });
              }}
            >
              {assignmentLabel(item)}
            </Tag>
          ))}
          <Button type="link" size="small" onClick={() => setAssignTemplate(record)}>
            {t('permissions.assignTemplate')}
          </Button>
        </Space>
      ),
    },
    {
      title: t('common.actions'),
      width: 200,
      render: (_: unknown, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => setRulesTemplate(record)}
          >
            {t('permissions.manageRules')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditTemplate(record);
              editTemplateForm.setFieldsValue({
                name: record.name,
                description: record.description ?? undefined,
              });
            }}
          >
            {t('permissions.editTemplate')}
          </Button>
          <Popconfirm
            title={t('permissions.confirmDeleteTemplate')}
            onConfirm={() => deleteMutation.mutate({ accountId, templateId: record.id })}
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
            {t('permissions.createTemplate')}
          </Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 900 }}
      />

      <Modal
        title={t('permissions.createTemplateTitle')}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => void createForm.validateFields().then((values) => createMutation.mutate({ accountId, values }))}
        confirmLoading={createMutation.isPending}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
        width={760}
      >
        <Form form={createForm} layout="vertical" initialValues={{ actions: ['read'] }}>
          <Form.Item name="name" label={t('permissions.templateName')} rules={[{ required: true }]}>
            <Input placeholder={t('permissions.templateNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('permissions.templateDesc')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="bucket_name" label={t('permissions.bucket')}>
            <Select allowClear options={bucketOptions} placeholder={t('permissions.allBucketsShort')} />
          </Form.Item>
          <Form.Item name="prefix" label={t('permissions.prefix')}>
            <Input placeholder={t('permissions.prefixExample')} />
          </Form.Item>
          <Form.Item name="actions" label={t('permissions.templateActions')} rules={[actionRequiredRule]}>
            <PermissionActionsPicker />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          assignTemplate
            ? t('permissions.assignTemplateTitle', { name: assignTemplate.name })
            : t('permissions.assignTemplate')
        }
        open={assignTemplate !== null}
        onCancel={() => setAssignTemplate(null)}
        onOk={() =>
          void assignForm.validateFields().then((values) => {
            if (!assignTemplate) return;
            assignMutation.mutate({
              accountId,
              templateId: assignTemplate.id,
              values,
            });
          })
        }
        confirmLoading={assignMutation.isPending}
        okText={t('common.assign')}
        cancelText={t('common.cancel')}
      >
        <Form form={assignForm} layout="vertical" initialValues={{ subject_type: 'user' }}>
          <Form.Item name="subject_type" label={t('permissions.assignSubject')} rules={[{ required: true }]}>
            <Select
              options={[
                { label: t('permissions.assignUser'), value: 'user' },
                { label: t('permissions.assignGroup'), value: 'group' },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {() =>
              assignForm.getFieldValue('subject_type') === 'user' ? (
                <Form.Item name="user_id" label={t('permissions.user')} rules={[{ required: true }]}>
                  <Select options={userOptions} placeholder={t('permissions.selectUser')} />
                </Form.Item>
              ) : (
                <Form.Item name="group_id" label={t('permissions.group')} rules={[{ required: true }]}>
                  <Select options={groupOptions} placeholder={t('permissions.selectGroup')} />
                </Form.Item>
              )
            }
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('permissions.editTemplateTitle')}
        open={editTemplate !== null}
        onCancel={() => setEditTemplate(null)}
        onOk={() =>
          void editTemplateForm.validateFields().then((values) => {
            if (!editTemplate) return;
            editTemplateMutation.mutate({ accountId, templateId: editTemplate.id, values });
          })
        }
        confirmLoading={editTemplateMutation.isPending}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={editTemplateForm} layout="vertical">
          <Form.Item name="name" label={t('permissions.templateName')} rules={[{ required: true }]}>
            <Input placeholder={t('permissions.templateNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('permissions.templateDesc')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          currentRulesTemplate
            ? t('permissions.manageRulesTitle', { name: currentRulesTemplate.name })
            : t('permissions.manageRules')
        }
        open={rulesTemplate !== null}
        onCancel={() => {
          setRulesTemplate(null);
          setRuleFormOpen(false);
          setEditingRule(null);
          ruleForm.resetFields();
        }}
        footer={null}
        width={720}
      >
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRule(null);
              ruleForm.resetFields();
              ruleForm.setFieldsValue({ actions: ['read'] });
              setRuleFormOpen(true);
            }}
          >
            {t('permissions.addRule')}
          </Button>
        </div>
        <Table
          rowKey="id"
          size="small"
          columns={ruleColumns}
          dataSource={currentRulesTemplate?.rules ?? []}
          pagination={false}
        />
      </Modal>

      <Modal
        title={editingRule ? t('permissions.editRuleInTemplate') : t('permissions.addRule')}
        open={ruleFormOpen}
        onCancel={() => {
          setRuleFormOpen(false);
          setEditingRule(null);
          ruleForm.resetFields();
        }}
        onOk={() =>
          void ruleForm.validateFields().then((values) => {
            if (editingRule && rulesTemplate) {
              updateRuleMutation.mutate({
                accountId,
                templateId: rulesTemplate.id,
                ruleId: editingRule.id,
                values,
              });
            } else if (rulesTemplate) {
              createRuleMutation.mutate({ accountId, templateId: rulesTemplate.id, values });
            }
          })
        }
        confirmLoading={createRuleMutation.isPending || updateRuleMutation.isPending}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        width={760}
      >
        <Form form={ruleForm} layout="vertical" initialValues={{ actions: ['read'] }}>
          <Form.Item name="bucket_name" label={t('permissions.bucket')}>
            <Select allowClear options={bucketOptions} placeholder={t('permissions.allBucketsShort')} />
          </Form.Item>
          <Form.Item name="prefix" label={t('permissions.prefix')}>
            <Input placeholder={t('permissions.prefixExample')} />
          </Form.Item>
          <Form.Item name="actions" label={t('permissions.templateActions')} rules={[actionRequiredRule]}>
            <PermissionActionsPicker />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
