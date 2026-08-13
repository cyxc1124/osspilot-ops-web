import { Collapse, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';
import { useT } from '../../i18n';
import { PERMISSION_ACTIONS, permissionActionLabel } from '../../utils/roles';

const { Text } = Typography;

interface ActionRow {
  key: string;
  action: string;
  description: string;
}

export default function PermissionActionsPanel() {
  const t = useT();

  const rows = useMemo<ActionRow[]>(
    () =>
      PERMISSION_ACTIONS.map((action) => ({
        key: action,
        action,
        description: t(`permissions.actionDesc.${action}`),
      })),
    [t],
  );

  const columns: ColumnsType<ActionRow> = useMemo(
    () => [
      {
        title: t('permissions.actions'),
        dataIndex: 'action',
        width: 120,
        render: (action: string) => permissionActionLabel(action),
      },
      {
        title: t('permissions.actionReferenceTitle'),
        dataIndex: 'description',
        render: (description: string) => <Text type="secondary">{description}</Text>,
      },
    ],
    [t],
  );

  return (
    <Collapse
      style={{ marginBottom: 16 }}
      items={[
        {
          key: 'actions',
          label: t('permissions.actionReferenceTitle'),
          children: (
            <Table
              rowKey="key"
              size="small"
              pagination={false}
              columns={columns}
              dataSource={rows}
            />
          ),
        },
      ]}
    />
  );
}
