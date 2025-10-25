'use client'
import React, { useEffect, useState } from 'react';
import Select from '../customer-interaction/Select';
import AddIcon from '@/src/assets/AddIcon.svg'
import Image from 'next/image';
import Delete from '@/src/assets/Delete.svg';
import { useTranslations } from 'next-intl';
import { Project } from '@/src/types/project';
import { useAuth } from '@/src/contexts/AuthContext';

export interface filters {
    codeName?: string,
    address?: string,
    status?: string,
    projectId?: string,
}

interface FilterFormProps {
    filters: filters; 
    page: string;
    onFilterChange: (name: keyof filters, value: string) => void; 
    onAdd: () => void; 
    onClear: () => void;
    onDelete: () => void;
    projectList?: Project[];
}

const FilterForm = ({ filters, page, onFilterChange, onAdd, onClear, onDelete, projectList }: FilterFormProps) => {
    const t = useTranslations();
    const { user, hasRole } = useAuth();

    const [isProjectLocked, setIsProjectLocked] = useState(false);

    const projectId = user?.tenantId;
    console.log('projectId', projectId);
    
    useEffect(() => {
        if (projectId && projectList && projectList.length > 0) {
            // Tự động set projectId vào filter khi có user.tenantId
            onFilterChange('projectId', projectId);
            setIsProjectLocked(true);
        }
    }, [projectId, projectList]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange(e.target.name as keyof filters, e.target.value);
    };

    console.log("projectList", projectList);

    const inputClass = "w-full px-4 h-10 border-[1px] border-[#2ad47a] rounded-lg text-[#81A996] focus:outline-none transition duration-150 ease-in-out";

    if(page == "project"){

        return (
            <div className="bg-white rounded-xl w-full">
                <div className="flex flex-col lg:flex-row gap-4">
                    <span className='whitespace-nowrap py-2.5'>
                        {t('Project.fillterBy')}
                    </span>
                    <input
                        type="text"
                        name="codeName"
                        placeholder={t('Project.projectcodename')}
                        value={filters.codeName || ''}
                        className={inputClass}
                        onChange={handleInputChange}
                    />    
                    <Select
                        options={[{ name: t('Project.active'), value: 'ACTIVE' }, { name: t('Project.inactive'), value: 'INACTIVE' }]}
                        value={filters.status}
                        onSelect={(item) => onFilterChange('status', item.value)}
                        renderItem={(item) => item.name}
                        getValue={(item) => item.value}
                        placeholder={t('Project.status')}
                    />
                    <input
                        type="text"
                        name="address"
                        placeholder={t('Project.address')}
                        value={filters.address || ''}
                        className={inputClass}
                        onChange={handleInputChange}
                    />

                    <button
                        type="button"
                        onClick={onClear}
                        className="flex items-center justify-center px-6 py-2.5 bg-white text-[#02542D] font-semibold border border-gray-300 rounded-lg shadow-sm hover:bg-[#d9dadb]"
                    >
                        {t('Project.clear')}
                    </button>

                    <button
                        type="button"
                        onClick={onAdd}
                        className="flex items-center justify-center px-6 py-2.5 bg-[#14AE5C] text-white font-semibold border border-gray-300 rounded-lg shadow-sm hover:bg-[#0c793f] whitespace-nowrap gap-2"
                    >
                        <Image
                            src={AddIcon}
                            alt="AddIcon"
                            width={16}
                            height={16}
                        />
                        {t('Project.addProject')}
                    </button>
                    <button 
                        type="button"
                        className="flex items-center justify-center px-6 py-2.5 bg-red-700 text-white font-semibold border border-gray-300 rounded-lg shadow-sm hover:bg-red-900 whitespace-nowrap gap-2"
                        onClick={onDelete}
                    >
                        <Image 
                            src={Delete} 
                            alt="Delete" 
                            width={16} 
                            height={16}
                        />
                        {t('Project.deleteProject')}
                    </button>
                </div>
            </div>
        );
    }

    if(page == "building"){

        return (
            <div className="bg-white rounded-xl w-full">
                <div className="flex flex-col lg:flex-row gap-4">
                    <span className='whitespace-nowrap py-2.5'>
                        {t('Building.fillterBy')}
                    </span>
                    <input
                        type="text"
                        name="codeName"
                        placeholder={t('Building.buildingcodename')}
                        value={filters.codeName || ''}
                        className={inputClass}
                        onChange={handleInputChange}
                    />    
                    <Select
                        options={[{ name: t('Building.active'), value: 'ACTIVE' }, { name: t('Building.inactive'), value: 'INACTIVE' }]}
                        value={filters.status}
                        onSelect={(item) => onFilterChange('status', item.value)}
                        renderItem={(item) => item.name}
                        getValue={(item) => item.value}
                        placeholder={t('Building.status')}
                    />
                    {/* { projectName === "" && ( */}
                        <Select
                            options={projectList ?? []}
                            value={filters.projectId}
                            onSelect={(item) => onFilterChange('projectId', item.id || "")}
                            renderItem={(item) => item.name || ""}
                            getValue={(item) => item.id || ""}
                            disable={isProjectLocked}
                            placeholder={t('Building.projectName')}
                        />
                    {/* )} */}

                    {/* { projectName != "" && (
                        <Select
                            options={projectList ?? []}
                            value={filters.projectId}
                            onSelect={(item) => onFilterChange('projectId', item.id || "")}
                            renderItem={(item) => item.name || ""}
                            getValue={(item) => item.id || ""}
                            disable={true}
                            placeholder={t('Building.projectName')}
                        />
                    )} */}



                    <button
                        type="button"
                        onClick={onClear}
                        className="flex items-center justify-center px-6 py-2.5 bg-white text-[#02542D] font-semibold border border-gray-300 rounded-lg shadow-sm hover:bg-[#d9dadb]"
                    >
                        {t('Building.clear')}
                    </button>

                    <button
                        type="button"
                        onClick={onAdd}
                        className="flex items-center justify-center px-6 py-2.5 bg-[#14AE5C] text-white font-semibold border border-gray-300 rounded-lg shadow-sm hover:bg-[#0c793f] whitespace-nowrap gap-2"
                    >
                        <Image
                            src={AddIcon}
                            alt="AddIcon"
                            width={16}
                            height={16}
                        />
                        {t('Building.addBuilding')}
                    </button>
                    
                </div>
            </div>
        );
    }
};

export default FilterForm;
