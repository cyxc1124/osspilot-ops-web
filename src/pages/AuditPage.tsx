import { useState } from 'react';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { exportAuditLogs, listAuditLogs } from '../api/audit';
import { ApiError } from '../api/client';
import type { AuditLogFilters, AuditLogItem } from '../api/types';
import { useT } from '../i18n';
import { useAuthStore } from '../stores/authStore';
import { formatDateTime } from '../utils/format';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface FilterForm {
  username?: string;
  tenant_name?: string;
  action?: string;
  status?: string;
  source_ip?: string;
  keyword?: string;
  tenant_id?: number;
  admin_only?: boolean;
  date_range?: [Dayjs, Dayjs];
}

function formToFilters(values: FilterForm, page: number, pageSize: number): AuditLogFilters {
  const filters: AuditLogFilters = {
    page,
    page_size: pageSize,
  };
  if (values.username) filters.username = values.username;
  if (values.tenant_name) filters.tenant_name = values.tenant_name;
  if (values.action) filters.action = values.action;
  if (values.status) filters.status = values.status;
  if (values.source_ip) filters.source_ip = values.source_ip;
  if (values.keyword) filters.keyword = values.keyword;
  if (values.tenant_id) filters.tenant_id = values.tenant_id;
  if (values.admin_only) filters.admin_only = true;
  if (values.date_range?.[0]) {
    filters.created_from = values.date_range[0].startOf('day').toISOString();
  }
  if (values.date_range?.[1]) {
    filters.created_to = values.date_range[1].endOf('day').toISOString();
  }
  return filters;
}

export default function AuditPage() {
  const t = useT();
  const token = useAuthStore((s) => s.token)!;
  const [form] = Form.useForm<FilterForm>();
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, page_size: 20 });
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => listAuditLogs(token, filters),
  });

  const handleSearch = (values: FilterForm) => {
    setFilters(formToFilters(values, 1, filters.page_size ?? 20));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: AuditLogFilters = { ...filters };
      delete exportFilters.page;
      delete exportFilters.page_size;
      const blob = await exportAuditLogs(token, exportFilters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
      link.download = `audit-logs-${stamp}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      message.success(t('audit.exportSuccess'));
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('audit.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const columns: ColumnsType<AuditLogItem> = [
    { title: t('common.id'), dataIndex: 'id', width: 72 },
    { title: t('common.time'), dataIndex: 'created_at', width: 170, render: formatDateTime },
    { title: t('common.user'), dataIndex: 'username', render: (v) => v ?? t('common.emDash') },
    {
      title: t('audit.tenant'),
      dataIndex: 'tenant_name',
      render: (v, r) => v ?? (r.tenant_id ? `#${r.tenant_id}` : t('common.emDash')),
    },
    { title: t('audit.action'), dataIndex: 'action' },
    { title: t('common.bucket'), dataIndex: 'bucket_name', render: (v) => v ?? t('common.emDash') },
    { title: t('audit.objectKey'), dataIndex: 'object_key', ellipsis: true, render: (v) => v ?? t('common.emDash') },
    { title: t('audit.sourceIp'), dataIndex: 'source_ip', render: (v) => v ?? t('common.emDash') },
    {
      title: t('common.status'),
      dataIndex: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={status === 'success' ? 'success' : 'error'}>{status}</Tag>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>
          {t('audit.title')}
        </Title>
        <Button icon={<DownloadOutlined />} loading={exporting} onClick={() => void handleExport()}>
          {t('audit.exportCsv')}
        </Button>
      </Space>

      <Form form={form} layout="inline" onFinish={handleSearch}>
        <Form.Item name="username" label={t('audit.username')}>
          <Input allowClear placeholder={t('audit.username')} />
        </Form.Item>
        <Form.Item name="tenant_name" label={t('audit.tenantName')}>
          <Input allowClear placeholder={t('audit.tenantNamePlaceholder')} />
        </Form.Item>
        <Form.Item name="action" label={t('audit.action')}>
          <Input allowClear placeholder={t('audit.actionPlaceholder')} />
        </Form.Item>
        <Form.Item name="status" label={t('common.status')}>
          <Select
            allowClear
            placeholder={t('common.all')}
            options={[
              { value: 'success', label: 'success' },
              { value: 'failure', label: 'failure' },
            ]}
            style={{ width: 120 }}
          />
        </Form.Item>
        <Form.Item name="source_ip" label={t('audit.sourceIp')}>
          <Input allowClear placeholder="IP" />
        </Form.Item>
        <Form.Item name="keyword" label={t('audit.keyword')}>
          <Input allowClear placeholder={t('audit.keywordPlaceholder')} />
        </Form.Item>
        <Form.Item name="tenant_id" label={t('audit.tenantId')}>
          <InputNumber min={1} placeholder="ID" style={{ width: 100 }} />
        </Form.Item>
        <Form.Item name="admin_only" valuePropName="checked">
          <Checkbox>{t('audit.adminOnly')}</Checkbox>
        </Form.Item>
        <Form.Item name="date_range" label={t('audit.dateRange')}>
          <RangePicker />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            {t('audit.search')}
          </Button>
        </Form.Item>
      </Form>

      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items ?? []}
        scroll={{ x: 1100 }}
        pagination={{
          current: filters.page ?? 1,
          pageSize: filters.page_size ?? 20,
          total: data?.total ?? 0,
          showTotal: (total) => t('common.totalRecords', { total }),
          onChange: (page, pageSize) => {
            const values = form.getFieldsValue();
            setFilters(formToFilters(values, page, pageSize));
          },
        }}
      />
    </Space>
  );
}
