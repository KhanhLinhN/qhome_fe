'use client'
import React from 'react';
import Select from '../customer-interaction/Select';
import DateBox from '../customer-interaction/DateBox';
import { useTranslations } from 'next-intl';

export interface filters {
    codeName?: string,
    address?: string,
    status?: string
}

interface FilterFormProps {
    filters: filters; 
    page: string;
    onFilterChange: (name: keyof filters, value: string) => void; 
    onSearch: () => void; 
    onClear: () => void; 
}

const FilterForm = ({ filters, page, onFilterChange, onSearch, onClear }: FilterFormProps) => {
    const t = useTranslations('Project');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange(e.target.name as keyof filters, e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch();
    };

    const inputClass = "w-full px-4 h-10 border-[1px] border-[#2ad47a] rounded-lg text-[#81A996] focus:outline-none transition duration-150 ease-in-out";

    if(page == "project"){

        return (
            <div className="bg-white p-6 rounded-xl w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                        type="text"
                        name="projectcodename"
                        placeholder={t('projectcodename')}
                        value={filters.codeName || ''}
                        className={inputClass}
                        onChange={handleInputChange}
                    />    
                <div className="flex-1 min-w-0">    
                    <Select
                        options={[{ name: t('active'), value: 'active' }, { name: t('inactive'), value: 'inactive' }, { name: t('completed'), value: 'Completed' }, { name: t('closed'), value: 'Closed'}]}
                        value={filters.status}
                        onSelect={(item) => onFilterChange('status', item.value)}
                        renderItem={(item) => item.name}
                        getValue={(item) => item.value}
                        placeholder={t('status')}
                    />
                </div>
                <input
                    type="text"
                    name="address"
                    placeholder={t('address')}
                    value={filters.address || ''}
                    className={inputClass}
                    onChange={handleInputChange}
                />

                <button
                    type="button"
                    onClick={onClear}
                    className="flex items-center justify-center px-6 py-2.5 bg-white text-gray-700 font-semibold border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
                >
                    {t('clear')}
                </button>
                </div>
            </div>
        );
    }
};

export default FilterForm;
