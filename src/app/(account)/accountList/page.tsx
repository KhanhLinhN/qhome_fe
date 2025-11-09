'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchResidentAccounts,
  fetchStaffAccounts,
  UserAccountInfo,
  deleteAccount,
} from '@/src/services/iam/userService';
import Table from '@/src/components/base-service/Table';
import Pagination from '@/src/components/customer-interaction/Pagination';
import Select from '@/src/components/customer-interaction/Select';
import { useNotifications } from '@/src/hooks/useNotifications';
const PAGE_SIZE = 10;
const TABLE_HEADERS = ['Username', 'Email', 'Roles', 'Trạng thái', 'Action'];

type SelectOption = {
  id: string;
  label: string;
};

type AccountRow = {
  key: string;
  username: string;
  email: string;
  roles: string;
  active: boolean;
  rolesList: string[];
  buildingId?: string;
  buildingName?: string;
  accountType: 'staff' | 'resident';
};

const toAccountRow = (
  account: UserAccountInfo,
  accountType: 'staff' | 'resident',
): AccountRow => ({
  key: account.userId,
  username: account.username,
  email: account.email,
  roles: account.roles?.join(', ') || '—',
  active: account.active,
  rolesList:
    account.roles?.map((role) => role.trim().toUpperCase()).filter(Boolean) || [],
  buildingId: account.buildingId,
  buildingName: account.buildingName || account.buildingCode,
  accountType,
});

