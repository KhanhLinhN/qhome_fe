import { useCallback, useEffect, useState } from 'react';
import { ProjectService } from '@/src/services/base/project/projectService';
import { Project } from '../types/project';
import { filters } from '@/src/components/base-service/FilterForm';

const initialFilters : filters = {
    codeName: '',
    status: '',
    address: ''
};

const projectService = new ProjectService();

export const useProjectPage = (loadOnMount: boolean = true) => {
    const [data, setData] = useState<Project>();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<filters>(initialFilters);
    const [pageNo, setPageNo] = useState<number>(0);


    const fetchData = useCallback(async (currentFilters: filters) => {
        setLoading(true);
        setError(null);
        try {

            const filters = {
                ...currentFilters
            }
                
            const listProject = await projectService.getProjectList();

            setData(listProject);
        } catch (err) {
            setError('Failed to fetch requests.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []); 

    useEffect(() => {
        if (loadOnMount) {
            fetchData(initialFilters, 0);
        }
    }, [fetchData, loadOnMount]);


    // const handleFilterChange = (name: keyof RequestFilters, value: string) => {
    //     setFilters(prevFilters => ({
    //         ...prevFilters,
    //         [name]: value,
    //     }));
    // };

    // const handleSearch = () => {
    //     const newPageNo = 0;
    //     setPageNo(newPageNo); // Reset to first page on new search
    //     fetchData(filters, newPageNo);
    // };

    // const handleClear = () => {
    //     setFilters(initialFilters);
    //     setPageNo(0);
    // };

    // const handlePageChange = (newPage: number) => {
    //     setPageNo(newPage);
    //     fetchData(filters, newPage);
    // };

    // const handleStatusChange = (status: string) => {
    //     setFilters(prev => ({ ...prev, status: status }));
    //     setPageNo(0);
    // };

    return {
        data,
        loading,
        error,
        // filters,
        // TYgeChange,
    };
}
