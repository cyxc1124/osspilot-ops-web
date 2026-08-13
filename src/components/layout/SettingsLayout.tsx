import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CloudOutlined,
  DeleteOutlined,
  GlobalOutlined,
  LoginOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Alert, Menu, Space, Typography, type MenuProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getSettings } from '../../api/settings';
import { useT } from '../../i18n';
import { useAuthStore } from '../../stores/authStore';
import { formatDateTime } from '../../utils/format';
import { isPlatformAdmin } from '../../utils/roles';
import styles from './SettingsLayout.module.css';

const { Title, Text } = Typography;

const MENU_ITEMS: { key: string; labelKey: string; icon: React.ReactNode }[] = [
  { key: 'general', labelKey: 'settings.nav.general', icon: <SettingOutlined /> },
  { key: 'services', labelKey: 'settings.nav.services', icon: <CloudOutlined /> },
  { key: 'cleanup', labelKey: 'settings.nav.cleanup', icon: <DeleteOutlined /> },
  { key: 'tenant-login', labelKey: 'settings.nav.tenantLogin', icon: <LoginOutlined /> },
  { key: 'regions', labelKey: 'settings.nav.regions', icon: <GlobalOutlined /> },
];

export default function SettingsLayout() {
  const t = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token)!;
  const user = useAuthStore((s) => s.user);
  const isAdmin = isPlatformAdmin(user?.roles ?? []);

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings(token),
  });

  const selectedKey = useMemo(() => {
    const match = MENU_ITEMS.find((item) => location.pathname.endsWith(`/${item.key}`));
    return match?.key ?? 'general';
  }, [location.pathname]);

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      MENU_ITEMS.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: t(item.labelKey),
      })),
    [t],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>
          {t('settings.title')}
        </Title>
        {!isAdmin ? <Text type="secondary">{t('settings.operatorReadOnly')}</Text> : null}
      </Space>

      {!isAdmin ? <Alert type="info" showIcon message={t('settings.readOnlyAlert')} /> : null}

      {data?.updated_at ? (
        <Text type="secondary">{t('settings.lastUpdated', { time: formatDateTime(data.updated_at) })}</Text>
      ) : null}

      <div className={styles.layout}>
        <aside className={styles.subNav}>
          <Menu
            className={styles.menu}
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => navigate(`/settings/${String(key)}`)}
          />
        </aside>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </Space>
  );
}
