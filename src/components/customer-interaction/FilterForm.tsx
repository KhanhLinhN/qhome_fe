'use client'
import React from 'react';
import Select from './Select';
import DateBox from './DateBox';
import { useTranslations } from 'next-intl';

export interface RequestFilters {
    status?: string;
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch();
    };

    const labelClass = 'text-gray-600 font-medium';

    return (
        <div className="bg-white p-6 rounded-xl w-full">
            <form className="space-y-4" onSubmit={handleSubmit}>
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
                            options={[
                                { name: t('pending'), value: 'Pending' },
                                { name: t('processing'), value: 'Processing' },
                                { name: t('done'), value: 'Done' },
                            ]}
                            value={filters.status}
                            onSelect={(item) => onFilterChange('status', item.value)}
                            renderItem={(item) => item.name}
                            getValue={(item) => item.value}
                            placeholder={t('status')}
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
