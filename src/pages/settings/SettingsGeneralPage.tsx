import { useEffect } from 'react';
import { Button, Form, Input, InputNumber, Space, Switch, Typography } from 'antd';
import { useT } from '../../i18n';
import { formatBytes } from '../../utils/format';
import { useSettingsForm } from './useSettingsForm';

const { Title } = Typography;

interface GeneralForm {
  s3_endpoint?: string;
  rgw_access_key?: string;
  rgw_secret_key?: string;
  default_upload_presign_expires: number;
  default_download_presign_expires: number;
  max_upload_gb: number;
  audit_enabled: boolean;
}

export default function SettingsGeneralPage() {
  const t = useT();
  const { data, isLoading, isAdmin, saveMutation } = useSettingsForm();
  const [form] = Form.useForm<GeneralForm>();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        s3_endpoint: data.s3_endpoint ?? undefined,
        default_upload_presign_expires: data.default_upload_presign_expires,
        default_download_presign_expires: data.default_download_presign_expires,
        max_upload_gb: data.max_upload_bytes / 1024 ** 3,
        audit_enabled: data.audit_enabled,
      });
    }
  }, [data, form]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={5} style={{ margin: 0 }}>
        {t('settings.nav.general')}
      </Title>

      <Form
        form={form}
        layout="vertical"
        disabled={!isAdmin || isLoading}
        onFinish={(values) =>
          saveMutation.mutate({
            s3_endpoint: values.s3_endpoint || null,
            rgw_access_key: values.rgw_access_key || undefined,
            rgw_secret_key: values.rgw_secret_key || undefined,
            default_upload_presign_expires: values.default_upload_presign_expires,
            default_download_presign_expires: values.default_download_presign_expires,
            max_upload_bytes: Math.round(values.max_upload_gb * 1024 ** 3),
            audit_enabled: values.audit_enabled,
          })
        }
        style={{ maxWidth: 640 }}
      >
        <Form.Item name="s3_endpoint" label={t('settings.s3Endpoint')}>
          <Input placeholder="https://s3.example.com" />
        </Form.Item>

        <Form.Item
          name="rgw_access_key"
          label={t('settings.rgwAccessKey')}
          extra={
            data?.rgw_access_key_configured
              ? t('settings.configured', { value: data.rgw_access_key ?? '****' })
              : t('settings.notConfigured')
          }
        >
          <Input.Password
            placeholder={
              data?.rgw_access_key_configured ? t('settings.keepUnchanged') : t('settings.enterAccessKey')
            }
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="rgw_secret_key"
          label={t('settings.rgwSecretKey')}
          extra={
            data?.rgw_secret_key_configured
              ? t('settings.configured', { value: data.rgw_secret_key ?? '****' })
              : t('settings.notConfigured')
          }
        >
          <Input.Password
            placeholder={
              data?.rgw_secret_key_configured ? t('settings.keepUnchanged') : t('settings.enterSecretKey')
            }
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="default_upload_presign_expires"
          label={t('settings.uploadPresignExpires')}
          rules={[{ required: true }]}
          extra={t('settings.uploadPresignRange')}
        >
          <InputNumber min={600} max={1800} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="default_download_presign_expires"
          label={t('settings.downloadPresignExpires')}
          rules={[{ required: true }]}
          extra={t('settings.downloadPresignRange')}
        >
          <InputNumber min={300} max={600} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="max_upload_gb"
          label={t('settings.maxUploadGb')}
          rules={[{ required: true }]}
          extra={data ? t('settings.currentApprox', { size: formatBytes(data.max_upload_bytes) }) : undefined}
        >
          <InputNumber min={0.001} step={0.1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="audit_enabled" label={t('settings.auditEnabled')} valuePropName="checked">
          <Switch />
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
