import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  acknowledgeAlertEvent,
  createAlertRule,
  createNotificationChannel,
  deleteAlertRule,
  deleteNotificationChannel,
  evaluateAlerts,
  getChannelTypeOptions,
  getRuleTypeOptions,
  listAlertEvents,
  listAlertRules,
  listNotificationChannels,
  resolveAlertEvent,
  updateAlertRule,
  updateNotificationChannel,
  type AlertEvent,
  type AlertRule,
  type NotificationChannel,
} from '../api/alerts';
import { ApiError } from '../api/client';
import { useT } from '../i18n';
import { useAuthStore } from '../stores/authStore';
import { formatDateTime } from '../utils/format';
import { isPlatformAdmin } from '../utils/roles';

const { Title, Text } = Typography;

function severityColor(severity: string): string {
  if (severity === 'critical') return 'error';
  if (severity === 'warning') return 'warning';
  return 'default';
}

function statusColor(status: string): string {
  if (status === 'firing') return 'error';
  if (status === 'acknowledged') return 'processing';
  if (status === 'resolved') return 'success';
  return 'default';
}

export default function AlertsPage() {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const user = useAuthStore((s) => s.user);
  const isAdmin = isPlatformAdmin(user?.roles ?? []);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('events');
  const [eventStatus, setEventStatus] = useState<string | undefined>();
  const [eventPage, setEventPage] = useState(1);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);
  const [ruleForm] = Form.useForm();
  const [channelForm] = Form.useForm();

  const ruleTypeOptions = getRuleTypeOptions();
  const channelTypeOptions = getChannelTypeOptions();

  const rulesQuery = useQuery({
    queryKey: ['alert-rules'],
    queryFn: () => listAlertRules(token),
  });

  const channelsQuery = useQuery({
    queryKey: ['alert-channels'],
    queryFn: () => listNotificationChannels(token),
  });

  const eventsQuery = useQuery({
    queryKey: ['alert-events', eventStatus, eventPage],
    queryFn: () =>
      listAlertEvents(token, {
        status: eventStatus,
        page: eventPage,
        page_size: 20,
      }),
  });

  const evaluateMutation = useMutation({
    mutationFn: () => evaluateAlerts(token),
    onSuccess: (result) => {
      message.success(
        t('alerts.evaluateResult', {
          rules: result.evaluated_rules,
          newEvents: result.new_events,
          resolvedEvents: result.resolved_events,
        }),
      );
      void queryClient.invalidateQueries({ queryKey: ['alert-events'] });
    },
    onError: (err: Error) => message.error(err instanceof ApiError ? err.message : t('common.evaluateFailed')),
  });

  const saveRuleMutation = useMutation({
    mutationFn: ({
      ruleId,
      values,
    }: {
      ruleId?: number;
      values: Record<string, unknown>;
    }) => {
      const payload = {
        name: values.name as string,
        rule_type: values.rule_type as string,
        enabled: values.enabled as boolean,
        severity: values.severity as string,
        notify_tenant: values.notify_tenant as boolean,
        description: (values.description as string) || null,
        channel_ids: (values.channel_ids as number[]) ?? [],
        config: {
          threshold_percent: values.threshold_percent,
          error_rate: values.error_rate,
          failure_rate: values.failure_rate,
          count_threshold: values.count_threshold,
          window_minutes: values.window_minutes,
        },
      };
      if (ruleId != null) {
        return updateAlertRule(token, ruleId, payload);
      }
      return createAlertRule(token, payload);
    },
    onSuccess: (_result, { ruleId }) => {
      message.success(ruleId != null ? t('alerts.ruleUpdated') : t('alerts.ruleCreated'));
      setRuleModalOpen(false);
      setEditingRule(null);
      ruleForm.resetFields();
      void queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
    onError: (err: Error) => message.error(err instanceof ApiError ? err.message : t('common.saveFailed')),
  });

  const saveChannelMutation = useMutation({
    mutationFn: ({
      channelId,
      values,
    }: {
      channelId?: number;
      values: Record<string, unknown>;
    }) => {
      const channelType = values.channel_type as string;
      const config: Record<string, unknown> = {};
      if (channelType === 'email') {
        config.recipients = String(values.recipients ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      } else if (channelType === 'webhook' || channelType === 'alertmanager') {
        config.url = values.url;
      } else {
        config.webhook_url = values.webhook_url;
      }

      const payload = {
        name: values.name as string,
        channel_type: channelType,
        enabled: values.enabled as boolean,
        config,
      };
      if (channelId != null) {
        return updateNotificationChannel(token, channelId, payload);
      }
      return createNotificationChannel(token, payload);
    },
    onSuccess: (_result, { channelId }) => {
      message.success(channelId != null ? t('alerts.channelUpdated') : t('alerts.channelCreated'));
      setChannelModalOpen(false);
      setEditingChannel(null);
      channelForm.resetFields();
      void queryClient.invalidateQueries({ queryKey: ['alert-channels'] });
    },
    onError: (err: Error) => message.error(err instanceof ApiError ? err.message : t('common.saveFailed')),
  });

  const openCreateRule = () => {
    setEditingRule(null);
    ruleForm.resetFields();
    ruleForm.setFieldsValue({
      enabled: true,
      severity: 'warning',
      notify_tenant: false,
      channel_ids: [],
      window_minutes: 60,
    });
    setRuleModalOpen(true);
  };

  const openEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    ruleForm.setFieldsValue({
      name: rule.name,
      rule_type: rule.rule_type,
      enabled: rule.enabled,
      severity: rule.severity,
      notify_tenant: rule.notify_tenant,
      description: rule.description,
      channel_ids: rule.channel_ids,
      threshold_percent: rule.config.threshold_percent,
      error_rate: rule.config.error_rate,
      failure_rate: rule.config.failure_rate,
      count_threshold: rule.config.count_threshold,
      window_minutes: rule.config.window_minutes ?? 60,
    });
    setRuleModalOpen(true);
  };

  const openCreateChannel = () => {
    setEditingChannel(null);
    channelForm.resetFields();
    channelForm.setFieldsValue({ enabled: true, channel_type: 'webhook' });
    setChannelModalOpen(true);
  };

  const openEditChannel = (channel: NotificationChannel) => {
    setEditingChannel(channel);
    channelForm.setFieldsValue({
      name: channel.name,
      channel_type: channel.channel_type,
      enabled: channel.enabled,
      url: channel.config.url,
      webhook_url: channel.config.webhook_url,
      recipients: Array.isArray(channel.config.recipients)
        ? (channel.config.recipients as string[]).join(', ')
        : '',
    });
    setChannelModalOpen(true);
  };

  const ruleTypeLabel = (ruleType: string) =>
    ruleTypeOptions.find((item) => item.value === ruleType)?.label ?? ruleType;

  const channelTypeLabel = (channelType: string) =>
    channelTypeOptions.find((item) => item.value === channelType)?.label ?? channelType;

  const eventColumns: ColumnsType<AlertEvent> = [
    { title: t('common.time'), dataIndex: 'fired_at', width: 180, render: formatDateTime },
    {
      title: t('alerts.severity'),
      dataIndex: 'severity',
      width: 90,
      render: (value: string) => <Tag color={severityColor(value)}>{value}</Tag>,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      width: 110,
      render: (value: string) => <Tag color={statusColor(value)}>{value}</Tag>,
    },
    { title: t('dashboard.alertTitle'), dataIndex: 'title', ellipsis: true },
    { title: t('common.bucket'), dataIndex: 'bucket_name', width: 140, render: (v) => v ?? t('common.emDash') },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          {record.status !== 'resolved' ? (
            <Button
              size="small"
              onClick={async () => {
                try {
                  await acknowledgeAlertEvent(token, record.id);
                  message.success(t('alerts.acknowledged'));
                  void queryClient.invalidateQueries({ queryKey: ['alert-events'] });
                } catch (err) {
                  message.error(err instanceof ApiError ? err.message : t('common.operationFailed'));
                }
              }}
            >
              {t('alerts.acknowledge')}
            </Button>
          ) : null}
          {record.status !== 'resolved' ? (
            <Button
              size="small"
              type="primary"
              onClick={async () => {
                try {
                  await resolveAlertEvent(token, record.id);
                  message.success(t('alerts.resolved'));
                  void queryClient.invalidateQueries({ queryKey: ['alert-events'] });
                } catch (err) {
                  message.error(err instanceof ApiError ? err.message : t('common.operationFailed'));
                }
              }}
            >
              {t('alerts.resolve')}
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const ruleColumns: ColumnsType<AlertRule> = [
    { title: t('alerts.ruleName'), dataIndex: 'name' },
    {
      title: t('alerts.ruleType'),
      dataIndex: 'rule_type',
      render: (value: string) => ruleTypeLabel(value),
    },
    {
      title: t('alerts.severity'),
      dataIndex: 'severity',
      render: (value: string) => <Tag color={severityColor(value)}>{value}</Tag>,
    },
    {
      title: t('alerts.enabled'),
      dataIndex: 'enabled',
      render: (value: boolean) => (value ? t('common.yes') : t('common.no')),
    },
    {
      title: t('alerts.notifyTenant'),
      dataIndex: 'notify_tenant',
      render: (value: boolean) => (value ? t('common.yes') : t('common.no')),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, record) =>
        isAdmin ? (
          <Space>
            <Button size="small" onClick={() => openEditRule(record)}>
              {t('common.edit')}
            </Button>
            <Popconfirm
              title={t('alerts.deleteRuleConfirm')}
              onConfirm={async () => {
                try {
                  await deleteAlertRule(token, record.id);
                  message.success(t('alerts.deleted'));
                  void queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
                } catch (err) {
                  message.error(err instanceof ApiError ? err.message : t('common.deleteFailed'));
                }
              }}
            >
              <Button size="small" danger>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          </Space>
        ) : (
          t('common.emDash')
        ),
    },
  ];

  const channelColumns: ColumnsType<NotificationChannel> = [
    { title: t('alerts.ruleName'), dataIndex: 'name' },
    {
      title: t('alerts.channelType'),
      dataIndex: 'channel_type',
      render: (value: string) => channelTypeLabel(value),
    },
    {
      title: t('alerts.enabled'),
      dataIndex: 'enabled',
      render: (value: boolean) => (value ? t('common.yes') : t('common.no')),
    },
    {
      title: t('alerts.configSummary'),
      key: 'config',
      render: (_, record) => {
        if (record.channel_type === 'email') {
          const recipients = record.config.recipients;
          return Array.isArray(recipients) ? (recipients as string[]).join(', ') : t('common.emDash');
        }
        return String(record.config.url ?? record.config.webhook_url ?? t('common.emDash'));
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, record) =>
        isAdmin ? (
          <Space>
            <Button size="small" onClick={() => openEditChannel(record)}>
              {t('common.edit')}
            </Button>
            <Popconfirm
              title={t('alerts.deleteChannelConfirm')}
              onConfirm={async () => {
                try {
                  await deleteNotificationChannel(token, record.id);
                  message.success(t('alerts.deleted'));
                  void queryClient.invalidateQueries({ queryKey: ['alert-channels'] });
                } catch (err) {
                  message.error(err instanceof ApiError ? err.message : t('common.deleteFailed'));
                }
              }}
            >
              <Button size="small" danger>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          </Space>
        ) : (
          t('common.emDash')
        ),
    },
  ];

  const channelOptions =
    channelsQuery.data?.items.map((item) => ({ value: item.id, label: item.name })) ?? [];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t('alerts.title')}
          </Title>
          <Text type="secondary">{t('alerts.subtitle')}</Text>
        </div>
        <Space>
          {isAdmin ? (
            <Button loading={evaluateMutation.isPending} onClick={() => evaluateMutation.mutate()}>
              {t('alerts.evaluateNow')}
            </Button>
          ) : null}
        </Space>
      </Space>

      {!isAdmin ? <Alert type="info" showIcon message={t('alerts.operatorReadOnlyAlert')} /> : null}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'events',
            label: t('alerts.tabEvents'),
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select
                  allowClear
                  placeholder={t('alerts.filterByStatus')}
                  style={{ width: 200 }}
                  value={eventStatus}
                  onChange={(value) => {
                    setEventStatus(value);
                    setEventPage(1);
                  }}
                  options={[
                    { value: 'firing', label: 'firing' },
                    { value: 'acknowledged', label: 'acknowledged' },
                    { value: 'resolved', label: 'resolved' },
                  ]}
                />
                <Table
                  rowKey="id"
                  loading={eventsQuery.isLoading}
                  columns={eventColumns}
                  dataSource={eventsQuery.data?.items ?? []}
                  pagination={{
                    current: eventPage,
                    pageSize: 20,
                    total: eventsQuery.data?.total ?? 0,
                    onChange: setEventPage,
                  }}
                />
              </Space>
            ),
          },
          {
            key: 'rules',
            label: t('alerts.tabRules'),
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                {isAdmin ? (
                  <Button type="primary" onClick={openCreateRule}>
                    {t('alerts.createRule')}
                  </Button>
                ) : null}
                <Table
                  rowKey="id"
                  loading={rulesQuery.isLoading}
                  columns={ruleColumns}
                  dataSource={rulesQuery.data?.items ?? []}
                  pagination={false}
                />
              </Space>
            ),
          },
          {
            key: 'channels',
            label: t('alerts.tabChannels'),
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                {isAdmin ? (
                  <Button type="primary" onClick={openCreateChannel}>
                    {t('alerts.createChannel')}
                  </Button>
                ) : null}
                <Table
                  rowKey="id"
                  loading={channelsQuery.isLoading}
                  columns={channelColumns}
                  dataSource={channelsQuery.data?.items ?? []}
                  pagination={false}
                />
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editingRule ? t('alerts.editRule') : t('alerts.createRuleModal')}
        open={ruleModalOpen}
        onCancel={() => {
          setRuleModalOpen(false);
          setEditingRule(null);
        }}
        onOk={() => ruleForm.submit()}
        confirmLoading={saveRuleMutation.isPending}
        destroyOnClose
      >
        <Form
          form={ruleForm}
          layout="vertical"
          onFinish={(values) => saveRuleMutation.mutate({ ruleId: editingRule?.id, values })}
        >
          <Form.Item name="name" label={t('alerts.ruleName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="rule_type" label={t('alerts.ruleType')} rules={[{ required: true }]}>
            <Select options={ruleTypeOptions} disabled={Boolean(editingRule)} />
          </Form.Item>
          <Form.Item name="severity" label={t('alerts.severity')} rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'warning', label: 'warning' },
                { value: 'critical', label: 'critical' },
              ]}
            />
          </Form.Item>
          <Form.Item name="enabled" label={t('alerts.enabled')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="notify_tenant" label={t('alerts.notifyTenantReadOnly')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="channel_ids" label={t('alerts.notificationChannels')}>
            <Select mode="multiple" options={channelOptions} allowClear />
          </Form.Item>
          <Form.Item name="threshold_percent" label={t('alerts.thresholdPercent')}>
            <InputNumber min={0} max={2} step={0.05} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="error_rate" label={t('alerts.errorRate')}>
            <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="failure_rate" label={t('alerts.failureRate')}>
            <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="count_threshold" label={t('alerts.countThreshold')}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="window_minutes" label={t('alerts.windowMinutes')}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label={t('common.description')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingChannel ? t('alerts.editChannel') : t('alerts.createChannelModal')}
        open={channelModalOpen}
        onCancel={() => {
          setChannelModalOpen(false);
          setEditingChannel(null);
        }}
        onOk={() => channelForm.submit()}
        confirmLoading={saveChannelMutation.isPending}
        destroyOnClose
      >
        <Form
          form={channelForm}
          layout="vertical"
          onFinish={(values) =>
            saveChannelMutation.mutate({ channelId: editingChannel?.id, values })
          }
        >
          <Form.Item name="name" label={t('alerts.ruleName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="channel_type" label={t('alerts.channelType')} rules={[{ required: true }]}>
            <Select options={channelTypeOptions} disabled={Boolean(editingChannel)} />
          </Form.Item>
          <Form.Item name="enabled" label={t('alerts.enabled')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.channel_type !== cur.channel_type}>
            {({ getFieldValue }) => {
              const channelType = getFieldValue('channel_type');
              if (channelType === 'email') {
                return (
                  <Form.Item name="recipients" label={t('alerts.recipients')} rules={[{ required: true }]}>
                    <Input placeholder="ops@example.com, oncall@example.com" />
                  </Form.Item>
                );
              }
              if (channelType === 'webhook' || channelType === 'alertmanager') {
                return (
                  <Form.Item name="url" label={t('alerts.url')} rules={[{ required: true }]}>
                    <Input placeholder="https://..." />
                  </Form.Item>
                );
              }
              if (channelType === 'wecom' || channelType === 'feishu') {
                return (
                  <Form.Item name="webhook_url" label={t('alerts.webhookUrl')} rules={[{ required: true }]}>
                    <Input placeholder="https://..." />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
