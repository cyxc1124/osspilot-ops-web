import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Drawer,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  enqueueBucketInventory,
  listBuckets,
  listS3Buckets,
  registerBuckets,
} from '../api/buckets';
import { ApiError } from '../api/client';
import type { PlatformBucketListItem, S3BucketDiscoveryItem } from '../api/types';
import { useT } from '../i18n';
import { useAuthStore } from '../stores/authStore';
import { formatBytes, formatDateTime } from '../utils/format';

const { Title, Paragraph } = Typography;

export default function BucketsPage() {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const queryClient = useQueryClient();
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const bucketsQuery = useQuery({
    queryKey: ['platform-buckets'],
    queryFn: () => listBuckets(token),
  });

  const s3Query = useQuery({
    queryKey: ['s3-buckets'],
    queryFn: () => listS3Buckets(token),
    enabled: discoverOpen,
  });

  const registerMutation = useMutation({
    mutationFn: (names: string[]) => registerBuckets(token, names),
    onSuccess: (result) => {
      const ok = result.imported.length;
      const fail = result.failed.length;
      if (ok > 0) {
        message.success(t('bucketsRegistry.registeredCount', { count: ok }));
        void queryClient.invalidateQueries({ queryKey: ['platform-buckets'] });
        void s3Query.refetch();
      }
      if (fail > 0) {
        message.warning(t('bucketsRegistry.registerFailedCount', { count: fail }));
      }
      setSelected([]);
      if (fail === 0) {
        setDiscoverOpen(false);
      }
    },
    onError: (err: Error) => {
      message.error(err instanceof ApiError ? err.message : t('common.importFailed'));
    },
  });

  const inventoryMutation = useMutation({
    mutationFn: (bucketId: number) => enqueueBucketInventory(token, bucketId),
    onSuccess: (result) => {
      message.success(`${result.bucket_name}：${result.message}`);
    },
    onError: (err: Error) => {
      message.error(err instanceof ApiError ? err.message : t('bucketsRegistry.inventoryTaskFailed'));
    },
  });

  const loadError =
    bucketsQuery.error instanceof ApiError
      ? bucketsQuery.error.message
      : bucketsQuery.error
        ? t('common.loadFailed')
        : null;

  const bucketColumns: ColumnsType<PlatformBucketListItem> = [
    {
      title: t('bucketsRegistry.bucketName'),
      dataIndex: 'bucket_name',
      render: (name: string, record) =>
        record.display_name?.trim() ? (
          <span>
            {record.display_name}
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {name}
            </Typography.Text>
          </span>
        ) : (
          name
        ),
    },
    {
      title: t('bucketsRegistry.capacity'),
      dataIndex: 'used_bytes',
      render: (value: number) => formatBytes(value),
    },
    {
      title: t('bucketsRegistry.objectCount'),
      dataIndex: 'object_count',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: t('bucketsRegistry.collectedAt'),
      dataIndex: 'collected_at',
      render: (value: string | null) => (value ? formatDateTime(value) : t('common.notCollected')),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          disabled={record.status !== 'active'}
          loading={inventoryMutation.isPending && inventoryMutation.variables === record.id}
          onClick={() => inventoryMutation.mutate(record.id)}
        >
          {t('bucketsRegistry.recollect')}
        </Button>
      ),
    },
  ];

  const s3Columns: ColumnsType<S3BucketDiscoveryItem> = [
    { title: t('bucketsRegistry.s3BucketName'), dataIndex: 'name' },
    {
      title: t('bucketsRegistry.s3CreatedAt'),
      dataIndex: 'creation_date',
      render: (value: string | null) => (value ? formatDateTime(value) : t('common.emDash')),
    },
    {
      title: t('common.status'),
      key: 'status',
      render: (_, record) =>
        record.registered ? (
          <Tag color="default">{t('bucketsRegistry.alreadyRegistered')}</Tag>
        ) : (
          <Tag color="blue">{t('bucketsRegistry.registerable')}</Tag>
        ),
    },
  ];

  const s3LoadError =
    s3Query.error instanceof ApiError
      ? s3Query.error.message
      : s3Query.error
        ? t('bucketsRegistry.loadS3Failed')
        : null;

  return (
    <>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          {t('bucketsRegistry.title')}
        </Title>
        <Space>
          <Button onClick={() => void bucketsQuery.refetch()} loading={bucketsQuery.isFetching}>
            {t('common.refresh')}
          </Button>
          <Button type="primary" onClick={() => setDiscoverOpen(true)}>
            {t('bucketsRegistry.discoverAndRegister')}
          </Button>
        </Space>
      </Space>

      <Paragraph type="secondary">{t('bucketsRegistry.description')}</Paragraph>

      {loadError ? <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} /> : null}

      <Table
        rowKey="id"
        loading={bucketsQuery.isLoading}
        columns={bucketColumns}
        dataSource={bucketsQuery.data?.items ?? []}
        pagination={{ pageSize: 10, showTotal: (total) => t('common.totalBuckets', { total }) }}
        locale={{ emptyText: loadError ?? t('bucketsRegistry.noBuckets') }}
        scroll={{ x: 900 }}
      />

      <Drawer
        title={t('bucketsRegistry.discoverTitle')}
        open={discoverOpen}
        onClose={() => {
          setSelected([]);
          setDiscoverOpen(false);
        }}
        width={720}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => void s3Query.refetch()} loading={s3Query.isFetching}>
              {t('common.refresh')}
            </Button>
            <Button
              type="primary"
              disabled={selected.length === 0}
              loading={registerMutation.isPending}
              onClick={() => registerMutation.mutate(selected)}
            >
              {t('bucketsRegistry.registerSelected', { count: selected.length })}
            </Button>
          </Space>
        }
      >
        <Paragraph type="secondary">{t('bucketsRegistry.discoverDesc')}</Paragraph>

        {s3LoadError ? (
          <Alert type="error" showIcon message={s3LoadError} style={{ marginBottom: 16 }} />
        ) : null}

        <Table
          rowKey="name"
          size="small"
          loading={s3Query.isLoading}
          columns={s3Columns}
          dataSource={s3Query.data?.items ?? []}
          rowSelection={{
            selectedRowKeys: selected,
            onChange: (keys) => setSelected(keys.map(String)),
            getCheckboxProps: (record) => ({ disabled: record.registered }),
          }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => t('common.totalImportableBuckets', { total }),
          }}
          locale={{ emptyText: s3LoadError ?? t('bucketsRegistry.noRegisterable') }}
        />
      </Drawer>
    </>
  );
}
