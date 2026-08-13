import { useEffect } from 'react';
import { Button, Divider, Form, InputNumber, Space, Switch, Typography } from 'antd';
import { useT } from '../../i18n';
import { useSettingsForm } from './useSettingsForm';

const { Title } = Typography;

interface CleanupForm {
  trash_cleanup_enabled: boolean;
  trash_retention_days: number;
  lifecycle_cleanup_enabled: boolean;
  version_cleanup_enabled: boolean;
  version_retention_days: number;
  multipart_cleanup_enabled: boolean;
  multipart_stale_days: number;
}

export default function SettingsCleanupPage() {
  const t = useT();
  const { data, isLoading, isAdmin, saveMutation } = useSettingsForm();
  const [form] = Form.useForm<CleanupForm>();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        trash_retention_days: data.trash_retention_days,
        trash_cleanup_enabled: data.trash_cleanup_enabled,
        lifecycle_cleanup_enabled: data.lifecycle_cleanup_enabled,
        version_retention_days: data.version_retention_days,
        version_cleanup_enabled: data.version_cleanup_enabled,
        multipart_stale_days: data.multipart_stale_days,
        multipart_cleanup_enabled: data.multipart_cleanup_enabled,
      });
    }
  }, [data, form]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={5} style={{ margin: 0 }}>
        {t('settings.nav.cleanup')}
      </Title>

      <Form
        form={form}
        layout="vertical"
        disabled={!isAdmin || isLoading}
        onFinish={(values) =>
          saveMutation.mutate({
            trash_retention_days: values.trash_retention_days,
            trash_cleanup_enabled: values.trash_cleanup_enabled,
            lifecycle_cleanup_enabled: values.lifecycle_cleanup_enabled,
            version_retention_days: values.version_retention_days,
            version_cleanup_enabled: values.version_cleanup_enabled,
            multipart_stale_days: values.multipart_stale_days,
            multipart_cleanup_enabled: values.multipart_cleanup_enabled,
          })
        }
        style={{ maxWidth: 640 }}
      >
        <Divider titlePlacement="start">{t('settings.trashSection')}</Divider>

        <Form.Item
          name="trash_cleanup_enabled"
          label={t('settings.trashCleanupEnabled')}
          valuePropName="checked"
          extra={t('settings.trashCleanupExtra')}
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="trash_retention_days"
          label={t('settings.trashRetentionDays')}
          rules={[{ required: true }]}
          extra={t('settings.trashRetentionExtra')}
        >
          <InputNumber min={0} max={3650} style={{ width: '100%' }} />
        </Form.Item>

        <Divider titlePlacement="start">{t('settings.workerCleanupSection')}</Divider>

        <Form.Item
          name="lifecycle_cleanup_enabled"
          label={t('settings.lifecycleCleanupEnabled')}
          valuePropName="checked"
          extra={t('settings.lifecycleCleanupExtra')}
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="version_cleanup_enabled"
          label={t('settings.versionCleanupEnabled')}
          valuePropName="checked"
          extra={t('settings.versionCleanupExtra')}
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="version_retention_days"
          label={t('settings.versionRetentionDays')}
          rules={[{ required: true }]}
          extra={t('settings.versionRetentionExtra')}
        >
          <InputNumber min={0} max={3650} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="multipart_cleanup_enabled"
          label={t('settings.multipartCleanupEnabled')}
          valuePropName="checked"
          extra={t('settings.multipartCleanupExtra')}
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="multipart_stale_days"
          label={t('settings.multipartStaleDays')}
          rules={[{ required: true }]}
          extra={t('settings.multipartStaleExtra')}
        >
          <InputNumber min={0} max={3650} style={{ width: '100%' }} />
        </Form.Item>

        {isAdmin ? (
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
              {t('settings.saveSettings')}
            </Button>
          </Form.Item>
        ) : null}
      </Form>
    </Space>
  );
}
