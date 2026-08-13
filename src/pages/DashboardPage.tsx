import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Alert,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { getClusterHealth, getRgwInstances, getRgwStats } from '../api/ceph';
import { listRecentAlertEvents } from '../api/alerts';
import { listAuditLogs } from '../api/audit';
import {
  getBucketRanking,
  getDailyTraffic,
  getPerformanceStats,
  getPlatformStatsOverview,
  getPrefixRanking,
  getStorageClassUsage,
  getTenantCapacityRanking,
  getTrafficStats,
  getUserBehaviorRanking,
} from '../api/stats';
import { listTenantUsers } from '../api/tenantUsers';
import { ApiError } from '../api/client';
import { useT } from '../i18n';
import { useAuthStore } from '../stores/authStore';
import { formatBytes, formatDateTime, formatPercent } from '../utils/format';
import { isPlatformAdmin } from '../utils/roles';
import styles from './DashboardPage.module.css';

const { Title, Text } = Typography;

function healthColor(status: string | null | undefined): string {
  if (status === 'HEALTH_OK') return 'success';
  if (status === 'HEALTH_WARN') return 'warning';
  if (status === 'HEALTH_ERR') return 'error';
  return 'default';
}

function instanceStatusColor(status: string): string {
  if (status === 'running') return 'success';
  if (status === 'stopped') return 'error';
  return 'default';
}

