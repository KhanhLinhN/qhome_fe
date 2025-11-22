import ReadingAssignDashboard from '@/src/components/base-service/ReadingAssignDashboard';

const SERVICE_CONFIG: Record<string, { code: string; label: string }> = {
  water: { code: 'WATER', label: 'Nước' },
  electric: { code: 'ELECTRIC', label: 'Điện' },
};

interface ReadingAssignServicePageProps {
  params: {
    service: string;
  };
}

export default function ReadingAssignServicePage({ params }: ReadingAssignServicePageProps) {
  const slug = params.service?.toLowerCase() ?? '';
  const config = SERVICE_CONFIG[slug];

  if (!config) {
    return (
      <div className="px-[41px] py-12">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
          <h1 className="text-xl font-semibold text-[#02542D]">Dịch vụ không hợp lệ</h1>
          <p className="text-sm text-gray-600 mt-2">Vui lòng quay lại danh sách dịch vụ để chọn lại.</p>
        </div>
      </div>
    );
  }

  return (
    <ReadingAssignDashboard serviceCode={config.code} serviceLabel={config.label} />
  );
}


