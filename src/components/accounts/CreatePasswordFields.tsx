import { useState } from 'react';
import { Checkbox, Form, Input, Switch } from 'antd';
import { useT } from '../../i18n';

export default function CreatePasswordFields() {
  const t = useT();
  const skipMustChange = Form.useWatch('skip_must_change');
  const [visible, setVisible] = useState(false);
  const toggle = { visible, onVisibleChange: setVisible };

  return (
    <>
      <Form.Item name="skip_must_change" valuePropName="checked">
        <Checkbox>{t('users.skipMustChange')}</Checkbox>
      </Form.Item>
      <Form.Item>
        <Switch size="small" checked={visible} onChange={setVisible} />
        <span style={{ marginLeft: 8 }}>{t('users.showPassword')}</span>
      </Form.Item>
      <Form.Item
        name="password"
        label={t('users.initialPassword')}
        rules={[
          { required: true, message: t('users.passwordRequired') },
          { min: 8, message: t('users.passwordMinLength') },
        ]}
      >
        <Input.Password visibilityToggle={toggle} placeholder={t('users.passwordMinLength')} />
      </Form.Item>
      {skipMustChange ? (
        <Form.Item
          name="confirm_password"
          label={t('account.confirmPassword')}
          dependencies={['password']}
          rules={[
            { required: true, message: t('account.confirmPasswordRequired') },
            ({ getFieldValue }) => ({
              validator(_, value: string) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('account.passwordMismatch')));
              },
            }),
          ]}
        >
          <Input.Password visibilityToggle={toggle} placeholder={t('users.passwordMinLength')} />
        </Form.Item>
      ) : null}
    </>
  );
}
