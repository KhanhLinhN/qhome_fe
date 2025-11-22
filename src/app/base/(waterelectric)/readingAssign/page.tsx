import Link from 'next/link';

const services = [
  {
    slug: 'water',
    label: 'Nước',
    description: 'Quản lý assignment chu kỳ nước: kiểm tra lần đọc, phân công kỹ thuật viên và xuất hóa đơn.',
  },
  {
    slug: 'electric',
    label: 'Điện',
    description: 'Theo dõi assignment chu kỳ điện riêng biệt để đảm bảo chỉ tiêu và kế hoạch đọc đồng hồ.',
  },
];

export default function ReadingAssignIndexPage() {
  return (
    <div className="px-[41px] py-12 space-y-8">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">Assignment Management</p>
        <h1 className="text-3xl font-semibold text-[#02542D] mt-2">Chọn dịch vụ để xem dữ liệu</h1>
        <p className="text-sm text-gray-600 mt-1">
          Mỗi dịch vụ có chu kỳ và assignment tách biệt. Chọn service cụ thể để xem task, tiến độ và export hóa đơn.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <Link
            key={service.slug}
            href={`/base/readingAssign/${service.slug}`}
            className="block border border-gray-200 rounded-xl p-6 shadow-sm hover:border-[#02542D] transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-gray-500">Dịch vụ</p>
                <h2 className="text-xl font-semibold text-[#02542D]">{service.label}</h2>
              </div>
              <span className="text-xs font-semibold text-[#02542D] uppercase">Mở</span>
            </div>
            <p className="text-sm text-gray-600 mt-3">{service.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
