'use client'
import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import WaterBillingTab from '@/src/components/water/WaterBillingTab';
import ElectricBillingTab from '@/src/components/water/ElectricBillingTab';
import PricingFormulaModal from '@/src/components/water/PricingFormulaModal';

type ServiceCode = 'WATER' | 'ELECTRIC';

export default function BillingCyclesPage() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<ServiceCode>('WATER');
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [formulaVersion, setFormulaVersion] = useState<{ WATER: number; ELECTRIC: number }>({ WATER: 0, ELECTRIC: 0 });

  const handleFormulaUpdated = (serviceCode: ServiceCode) => {
    setFormulaVersion(prev => ({
      ...prev,
      [serviceCode]: prev[serviceCode] + 1,
    }));
  };

  return (
    <div className="px-[41px] py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#02542D]">Billing Cycles</h1>
        <button
          onClick={() => setShowFormulaModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          View Công Thức Tính
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('WATER')}
          className={`px-6 py-2 font-medium transition-colors ${
            activeTab === 'WATER'
              ? 'text-[#02542D] border-b-2 border-[#02542D]'
              : 'text-gray-600 hover:text-[#02542D]'
          }`}
        >
          Water
        </button>
        <button
          onClick={() => setActiveTab('ELECTRIC')}
          className={`px-6 py-2 font-medium transition-colors ${
            activeTab === 'ELECTRIC'
              ? 'text-[#02542D] border-b-2 border-[#02542D]'
              : 'text-gray-600 hover:text-[#02542D]'
          }`}
        >
          Electric
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'WATER' ? (
        <WaterBillingTab formulaVersion={formulaVersion.WATER} />
      ) : (
        <ElectricBillingTab formulaVersion={formulaVersion.ELECTRIC} />
      )}

      {showFormulaModal && (
        <PricingFormulaModal
          serviceCode={activeTab}
          onClose={() => setShowFormulaModal(false)}
          onUpdated={handleFormulaUpdated}
        />
      )}
    </div>
  );
}

