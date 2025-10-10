'use client'
import React, { useRef, useState } from 'react';
import Select from './Select';
import DateBox from './DateBox';
import { useTranslations } from 'next-intl';

interface FilterProps {
    type: string;
}

export interface RequestFilters {
  requestId?: string; 
  title?: string;
  residentName?: string;
  status?: string;
  priority?: string;
}

interface FilterFormProps {
    filters: RequestFilters; 
    onFilterChange: (name: keyof RequestFilters, value: string) => void; 
    onSearch: () => void; 
    onClear: () => void; 
}

const FilterForm = ( { filters, onFilterChange, onSearch, onClear }: FilterFormProps) => {
  const now = new Date();

  const t = useTranslations('customer-interaction.Request');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange(e.target.name as keyof RequestFilters, e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const inputClass = "w-full px-4 py-3 border-[1px] border-[#2ad47a] rounded-lg text-[#81A996] leading-tight focus:outline-none transition duration-150 ease-in-out";

  return (
    <div className="bg-white p-6 rounded-xl w-full">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            name="requestNumber"
            placeholder={t('requestNumber')}
            value={filters.requestId || ''}
            className={inputClass}
          />
          <input
            type="text"
            name="requestTitle"
            placeholder={t('requestTitle')}
            value={filters.title || ''}
            className={inputClass}
          />
          <input
            type="text"
            name="residentName"
            placeholder={t('residentName')}
            value={filters.residentName || ''}
            className={inputClass}
          />
          {/* {type === 'requests' && (
            <input
              type="text"
              name="assignee"
              placeholder={t('assignee')}
              // value={filters.assignee}
              // onChange={handleInputChange}
              className={inputClass}
            />
          )} */}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* <div className="flex flex-wrap justify-start gap-4"> */}
          {/* <div className="w-full lg:flex-[1.5] min-w-0">
            <div className="flex items-center gap-2">
              <span className={labelClass}>From:</span>
              <DateBox
                dateValue={dateFrom}
                onChange={handleStartDateChange}
              />
              <span className={`${labelClass} pl-2`}>to</span>
              <DateBox 
                dateValue={dateTo}
                onChange={handleEndDateChange}
              />
            </div>
          </div> */}

          {/* <div className="w-full xl:flex-1 min-w-0"> */}
            <Select
              options={[{ name: t('new'), value: 'NEW' }, { name: t('processing'), value: 'PROCESSING' }, { name: t('completed'), value: 'COMPLETED' }, { name: t('closed'), value: 'CLOSED' }]}
              value={filters.status}
              onSelect={(item) => onFilterChange('status', item.value)}
              renderItem={(item) => item.name}
              filterLogic={(item, keyword) => item.name.toLowerCase().includes(keyword.toLowerCase())}
              placeholder={t('status')}
            />
          {/* </div> */}

          {/* <div className="w-full xl:flex-1 min-w-0"> */}
            <Select
              options={[{ name: t('high'), value: 'HIGH' }, { name: t('medium'), value: 'MEDIUM' }, { name: t('low'), value: 'LOW' }]}
              value={filters.priority} // Truyền giá trị từ state của cha
              onSelect={(item) => onFilterChange('priority', item.value)}
              renderItem={(item) => item.name}
              filterLogic={(item, keyword) => item.name.toLowerCase().includes(keyword.toLowerCase())}
              placeholder={t('priority')}
            />
          </div>
        {/* </div> */}

        <div className="flex space-x-4 pt-2">
          <button
            type="submit"
            className="flex items-center justify-center px-6 py-2.5 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
          >
            {t('search')}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="flex items-center justify-center px-6 py-2.5 bg-white text-gray-700 font-semibold border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 transition duration-150 ease-in-out"
          >
            {t('clear')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FilterForm;
