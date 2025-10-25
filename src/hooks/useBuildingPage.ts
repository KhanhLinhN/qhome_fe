import { useCallback, useEffect, useMemo, useState } from 'react';
// 1. Import các service và type cần thiết
import { PagedResponse } from '@/src/services/base/project/projectService';
import { getAllTenants } from '@/src/services/base/tenantService';
import { getBuildingsByTenant } from '@/src/services/base/buildingService';
import { filters } from '@/src/components/base-service/FilterForm'; 
import { Project } from '../types/project';
import { Building } from '../types/building';
import { useAuth } from '../contexts/AuthContext';

const initialFilters: filters = {
    codeName: '',
    status: '',
    projectId: '', 
};

const initialPageSize = 10;

export const useBuildingPage = (loadOnMount: boolean = true) => {
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [allBuildings, setAllBuildings] = useState<Building[]>([]); // Chỉ chứa building của 1 project

    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingBuildings, setLoadingBuildings] = useState(false); // Chỉ loading khi gọi API building
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<filters>(initialFilters);
    const [pageNo, setPageNo] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(initialPageSize);
    const { user, hasRole } = useAuth();


    useEffect(() => {
        if (!loadOnMount) {
            setLoadingProjects(false);
            return;
        }

        const loadInitialProjects = async () => {
            setLoadingProjects(true);
            setError(null);
            try {
                const projects = await getAllTenants();
                setAllProjects(projects as unknown as Project[]);

                const storedProjectId = localStorage.getItem('projectId');
                if (storedProjectId) {
                    setFilters(prev => ({ ...prev, projectId: storedProjectId }));
                }
            } catch (err) {
                setError('Failed to fetch projects.');
                console.error(err);
            } finally {
                setLoadingProjects(false);
            }
        };

        loadInitialProjects();
    }, [loadOnMount]); 

    // reload building when project selected
    useEffect(() => {
        if (!filters.projectId) {
            setAllBuildings([]); 
            return;
        }

        const fetchBuildingsForProject = async () => {
            setLoadingBuildings(true);
            setError(null);
            try {
                const buildings = await getBuildingsByTenant(filters.projectId!);
                setAllBuildings(buildings as unknown as Building[]);
                setPageNo(0); 
            } catch (err) {
                setError('Failed to fetch buildings for project.');
                console.error(err);
                setAllBuildings([]);
            } finally {
                setLoadingBuildings(false);
            }
        };

        fetchBuildingsForProject();
    }, [filters.projectId]); 

    const filteredBuildings = useMemo(() => {
        if (!allBuildings || allBuildings.length === 0) {
            return [];
        }
        return allBuildings.filter(building => {
            const codeNameMatch = filters.codeName
                ? building?.name?.toLowerCase().includes(filters.codeName.toLowerCase()) || building?.code?.toLowerCase().includes(filters.codeName.toLowerCase())
                : true;
            
            const statusMatch = filters.status
                ? building.status === filters.status
                : true;
            
            return codeNameMatch && statusMatch;
        });
    }, [allBuildings, filters.codeName, filters.status]); 

    const data: PagedResponse<Building> = useMemo(() => {
        const totalElements = filteredBuildings.length;
        const startIndex = pageNo * pageSize;
        const endIndex = startIndex + pageSize;
        const content = filteredBuildings.slice(startIndex, endIndex);

        return {
            content: content,
            pageable: { pageNumber: pageNo, pageSize: pageSize },
            totalElements: totalElements,
        };
    }, [filteredBuildings, pageNo, pageSize]);

    const handleFilterChange = (name: keyof filters, value: string) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value,
        }));
        
        if (name !== 'projectId') {
             setPageNo(0);
        }
    };

    const handleClear = () => {
        const projectId = user?.tenantId;
        if(projectId) {
            setFilters(prev => ({ ...prev, projectId: projectId }));
        }else{
            setFilters(initialFilters);
        }
        setPageNo(0);
    };

    const handlePageChange = (newPage: number) => {
        setPageNo(newPage);
    };

    const totalPages = pageSize > 0 
        ? Math.ceil(data.totalElements / pageSize) 
        : 0;

    return {
        data, // PagedResponse<Building>
        loading: loadingProjects || loadingBuildings, // Loading 
        error,
        filters,
        allProjects, // return list project
        pageNo,
        totalPages: totalPages, 
        pageSize,
        setPageSize,      
        handleFilterChange,
        handleClear,
        handlePageChange,
    }
}