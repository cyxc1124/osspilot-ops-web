import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Form, Input, Modal, message } from 'antd';
import { changePassword } from '../../api/auth';
import { ApiError } from '../../api/client';
import { useT } from '../../i18n';
import { useAuthStore } from '../../stores/authStore';
import LocaleSwitcher from '../LocaleSwitcher';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
  onLogout?: () => void;
  forced?: boolean;
}

interface FormValues {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export default function ChangePasswordModal({
  open,
  onClose,
  onChanged,
  onLogout,
  forced = false,
}: ChangePasswordModalProps) {
  const t = useT();
  const [form] = Form.useForm<FormValues>();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!token) {
        throw new Error(t('account.changeFailed'));
      }
      return changePassword(token, {
        old_password: values.old_password,
        new_password: values.new_password,
      });
    },
    onSuccess: () => {
      message.success(t('account.passwordChanged'));
      onChanged?.();
      onClose();
    },
    onError: (err: Error) => {
      message.error(err instanceof ApiError ? err.message : t('account.changeFailed'));
    },
  });

  return (
    <Modal
      title={forced ? t('account.mustChangeTitle') : t('account.changePassword')}
      open={open}
      onCancel={forced ? onLogout : onClose}
      onOk={() => form.submit()}
      okText={t('account.changePassword')}
      cancelText={forced ? t('nav.logout') : undefined}
      confirmLoading={mutation.isPending}
      destroyOnClose
      closable={!forced}
      maskClosable={!forced}
      keyboard={!forced}
    >
      {forced ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <p style={{ margin: 0 }}>{t('account.mustChangeHint')}</p>
          <LocaleSwitcher />
        </div>
      ) : null}
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => mutation.mutate(values)}
        autoComplete="off"
      >
        <Form.Item
          name="old_password"
          label={t('account.currentPassword')}
          rules={[{ required: true, message: t('account.currentPasswordRequired') }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          name="new_password"
          label={t('account.newPassword')}
          rules={[
            { required: true, message: t('account.newPasswordRequired') },
            { min: 8, message: t('account.passwordMinLength') },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirm_password"
          label={t('account.confirmPassword')}
          dependencies={['new_password']}
          rules={[
            { required: true, message: t('account.confirmPasswordRequired') },
            ({ getFieldValue }) => ({
              validator(_, value: string) {
                if (!value || getFieldValue('new_password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('account.passwordMismatch')));
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
