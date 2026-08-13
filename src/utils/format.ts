import { t } from '../i18n';
import { formatDateTime as formatDateTimeI18n } from '../i18n';

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

export function formatPercent(rate: number | null | undefined): string {
  if (rate == null) {
    return t('common.emDash');
  }
  return `${(rate * 100).toFixed(2)}%`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return t('common.emDash');
  }
  return formatDateTimeI18n(value);
}

export function tenantStatusLabel(status: string): string {
  if (status === 'active') {
    return t('common.statusActive');
  }
  if (status === 'disabled') {
    return t('common.tenantStatusDisabled');
  }
  return status;
}

export function userStatusLabel(status: string): string {
  if (status === 'active') {
    return t('common.statusActive');
  }
  if (status === 'disabled') {
    return t('common.statusDisabled');
  }
  return status;
}
