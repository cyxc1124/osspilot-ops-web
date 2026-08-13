import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AuditOutlined,
  BellOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  KeyOutlined,
  LogoutOutlined,
  SettingOutlined,
  FileProtectOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Space, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { logout } from '../../api/auth';
import { useT } from '../../i18n';
import ChangePasswordModal from '../account/ChangePasswordModal';
import LocaleSwitcher from '../LocaleSwitcher';
import { useAuthStore } from '../../stores/authStore';
import { hasOpsAccess, isPlatformAdmin, opsRoleLabel } from '../../utils/roles';
import styles from './OpsLayout.module.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MenuDef {
  key: string;
  labelKey: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  readOnlyForOperator?: boolean;
}

const MENU_DEFS: MenuDef[] = [
  { key: '/', labelKey: 'nav.dashboard', icon: <DashboardOutlined /> },
  { key: '/tenant-accounts', labelKey: 'nav.tenantAccounts', icon: <TeamOutlined />, adminOnly: true },
  { key: '/buckets', labelKey: 'nav.buckets', icon: <DatabaseOutlined />, adminOnly: true },
  { key: '/users', labelKey: 'nav.users', icon: <UserOutlined />, adminOnly: true },
  { key: '/permissions', labelKey: 'nav.permissions', icon: <SafetyOutlined />, adminOnly: true },
  { key: '/bucket-policies', labelKey: 'nav.bucketPolicies', icon: <FileProtectOutlined />, adminOnly: true },
  { key: '/settings', labelKey: 'nav.settings', icon: <SettingOutlined />, readOnlyForOperator: true },
  { key: '/rgw', labelKey: 'nav.rgw', icon: <CloudServerOutlined />, readOnlyForOperator: true },
  { key: '/alerts', labelKey: 'nav.alerts', icon: <BellOutlined />, readOnlyForOperator: true },
  { key: '/audit', labelKey: 'nav.audit', icon: <AuditOutlined />, readOnlyForOperator: true },
];

export default function OpsLayout() {
  const t = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isAdmin = isPlatformAdmin(user?.roles ?? []);

  const visibleMenuDefs = useMemo(
    () => MENU_DEFS.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin],
  );

  const menuItems: MenuProps['items'] = useMemo(() => {
    return visibleMenuDefs.map((item) => ({
      key: item.key,
      icon: item.icon,
      label: (
        <>
          {t(item.labelKey)}
          {!isAdmin && item.readOnlyForOperator ? (
            <Tag color="default" style={{ marginLeft: 8, fontSize: 11 }}>
              {t('common.readOnly')}
            </Tag>
          ) : null}
        </>
      ),
    }));
  }, [visibleMenuDefs, isAdmin, t]);

  const selectedKey = useMemo(() => {
    if (location.pathname === '/') {
      return '/';
    }
    const keys = visibleMenuDefs
      .map((item) => item.key)
      .filter((key) => key !== '/')
      .sort((a, b) => b.length - a.length);
    const match = keys.find((key) => location.pathname.startsWith(key));
    return match ?? '/';
  }, [location.pathname, visibleMenuDefs]);

  const handleLogout = async () => {
    if (token) {
      try {
        await logout(token);
      } catch {
        // Stateless logout — clear local state regardless.
      }
    }
    clearAuth();
    navigate('/login', { replace: true });
  };

  const roleLabels = (user?.roles ?? [])
    .filter((role) => hasOpsAccess([role]))
    .map((role) => opsRoleLabel(role))
    .join('、');

  const userMenu: MenuProps['items'] = [
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: t('account.changePassword'),
      onClick: () => setPasswordOpen(true),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className={styles.layout}>
      <Sider breakpoint="lg" collapsedWidth={64} className={styles.sider} width={220}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>O</span>
          <span className={styles.logoText}>{t('nav.brand')}</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(String(key))}
        />
      </Sider>
      <Layout className={styles.main}>
        <Header className={styles.header}>
          <Space align="center" size={12}>
            <Avatar icon={<UserOutlined />} />
            <div className={styles.userInfo}>
              <Text strong>{user?.display_name || user?.username}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {roleLabels || t('nav.opsUser')}
              </Text>
            </div>
          </Space>
          <Space size={16}>
            <LocaleSwitcher />
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <span className={styles.userTrigger}>
                <UserOutlined />
              </span>
            </Dropdown>
          </Space>
        </Header>
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </Layout>
  );
}
