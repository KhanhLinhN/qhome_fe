'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getAllInvoicesForAdmin, InvoiceDto, InvoiceLineDto } from '@/src/services/finance/invoiceAdminService';
import { useNotifications } from '@/src/hooks/useNotifications';
import axios from '@/src/lib/axios';

const SERVICE_CODE_OPTIONS = [
  { value: '', label: 'Tất cả dịch vụ' },
  { value: 'ELECTRICITY', label: 'Điện' },
  { value: 'WATER', label: 'Nước' },
  { value: 'VEHICLE_CARD', label: 'Thẻ xe' },
  { value: 'ELEVATOR_CARD', label: 'Thẻ thang máy' },
  { value: 'RESIDENT_CARD', label: 'Thẻ cư dân' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'PUBLISHED', label: 'Đã phát hành' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'VOID', label: 'Đã hủy' },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Nháp', className: 'bg-gray-100 text-gray-700' },
  PUBLISHED: { label: 'Đã phát hành', className: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-700' },
  VOID: { label: 'Đã hủy', className: 'bg-red-100 text-red-700' },
};

const SERVICE_CODE_LABELS: Record<string, string> = {
  ELECTRICITY: 'Điện',
  WATER: 'Nước',
  VEHICLE_CARD: 'Thẻ xe',
  ELEVATOR_CARD: 'Thẻ thang máy',
  RESIDENT_CARD: 'Thẻ cư dân',
};

export default function InvoicesManagementPage() {
  const { show } = useNotifications();
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null);
  
  // Filters
  const [serviceCodeFilter, setServiceCodeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Generate month options (last 12 months + current month)
  const monthOptions = useMemo(() => {
    const options = [{ value: '', label: 'Tất cả tháng' }];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      options.push({ value, label: month });
    }
    return options;
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [serviceCodeFilter, statusFilter, monthFilter]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (serviceCodeFilter) params.serviceCode = serviceCodeFilter;
      if (statusFilter) params.status = statusFilter;
      
      // Convert month filter (YYYY-MM) to startDate and endDate
      if (monthFilter) {
        const [year, month] = monthFilter.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      }
      
      const data = await getAllInvoicesForAdmin(params);
      setInvoices(data);
    } catch (error: any) {
      console.error('Failed to load invoices:', error);
      show('Không thể tải danh sách hóa đơn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.code?.toLowerCase().includes(query) ||
        invoice.billToName?.toLowerCase().includes(query) ||
        invoice.billToAddress?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [invoices, searchQuery]);

  const statistics = useMemo(() => {
    const stats = {
      total: filteredInvoices.length,
      totalAmount: 0,
      byStatus: {
        DRAFT: { count: 0, amount: 0 },
        PUBLISHED: { count: 0, amount: 0 },
        PAID: { count: 0, amount: 0 },
        VOID: { count: 0, amount: 0 },
      },
      byService: {} as Record<string, { count: number; amount: number }>,
    };

    filteredInvoices.forEach(invoice => {
      const amount = invoice.totalAmount || 0;
      stats.totalAmount += amount;
      
      const status = invoice.status || 'DRAFT';
      if (stats.byStatus[status as keyof typeof stats.byStatus]) {
        stats.byStatus[status as keyof typeof stats.byStatus].count++;
        stats.byStatus[status as keyof typeof stats.byStatus].amount += amount;
      }

      // Group by service code from invoice lines
      invoice.lines?.forEach(line => {
        const serviceCode = line.serviceCode || 'OTHER';
        if (!stats.byService[serviceCode]) {
          stats.byService[serviceCode] = { count: 0, amount: 0 };
        }
        stats.byService[serviceCode].count++;
        stats.byService[serviceCode].amount += line.lineTotal || 0;
      });
    });

    return stats;
  }, [filteredInvoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleExportExcel = async () => {
    try {
      const params: any = {};
      if (serviceCodeFilter) params.serviceCode = serviceCodeFilter;
      if (statusFilter) params.status = statusFilter;
      if (monthFilter) {
        params.month = monthFilter;
        const [year, month] = monthFilter.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      }
      
      const BASE_URL = process.env.NEXT_PUBLIC_FINANCE_BASE_URL || 'http://localhost:8085';
      const queryString = new URLSearchParams(params).toString();
      
      const response = await axios.get(
        `${BASE_URL}/api/invoices/admin/export?${queryString}`,
        {
          responseType: 'blob',
          withCredentials: true,
        }
      );
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `danh_sach_hoa_don_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      } else if (monthFilter) {
        const monthFormatted = monthFilter.replace('-', '');
        filename = `danh_sach_hoa_don_${monthFormatted}.xlsx`;
      }
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      show('Xuất file Excel thành công', 'success');
    } catch (error: any) {
      console.error('Failed to export Excel:', error);
      show('Không thể xuất file Excel', 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Thu Chi</h1>
          <p className="text-gray-600">Xem và quản lý tất cả các hóa đơn trong hệ thống</p>
        </div>
        <button
          onClick={handleExportExcel}
          className="px-4 py-2 bg-[#02542D] text-white rounded-md hover:bg-[#014a26] transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Xuất Excel
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Tổng số hóa đơn</div>
          <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Tổng giá trị</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(statistics.totalAmount)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Đã thanh toán</div>
          <div className="text-2xl font-bold text-green-600">
            {statistics.byStatus.PAID.count} ({formatCurrency(statistics.byStatus.PAID.amount)})
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Chưa thanh toán</div>
          <div className="text-2xl font-bold text-yellow-600">
            {statistics.byStatus.PUBLISHED.count} ({formatCurrency(statistics.byStatus.PUBLISHED.amount)})
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mã hóa đơn, tên, địa chỉ..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#02542D]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại dịch vụ</label>
            <select
              value={serviceCodeFilter}
              onChange={(e) => setServiceCodeFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#02542D]"
            >
              {SERVICE_CODE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#02542D]"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#02542D]"
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden relative z-0">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có hóa đơn nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã HĐ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày phát hành
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dịch vụ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.issuedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{invoice.billToName || '-'}</div>
                      <div className="text-xs text-gray-400">{invoice.billToAddress || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {invoice.lines?.map((line, idx) => (
                        <div key={idx} className="text-xs">
                          {SERVICE_CODE_LABELS[line.serviceCode] || line.serviceCode}
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.totalAmount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        STATUS_CONFIG[invoice.status]?.className || 'bg-gray-100 text-gray-700'
                      }`}>
                        {STATUS_CONFIG[invoice.status]?.label || invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="text-[#02542D] hover:text-[#023a20] font-medium"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết hóa đơn</h2>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-600">Mã hóa đơn</div>
                  <div className="font-medium">{selectedInvoice.code || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Trạng thái</div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    STATUS_CONFIG[selectedInvoice.status]?.className || 'bg-gray-100 text-gray-700'
                  }`}>
                    {STATUS_CONFIG[selectedInvoice.status]?.label || selectedInvoice.status}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ngày phát hành</div>
                  <div className="font-medium">{formatDate(selectedInvoice.issuedAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Hạn thanh toán</div>
                  <div className="font-medium">{formatDate(selectedInvoice.dueDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Người thanh toán</div>
                  <div className="font-medium">{selectedInvoice.billToName || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Địa chỉ</div>
                  <div className="font-medium">{selectedInvoice.billToAddress || '-'}</div>
                </div>
                {selectedInvoice.paidAt && (
                  <div>
                    <div className="text-sm text-gray-600">Ngày thanh toán</div>
                    <div className="font-medium">{formatDate(selectedInvoice.paidAt)}</div>
                  </div>
                )}
                {selectedInvoice.paymentGateway && (
                  <div>
                    <div className="text-sm text-gray-600">Phương thức thanh toán</div>
                    <div className="font-medium">{selectedInvoice.paymentGateway}</div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Chi tiết dịch vụ</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dịch vụ</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedInvoice.lines?.map((line) => (
                      <tr key={line.id}>
                        <td className="px-4 py-2 text-sm">
                          {SERVICE_CODE_LABELS[line.serviceCode] || line.serviceCode}
                        </td>
                        <td className="px-4 py-2 text-sm">{line.description || '-'}</td>
                        <td className="px-4 py-2 text-sm">{line.quantity} {line.unit}</td>
                        <td className="px-4 py-2 text-sm">{formatCurrency(line.unitPrice || 0)}</td>
                        <td className="px-4 py-2 text-sm font-medium">{formatCurrency(line.lineTotal || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-end">
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Tổng cộng</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(selectedInvoice.totalAmount || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

