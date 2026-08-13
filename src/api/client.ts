import { t } from '../i18n';
import { getApiBaseUrl } from '../lib/apiBase';
import { APP_LOCALE_HEADER, getAppLocale } from '../lib/locale';
import type { ApiErrorBody } from './types';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function parseErrorMessage(body: ApiErrorBody | null, fallback: string): string {
  if (!body?.detail) {
    return fallback;
  }
  if (typeof body.detail === 'string') {
    return body.detail;
  }
  return body.detail.map((item) => item.msg).join('; ') || fallback;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;
  const headers = new Headers(customHeaders);

  if (!headers.has('Content-Type') && rest.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set(APP_LOCALE_HEADER, getAppLocale());

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    const body = isJson ? ((await response.json()) as ApiErrorBody) : null;
    throw new ApiError(
      response.status,
      parseErrorMessage(body, response.statusText || t('common.requestFailed')),
    );
  }

  if (isJson) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

export async function apiDownload(
  path: string,
  token: string | null,
): Promise<Blob> {
  const headers = new Headers();
  headers.set(APP_LOCALE_HEADER, getAppLocale());
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, { headers });
  if (!response.ok) {
    const contentType = response.headers.get('Content-Type') ?? '';
    const body = contentType.includes('application/json')
      ? ((await response.json()) as ApiErrorBody)
      : null;
    throw new ApiError(
      response.status,
      parseErrorMessage(body, response.statusText || t('common.exportFailed')),
    );
  }
  return response.blob();
}
