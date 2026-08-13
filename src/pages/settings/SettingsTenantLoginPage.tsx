import { useEffect } from 'react';
import { Button, Form, Input, Space, Typography } from 'antd';
import { useT } from '../../i18n';
import { useSettingsForm } from './useSettingsForm';

const { Title } = Typography;

interface TenantLoginForm {
  tenant_login_logo_text: string;
  tenant_login_title: string;
  tenant_login_subtitle: string;
}

export default function SettingsTenantLoginPage() {
  const t = useT();
  const { data, isLoading, isAdmin, saveMutation } = useSettingsForm();
  const [form] = Form.useForm<TenantLoginForm>();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        tenant_login_logo_text: data.tenant_login_logo_text,
        tenant_login_title: data.tenant_login_title,
        tenant_login_subtitle: data.tenant_login_subtitle,
      });
    }
  }, [data, form]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={5} style={{ margin: 0 }}>
        {t('settings.nav.tenantLogin')}
      </Title>

      <Form
        form={form}
        layout="vertical"
        disabled={!isAdmin || isLoading}
        onFinish={(values) =>
          saveMutation.mutate({
            tenant_login_logo_text: values.tenant_login_logo_text,
            tenant_login_title: values.tenant_login_title,
            tenant_login_subtitle: values.tenant_login_subtitle,
          })
        }
        style={{ maxWidth: 640 }}
      >
        <Form.Item
          name="tenant_login_logo_text"
          label={t('settings.brandText')}
          rules={[{ required: true, message: t('settings.brandTextRequired') }]}
          extra={t('settings.brandTextExtra')}
        >
          <Input placeholder="O" maxLength={8} />
        </Form.Item>

        <Form.Item
          name="tenant_login_title"
          label={t('settings.mainTitle')}
          rules={[{ required: true, message: t('settings.mainTitleRequired') }]}
        >
          <Input placeholder={t('settings.mainTitlePlaceholder')} maxLength={128} />
        </Form.Item>

        <Form.Item
          name="tenant_login_subtitle"
          label={t('settings.subtitle')}
          rules={[{ required: true, message: t('settings.subtitleRequired') }]}
        >
          <Input placeholder={t('settings.subtitlePlaceholder')} maxLength={256} />
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
