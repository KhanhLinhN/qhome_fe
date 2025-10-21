import { useCallback, useEffect, useState } from 'react';
import { PagedResponse, ProjectService } from '@/src/services/base/project/projectService';
import { Project } from '../types/project';
import { filters } from '@/src/components/base-service/FilterForm';

const initialFilters: filters = {
    codeName: '',
    status: '',
    address: ''
};

const initialProjectData: PagedResponse<Project> = {
    content: [],
    pageable: { pageNumber: 0, pageSize: 10 },
    totalElements: 0,
};

const projectService = new ProjectService();

export const useProjectPage = (loadOnMount: boolean = true) => {
    const [data, setData] = useState<PagedResponse<Project>>(initialProjectData);    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<filters>(initialFilters);
    const [pageNo, setPageNo] = useState<number>(0);

    const pageSize = data.pageable?.pageSize || 10;
    const totalElements = data.totalElements || 0;
    
    const safeTotalPages = pageSize > 0 
        ? Math.ceil(totalElements / pageSize) 
        : 0;

    const fetchData = useCallback(async (currentFilters: filters, currentPageNo: number) => {
        setLoading(true);
        setError(null);
        try {
            const listProject = await projectService.getProjectList(currentFilters, currentPageNo);
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
    }, [loadOnMount, fetchData]);

    useEffect(() => {
        fetchData(filters, pageNo);
    }, [filters, pageNo, fetchData]);

    const handleFilterChange = (name: keyof filters, value: string) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    const handleSearch = () => {
        const newPageNo = 0;
        setPageNo(newPageNo); // Reset to first page on new search
    };

    const handleClear = () => {
        setFilters(initialFilters);
        setPageNo(0);
    };

    const handlePageChange = (newPage: number) => {
        setPageNo(newPage);
    };

    const handleStatusChange = (status: string) => {
        setFilters(prev => ({ ...prev, status: status }));
        setPageNo(0);
    };

    return {
        data,
        loading,
        error,
        filters,
        pageNo,
        totalPages: safeTotalPages,           
        handleFilterChange,
        handleSearch,
        handleClear,
        handlePageChange,
        handleStatusChange
    }
}
