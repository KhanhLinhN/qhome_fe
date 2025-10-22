import { useState, useEffect, useCallback } from 'react';
import { Building } from '@/src/types/building';
import { BuildingService } from '../services/base/building/buildingService';

const buildingService = new BuildingService();

export const useBuildingDetailPage = (buildingId: string | string[] | undefined) => {
    const [buildingData, setBuildingData] = useState<Building | null>(null);
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const fetchData = useCallback(async () => {
        if (!buildingId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const buildingData = await buildingService.getBuildingDetails(buildingId.toString());
            setBuildingData(buildingData);
        } catch (err) {
            setError(err as Error);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [buildingId]); 

    useEffect(() => {
        fetchData();
    }, [fetchData]); 

    const editProject = async(buildingId: string, data: Building) =>{
        if (!buildingId) return;

        setIsSubmitting(true);
        setError(null);
        try {
            await buildingService.editBuilding(buildingId, data);
            await fetchData(); 
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }

    return { 
        buildingData,
        editProject, 
        loading, 
        error,
        isSubmitting,
    };
};
