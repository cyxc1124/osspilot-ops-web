import { apiRequest } from './client';
import type { SystemSettings, SystemSettingsUpdateRequest } from './types';

export function getSettings(token: string): Promise<SystemSettings> {
  return apiRequest<SystemSettings>('/api/settings', { token });
}

export function updateSettings(
  token: string,
  body: SystemSettingsUpdateRequest,
): Promise<SystemSettings> {
  return apiRequest<SystemSettings>('/api/settings', {
    method: 'PUT',
    token,
    body: JSON.stringify(body),
  });
}
