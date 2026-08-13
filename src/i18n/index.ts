import { useCallback, useSyncExternalStore } from 'react';
import { getAppLocale, subscribeLocale, type AppLocale } from '../lib/locale';
import { enUS } from './en-US';
import { zhCN } from './zh-CN';

type MessageTree = Record<string, unknown>;

const CATALOGS: Record<AppLocale, MessageTree> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

function lookup(tree: MessageTree, key: string): string | undefined {
  const parts = key.split('.');
  let cur: unknown = tree;
  for (const part of parts) {
    if (!cur || typeof cur !== 'object' || !(part in (cur as MessageTree))) {
      return undefined;
    }
    cur = (cur as MessageTree)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function t(
  key: string,
  params?: Record<string, string | number>,
  locale: AppLocale = getAppLocale(),
): string {
  const catalog = CATALOGS[locale];
  let text = lookup(catalog, key) ?? lookup(CATALOGS['zh-CN'], key) ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export function useT() {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getAppLocale,
    () => 'zh-CN' as AppLocale,
  );
  return useCallback((key: string, params?: Record<string, string | number>) => t(key, params, locale), [locale]);
}

export function useAppLocale(): AppLocale {
  return useSyncExternalStore(subscribeLocale, getAppLocale, () => 'zh-CN');
}

export function formatDateTime(value: string | Date, locale: AppLocale = getAppLocale()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString(locale === 'en-US' ? 'en-US' : 'zh-CN');
}
