import { Collapse, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';
import { useT } from '../../i18n';
import {
  ASSIGNABLE_TENANT_ROLES,
  permissionActionLabel,
  tenantRoleLabel,
  tenantRolePresetActions,
} from '../../utils/roles';

const { Text } = Typography;

interface PresetRow {
  key: string;
  role: string;
  actions: readonly string[];
  isAdmin: boolean;
}

export default function RolePresetsPanel() {
  const t = useT();

  const rows = useMemo<PresetRow[]>(
    () =>
      ASSIGNABLE_TENANT_ROLES.map((role) => {
        const actions = tenantRolePresetActions(role) ?? [];
        return {
          key: role,
          role,
          actions,
          isAdmin: actions.length === 8,
        };
      }),
    [],
  );

  const columns: ColumnsType<PresetRow> = useMemo(
    () => [
      {
        title: t('permissions.rolePresetsRole'),
        dataIndex: 'role',
        width: 160,
        render: (role: string) => tenantRoleLabel(role),
      },
      {
        title: t('permissions.rolePresetsActions'),
        dataIndex: 'actions',
        render: (_: unknown, record) =>
          record.isAdmin ? (
            <Tag color="blue">{t('permissions.tenantAdminAllActions')}</Tag>
          ) : record.actions.length > 0 ? (
            record.actions.map((action) => (
              <Tag key={action}>{permissionActionLabel(action)}</Tag>
            ))
          ) : (
            <Text type="secondary">{t('permissions.rolePresetsNoBuiltin')}</Text>
          ),
      },
    ],
    [t],
  );

  return (
    <Collapse
      style={{ marginBottom: 16 }}
      items={[
        {
          key: 'presets',
          label: t('permissions.rolePresetsTitle'),
          children: (
            <>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                {t('permissions.rolePresetsHint')}
              </Text>
              <Table
                rowKey="key"
                size="small"
                pagination={false}
                columns={columns}
                dataSource={rows}
              />
            </>
          ),
        },
      ]}
    />
  );
}
