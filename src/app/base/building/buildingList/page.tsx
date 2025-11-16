'use client'
import {useTranslations} from 'next-intl';
import FilterForm from "../../../../components/base-service/FilterForm";
import Table from "../../../../components/base-service/Table";
import { useMemo, useState } from 'react';
import { useProjectPage } from '@/src/hooks/useProjectPage';
import Pagination from '@/src/components/customer-interaction/Pagination';
import { create } from 'domain';
import { useProjectAdd } from '@/src/hooks/useProjectAdd';
import { useRouter } from 'next/navigation';
import { useBuildingPage } from '@/src/hooks/useBuildingPage';
import { useAuth } from '@/src/contexts/AuthContext';
import PopupConfirm from '@/src/components/common/PopupComfirm';
import { updateBuilding } from '@/src/services/base/buildingService';


export default function Home() {
  const { user, hasRole } = useAuth();
  const t = useTranslations('Building');
  const headers = [t('buildingCode'), t('buildingName'), t('status'), t('createAt'), t('createBy'), t('action')];

  const {
    data,
    loading,
    error,
    filters,        
    allProjects, 
    pageNo,        
    totalPages,        
    handleFilterChange,
    handleClear,
    handlePageChange
  } = useBuildingPage()

  // Order by createdAt desc (newest first)
  const ordered = (data?.content || []).slice().sort((a: any, b: any) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  const tableData = ordered.map((item: any) => ({
    buildingId: item.id,      
    buildingCode: item.code,  
    buildingName: item.name,  
    floors: item.floorsMax,  
    status: item.status,
    createBy: item.createdBy,
    createdAt: item.createdAt?.slice(0, 10).replace(/-/g, '/')
  })) || [];

  const router = useRouter();
  const handleAdd = () => {
    router.push(`/base/building/buildingNew`);
  };

  const handleDelete = () => {
    router.push(`/base/building/buildingList`);
  };

  // Change building status with confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedBuildingStatus, setSelectedBuildingStatus] = useState<string | null>(null);

  const onBuildingStatusChange = (buildingId: string) => {
    const row = tableData.find(r => r.buildingId === buildingId);
    setSelectedBuildingId(buildingId);
    setSelectedBuildingStatus(row?.status ?? null);
    setConfirmOpen(true);
  };

  const handleConfirmChange = async () => {
    if (!selectedBuildingId || !selectedBuildingStatus) {
      setConfirmOpen(false);
      return;
    }
    const newStatus = selectedBuildingStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateBuilding(selectedBuildingId, { status: newStatus } as any);
      setConfirmOpen(false);
      setSelectedBuildingId(null);
      setSelectedBuildingStatus(null);
      window.location.reload();
    } catch (e) {
      // optionally show error
      setConfirmOpen(false);
    }
  };

  const handleCloseConfirm = () => {
    setConfirmOpen(false);
    setSelectedBuildingId(null);
    setSelectedBuildingStatus(null);
  };
 
   
  // Handle loading and error states
  if (loading) {
    return (
        <div className="px-[41px] py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="px-[41px] py-12 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {t('error')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-2 text-white rounded-md hover:bg-primary-3"
            >
              {t('retry')}
            </button>
          </div>
        </div>
    );
  }

  return (
    <div className="lg:col-span-1 space-y-6 ">
      <div className="max-w-screen overflow-x-hidden ">
          <h1 className="text-2xl font-semibold text-[#02542D] mb-4">{t('requestlist')}</h1>
          <div className="bg-white p-6 rounded-xl w-full min-h-[200px]">
              <FilterForm
                filters={filters}
                page='building'
                onFilterChange={handleFilterChange}
                onAdd={handleAdd}
                onClear={handleClear}
                onDelete={handleDelete}
                projectList={allProjects}
              ></FilterForm>
              <Table 
                  data={tableData} 
                  headers={headers}
                  type='building'
                  onBuildingStatusChange={onBuildingStatusChange}
              ></Table>
              <Pagination
                  currentPage={pageNo + 1} 
                  totalPages={totalPages}
                  onPageChange={(page) => handlePageChange(page - 1)} 
              />
          </div>
      </div>
      <PopupConfirm
        isOpen={confirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmChange}
        popupTitle={t('confirmChangeStatusTitle') || 'Xác nhận thay đổi trạng thái'}
        popupContext={selectedBuildingStatus === 'ACTIVE' ? (t('confirmDeactivateBuilding') || 'Bạn có chắc muốn vô hiệu hoá tòa nhà này?') : (t('confirmActivateBuilding') || 'Bạn có chắc muốn kích hoạt tòa nhà này?')}
        isDanger={false}
      />
    </div>
  )

};
