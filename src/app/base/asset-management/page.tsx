'use client';

import Link from 'next/link';

const actions = [
  {
    label: 'Danh sách tòa nhà',
    description: 'Truy cập danh sách tòa nhà để xem chi tiết, căn hộ và trạng thái meter.',
    href: '/base/building/buildingList',
  },
  {
    label: 'Quản lý meter',
    description: 'Xem bảng tổng hợp meter theo tòa nhà, dịch vụ và hành động nhanh mà không cần vào từng tòa.',
    href: '/base/meter-management',
  },
  {
    label: 'Tạo meter',
    description: 'Chọn tòa nhà, căn hộ rồi thêm meter mới theo dịch vụ.',
    href: '/base/building/buildingList',
  },
  {
    label: 'Phân công đọc meter',
    description: 'Chuyển qua phần phân công đọc điện/nước cho từng chu kỳ.',
    href: '/base/readingAssign',
  },
];

export default function AssetManagementPage() {
  return (
    <div className="px-[41px] py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">Quản lý tài sản</p>
        <h1 className="text-3xl font-semibold text-[#02542D]">Quản lý meter & tài sản</h1>
        <p className="text-sm text-gray-600 max-w-2xl">
          Trang tổng quan tập trung các thao tác liên quan đến meter: khám phá tòa nhà, thêm meter mới và
          chuyển sang phân công đọc để đảm bảo dữ liệu luôn được cập nhật.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="border border-gray-200 rounded-2xl p-6 space-y-4 bg-white shadow-sm hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold text-[#02542D]">{action.label}</h2>
            <p className="text-sm text-gray-600">{action.description}</p>
            <span className="text-sm font-semibold text-[#02542D]">→ Đi tới</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

