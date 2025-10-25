import axios from "@/src/lib/axios";
import { News, NewsImage, NewsTarget, GetNewsParams, NewsPage, CreateNewsRequest } from "@/src/types/news";

// Re-export types for convenience
export type { News, NewsImage, NewsTarget, GetNewsParams, NewsPage, CreateNewsRequest };

const BASE_URL = 'http://localhost:8086/api';

/**
 * News Service - Customer Interaction API
 */

    export async function getNewsList(tenantId: string): Promise<News[]> {
        const url = `${BASE_URL}/news?tenantId=${tenantId}`;

        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching news list:', error);
            throw error;
        }
    }

    /**
     * GET /news/:id
     */
    export async function getNewsDetail(tenantId: string, id: string): Promise<News> {
        try {
            const response = await axios.get(`${BASE_URL}/news/${id}?tenantId/${tenantId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching news detail:', error);
            throw error;
        }
    }

    /**
     * POST /news?tenantId={id}
     */
    export async function createNews(id: string, data: CreateNewsRequest): Promise<News> {
        try {
            console.log("tenantId", id);
            console.log("request data", data);
            const response = await axios.post(`${BASE_URL}/news?tenantId=${id}`, data,
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            console.error('Error creating news:', error);
            throw error;
        }
    }

    /**
     * PUT /news/:id
     */
    export async function updateNews(id: string, data: Partial<News>): Promise<News> {
        try {
            const response = await axios.put(`${BASE_URL}/news/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating news:', error);
            throw error;
        }
    }

    /**
     * DELETE /news/:id
     */
    export async function deleteNews(id: string): Promise<void> {
        try {
            await axios.delete(`${BASE_URL}/news/${id}`);
        } catch (error) {
            console.error('Error deleting news:', error);
            throw error;
        }
    }

    /**
     * POST /news/{newsId}/images
     * Returns: NewsImage object
     */
    export async function uploadNewsImage(
        tenantId: string, 
        newsId: string, 
        file: File,
        caption: string,
        sortOrder: number
    ): Promise<NewsImage> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('caption', caption);
            formData.append('sortOrder', sortOrder.toString());

            const response = await axios.post(
                `${BASE_URL}/news/${newsId}/images?tenantId=${tenantId}`, 
                formData, 
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error uploading news image:', error);
            throw error;
        }
    }




