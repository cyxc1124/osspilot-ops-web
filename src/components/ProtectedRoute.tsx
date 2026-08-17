import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Spin } from 'antd';
import { fetchMe, logout } from '../api/auth';
import ChangePasswordModal from './account/ChangePasswordModal';
import LocaleSwitcher from './LocaleSwitcher';
import { useT } from '../i18n';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const t = useT();
  const location = useLocation();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { isLoading, isError, data } = useQuery({
    queryKey: ['me', token],
    queryFn: () => fetchMe(token!),
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}>
        <Spin size="large" tip={t('common.loading')} />
      </div>
    );
  }

  if (isError) {
    clearAuth();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (data?.must_change_password) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 120 }}>
        <LocaleSwitcher />
        <Alert type="info" showIcon message={t('account.mustChangeHint')} />
        <Button
          onClick={() => {
            if (token) {
              void logout(token).finally(() => clearAuth());
              return;
            }
            clearAuth();
          }}
        >
          {t('nav.logout')}
        </Button>
        <ChangePasswordModal
          open
          forced
          onClose={() => undefined}
          onChanged={async () => {
            const me = await fetchMe(token);
            setUser(me);
            queryClient.setQueryData(['me', token], me);
          }}
        />
      </div>
    );
  }

  if (requireAdmin && !user?.roles.includes('platform_admin')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
