import { CloseOutlined } from '@ant-design/icons';
import { Button, Checkbox, Typography } from 'antd';
import { useMemo, type CSSProperties } from 'react';
import { useT } from '../../i18n';
import { PERMISSION_ACTIONS, permissionActionLabel } from '../../utils/roles';

const { Text } = Typography;

interface PermissionActionsPickerProps {
  value?: string[];
  onChange?: (value: string[]) => void;
}

function sortActions(actions: string[]): string[] {
  const order = new Map(PERMISSION_ACTIONS.map((action, index) => [action, index]));
  return [...actions].sort(
    (a, b) => (order.get(a as (typeof PERMISSION_ACTIONS)[number]) ?? 99) - (order.get(b as (typeof PERMISSION_ACTIONS)[number]) ?? 99),
  );
}

function panelStyle(): CSSProperties {
  return {
    flex: 1,
    minWidth: 0,
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    background: '#fafafa',
  };
}

function ActionItem({
  action,
  checked,
  onCheckedChange,
  onRemove,
}: {
  action: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onRemove?: () => void;
}) {
  const t = useT();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 4,
        padding: '6px 8px',
        borderRadius: 6,
        background: checked ? 'rgba(22,119,255,0.08)' : '#fff',
      }}
    >
      <Checkbox
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        style={{ alignItems: 'flex-start', flex: 1 }}
      >
        <div>
          <div>{permissionActionLabel(action)}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t(`permissions.actionDesc.${action}`)}
          </Text>
        </div>
      </Checkbox>
      {onRemove ? (
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          aria-label={t('permissions.removeAction', { action: permissionActionLabel(action) })}
          onClick={onRemove}
          style={{ marginTop: 2 }}
        />
      ) : null}
    </div>
  );
}

export default function PermissionActionsPicker({ value = [], onChange }: PermissionActionsPickerProps) {
  const t = useT();

  const selected = useMemo(() => sortActions(value), [value]);
  const available = useMemo(
    () => PERMISSION_ACTIONS.filter((action) => !selected.includes(action)),
    [selected],
  );

  const addAction = (action: string) => {
    onChange?.(sortActions([...selected, action]));
  };

  const removeAction = (action: string) => {
    onChange?.(selected.filter((item) => item !== action));
  };

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
      <div style={panelStyle()}>
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            fontWeight: 500,
          }}
        >
          {t('permissions.availableActions')}
          <Text type="secondary" style={{ marginLeft: 8, fontWeight: 400 }}>
            ({available.length})
          </Text>
        </div>
        <div style={{ flex: 1, minHeight: 220, maxHeight: 280, overflow: 'auto', padding: 8 }}>
          {available.length === 0 ? (
            <Text type="secondary" style={{ display: 'block', padding: '12px 8px' }}>
              {t('permissions.actionsListEmpty')}
            </Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {available.map((action) => (
                <ActionItem
                  key={action}
                  action={action}
                  checked={false}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      addAction(action);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={panelStyle()}>
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            fontWeight: 500,
          }}
        >
          {t('permissions.selectedActions')}
          <Text type="secondary" style={{ marginLeft: 8, fontWeight: 400 }}>
            ({selected.length})
          </Text>
        </div>
        <div style={{ flex: 1, minHeight: 220, maxHeight: 280, overflow: 'auto', padding: 8 }}>
          {selected.length === 0 ? (
            <Text type="secondary" style={{ display: 'block', padding: '12px 8px' }}>
              {t('permissions.actionsListEmpty')}
            </Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selected.map((action) => (
                <ActionItem
                  key={action}
                  action={action}
                  checked
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      removeAction(action);
                    }
                  }}
                  onRemove={() => removeAction(action)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
