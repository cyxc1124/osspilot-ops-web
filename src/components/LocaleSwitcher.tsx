import { useSyncExternalStore } from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import { useT } from '../i18n';
import {
  getAppLocale,
  LOCALE_OPTIONS,
  setAppLocale,
  subscribeLocale,
  type AppLocale,
} from '../lib/locale';

export default function LocaleSwitcher() {
  const t = useT();
  const locale = useSyncExternalStore(
    subscribeLocale,
    getAppLocale,
    () => 'zh-CN' as AppLocale,
  );

  return (
    <Select<AppLocale>
      value={locale}
      options={LOCALE_OPTIONS}
      onChange={setAppLocale}
      suffixIcon={<GlobalOutlined />}
      popupMatchSelectWidth={false}
      aria-label={t('common.language')}
      style={{ width: 116 }}
    />
  );
}
