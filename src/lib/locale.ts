export type AppLocale = 'zh-CN' | 'en-US';

export const APP_LOCALE_HEADER = 'X-App-Locale';

const STORAGE_KEY = 'osspilot.locale';

const listeners = new Set<() => void>();

function detectDefaultLocale(): AppLocale {
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('en')) {
      return 'en-US';
    }
  }
  return 'zh-CN';
}

export function getAppLocale(): AppLocale {
  if (typeof localStorage === 'undefined') {
    return detectDefaultLocale();
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en-US' || stored === 'zh-CN') {
    return stored;
  }
  return detectDefaultLocale();
}

export function setAppLocale(locale: AppLocale): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, locale);
  }
  listeners.forEach((listener) => listener());
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const LOCALE_OPTIONS: { value: AppLocale; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
];

export function requestFailedMessage(locale = getAppLocale()): string {
  return locale === 'en-US' ? 'Request failed' : '请求失败';
}
