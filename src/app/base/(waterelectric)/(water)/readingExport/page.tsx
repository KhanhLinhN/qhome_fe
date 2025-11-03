'use client'
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  getAllReadingCycles,
  ReadingCycleDto,
  ReadingCycleStatus,
  exportReadingsByCycle,
  MeterReadingImportResponse,
} from '@/src/services/base/waterService';
import { useNotifications } from '@/src/hooks/useNotifications';

export default function ReadingExportPage() {
  const { user } = useAuth();
  const { show } = useNotifications();
  const [cycles, setCycles] = useState<ReadingCycleDto[]>([]);
  const [filteredCycles, setFilteredCycles] = useState<ReadingCycleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportResults, setExportResults] = useState<Map<string, MeterReadingImportResponse>>(new Map());
  const [statusFilter, setStatusFilter] = useState<ReadingCycleStatus | 'ALL'>('ACTIVE');

  useEffect(() => {
    loadCycles();
  }, []);

  useEffect(() => {
    let filtered = cycles;
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    setFilteredCycles(filtered);
  }, [cycles, statusFilter]);

  const loadCycles = async () => {
    try {
      setLoading(true);
      const data = await getAllReadingCycles();
      setCycles(data);
    } catch (error) {
      console.error('Failed to load cycles:', error);
      show('Failed to load reading cycles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (cycleId: string) => {
    if (!confirm('Are you sure you want to export readings from this cycle? This will create invoices.')) return;

    try {
      setExporting(cycleId);
      const result = await exportReadingsByCycle(cycleId);
      setExportResults(prev => new Map(prev).set(cycleId, result));
      show(`Export completed: ${result.totalReadings} readings, ${result.invoicesCreated} invoices created`, 'success');
    } catch (error: any) {
      show(error?.message || 'Failed to export readings', 'error');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="px-[41px] py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#02542D]">Export Meter Readings</h1>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
        <p>
          <strong>Export Process:</strong> Exporting readings from a cycle will transfer all meter readings 
          to the billing system and create invoices. This action should be performed after completing all 
          readings for a cycle.
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white p-6 rounded-xl mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReadingCycleStatus | 'ALL')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559]"
          >
            <option value="ALL">All</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Cycles Table */}
      {filteredCycles.length > 0 && (
        <div className="bg-white p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-[#02542D] mb-4">Reading Cycles ({filteredCycles.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-solid border-[#14AE5C]">
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#024023] uppercase">Cycle Name</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Period</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Created At</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Export Result</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCycles.map((cycle) => {
                  const result = exportResults.get(cycle.id);
                  return (
                    <tr key={cycle.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-[#024023] font-semibold">{cycle.name}</td>
                      <td className="px-4 py-3 text-center text-[#024023] font-semibold">
                        {new Date(cycle.fromDate || cycle.periodFrom).toLocaleDateString()} - {' '}
                        {new Date(cycle.toDate || cycle.periodTo).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            cycle.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : cycle.status === 'CLOSED'
                              ? 'bg-blue-100 text-blue-700'
                              : cycle.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {cycle.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-[#024023] font-semibold">
                        {new Date(cycle.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {result ? (
                          <div className="text-sm">
                            <div className="text-green-600 font-semibold">
                              ✓ {result.totalReadings} readings
                            </div>
                            <div className="text-blue-600">
                              {result.invoicesCreated} invoices
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not exported</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleExport(cycle.id)}
                          disabled={exporting === cycle.id || cycle.status === 'CANCELLED'}
                          className="px-3 py-1 bg-[#739559] text-white rounded-md hover:bg-[#5a7347] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {exporting === cycle.id ? 'Exporting...' : 'Export'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredCycles.length === 0 && !loading && (
        <div className="bg-white p-6 rounded-xl text-center text-gray-500">
          No reading cycles found
        </div>
      )}

      {loading && (
        <div className="bg-white p-6 rounded-xl text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#739559] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      )}
    </div>
  );
}

