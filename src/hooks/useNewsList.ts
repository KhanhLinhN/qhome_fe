import { useCallback, useEffect, useState } from 'react';
import { News } from '@/src/types/news';
import { getNewsList } from '@/src/services/customer-interaction/newService';
import { useAuth } from '../contexts/AuthContext';

export const useNewsList = () => {
    const [newsList, setNewsList] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchNews = useCallback(async () => {
        if (!user?.tenantId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await getNewsList(user.tenantId);
            setNewsList(data);
        } catch (err) {
            setError('Failed to fetch news list');
            console.error('Error fetching news:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.tenantId]);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    return {
        newsList,
        loading,
        error,
        refetch: fetchNews,
    };
};

