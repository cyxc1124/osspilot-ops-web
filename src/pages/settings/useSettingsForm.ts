import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { getSettings, updateSettings } from '../../api/settings';
import type { SystemSettingsUpdateRequest } from '../../api/types';
import { ApiError } from '../../api/client';
import { useT } from '../../i18n';
import { useAuthStore } from '../../stores/authStore';
import { isPlatformAdmin } from '../../utils/roles';

export function useSettingsForm() {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const user = useAuthStore((s) => s.user);
  const isAdmin = isPlatformAdmin(user?.roles ?? []);
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings(token),
  });

  const saveMutation = useMutation({
    mutationFn: (body: SystemSettingsUpdateRequest) => updateSettings(token, body),
    onSuccess: () => {
      message.success(t('settings.saved'));
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: Error) =>
      message.error(err instanceof ApiError ? err.message : t('common.saveFailed')),
  });

  return {
    data: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    isAdmin,
    saveMutation,
  };
}
