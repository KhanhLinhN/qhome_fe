'use client'
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import { getBuildings, Building } from '@/src/services/base/buildingService';
import {
  getAllReadingCycles,
  getActiveServices,
  createMeterReadingAssignment,
  MeterReadingAssignmentCreateReq,
  ReadingCycleDto,
  ServiceDto,
} from '@/src/services/base/waterService';
import { useNotifications } from '@/src/hooks/useNotifications';
import Select from '@/src/components/customer-interaction/Select';

export default function AddAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hasRole } = useAuth();
  const { show } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [cycles, setCycles] = useState<ReadingCycleDto[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);

  // Form fields
  const [selectedCycleId, setSelectedCycleId] = useState<string>(
    searchParams.get('cycleId') || ''
  );
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [floorFrom, setFloorFrom] = useState<string>('');
  const [floorTo, setFloorTo] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [cyclesData, buildingsData, servicesData] = await Promise.all([
          getAllReadingCycles(),
          getBuildings(),
          getActiveServices()
        ]);

        setCycles(cyclesData);
        setBuildings(buildingsData);
        // Filter services that require meter
        setServices(servicesData.filter(s => s.requiresMeter));
      } catch (error) {
        console.error('Failed to load data:', error);
        show('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [show]);

  // Auto-fill dates when cycle is selected
  useEffect(() => {
    if (selectedCycleId) {
      const cycle = cycles.find(c => c.id === selectedCycleId);
      if (cycle) {
        setStartDate(cycle.periodFrom.split('T')[0]);
        setEndDate(cycle.periodTo.split('T')[0]);
      }
    }
  }, [selectedCycleId, cycles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCycleId) {
      show('Please select a cycle', 'error');
      return;
    }

    if (!selectedServiceId) {
      show('Please select a service', 'error');
      return;
    }

    if (!assignedTo) {
      show('Please enter staff ID to assign to', 'error');
      return;
    }

    try {
      setLoading(true);

      const req: MeterReadingAssignmentCreateReq = {
        cycleId: selectedCycleId,
        serviceId: selectedServiceId,
        assignedTo: assignedTo,
        buildingId: selectedBuildingId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        floorFrom: floorFrom ? parseInt(floorFrom) : undefined,
        floorTo: floorTo ? parseInt(floorTo) : undefined,
        note: note || undefined,
      };

      await createMeterReadingAssignment(req);
      show('Assignment created successfully', 'success');
      router.push('/base/(waterelectric)/(water)/waterAssign');
    } catch (error: any) {
      console.error('Failed to create assignment:', error);
      show(error?.response?.data?.message || error?.message || 'Failed to create assignment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading && cycles.length === 0) {
    return (
      <div className="px-[41px] py-12">
        <div className="bg-white p-6 rounded-xl text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#739559] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[41px] py-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-900"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-semibold text-[#02542D]">Add New Assignment</h1>
      </div>

      <div className="bg-white p-6 rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reading Cycle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reading Cycle <span className="text-red-500">*</span>
            </label>
            <Select
              options={cycles}
              value={selectedCycleId}
              onSelect={(cycle) => setSelectedCycleId(cycle.id)}
              renderItem={(cycle) => `${cycle.name} (${cycle.status}) - ${new Date(cycle.periodFrom).toLocaleDateString()} to ${new Date(cycle.periodTo).toLocaleDateString()}`}
              getValue={(cycle) => cycle.id}
              placeholder="Select a reading cycle..."
            />
          </div>

          {/* Building (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Building <span className="text-gray-500 text-xs">(Optional - leave empty for all buildings)</span>
            </label>
            <Select
              options={buildings}
              value={selectedBuildingId}
              onSelect={(building) => setSelectedBuildingId(building.id)}
              renderItem={(building) => `${building.name} (${building.code})`}
              getValue={(building) => building.id}
              placeholder="Select a building (optional)..."
            />
            {selectedBuildingId && (
              <button
                type="button"
                onClick={() => setSelectedBuildingId('')}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            )}
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service <span className="text-red-500">*</span>
            </label>
            <Select
              options={services}
              value={selectedServiceId}
              onSelect={(service) => setSelectedServiceId(service.id)}
              renderItem={(service) => `${service.name} (${service.code})`}
              getValue={(service) => service.id}
              placeholder="Select a service..."
            />
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To (Staff ID) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Enter staff user ID"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559]"
              required
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-gray-500 text-xs">(Optional - defaults to cycle start)</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-gray-500 text-xs">(Optional - defaults to cycle end)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559]"
              />
            </div>
          </div>

          {/* Floor Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor From <span className="text-gray-500 text-xs">(Optional - leave empty for all floors)</span>
              </label>
              <input
                type="number"
                value={floorFrom}
                onChange={(e) => setFloorFrom(e.target.value)}
                placeholder="e.g. 1"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor To <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="number"
                value={floorTo}
                onChange={(e) => setFloorTo(e.target.value)}
                placeholder="e.g. 10"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559]"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCycleId || !selectedServiceId || !assignedTo}
              className="px-6 py-2 bg-[#02542D] text-white rounded-md hover:bg-[#024428] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

