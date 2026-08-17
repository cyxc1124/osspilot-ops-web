import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { GithubOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getAbout, type AboutComponent } from '../api/about';
import { ApiError } from '../api/client';
import { useT } from '../i18n';
import { useAuthStore } from '../stores/authStore';
import styles from './AboutPage.module.css';

const { Title, Text, Link } = Typography;

function channelColor(channel: string): string {
  if (channel === 'release') return 'success';
  if (channel === 'develop' || channel === 'main') return 'warning';
  return 'default';
}

function statusColor(status: string): string {
  if (status === 'update') return 'warning';
  if (status === 'current') return 'success';
  if (status === 'checking') return 'processing';
  return 'default';
}

export default function AboutPage() {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const retried = useRef(false);

  const query = useQuery({
    queryKey: ['about'],
    queryFn: () => getAbout(token),
  });

  const about = query.data;
  const refetch = query.refetch;

  useEffect(() => {
    if (!about || retried.current) return;
    if (about.components.some((c) => c.compare_status === 'checking')) {
      retried.current = true;
      const timer = window.setTimeout(() => {
        void refetch();
      }, 3000);
      return () => window.clearTimeout(timer);
    }
  }, [about, refetch]);

  const updates = useMemo(
    () => query.data?.components.filter((c) => c.compare_status === 'update') ?? [],
    [query.data],
  );

  const columns: ColumnsType<AboutComponent> = [
    {
      title: t('about.component'),
      dataIndex: 'id',
      render: (id: string, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{t(`about.components.${id}`)}</Text>
          <Link href={row.repo_url} target="_blank" rel="noopener noreferrer">
            {row.repo}
          </Link>
        </Space>
      ),
    },
    {
      title: t('about.running'),
      dataIndex: 'running_version',
      render: (version: string, row) =>
        row.reachable ? (
          <Space>
            <Text code>{version}</Text>
            <Tag color={channelColor(row.channel)}>{t(`about.channel.${row.channel}`)}</Tag>
          </Space>
        ) : (
          <Text type="secondary">{t('about.unreachable')}</Text>
        ),
    },
    {
      title: t('about.githubLatest'),
      key: 'github',
      render: (_, row) => {
        const parts: ReactNode[] = [];
        if (row.latest_release) {
          parts.push(
            row.latest_release_url ? (
              <Link key="rel" href={row.latest_release_url} target="_blank" rel="noopener noreferrer">
                {row.latest_release}
              </Link>
            ) : (
              <Text key="rel">{row.latest_release}</Text>
            ),
          );
        }
        if (row.latest_commit) {
          parts.push(
            row.latest_commit_url ? (
              <Link key="sha" href={row.latest_commit_url} target="_blank" rel="noopener noreferrer">
                {row.latest_commit}
              </Link>
            ) : (
              <Text key="sha" code>
                {row.latest_commit}
              </Text>
            ),
          );
        }
        if (!parts.length) return t('common.emDash');
        return <Space size={8}>{parts}</Space>;
      },
    },
    {
      title: t('about.status'),
      dataIndex: 'compare_status',
      render: (status: string, row) => {
        const tag = <Tag color={statusColor(status)}>{t(`about.statusLabel.${status}`)}</Tag>;
        if (status === 'update' && row.update_url) {
          return (
            <Link href={row.update_url} target="_blank" rel="noopener noreferrer">
              {tag}
            </Link>
          );
        }
        return tag;
      },
    },
  ];

  return (
    <div>
      <div className={styles.header}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
          <div>
            <Title level={4} className={styles.title}>
              {t('about.title')}
            </Title>
            <Text type="secondary" className={styles.subtitle}>
              {t('about.subtitle')}
            </Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
            {t('common.refresh')}
          </Button>
        </Space>
      </div>

      {query.error ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={query.error instanceof ApiError ? query.error.message : t('common.loadFailed')}
        />
      ) : null}

      {updates.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('about.updateBanner', { count: updates.length })}
        />
      ) : null}

      <Card className={styles.card} bordered={false}>
        <Space align="center" size={12} style={{ marginBottom: 16 }}>
          <GithubOutlined />
          <div>
            <Text strong>{query.data?.app_name ?? 'OssPilot'}</Text>
            {query.data?.build_time ? (
              <div>
                <Text type="secondary">{t('about.buildTime', { time: query.data.build_time })}</Text>
              </div>
            ) : null}
          </div>
        </Space>
        <Table
          rowKey="id"
          loading={query.isLoading}
          columns={columns}
          dataSource={query.data?.components ?? []}
          pagination={false}
        />
      </Card>
    </div>
  );
}
