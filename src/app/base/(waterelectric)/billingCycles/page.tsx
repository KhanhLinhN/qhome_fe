'use client'
import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import WaterBillingTab from './WaterBillingTab';
import ElectricBillingTab from './ElectricBillingTab';

export default function BillingCyclesPage() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'WATER' | 'ELECTRIC'>('WATER');


  return (
    <div className="px-[41px] py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#02542D]">Billing Cycles</h1>
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
      {activeTab === 'WATER' ? <WaterBillingTab /> : <ElectricBillingTab />}
    </div>
  );
}

