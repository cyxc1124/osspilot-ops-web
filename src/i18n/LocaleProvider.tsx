import type { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { opsTheme } from '../theme';
import { useAppLocale } from './index';

export default function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useAppLocale();
  return (
    <ConfigProvider locale={locale === 'en-US' ? enUS : zhCN} theme={opsTheme}>
      {children}
    </ConfigProvider>
  );
}
