'use client'
import React from 'react';
import Select from './Select';
import DateBox from './DateBox';
import { useTranslations } from 'next-intl';

export interface RequestFilters {
    requestId?: string; 
    title?: string;
    residentName?: string;
    tenantId?: string;
    status?: string;
    priority?: string;
    dateFrom?: string; 
    dateTo?: string;   
}

interface FilterFormProps {
    filters: RequestFilters; 
    onFilterChange: (name: keyof RequestFilters, value: string) => void; 
    onSearch: () => void; 
    onClear: () => void; 
}

const FilterForm = ({ filters, onFilterChange, onSearch, onClear }: FilterFormProps) => {
    const t = useTranslations('customer-interaction.Request');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange(e.target.name as keyof RequestFilters, e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch();
    };

    const inputClass = "w-full px-4 h-10 border-[1px] border-[#2ad47a] rounded-lg text-[#81A996] focus:outline-none transition duration-150 ease-in-out";
    const labelClass = "text-gray-600 font-medium";

    return (
        <div className="bg-white p-6 rounded-xl w-full">
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                        type="text"
                        name="requestId"
                        placeholder={t('requestNumber')}
                        value={filters.requestId || ''}
                        className={inputClass}
                        onChange={handleInputChange}
                    />
                    <input
                        type="text"
                        name="title"
                        placeholder={t('requestTitle')}
                        value={filters.title || ''}
                        className={inputClass}
                        onChange={handleInputChange}
                    />
                    <input
                        type="text"
                        name="residentName"
                        placeholder={t('residentName')}
                        value={filters.residentName || ''}
                        className={inputClass}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-[1.5] min-w-0">
                        <div className="flex items-center gap-2 h-full">
                            <span className={labelClass}>From:</span>
                            <DateBox
                                value={filters.dateFrom || ''}
                                onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                            />
                            <span className={`${labelClass} pl-2`}>To:</span>
                            <DateBox 
                                value={filters.dateTo || ''}
                                onChange={(e) => onFilterChange('dateTo', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">    
                        <Select
                            options={[{ name: t('new'), value: 'New' }, { name: t('processing'), value: 'Processing' }, { name: t('completed'), value: 'Completed' }, { name: t('closed'), value: 'Closed'}]}
                            value={filters.status}
                            onSelect={(item) => onFilterChange('status', item.value)}
                            renderItem={(item) => item.name}
                            getValue={(item) => item.value}
                            placeholder={t('status')}
                        />
                    </div>

                    <div className="flex-1 min-w-0">    
                        <Select
                            options={[{ name: t('high'), value: 'High' }, { name: t('medium'), value: 'Medium' }, { name: t('low'), value: 'Low' }]}
                            value={filters.priority}
                            onSelect={(item) => onFilterChange('priority', item.value)}
                            renderItem={(item) => item.name}
                            getValue={(item) => item.value}
                            placeholder={t('priority')}
                        />
                    </div>
                </div>

                <div className="flex space-x-4 pt-2">
                    <button
                        type="submit"
                        className="flex items-center justify-center px-6 py-2.5 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none"
                    >
                        {t('search')}
                    </button>
                    <button
                        type="button"
                        onClick={onClear}
                        className="flex items-center justify-center px-6 py-2.5 bg-white text-gray-700 font-semibold border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
                    >
                        {t('clear')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FilterForm;
