import { useState, useEffect, useCallback } from 'react';
import { Building } from '@/src/types/building';
import { getBuilding, updateBuilding } from '@/src/services/base/buildingService';

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
            const buildingData = await getBuilding(buildingId.toString());
            setBuildingData(buildingData as unknown as Building);
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

    const editBuilding = async(buildingId: string, data: Partial<Building>) =>{
        if (!buildingId) return;

        setIsSubmitting(true);
        setError(null);
        try {
            await updateBuilding(buildingId, data);
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
        editBuilding, 
        loading, 
        error,
        isSubmitting,
    };
};