export default function DashboardPage() {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const user = useAuthStore((s) => s.user);
  const isAdmin = isPlatformAdmin(user?.roles ?? []);

  const accountsQuery = useQuery({
    queryKey: ['tenant-users'],
    queryFn: () => listTenantUsers(token),
    enabled: isAdmin,
    retry: false,
  });

  const platformStatsQuery = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => getPlatformStatsOverview(token),
  });

  const tenantRankingQuery = useQuery({
    queryKey: ['tenant-capacity-ranking'],
    queryFn: () => getTenantCapacityRanking(token, 10),
  });

  const storageClassQuery = useQuery({
    queryKey: ['storage-class-usage'],
    queryFn: () => getStorageClassUsage(token),
  });

  const rgwInstancesQuery = useQuery({
    queryKey: ['rgw-instances'],
    queryFn: () => getRgwInstances(token),
  });

  const rgwStatsQuery = useQuery({
    queryKey: ['rgw-stats'],
    queryFn: () => getRgwStats(token),
  });

  const clusterHealthQuery = useQuery({
    queryKey: ['cluster-health'],
    queryFn: () => getClusterHealth(token),
  });

  const recentAuditQuery = useQuery({
    queryKey: ['audit-recent'],
    queryFn: () => listAuditLogs(token, { page: 1, page_size: 5 }),
  });

  const recentAlertsQuery = useQuery({
    queryKey: ['alerts-recent'],
    queryFn: () => listRecentAlertEvents(token, 5),
  });

  const trafficQuery = useQuery({
    queryKey: ['traffic-stats'],
    queryFn: () => getTrafficStats(token, '24h'),
  });

  const dailyTrafficQuery = useQuery({
    queryKey: ['daily-traffic'],
    queryFn: () => getDailyTraffic(token, 14),
  });

  const performanceQuery = useQuery({
    queryKey: ['performance-stats'],
    queryFn: () => getPerformanceStats(token, '24h'),
  });

  const userBehaviorQuery = useQuery({
    queryKey: ['user-behavior'],
    queryFn: () => getUserBehaviorRanking(token, '7d', 'access', 8),
  });

  const bucketRankingQuery = useQuery({
    queryKey: ['bucket-ranking'],
    queryFn: () => getBucketRanking(token, '7d', 8),
  });

  const prefixRankingQuery = useQuery({
    queryKey: ['prefix-ranking'],
    queryFn: () => getPrefixRanking(token, '7d', 8),
  });

  const activeAccounts = accountsQuery.data?.items.filter((item) => item.status === 'active').length ?? null;

  const platformStats = platformStatsQuery.data;
  const platformUsagePercent =
    platformStats?.total_quota_bytes && platformStats.total_quota_bytes > 0
      ? Math.round((platformStats.total_used_bytes / platformStats.total_quota_bytes) * 100)
      : null;

  const maxStorageClassBytes = Math.max(
    ...(storageClassQuery.data?.items.map((item) => item.used_bytes) ?? [1]),
    1,
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Title level={4} className={styles.title}>
          {t('dashboard.title')}
        </Title>
        {platformStats?.collected_at ? (
          <Text type="secondary" className={styles.subtitle}>
            {t('dashboard.statsUpdated', { time: formatDateTime(platformStats.collected_at) })}
          </Text>
        ) : null}
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={platformStatsQuery.isLoading} bordered={false} className={styles.statCard}>
            <Statistic title={t('dashboard.totalUsedCapacity')} value={formatBytes(platformStats?.total_used_bytes)} />
            {platformStats?.total_quota_bytes != null ? (
              <Text type="secondary">
                {t('dashboard.totalQuota', { size: formatBytes(platformStats.total_quota_bytes) })}
              </Text>
            ) : null}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={platformStatsQuery.isLoading} bordered={false} className={styles.statCard}>
            <Statistic title={t('dashboard.totalObjects')} value={platformStats?.total_object_count ?? t('common.emDash')} />
            <Text type="secondary">
              {t('dashboard.trashSize', { size: formatBytes(platformStats?.total_trash_bytes) })}
            </Text>
          </Card>
        </Col>
        {isAdmin ? (
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} className={styles.statCard}>
              <Statistic
                title={t('dashboard.accountCount')}
                value={accountsQuery.data?.total ?? platformStats?.tenant_count ?? t('common.emDash')}
                loading={accountsQuery.isLoading}
              />
              <Text type="secondary">
                {t('dashboard.activeAccounts', { count: activeAccounts ?? t('common.emDash') })}
              </Text>
            </Card>
          </Col>
        ) : null}
        <Col xs={24} sm={12} lg={6}>
          <Card loading={rgwStatsQuery.isLoading} bordered={false} className={styles.statCard}>
            <Statistic title={t('dashboard.rgwRequests')} value={rgwStatsQuery.data?.request_count ?? t('common.emDash')} />
            <Text type="secondary">
              {t('rgw.errorRate')} {formatPercent(rgwStatsQuery.data?.error_rate)}
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.platformUsage')} loading={platformStatsQuery.isLoading} bordered={false} className={styles.sectionCard}>
            {platformUsagePercent != null ? (
              <Progress
                percent={platformUsagePercent}
                status={
                  platformUsagePercent >= 90
                    ? 'exception'
                    : platformUsagePercent >= 80
                      ? 'active'
                      : 'normal'
                }
              />
            ) : (
              <Text type="secondary">{t('dashboard.noPlatformQuota')}</Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.storageClassDistribution')} loading={storageClassQuery.isLoading} bordered={false} className={styles.sectionCard}>
            {storageClassQuery.data?.items.length ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {storageClassQuery.data.items.map((item) => (
                  <div key={item.storage_class}>
                    <Text>
                      {item.storage_class} — {formatBytes(item.used_bytes)}
                    </Text>
                    <Progress
                      percent={Math.round((item.used_bytes / maxStorageClassBytes) * 100)}
                      showInfo={false}
                      size="small"
                    />
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description={t('dashboard.noStorageClassStats')} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={trafficQuery.isLoading} bordered={false} className={styles.statCard}>
            <Statistic title={t('dashboard.uploadTraffic24h')} value={formatBytes(trafficQuery.data?.upload_bytes)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={trafficQuery.isLoading} bordered={false} className={styles.statCard}>
            <Statistic title={t('dashboard.downloadTraffic24h')} value={formatBytes(trafficQuery.data?.download_bytes)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={trafficQuery.isLoading} bordered={false} className={styles.statCard}>
            <Statistic title={t('dashboard.requestCount24h')} value={trafficQuery.data?.request_count ?? t('common.emDash')} />
            <Text type="secondary">
              GET {trafficQuery.data?.get_count ?? t('common.emDash')} / PUT {trafficQuery.data?.put_count ?? t('common.emDash')} / DEL{' '}
              {trafficQuery.data?.delete_count ?? t('common.emDash')}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={trafficQuery.isLoading} bordered={false} className={styles.statCard}>
            <Statistic title={t('dashboard.activeUsers24h')} value={trafficQuery.data?.active_users ?? t('common.emDash')} />
            <Text type="secondary">
              {t('dashboard.errorRequests')} {trafficQuery.data?.error_count ?? t('common.emDash')}
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.requestTrend14d')} loading={dailyTrafficQuery.isLoading} bordered={false} className={styles.sectionCard}>
            {(dailyTrafficQuery.data?.items.length ?? 0) === 0 ? (
              <Empty description={t('dashboard.noTrafficStats')} />
            ) : (
              <Table
                size="small"
                pagination={false}
                rowKey="stat_date"
                dataSource={dailyTrafficQuery.data?.items ?? []}
                columns={[
                  { title: t('common.date'), dataIndex: 'stat_date' },
                  { title: t('common.requests'), dataIndex: 'request_count' },
                  {
                    title: t('common.upload'),
                    dataIndex: 'upload_bytes',
                    render: (value: number) => formatBytes(value),
                  },
                  {
                    title: t('common.download'),
                    dataIndex: 'download_bytes',
                    render: (value: number) => formatBytes(value),
                  },
                  { title: t('common.errors'), dataIndex: 'error_count' },
                ]}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.performanceOverview')} loading={performanceQuery.isLoading} bordered={false} className={styles.sectionCard}>
            {performanceQuery.data?.error ? (
              <Alert type="warning" message={performanceQuery.data.error} showIcon />
            ) : null}
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={t('dashboard.rgwP95Latency')}
                  value={
                    performanceQuery.data?.p95_latency_ms != null
                      ? `${performanceQuery.data.p95_latency_ms} ms`
                      : t('common.emDash')
                  }
                />
              </Col>
              <Col span={12}>
                <Statistic title={t('dashboard.rgwErrorRate')} value={formatPercent(performanceQuery.data?.error_rate)} />
              </Col>
              <Col span={12} style={{ marginTop: 16 }}>
                <Statistic
                  title={t('dashboard.rgwInstances')}
                  value={`${performanceQuery.data?.running_instances ?? 0}/${performanceQuery.data?.total_instances ?? 0}`}
                  suffix={t('dashboard.runningSuffix')}
                />
              </Col>
              <Col span={12} style={{ marginTop: 16 }}>
                <Statistic
                  title={t('dashboard.auditErrorRequests')}
                  value={performanceQuery.data?.audit_error_count ?? t('common.emDash')}
                  suffix={
                    <Text type="secondary">/ {performanceQuery.data?.audit_request_count ?? t('common.emDash')}</Text>
                  }
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.tenantCapacityRanking')} loading={tenantRankingQuery.isLoading} bordered={false} className={styles.sectionCard}>
            <Table
              size="small"
              pagination={false}
              rowKey="tenant_id"
              dataSource={tenantRankingQuery.data?.items ?? []}
              locale={{ emptyText: t('dashboard.noTenantCapacityData') }}
              columns={[
                {
                  title: t('dashboard.tenant'),
                  dataIndex: 'name',
                  render: (name: string, row) => row.display_name || name,
                },
                {
                  title: t('dashboard.used'),
                  dataIndex: 'used_bytes',
                  render: (value: number) => formatBytes(value),
                },
                {
                  title: t('tenants.objectCount'),
                  dataIndex: 'object_count',
                },
                {
                  title: t('dashboard.usageRate'),
                  dataIndex: 'usage_percent',
                  render: (value: number | null) =>
                    value != null ? `${Math.round(value * 100)}%` : t('common.emDash'),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.rgwServiceStatus')} loading={rgwInstancesQuery.isLoading} bordered={false} className={styles.sectionCard}>
            {rgwInstancesQuery.data?.error ? (
              <Alert type="warning" message={rgwInstancesQuery.data.error} showIcon />
            ) : null}
            {rgwInstancesQuery.data?.instances.length ? (
              <Table
                size="small"
                pagination={false}
                rowKey="id"
                dataSource={rgwInstancesQuery.data.instances}
                columns={[
                  { title: t('common.host'), dataIndex: 'hostname' },
                  { title: t('rgw.zone'), dataIndex: 'zone', render: (v) => v ?? t('common.emDash') },
                  {
                    title: t('common.status'),
                    dataIndex: 'status',
                    render: (status: string) => (
                      <Tag color={instanceStatusColor(status)}>{status}</Tag>
                    ),
                  },
                ]}
              />
            ) : (
              <Empty description={t('dashboard.noRgwInstances')} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={clusterHealthQuery.isLoading} bordered={false} className={styles.statCard}>
            <Statistic
              title={t('dashboard.clusterHealth')}
              value={clusterHealthQuery.data?.status ?? t('common.emDash')}
              valueStyle={{ fontSize: 18 }}
            />
            {clusterHealthQuery.data?.status ? (
              <Tag color={healthColor(clusterHealthQuery.data.status)}>
                {clusterHealthQuery.data.status}
              </Tag>
            ) : null}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={platformStatsQuery.isLoading} bordered={false} className={styles.statCard}>
            <Statistic title={t('dashboard.activeBuckets')} value={platformStats?.bucket_count ?? t('common.emDash')} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={t('dashboard.recentAlerts')}
            extra={<Link to="/alerts">{t('common.viewAll')}</Link>}
            loading={recentAlertsQuery.isLoading}
            bordered={false}
            className={styles.sectionCard}
          >
            {(recentAlertsQuery.data?.items.length ?? 0) === 0 ? (
              <Empty description={t('dashboard.noActiveAlerts')} />
            ) : (
              <Table
                size="small"
                pagination={false}
                rowKey="id"
                dataSource={recentAlertsQuery.data?.items ?? []}
                columns={[
                  { title: t('common.time'), dataIndex: 'fired_at', render: formatDateTime, width: 160 },
                  {
                    title: t('dashboard.severity'),
                    dataIndex: 'severity',
                    width: 80,
                    render: (severity: string) => (
                      <Tag color={severity === 'critical' ? 'error' : 'warning'}>{severity}</Tag>
                    ),
                  },
                  { title: t('dashboard.alertTitle'), dataIndex: 'title', ellipsis: true },
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title={t('dashboard.activeUserRanking')} loading={userBehaviorQuery.isLoading} bordered={false} className={styles.sectionCard}>
            <Table
              size="small"
              pagination={false}
              rowKey={(row) => `${row.user_id}-${row.tenant_id}`}
              dataSource={userBehaviorQuery.data?.items ?? []}
              locale={{ emptyText: t('dashboard.noUserBehaviorData') }}
              columns={[
                { title: t('common.user'), dataIndex: 'username', render: (v) => v ?? t('common.emDash') },
                { title: t('common.access'), dataIndex: 'access_count' },
                { title: t('common.upload'), dataIndex: 'upload_count' },
                { title: t('common.download'), dataIndex: 'download_count' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={t('dashboard.hotBuckets')} loading={bucketRankingQuery.isLoading} bordered={false} className={styles.sectionCard}>
            <Table
              size="small"
              pagination={false}
              rowKey="bucket_id"
              dataSource={bucketRankingQuery.data?.items ?? []}
              locale={{ emptyText: t('dashboard.noBucketRequestData') }}
              columns={[
                { title: t('common.bucket'), dataIndex: 'bucket_name', ellipsis: true },
                { title: t('common.requests'), dataIndex: 'request_count' },
                {
                  title: t('common.traffic'),
                  render: (_: unknown, row) => formatBytes(row.upload_bytes + row.download_bytes),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={t('dashboard.hotPrefixes')} loading={prefixRankingQuery.isLoading} bordered={false} className={styles.sectionCard}>
            <Table
              size="small"
              pagination={false}
              rowKey={(row) => `${row.bucket_id}-${row.prefix}`}
              dataSource={prefixRankingQuery.data?.items ?? []}
              locale={{ emptyText: t('dashboard.noPrefixAccessData') }}
              columns={[
                { title: t('common.bucket'), dataIndex: 'bucket_name', ellipsis: true },
                { title: t('common.prefix'), dataIndex: 'prefix', ellipsis: true },
                { title: t('common.access'), dataIndex: 'access_count' },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title={t('dashboard.recentGlobalOps')} loading={recentAuditQuery.isLoading} bordered={false} className={styles.sectionCard}>
        {recentAuditQuery.error instanceof ApiError && recentAuditQuery.error.status === 403 ? (
          <Alert type="warning" message={t('dashboard.noAuditPermission')} showIcon />
        ) : (
          <Table
            size="small"
            pagination={false}
            rowKey="id"
            dataSource={recentAuditQuery.data?.items ?? []}
            columns={[
              { title: t('common.time'), dataIndex: 'created_at', render: formatDateTime },
              { title: t('common.user'), dataIndex: 'username', render: (v) => v ?? t('common.emDash') },
              { title: t('audit.action'), dataIndex: 'action' },
              {
                title: t('common.status'),
                dataIndex: 'status',
                render: (status: string) => (
                  <Tag color={status === 'success' ? 'success' : 'error'}>{status}</Tag>
                ),
              },
            ]}
          />
        )}
      </Card>
    </Space>
    </div>
  );
}
