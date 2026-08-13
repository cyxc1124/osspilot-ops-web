import { useEffect, useState } from 'react';
import { DeleteOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Typography,
  message,
} from 'antd';
import {
  deleteBucketPolicy,
  getBucketPolicy,
  putBucketPolicy,
  type BucketPolicyResponse,
} from '../api/bucketPolicy';
import { ApiError } from '../api/client';
import { useT } from '../i18n';
import { useAuthStore } from '../stores/authStore';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const DEFAULT_POLICY = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'ExampleRead',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: 'arn:aws:s3:::BUCKET_NAME/*',
    },
  ],
};

function formatPolicy(policy: Record<string, unknown> | null, bucketName: string): string {
  const source = policy ?? {
    ...DEFAULT_POLICY,
    Statement: DEFAULT_POLICY.Statement.map((item) => ({
      ...item,
      Resource: String(item.Resource).replace('BUCKET_NAME', bucketName),
    })),
  };
  return JSON.stringify(source, null, 2);
}

export default function BucketPolicyPage() {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const queryClient = useQueryClient();
  const [bucketId, setBucketId] = useState<number | null>(null);
  const [activeBucketId, setActiveBucketId] = useState<number | null>(null);
  const [editorValue, setEditorValue] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const parsePolicyText = (text: string): Record<string, unknown> => {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(t('bucketPolicy.policyMustBeObject'));
    }
    return parsed as Record<string, unknown>;
  };

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['bucket-policy', activeBucketId],
    queryFn: () => getBucketPolicy(token, activeBucketId!),
    enabled: activeBucketId !== null,
  });

  useEffect(() => {
    if (!data || dirty) {
      return;
    }
    setEditorValue(formatPolicy(data.policy, data.bucket_name));
    setParseError(null);
  }, [data, dirty]);

  const saveMutation = useMutation({
    mutationFn: async ({ bucketId, policyText }: { bucketId: number; policyText: string }) => {
      const policy = parsePolicyText(policyText);
      return putBucketPolicy(token, bucketId, policy);
    },
    onSuccess: (saved, { bucketId }) => {
      message.success(t('bucketPolicy.saved'));
      queryClient.setQueryData<BucketPolicyResponse>(['bucket-policy', bucketId], saved);
      if (bucketId === activeBucketId) {
        setDirty(false);
      }
      void queryClient.invalidateQueries({ queryKey: ['bucket-policy', bucketId] });
    },
    onError: (err) => {
      const text = err instanceof ApiError ? err.message : t('common.saveFailed');
      message.error(text);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (bucketId: number) => deleteBucketPolicy(token, bucketId),
    onSuccess: (_result, bucketId) => {
      message.success(t('bucketPolicy.deleted'));
      const cacheKey = ['bucket-policy', bucketId] as const;
      const previous = queryClient.getQueryData<BucketPolicyResponse>(cacheKey);
      if (previous) {
        queryClient.setQueryData<BucketPolicyResponse>(cacheKey, {
          ...previous,
          policy: null,
          has_policy: false,
        });
      }
      if (bucketId === activeBucketId) {
        setDirty(false);
      }
      void queryClient.invalidateQueries({ queryKey: cacheKey });
    },
    onError: (err) => {
      const text = err instanceof ApiError ? err.message : t('common.deleteFailed');
      message.error(text);
    },
  });

  const loadError = error instanceof ApiError ? error.message : error ? t('common.loadFailed') : null;

  const handleLoad = () => {
    if (bucketId === null || bucketId <= 0) {
      message.warning(t('bucketPolicy.invalidBucketId'));
      return;
    }
    setDirty(false);
    setActiveBucketId(bucketId);
  };

  const handleEditorChange = (value: string) => {
    setEditorValue(value);
    setDirty(true);
    try {
      parsePolicyText(value);
      setParseError(null);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : t('bucketPolicy.invalidJson'));
    }
  };

  return (
    <div>
      <Title level={4}>{t('bucketPolicy.title')}</Title>
      <Paragraph type="secondary">{t('bucketPolicy.description')}</Paragraph>

      <Space style={{ marginBottom: 16 }} wrap>
        <InputNumber
          min={1}
          placeholder={t('bucketPolicy.bucketIdPlaceholder')}
          value={bucketId ?? undefined}
          onChange={(value) => setBucketId(value)}
        />
        <Button type="primary" onClick={handleLoad} loading={isLoading || isFetching}>
          {t('bucketPolicy.loadPolicy')}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => void refetch()} disabled={!activeBucketId}>
          {t('common.refresh')}
        </Button>
      </Space>

      {data ? (
        <Paragraph>
          {t('bucketPolicy.currentBucket', {
            name: data.bucket_name,
            tenantId: data.tenant_id,
            bucketId: data.bucket_id,
          })}
        </Paragraph>
      ) : null}

      {loadError ? <Alert type="error" message={loadError} showIcon style={{ marginBottom: 16 }} /> : null}
      {parseError ? (
        <Alert type="warning" message={parseError} showIcon style={{ marginBottom: 16 }} />
      ) : null}

      <TextArea
        rows={22}
        value={editorValue}
        onChange={(event) => handleEditorChange(event.target.value)}
        placeholder={t('bucketPolicy.editorPlaceholder')}
        style={{ fontFamily: 'Menlo, Monaco, Consolas, monospace', marginBottom: 16 }}
      />

      <Space>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saveMutation.isPending}
          disabled={!activeBucketId || Boolean(parseError)}
          onClick={() => {
            if (activeBucketId === null) {
              message.warning(t('bucketPolicy.loadBucketFirst'));
              return;
            }
            saveMutation.mutate({ bucketId: activeBucketId, policyText: editorValue });
          }}
        >
          {t('common.save')}
        </Button>
        <Popconfirm
          title={t('bucketPolicy.deleteConfirm')}
          okText={t('common.delete')}
          cancelText={t('common.cancel')}
          okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
          onConfirm={() => {
            if (activeBucketId === null) {
              message.warning(t('bucketPolicy.loadBucketFirst'));
              return;
            }
            deleteMutation.mutate(activeBucketId);
          }}
          disabled={!data?.has_policy}
        >
          <Button danger icon={<DeleteOutlined />} disabled={!data?.has_policy}>
            {t('bucketPolicy.deletePolicy')}
          </Button>
        </Popconfirm>
      </Space>
    </div>
  );
}
