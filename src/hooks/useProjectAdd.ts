import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/src/types/project';
import { ProjectService } from '../services/base/project/projectService';

const projectService = new ProjectService();

export const useProjectAdd = () => {
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const addProject = async(data: Project) =>{
        setIsSubmitting(true);
        setError(null);
        try {
            await projectService.addProject(data);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }

    return { 
        addProject, 
        loading, 
        error,
        isSubmitting,
    };
};
