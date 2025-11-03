'use client'
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  loadBillingPeriod,
  getBillingCyclesByPeriod,
  createBillingCycle,
  updateBillingCycleStatus,
  BillingCycleDto,
  CreateBillingCycleRequest,
} from '@/src/services/base/waterService';
import { useNotifications } from '@/src/hooks/useNotifications';
import DateBox from '@/src/components/customer-interaction/DateBox';

export default function BillingCyclesPage() {
  const { user } = useAuth();
  const { show } = useNotifications();
  const [cycles, setCycles] = useState<BillingCycleDto[]>([]);
  const [filteredCycles, setFilteredCycles] = useState<BillingCycleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    loadCyclesByYear();
  }, [yearFilter]);

  useEffect(() => {
    if (dateFrom && dateTo) {
      loadCyclesByPeriod();
    } else {
      setFilteredCycles(cycles);
    }
  }, [dateFrom, dateTo]);

  const loadCyclesByYear = async () => {
    try {
      setLoading(true);
      const data = await loadBillingPeriod(yearFilter);
      setCycles(data);
      setFilteredCycles(data);
    } catch (error) {
      console.error('Failed to load billing cycles:', error);
      show('Failed to load billing cycles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCyclesByPeriod = async () => {
    try {
      setLoading(true);
      const data = await getBillingCyclesByPeriod(dateFrom, dateTo);
      setCycles(data);
      setFilteredCycles(data);
    } catch (error) {
      console.error('Failed to load billing cycles:', error);
      show('Failed to load billing cycles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (req: CreateBillingCycleRequest) => {
    try {
      await createBillingCycle(req);
      show('Billing cycle created successfully', 'success');
      setIsCreateOpen(false);
      loadCyclesByYear();
    } catch (error: any) {
      show(error?.message || 'Failed to create billing cycle', 'error');
    }
  };

  const handleStatusChange = async (cycleId: string, status: string) => {
    try {
      await updateBillingCycleStatus(cycleId, status);
      show('Status updated successfully', 'success');
      loadCyclesByYear();
    } catch (error: any) {
      show(error?.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="px-[41px] py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#02542D]">Billing Cycles</h1>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-[#02542D] text-white rounded-md hover:bg-[#024428] transition-colors"
        >
          Create Cycle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <input
              type="number"
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(parseInt(e.target.value));
                setDateFrom('');
                setDateTo('');
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <DateBox
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                if (!e.target.value) setDateTo('');
              }}
              placeholderText="Select from date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <div className={!dateFrom ? 'opacity-50 pointer-events-none' : ''}>
              <DateBox
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholderText="Select to date"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cycles Table */}
      {filteredCycles.length > 0 && (
        <div className="bg-white p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-[#02542D] mb-4">Billing Cycles ({filteredCycles.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-solid border-[#14AE5C]">
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#024023] uppercase">Name</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Period From</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Period To</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCycles.map((cycle) => (
                  <tr key={cycle.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-[#024023] font-semibold">{cycle.name}</td>
                    <td className="px-4 py-3 text-center text-[#024023] font-semibold">
                      {new Date(cycle.periodFrom).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center text-[#024023] font-semibold">
                      {new Date(cycle.periodTo).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          cycle.status === 'ACTIVE' || cycle.status === 'OPEN'
                            ? 'bg-green-100 text-green-700'
                            : cycle.status === 'CLOSED'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {cycle.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={cycle.status}
                        onChange={(e) => handleStatusChange(cycle.id, e.target.value)}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md text-sm border border-gray-300"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="OPEN">Open</option>
                        <option value="ACTIVE">Active</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredCycles.length === 0 && !loading && (
        <div className="bg-white p-6 rounded-xl text-center text-gray-500">
          No billing cycles found
        </div>
      )}

      {loading && (
        <div className="bg-white p-6 rounded-xl text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#739559] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <CreateBillingCycleModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

interface CreateBillingCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CreateBillingCycleRequest) => Promise<void>;
}

function CreateBillingCycleModal({ isOpen, onClose, onSubmit }: CreateBillingCycleModalProps) {
  const [name, setName] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setPeriodFrom('');
      setPeriodTo('');
      setStatus('DRAFT');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmit({
        name,
        periodFrom,
        periodTo,
        status,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#E7E4E8CC]/80 z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="16" width="16">
            <g fill="none" fillRule="evenodd">
              <path d="M16 0v16H0V0h16Z"></path>
              <path fill="#000000" d="m8 9.414666666666665 3.535333333333333 3.535333333333333a1 1 0 0 0 1.4146666666666665 -1.4146666666666665L9.413333333333332 8l3.536 -3.535333333333333a1 1 0 1 0 -1.4146666666666665 -1.414L8 6.585999999999999 4.464666666666666 3.0506666666666664a1 1 0 1 0 -1.4146666666666665 1.4133333333333333L6.586666666666667 8l-3.536 3.536a1 1 0 1 0 1.4146666666666665 1.4133333333333333L8 9.415333333333333Z" strokeWidth="0.6667"></path>
            </g>
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-[#02542D] mb-6">Create Billing Cycle</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period From</label>
            <DateBox
              value={periodFrom}
              onChange={(e) => setPeriodFrom(e.target.value)}
              placeholderText="Select period from date"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period To</label>
            <DateBox
              value={periodTo}
              onChange={(e) => setPeriodTo(e.target.value)}
              placeholderText="Select period to date"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559]"
            >
              <option value="DRAFT">Draft</option>
              <option value="OPEN">Open</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#739559] text-white rounded-md hover:bg-[#5a7347] disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

