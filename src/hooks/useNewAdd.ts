import { useState } from 'react';
import { News, CreateNewsRequest, createNews } from '@/src/services/customer-interaction/newService';
import { useAuth } from '../contexts/AuthContext';

interface UseNewAddResult {
    addNews: (data: News) => Promise<News>;
    loading: boolean;
    error: Error | null;
    isSubmitting: boolean;
}

export const useNewAdd = (): UseNewAddResult => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const { user } = useAuth();

    const addNews = async (data: News): Promise<News> => {
        setIsSubmitting(true);
        setError(null);
        
        try {
            if (!user?.tenantId) {
                throw new Error('Tenant ID not found');
            }

            // Convert News to CreateNewsRequest theo format backend expects
            const request: CreateNewsRequest = {
                title: data.title,
                summary: data.summary,
                bodyHtml: data.bodyHtml,
                coverImageUrl: data.coverImageUrl,
                status: data.status,
                publishAt: data.publishAt,
                expireAt: data.expireAt,
                displayOrder: data.displayOrder,
                images: data.images,
                targetType: data.targets[0]?.targetType || 'ALL',
                buildingIds: data.targets[0]?.targetType === 'BUILDING' 
                    ? data.targets.map(t => t.buildingId).filter(id => id !== null) as string[]
                    : undefined
            };

            const result = await createNews(user.tenantId, request);
            return result;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        addNews,
        loading,
        error,
        isSubmitting,
    };
};

