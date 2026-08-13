import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag, Typography, message } from 'antd';
import { createRegion, deleteRegion, listRegions } from '../../api/regions';
import { ApiError } from '../../api/client';
import { useT } from '../../i18n';
import { useAuthStore } from '../../stores/authStore';
import { isPlatformAdmin } from '../../utils/roles';

const { Title } = Typography;

export default function SettingsRegionsPage() {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const user = useAuthStore((s) => s.user);
  const isAdmin = isPlatformAdmin(user?.roles ?? []);
  const queryClient = useQueryClient();
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionForm] = Form.useForm<{
    code: string;
    name: string;
    s3_endpoint: string;
    s3_region_name?: string;
    is_default?: boolean;
  }>();

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: () => listRegions(token),
  });

  const createRegionMutation = useMutation({
    mutationFn: (values: { code: string; name: string; s3_endpoint: string; s3_region_name?: string; is_default?: boolean }) =>
      createRegion(token, values),
    onSuccess: () => {
      message.success(t('settings.regionCreated'));
      setRegionOpen(false);
      regionForm.resetFields();
      void queryClient.invalidateQueries({ queryKey: ['regions'] });
    },
    onError: (err: Error) => message.error(err instanceof ApiError ? err.message : t('common.createFailed')),
  });

  const deleteRegionMutation = useMutation({
    mutationFn: (regionId: number) => deleteRegion(token, regionId),
    onSuccess: () => {
      message.success(t('settings.regionDeleted'));
      void queryClient.invalidateQueries({ queryKey: ['regions'] });
    },
    onError: (err: Error) => message.error(err instanceof ApiError ? err.message : t('common.deleteFailed')),
  });

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 960 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Title level={5} style={{ margin: 0 }}>
          {t('settings.nav.regions')}
        </Title>
        {isAdmin ? (
          <Button type="primary" onClick={() => setRegionOpen(true)}>
            {t('settings.addRegion')}
          </Button>
        ) : null}
      </Space>

      <Table
        rowKey="id"
        loading={regionsQuery.isLoading}
        dataSource={regionsQuery.data?.items ?? []}
        pagination={false}
        columns={[
          { title: t('settings.regionCode'), dataIndex: 'code' },
          { title: t('settings.regionName'), dataIndex: 'name' },
          { title: t('settings.s3Endpoint'), dataIndex: 's3_endpoint' },
          {
            title: t('settings.regionDefault'),
            dataIndex: 'is_default',
            render: (value: boolean) =>
              value ? <Tag color="blue">{t('settings.regionDefault')}</Tag> : t('common.emDash'),
          },
          { title: t('settings.boundTenants'), dataIndex: 'tenant_count' },
          {
            title: t('common.actions'),
            key: 'actions',
            render: (_, record) =>
              isAdmin ? (
                <Popconfirm
                  title={t('settings.deleteRegionConfirm')}
                  description={t('settings.deleteRegionDesc')}
                  onConfirm={() => deleteRegionMutation.mutate(record.id)}
                >
                  <Button type="link" size="small" danger disabled={record.is_default}>
                    {t('common.delete')}
                  </Button>
                </Popconfirm>
              ) : null,
          },
        ]}
      />

      <Modal
        title={t('settings.addRegionModal')}
        open={regionOpen}
        onCancel={() => setRegionOpen(false)}
        onOk={() => regionForm.submit()}
        confirmLoading={createRegionMutation.isPending}
        destroyOnClose
      >
        <Form form={regionForm} layout="vertical" onFinish={(v) => createRegionMutation.mutate(v)}>
          <Form.Item name="code" label={t('settings.regionCode')} rules={[{ required: true }]}>
            <Input placeholder="cn-east-1" />
          </Form.Item>
          <Form.Item name="name" label={t('settings.regionName')} rules={[{ required: true }]}>
            <Input placeholder={t('settings.regionNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="s3_endpoint" label={t('settings.s3Endpoint')} rules={[{ required: true }]}>
            <Input placeholder="https://s3-east.example.com" />
          </Form.Item>
          <Form.Item name="s3_region_name" label="S3 Region Name" initialValue="us-east-1">
            <Input />
          </Form.Item>
          <Form.Item name="is_default" label={t('settings.setDefaultRegion')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
