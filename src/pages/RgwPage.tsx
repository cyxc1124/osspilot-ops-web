import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  InputNumber,
  Popconfirm,
  Row,
  Segmented,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { listAlertEvents } from '../api/alerts';
import { ApiError } from '../api/client';
import {
  getClusterHealth,
  getClusterInfo,
  getRgwInstances,
  getRgwStats,
  restartRgw,
  rollingRestartRgw,
  testS3Connection,
} from '../api/ceph';
import { getPerformanceStats, getTrafficStats, type StatPeriod } from '../api/stats';
import { useT } from '../i18n';
import { useAuthStore } from '../stores/authStore';
import { formatBytes, formatDateTime, formatPercent } from '../utils/format';
import { isPlatformAdmin } from '../utils/roles';

const { Title, Text } = Typography;
const REFRESH_MS = 30_000;

function instanceStatusColor(status: string): string {
  if (status === 'running') return 'success';
  if (status === 'stopped') return 'error';
  return 'default';
}

function healthColor(status: string | null | undefined): string {
  if (status === 'HEALTH_OK') return 'success';
  if (status === 'HEALTH_WARN') return 'warning';
  if (status === 'HEALTH_ERR') return 'error';
  return 'default';
}

function alertSeverityColor(severity: string): string {
  if (severity === 'critical') return 'error';
  if (severity === 'warning') return 'warning';
  return 'default';
}

