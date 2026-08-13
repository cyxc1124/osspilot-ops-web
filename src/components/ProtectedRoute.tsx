import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { fetchMe } from '../api/auth';
import { useT } from '../i18n';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const t = useT();
  const location = useLocation();
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

  if (requireAdmin && !user?.roles.includes('platform_admin')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
