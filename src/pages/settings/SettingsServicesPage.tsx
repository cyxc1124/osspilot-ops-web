import { useEffect } from 'react';
import { Button, Form, Input, Space, Typography } from 'antd';
import { useT } from '../../i18n';
import { useSettingsForm } from './useSettingsForm';

const { Title } = Typography;

interface ServicesForm {
  ceph_mgmt_api_url?: string;
  office_url?: string;
  download_cdn_url?: string;
  preview_cdn_url?: string;
  object_http_domain?: string;
  object_https_domain?: string;
}

export default function SettingsServicesPage() {
  const t = useT();
  const { data, isLoading, isAdmin, saveMutation } = useSettingsForm();
  const [form] = Form.useForm<ServicesForm>();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        office_url: data.office_url ?? undefined,
        download_cdn_url: data.download_cdn_url ?? undefined,
        preview_cdn_url: data.preview_cdn_url ?? undefined,
        object_http_domain: data.object_http_domain ?? undefined,
        object_https_domain: data.object_https_domain ?? undefined,
        ceph_mgmt_api_url: data.ceph_mgmt_api_url ?? undefined,
      });
    }
  }, [data, form]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={5} style={{ margin: 0 }}>
        {t('settings.nav.services')}
      </Title>

      <Form
        form={form}
        layout="vertical"
        disabled={!isAdmin || isLoading}
        onFinish={(values) =>
          saveMutation.mutate({
            office_url: values.office_url || null,
            download_cdn_url: values.download_cdn_url || null,
            preview_cdn_url: values.preview_cdn_url || null,
            // Empty string clears stored domains (null would skip the backend update).
            object_http_domain: (values.object_http_domain ?? '').trim(),
            object_https_domain: (values.object_https_domain ?? '').trim(),
            ceph_mgmt_api_url: values.ceph_mgmt_api_url || null,
          })
        }
        style={{ maxWidth: 640 }}
      >
        <Form.Item name="ceph_mgmt_api_url" label={t('settings.cephMgmtApiUrl')} extra={t('settings.cephMgmtApiExtra')}>
          <Input placeholder="http://ceph-mgmt.internal:8080" />
        </Form.Item>

        <Form.Item name="office_url" label={t('settings.officeUrl')}>
          <Input placeholder="https://office.example.com" />
        </Form.Item>

        <Form.Item name="download_cdn_url" label={t('settings.downloadCdnUrl')} extra={t('settings.downloadCdnExtra')}>
          <Input placeholder="https://download.example.com" />
        </Form.Item>

        <Form.Item name="preview_cdn_url" label={t('settings.previewCdnUrl')} extra={t('settings.previewCdnExtra')}>
          <Input placeholder="https://preview.example.com" />
        </Form.Item>

        <Form.Item
          name="object_http_domain"
          label={t('settings.objectHttpDomain')}
          extra={t('settings.objectHttpDomainExtra')}
        >
          <Input placeholder="http://oss.example.com" />
        </Form.Item>

        <Form.Item
          name="object_https_domain"
          label={t('settings.objectHttpsDomain')}
          extra={t('settings.objectHttpsDomainExtra')}
        >
          <Input placeholder="https://oss.example.com" />
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
