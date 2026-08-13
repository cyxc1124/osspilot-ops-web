import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Checkbox, Drawer, Space, Spin, Typography, message } from 'antd';
import { listBuckets, listAccountBuckets, updateAccountBuckets } from '../../api/buckets';
import { ApiError } from '../../api/client';
import type { TenantUserResponse } from '../../api/types';
import { useT } from '../../i18n';

interface AccountBucketsDrawerProps {
  open: boolean;
  account: TenantUserResponse | null;
  token: string;
  onClose: () => void;
}

export default function AccountBucketsDrawer({
  open,
  account,
  token,
  onClose,
}: AccountBucketsDrawerProps) {
  const t = useT();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const allBucketsQuery = useQuery({
    queryKey: ['platform-buckets'],
    queryFn: () => listBuckets(token),
    enabled: open,
  });

  const accountBucketsQuery = useQuery({
    queryKey: ['account-buckets', account?.id],
    queryFn: () => listAccountBuckets(token, account!.id),
    enabled: open && account != null,
  });

  useEffect(() => {
    if (accountBucketsQuery.data) {
      setSelectedIds(accountBucketsQuery.data.items.map((item) => item.bucket_id));
    }
  }, [accountBucketsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: ({ accountId, bucketIds }: { accountId: number; bucketIds: number[] }) =>
      updateAccountBuckets(token, accountId, bucketIds),
    onSuccess: (_result, { accountId }) => {
      message.success(t('tenantAccounts.bucketsSaved'));
      void queryClient.invalidateQueries({ queryKey: ['account-buckets', accountId] });
      onClose();
    },
    onError: (err: Error) => {
      message.error(err instanceof ApiError ? err.message : t('common.saveFailed'));
    },
  });

  const loadError =
    allBucketsQuery.error instanceof ApiError
      ? allBucketsQuery.error.message
      : accountBucketsQuery.error instanceof ApiError
        ? accountBucketsQuery.error.message
        : allBucketsQuery.error || accountBucketsQuery.error
          ? t('common.loadFailed')
          : null;

  const isLoading = allBucketsQuery.isLoading || accountBucketsQuery.isLoading;
  const buckets = allBucketsQuery.data?.items ?? [];

  return (
    <Drawer
      title={
        account
          ? t('tenantAccounts.bucketsTitle', { name: account.display_name ?? account.username })
          : t('tenantAccounts.bucketsTitleDefault')
      }
      open={open}
      onClose={onClose}
      width={520}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="primary"
            loading={saveMutation.isPending}
            onClick={() => {
              if (!account) return;
              saveMutation.mutate({ accountId: account.id, bucketIds: selectedIds });
            }}
          >
            {t('common.save')}
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">{t('tenantAccounts.bucketsDesc')}</Typography.Paragraph>

      {loadError ? <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} /> : null}

      {isLoading ? (
        <Spin />
      ) : buckets.length === 0 ? (
        <Typography.Text type="secondary">{t('tenantAccounts.noRegisteredBuckets')}</Typography.Text>
      ) : (
        <Checkbox.Group
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          value={selectedIds}
          onChange={(values) => setSelectedIds(values.map(Number))}
        >
          {buckets.map((bucket) => (
            <Checkbox key={bucket.id} value={bucket.id}>
              {bucket.display_name?.trim() ? (
                <span>
                  {bucket.display_name}
                  <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    {bucket.bucket_name}
                  </Typography.Text>
                </span>
              ) : (
                bucket.bucket_name
              )}
            </Checkbox>
          ))}
        </Checkbox.Group>
      )}
    </Drawer>
  );
}
