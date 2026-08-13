import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { login } from '../api/auth';
import { ApiError } from '../api/client';
import LocaleSwitcher from '../components/LocaleSwitcher';
import { useT } from '../i18n';
import { useAuthStore } from '../stores/authStore';
import styles from './LoginPage.module.css';

const { Title, Paragraph } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (token) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      const response = await login({
        username: values.username.trim(),
        password: values.password,
        portal: 'ops',
      });
      setAuth(response.access_token, response.user);
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('login.failed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.localeBar}>
        <LocaleSwitcher />
      </div>

      <div className={styles.panel}>
        <div className={styles.hero}>
          <div className={styles.logo}>O</div>
          <Title level={3} className={styles.heroTitle}>
            {t('login.title')}
          </Title>
          <Paragraph className={styles.heroDesc}>{t('login.subtitle')}</Paragraph>
        </div>

        <div className={styles.formWrap}>
          <Title level={4} className={styles.formTitle}>
            {t('login.submit')}
          </Title>
          <Paragraph type="secondary" className={styles.formSubtitle}>
            {t('login.subtitle')}
          </Paragraph>

          {error ? <Alert className={styles.alert} type="error" message={error} showIcon /> : null}

          <Form layout="vertical" onFinish={handleSubmit} autoComplete="off" size="large" requiredMark={false}>
            <Form.Item
              name="username"
              label={t('login.username')}
              rules={[{ required: true, message: t('login.usernameRequired') }]}
            >
              <Input prefix={<UserOutlined />} placeholder="admin" />
            </Form.Item>
            <Form.Item
              name="password"
              label={t('login.password')}
              rules={[{ required: true, message: t('login.passwordRequired') }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder={t('login.passwordPlaceholder')} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                {t('login.submit')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