export default function RgwPage() {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const user = useAuthStore((s) => s.user);
  const isAdmin = isPlatformAdmin(user?.roles ?? []);
  const queryClient = useQueryClient();
  const [trafficPeriod, setTrafficPeriod] = useState<StatPeriod>('24h');
  const [rollingWaitSeconds, setRollingWaitSeconds] = useState(30);
  const [s3TestMessage, setS3TestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const queryOptions = { refetchInterval: REFRESH_MS };

  const refreshRgwQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['rgw-instances'] }),
      queryClient.invalidateQueries({ queryKey: ['rgw-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['cluster-health'] }),
      queryClient.invalidateQueries({ queryKey: ['cluster-info'] }),
      queryClient.invalidateQueries({ queryKey: ['rgw-performance'] }),
    ]);
  };

  const handleRestartError = (error: unknown) => {
    const detail = error instanceof ApiError ? error.message : t('common.requestFailed');
    message.error(t('rgw.restartFailed', { error: detail }));
  };

  const instancesQuery = useQuery({
    queryKey: ['rgw-instances'],
    queryFn: () => getRgwInstances(token),
    ...queryOptions,
  });

  const statsQuery = useQuery({
    queryKey: ['rgw-stats'],
    queryFn: () => getRgwStats(token),
    ...queryOptions,
  });

  const healthQuery = useQuery({
    queryKey: ['cluster-health'],
    queryFn: () => getClusterHealth(token),
    ...queryOptions,
  });

  const clusterInfoQuery = useQuery({
    queryKey: ['cluster-info'],
    queryFn: () => getClusterInfo(token),
    ...queryOptions,
  });

  const performanceQuery = useQuery({
    queryKey: ['rgw-performance', trafficPeriod],
    queryFn: () => getPerformanceStats(token, trafficPeriod),
    ...queryOptions,
  });

  const trafficQuery = useQuery({
    queryKey: ['rgw-traffic', trafficPeriod],
    queryFn: () => getTrafficStats(token, trafficPeriod),
    ...queryOptions,
  });

  const rgwAlertsQuery = useQuery({
    queryKey: ['rgw-alerts'],
    queryFn: async () => {
      const result = await listAlertEvents(token, { status: 'firing', page_size: 20 });
      return {
        ...result,
        items: result.items.filter((item) => item.rule_type === 'rgw_5xx_rate'),
      };
    },
    ...queryOptions,
  });

  const restartAllMutation = useMutation({
    mutationFn: () => restartRgw(token, {}),
    onSuccess: async (data) => {
      message.success(t('rgw.restartSuccess', { message: data.message }));
      await refreshRgwQueries();
    },
    onError: handleRestartError,
  });

  const rollingRestartMutation = useMutation({
    mutationFn: () => rollingRestartRgw(token, { wait_seconds: rollingWaitSeconds }),
    onSuccess: async (data) => {
      message.success(t('rgw.restartSuccess', { message: data.message }));
      await refreshRgwQueries();
    },
    onError: handleRestartError,
  });

  const restartInstanceMutation = useMutation({
    mutationFn: (instanceId: string) => restartRgw(token, { instance_id: instanceId }),
    onSuccess: async (data) => {
      message.success(t('rgw.restartSuccess', { message: data.message }));
      await refreshRgwQueries();
    },
    onError: handleRestartError,
  });

  const s3TestMutation = useMutation({
    mutationFn: () => testS3Connection(token),
    onSuccess: (data) => {
      if (data.ok) {
        setS3TestMessage({
          type: 'success',
          text: t('rgw.s3Connected', {
            endpoint: data.endpoint ?? t('common.emDash'),
            count: data.bucket_count ?? 0,
          }),
        });
        return;
      }
      setS3TestMessage({
        type: 'error',
        text: t('rgw.s3ConnectFailed', { error: data.error ?? t('common.emDash') }),
      });
    },
    onError: () => {
      setS3TestMessage({
        type: 'error',
        text: t('rgw.s3ConnectFailed', { error: t('common.requestFailed') }),
      });
    },
  });

  const runningCount = performanceQuery.data?.running_instances ?? 0;
  const totalCount = performanceQuery.data?.total_instances ?? instancesQuery.data?.instances.length ?? 0;

  const trafficPeriodOptions = [
    { label: t('rgw.trafficPeriod24h'), value: '24h' as StatPeriod },
    { label: t('rgw.trafficPeriod7d'), value: '7d' as StatPeriod },
    { label: t('rgw.trafficPeriod30d'), value: '30d' as StatPeriod },
  ];

  const compareRows = [
    {
      key: 'requests',
      metric: t('rgw.compareRequests'),
      ceph: statsQuery.data?.request_count ?? t('common.emDash'),
      platform: performanceQuery.data?.audit_request_count ?? trafficQuery.data?.request_count ?? t('common.emDash'),
    },
    {
      key: 'errors',
      metric: t('rgw.compareErrors'),
      ceph: formatPercent(statsQuery.data?.error_rate),
      platform: performanceQuery.data?.audit_error_count ?? trafficQuery.data?.error_count ?? t('common.emDash'),
    },
    {
      key: 'latency',
      metric: t('rgw.compareLatency'),
      ceph: statsQuery.data?.p95_latency_ms != null ? `${statsQuery.data.p95_latency_ms} ms` : t('common.emDash'),
      platform: t('common.emDash'),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>
          {t('rgw.title')}
        </Title>
        <Text type="secondary">{t('rgw.autoRefreshHint')}</Text>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card loading={statsQuery.isLoading}>
            <Statistic title={t('rgw.totalRequests')} value={statsQuery.data?.request_count ?? t('common.emDash')} />
            <div style={{ marginTop: 8 }}>
              {t('rgw.errorRate')} {formatPercent(statsQuery.data?.error_rate)}
            </div>
            <div>
              {t('rgw.p95Latency')} {statsQuery.data?.p95_latency_ms ?? t('common.emDash')} ms
            </div>
            <div>
              {t('rgw.p99Latency')} {statsQuery.data?.p99_latency_ms ?? t('common.emDash')} ms
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={healthQuery.isLoading}>
            <Statistic
              title={t('rgw.clusterHealth')}
              value={healthQuery.data?.status ?? t('common.emDash')}
              valueStyle={{ fontSize: 20 }}
            />
            {healthQuery.data?.status ? (
              <Tag color={healthColor(healthQuery.data.status)} style={{ marginTop: 8 }}>
                {healthQuery.data.status}
              </Tag>
            ) : null}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={instancesQuery.isLoading || performanceQuery.isLoading}>
            <Statistic title={t('rgw.instanceCount')} value={totalCount} />
            <div style={{ marginTop: 8 }}>
              {t('rgw.runningInstances', { running: runningCount, total: totalCount })}
            </div>
            <div>
              {t('rgw.dataTime')} {formatDateTime(instancesQuery.data?.fetched_at)}
            </div>
          </Card>
        </Col>
      </Row>

      {statsQuery.data?.error ? (
        <Alert type="warning" message={t('rgw.statsError', { error: statsQuery.data.error })} showIcon />
      ) : null}
      {healthQuery.data?.error ? (
        <Alert type="warning" message={t('rgw.healthError', { error: healthQuery.data.error })} showIcon />
      ) : null}
      {instancesQuery.data?.error ? (
        <Alert type="warning" message={t('rgw.instancesError', { error: instancesQuery.data.error })} showIcon />
      ) : null}

      <Card title={t('rgw.operations')}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text type="secondary">{t('rgw.operationsHint')}</Text>
          {!isAdmin ? (
            <Alert type="info" message={t('rgw.operatorReadOnlyOps')} showIcon />
          ) : (
            <Space wrap>
              <Popconfirm
                title={t('rgw.restartAllConfirm')}
                onConfirm={() => restartAllMutation.mutate()}
                okText={t('common.confirm')}
                cancelText={t('common.cancel')}
              >
                <Button danger loading={restartAllMutation.isPending}>
                  {t('rgw.restartAll')}
                </Button>
              </Popconfirm>
              <Space>
                <span>{t('rgw.rollingWaitSeconds')}</span>
                <InputNumber
                  min={0}
                  max={300}
                  value={rollingWaitSeconds}
                  onChange={(value) => setRollingWaitSeconds(value ?? 30)}
                />
                <Popconfirm
                  title={t('rgw.rollingRestartConfirm')}
                  onConfirm={() => rollingRestartMutation.mutate()}
                  okText={t('common.confirm')}
                  cancelText={t('common.cancel')}
                >
                  <Button loading={rollingRestartMutation.isPending}>{t('rgw.rollingRestart')}</Button>
                </Popconfirm>
              </Space>
            </Space>
          )}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t('rgw.clusterInfo')} loading={clusterInfoQuery.isLoading}>
            {clusterInfoQuery.data?.error ? (
              <Alert type="warning" message={clusterInfoQuery.data.error} showIcon />
            ) : (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label={t('rgw.cephVersion')}>
                  {clusterInfoQuery.data?.ceph_version ?? t('common.emDash')}
                </Descriptions.Item>
                <Descriptions.Item label={t('rgw.clusterCapacity')}>
                  {clusterInfoQuery.data?.total_bytes != null
                    ? t('rgw.clusterUsed', {
                        used: formatBytes(clusterInfoQuery.data.used_bytes ?? 0),
                        total: formatBytes(clusterInfoQuery.data.total_bytes),
                      })
                    : t('common.emDash')}
                </Descriptions.Item>
                <Descriptions.Item label={t('rgw.availCapacity')}>
                  {clusterInfoQuery.data?.avail_bytes != null
                    ? formatBytes(clusterInfoQuery.data.avail_bytes)
                    : t('common.emDash')}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('rgw.s3Connection')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button loading={s3TestMutation.isPending} onClick={() => s3TestMutation.mutate()}>
                {t('rgw.testS3Connection')}
              </Button>
              {s3TestMessage ? (
                <Alert type={s3TestMessage.type} message={s3TestMessage.text} showIcon />
              ) : (
                <Text type="secondary">{t('rgw.s3NotConfigured')}</Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={t('rgw.platformTraffic')}
        extra={
          <Segmented
            options={trafficPeriodOptions}
            value={trafficPeriod}
            onChange={(value) => setTrafficPeriod(value as StatPeriod)}
          />
        }
        loading={trafficQuery.isLoading}
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} md={8} lg={4}>
            <Statistic title={t('rgw.uploadBytes')} value={formatBytes(trafficQuery.data?.upload_bytes)} />
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Statistic title={t('rgw.downloadBytes')} value={formatBytes(trafficQuery.data?.download_bytes)} />
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Statistic title={t('rgw.auditRequests')} value={trafficQuery.data?.request_count ?? t('common.emDash')} />
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Statistic title={t('rgw.auditErrors')} value={trafficQuery.data?.error_count ?? t('common.emDash')} />
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Statistic title={t('rgw.activeUsers')} value={trafficQuery.data?.active_users ?? t('common.emDash')} />
          </Col>
        </Row>
      </Card>

      <Card title={t('rgw.metricsCompare')} loading={performanceQuery.isLoading || statsQuery.isLoading}>
        <Table
          rowKey="key"
          pagination={false}
          size="small"
          dataSource={compareRows}
          columns={[
            { title: t('rgw.metricName'), dataIndex: 'metric' },
            { title: t('rgw.cephSource'), dataIndex: 'ceph' },
            { title: t('rgw.platformSource'), dataIndex: 'platform' },
          ]}
        />
      </Card>

      <Card
        title={t('rgw.rgwAlerts')}
        extra={
          <Link to="/alerts">{t('rgw.viewAllAlerts')}</Link>
        }
        loading={rgwAlertsQuery.isLoading}
      >
        {rgwAlertsQuery.data?.items.length ? (
          <Table
            rowKey="id"
            pagination={false}
            size="small"
            dataSource={rgwAlertsQuery.data.items}
            columns={[
              {
                title: t('dashboard.severity'),
                dataIndex: 'severity',
                render: (severity: string) => <Tag color={alertSeverityColor(severity)}>{severity}</Tag>,
              },
              { title: t('dashboard.alertTitle'), dataIndex: 'title' },
              { title: t('rgw.alertMessage'), dataIndex: 'message' },
              {
                title: t('common.time'),
                dataIndex: 'fired_at',
                render: (value: string) => formatDateTime(value),
              },
            ]}
          />
        ) : (
          <Empty description={t('rgw.noRgwAlerts')} />
        )}
      </Card>

      {healthQuery.data?.summary.length ? (
        <Card title={t('rgw.healthSummary')} size="small">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {healthQuery.data.summary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card title={t('rgw.instanceStatus')} loading={instancesQuery.isLoading}>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={instancesQuery.data?.instances ?? []}
          columns={[
            { title: t('common.id'), dataIndex: 'id' },
            { title: t('common.host'), dataIndex: 'hostname' },
            { title: t('common.port'), dataIndex: 'port', render: (v) => v ?? t('common.emDash') },
            { title: t('rgw.zone'), dataIndex: 'zone', render: (v) => v ?? t('common.emDash') },
            {
              title: t('common.status'),
              dataIndex: 'status',
              render: (status: string) => (
                <Tag color={instanceStatusColor(status)}>{status}</Tag>
              ),
            },
            ...(isAdmin
              ? [
                  {
                    title: t('common.actions'),
                    key: 'actions',
                    render: (_: unknown, record: { id: string }) => (
                      <Popconfirm
                        title={t('rgw.restartInstanceConfirm', { id: record.id })}
                        onConfirm={() => restartInstanceMutation.mutate(record.id)}
                        okText={t('common.confirm')}
                        cancelText={t('common.cancel')}
                      >
                        <Button
                          size="small"
                          loading={
                            restartInstanceMutation.isPending
                            && restartInstanceMutation.variables === record.id
                          }
                        >
                          {t('rgw.restartInstance')}
                        </Button>
                      </Popconfirm>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>

      <Card title={t('rgw.statsDetail')} loading={statsQuery.isLoading}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('rgw.dataAvailable')}>
            {statsQuery.data?.available ? t('common.yes') : t('common.no')}
          </Descriptions.Item>
          <Descriptions.Item label={t('rgw.requestCount')}>
            {statsQuery.data?.request_count ?? t('common.emDash')}
          </Descriptions.Item>
          <Descriptions.Item label={t('rgw.errorRate')}>
            {formatPercent(statsQuery.data?.error_rate)}
          </Descriptions.Item>
          <Descriptions.Item label={t('rgw.p95LatencyMs')}>
            {statsQuery.data?.p95_latency_ms ?? t('common.emDash')}
          </Descriptions.Item>
          <Descriptions.Item label={t('rgw.p99LatencyMs')}>
            {statsQuery.data?.p99_latency_ms ?? t('common.emDash')}
          </Descriptions.Item>
          <Descriptions.Item label={t('rgw.collectedAt')}>
            {formatDateTime(statsQuery.data?.fetched_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}
