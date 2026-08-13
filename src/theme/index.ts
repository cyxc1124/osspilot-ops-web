import type { ThemeConfig } from 'antd';

/** Modern design tokens for the ops console. */
export const opsTheme: ThemeConfig = {
  token: {
    colorPrimary: '#3b6fe8',
    colorLink: '#3b6fe8',
    borderRadius: 8,
    borderRadiusLG: 12,
    fontSize: 14,
    colorBgLayout: '#f4f6f9',
    colorText: '#1a1d26',
    colorTextSecondary: '#5c6370',
    colorBorder: '#e4e8ef',
    colorBorderSecondary: '#eef1f6',
    boxShadow:
      '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
    boxShadowSecondary: '0 4px 12px -2px rgb(15 23 42 / 0.08)',
  },
  components: {
    Layout: {
      siderBg: '#161b28',
      triggerBg: '#111520',
      headerBg: '#ffffff',
      headerHeight: 56,
      bodyBg: '#f4f6f9',
    },
    Menu: {
      darkItemBg: '#161b28',
      darkSubMenuItemBg: '#111520',
      darkItemSelectedBg: '#3b6fe8',
      darkItemHoverBg: 'rgb(255 255 255 / 6%)',
      itemBorderRadius: 8,
      itemMarginInline: 8,
      itemMarginBlock: 4,
      itemHeight: 40,
    },
    Card: {
      borderRadiusLG: 12,
      paddingLG: 20,
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#5c6370',
      borderColor: '#eef1f6',
    },
    Button: {
      controlHeight: 36,
      controlHeightLG: 44,
    },
    Input: {
      controlHeight: 36,
      controlHeightLG: 44,
    },
  },
};