export default function AccountListPage() {
  const router = useRouter();
  const [staffAccounts, setStaffAccounts] = useState<AccountRow[]>([]);
  const [residentAccounts, setResidentAccounts] = useState<AccountRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'STAFF' | 'RESIDENT'>('STAFF');
  const [roleFilter, setRoleFilter] = useState<'ALL' | string>('ALL');
  const [buildingFilter, setBuildingFilter] = useState<'ALL' | string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [staffPage, setStaffPage] = useState(1);
  const [residentPage, setResidentPage] = useState(1);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show } = useNotifications();

  useEffect(() => {
    let active = true;

    const loadAccounts = async () => {
      setError(null);
      setLoadingStaff(true);
      setLoadingResidents(true);
      try {
        const [staffRes, residentRes] = await Promise.all([
          fetchStaffAccounts(),
          fetchResidentAccounts(),
        ]);

        if (!active) return;

        setStaffAccounts(staffRes.map((row) => toAccountRow(row, 'staff')));
        setResidentAccounts(residentRes.map((row) => toAccountRow(row, 'resident')));
      } catch (err: any) {
        if (!active) return;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Không thể tải danh sách tài khoản.';
        setError(message);
      } finally {
        if (active) {
          setLoadingStaff(false);
          setLoadingResidents(false);
        }
      }
    };

    loadAccounts();

    return () => {
      active = false;
    };
  }, []);

  const formatRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'ACCOUNTANT':
        return 'Accountant';
      case 'TECHNICIAN':
        return 'Technician';
      case 'SUPPORTER':
        return 'Supporter';
      case 'RESIDENT':
        return 'Resident';
      case 'UNIT OWNER':
        return 'Unit Owner';
      default:
        return role
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/(^\w|\s\w)/g, (c) => c.toUpperCase());
    }
  };

  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    staffAccounts.forEach((row) => row.rolesList.forEach((role) => roles.add(role)));
    return Array.from(roles).sort();
  }, [staffAccounts]);

  const uniqueBuildings = useMemo(() => {
    const buildings = new Map<string, string>();
    residentAccounts.forEach((row) => {
      if (row.buildingId) {
        buildings.set(row.buildingId, row.buildingName || row.buildingId);
      } else if (row.buildingName) {
        buildings.set(row.buildingName, row.buildingName);
      }
    });
    return Array.from(buildings.entries()).map(([id, name]) => ({ id, name }));
  }, [residentAccounts]);

  const roleOptions: SelectOption[] = useMemo(
    () => [
      { id: 'ALL', label: 'Tất cả vai trò' },
      ...uniqueRoles.map((role) => ({
        id: role,
        label: formatRoleLabel(role),
      })),
    ],
    [uniqueRoles],
  );

  const buildingOptions: SelectOption[] = useMemo(
    () => [
      { id: 'ALL', label: 'Tất cả tòa nhà' },
      ...uniqueBuildings.map((building) => ({
        id: building.id,
        label: building.name,
      })),
    ],
    [uniqueBuildings],
  );

  const statusOptions: SelectOption[] = useMemo(
    () => [
      { id: 'ALL', label: 'Tất cả trạng thái' },
      { id: 'ACTIVE', label: 'Đang hoạt động' },
      { id: 'INACTIVE', label: 'Ngưng hoạt động' },
    ],
    [],
  );

  const filteredStaff = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    return staffAccounts.filter((row) => {
      const matchesSearch =
        !keyword ||
        row.username.toLowerCase().includes(keyword) ||
        row.email.toLowerCase().includes(keyword) ||
        row.roles.toLowerCase().includes(keyword);

      const matchesRole =
        roleFilter === 'ALL' || row.rolesList.includes(roleFilter);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' ? row.active : !row.active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffAccounts, searchTerm, roleFilter, statusFilter]);

  const filteredResidents = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    return residentAccounts.filter((row) => {
      const matchesSearch =
        !keyword ||
        row.username.toLowerCase().includes(keyword) ||
        row.email.toLowerCase().includes(keyword) ||
        row.roles.toLowerCase().includes(keyword);

      const matchesRole =
        buildingFilter === 'ALL' ||
        row.buildingId === buildingFilter ||
        row.buildingName === buildingFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' ? row.active : !row.active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [residentAccounts, searchTerm, buildingFilter, statusFilter]);

  useEffect(() => {
    setStaffPage(1);
    setResidentPage(1);
  }, [searchTerm, roleFilter, buildingFilter, statusFilter]);

  useEffect(() => {
    if (activeTab === 'STAFF') {
      setBuildingFilter('ALL');
    } else {
      setRoleFilter('ALL');
    }
  }, [activeTab]);

  const staffTotalPages = Math.max(1, Math.ceil(filteredStaff.length / PAGE_SIZE));
  const residentTotalPages = Math.max(1, Math.ceil(filteredResidents.length / PAGE_SIZE));

  useEffect(() => {
    if (staffPage > staffTotalPages) {
      setStaffPage(staffTotalPages);
    }
  }, [staffPage, staffTotalPages]);

  useEffect(() => {
    if (residentPage > residentTotalPages) {
      setResidentPage(residentTotalPages);
    }
  }, [residentPage, residentTotalPages]);

  const staffRows = useMemo(() => {
    const start = (staffPage - 1) * PAGE_SIZE;
    return filteredStaff.slice(start, start + PAGE_SIZE);
  }, [filteredStaff, staffPage]);

  const residentRows = useMemo(() => {
    const start = (residentPage - 1) * PAGE_SIZE;
    return filteredResidents.slice(start, start + PAGE_SIZE);
  }, [filteredResidents, residentPage]);

  const currentRows = activeTab === 'STAFF' ? staffRows : residentRows;
  const currentLoading = activeTab === 'STAFF' ? loadingStaff : loadingResidents;
  const currentPage = activeTab === 'STAFF' ? staffPage : residentPage;
  const currentTotalPages =
    activeTab === 'STAFF' ? staffTotalPages : residentTotalPages;

  const tableData = currentRows.map((row) => ({
    userId: row.key,
    username: row.username,
    email: row.email,
    roles: row.roles,
    active: row.active,
    accountId: row.key,
    buildingName: row.buildingName,
    accountType: row.accountType,
  }));

  const handlePageChange = (page: number) => {
    if (activeTab === 'STAFF') {
      setStaffPage(page);
    } else {
      setResidentPage(page);
    }
  };

  if (error) {
    return (
      <div className="px-[41px] py-12 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-2 text-white rounded-md hover:bg-primary-3 transition"
          >
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  async function handleDelete(id: string) {
    try {
      await deleteAccount(id);
      window.location.reload();
      show('Xóa tài khoản thành công', 'success');
    } catch (error) {
      show('Có lỗi xảy ra khi xóa tài khoản', 'error');
      console.error('Error deleting account:', error);
    }
  }

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="max-w-screen overflow-x-hidden">
        <h1 className="text-2xl font-semibold text-[#02542D] mb-4">
          Danh sách tài khoản
        </h1>
        <div className="bg-white p-6 rounded-xl w-full min-h-[200px] shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-500">Filter:</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="w-full md:w-64">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm kiếm theo username, email hoặc vai trò"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              {activeTab === 'STAFF' ? (
                <div className="w-full md:w-48">
                  <Select
                    options={roleOptions}
                    value={roleFilter}
                    onSelect={(option) =>
                      setRoleFilter(option.id === 'ALL' ? 'ALL' : option.id.toUpperCase())
                    }
                    renderItem={(option) => option.label}
                    getValue={(option) => option.id}
                    placeholder="Tất cả vai trò"
                  />
                </div>
              ) : (
                <div className="w-full md:w-48">
                  <Select
                    options={buildingOptions}
                    value={buildingFilter}
                    onSelect={(option) =>
                      setBuildingFilter(option.id === 'ALL' ? 'ALL' : option.id)
                    }
                    renderItem={(option) => option.label}
                    getValue={(option) => option.id}
                    placeholder="Tất cả tòa nhà"
                  />
                </div>
              )}
              <div className="w-full md:w-48">
                <Select
                  options={statusOptions}
                  value={statusFilter}
                  onSelect={(option) =>
                    setStatusFilter(option.id as 'ALL' | 'ACTIVE' | 'INACTIVE')
                  }
                  renderItem={(option) => option.label}
                  getValue={(option) => option.id}
                  placeholder="Tất cả trạng thái"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                router.push(activeTab === 'STAFF' ? '/accountNewStaff' : '/accountNewRe')
              }
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              + Thêm tài khoản
            </button>
          </div>

          <div className="mt-6 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('STAFF')}
              className={`px-6 py-2 font-medium transition-colors ${
                activeTab === 'STAFF'
                  ? 'text-[#02542D] border-b-2 border-[#02542D]'
                  : 'text-gray-600 hover:text-[#02542D]'
              }`}
            >
              Nhân viên ({filteredStaff.length})
            </button>
            <button
              onClick={() => setActiveTab('RESIDENT')}
              className={`px-6 py-2 font-medium transition-colors ${
                activeTab === 'RESIDENT'
                  ? 'text-[#02542D] border-b-2 border-[#02542D]'
                  : 'text-gray-600 hover:text-[#02542D]'
              }`}
            >
              Cư dân ({filteredResidents.length})
            </button>
          </div>

          {currentLoading ? (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : (
            <>
              <Table 
                data={tableData} 
                headers={TABLE_HEADERS} 
                type="account" 
                onDelete={handleDelete}
              />
              {currentTotalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={currentTotalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

