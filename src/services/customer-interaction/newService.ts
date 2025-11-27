import axios from "@/src/lib/axios";
import { 
    News, 
    NewsImage, 
    NewsTarget, 
    GetNewsParams, 
    NewsPage, 
    CreateNewsRequest,
    UpdateNewsRequest,
    NewsImageDto,
    UploadImageResponse,
    UpdateImageRequest
} from "@/src/types/news";
import { compressImage, compressImages } from "@/src/utils/imageCompression";

// Re-export types for convenience
export type { 
    News, 
    NewsImage, 
    NewsTarget, 
    GetNewsParams, 
    NewsPage, 
    CreateNewsRequest,
    UpdateNewsRequest,
    NewsImageDto,
    UploadImageResponse,
    UpdateImageRequest
};

const BASE_URL = 'http://localhost:8086/api';
const UPLOAD_API_URL = '/api/upload-image'; // Next.js API route to proxy imgbb upload

// File Upload Response interface for imgbb.com
export interface FileUploadResponse {
    fileId?: string;
    fileName: string;
    originalFileName: string;
    fileUrl: string;
    contentType: string;
    fileSize: number;
    uploadedBy?: string;
    uploadedAt?: string;
}

/**
 * News Service - Customer Interaction API
 * Based on NewsController.java and NewsImageController.java
 */

/**
 * GET /api/news
 * Get all news (for management)
 */
export async function getNewsList(): Promise<News[]> {
    try {
        const response = await axios.get(`${BASE_URL}/news`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching news list:', error);
        throw error;
    }
}

    /**
 * GET /api/news/:id
 * Get news detail by ID (for management)
     */
export async function getNewsDetail(id: string): Promise<News> {
    try {
        const response = await axios.get(`${BASE_URL}/news/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching news detail:', error);
        throw error;
    }
}

    /**
 * POST /api/news
 * Create new news
 */
export async function createNews(data: CreateNewsRequest): Promise<News> {
    try {
        const response = await axios.post(`${BASE_URL}/news`, data);
        return response.data;
    } catch (error) {
        console.error('Error creating news:', error);
        throw error;
    }
}

    /**
 * PUT /api/news/:id
 * Update existing news
     */
export async function updateNews(id: string, data: UpdateNewsRequest): Promise<News> {
    try {
        const response = await axios.put(`${BASE_URL}/news/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating news:', error);
        throw error;
    }
}

    /**
 * DELETE /api/news/:id
 * Delete news
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
 * GET /api/news/resident?residentId={id}
 * Get news for resident
 */
export async function getNewsForResident(residentId: string): Promise<News[]> {
    try {
        const response = await axios.get(`${BASE_URL}/news/resident`, {
            params: { residentId }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching news for resident:', error);
        throw error;
    }
}

/**
 * GET /api/news/:id/resident?residentId={id}
 * Get news detail for resident
 */
export async function getNewsDetailForResident(newsId: string, residentId: string): Promise<News> {
    try {
        const response = await axios.get(`${BASE_URL}/news/${newsId}/resident`, {
            params: { residentId }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching news detail for resident:', error);
        throw error;
    }
}

/**
 * Image Management APIs
 */

/**
 * POST /api/news/images
 * Upload single image (expects NewsImageDto with URL)
 */
export async function uploadNewsImage(data: NewsImageDto): Promise<UploadImageResponse> {
    try {
        const response = await axios.post(`${BASE_URL}/news/images`, data);
        return response.data;
    } catch (error) {
        console.error('Error uploading news image:', error);
        throw error;
    }
}

/**
 * POST /api/news/images/batch
 * Upload multiple images
 */
export async function uploadMultipleNewsImages(images: NewsImageDto[]): Promise<UploadImageResponse[]> {
    try {
        const response = await axios.post(`${BASE_URL}/news/images/batch`, images);
        return response.data;
    } catch (error) {
        console.error('Error uploading multiple news images:', error);
        throw error;
    }
}

/**
 * GET /api/news/images/news/:newsId
 * Get all images for a news item
 */
export async function getNewsImages(newsId: string): Promise<UploadImageResponse[]> {
    try {
        const response = await axios.get(`${BASE_URL}/news/images/news/${newsId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching news images:', error);
        throw error;
    }
}

/**
 * PUT /api/news/images/:imageId
 * Update image (caption or sortOrder)
 */
export async function updateNewsImage(imageId: string, data: UpdateImageRequest): Promise<UploadImageResponse> {
    try {
        const response = await axios.put(`${BASE_URL}/news/images/${imageId}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating news image:', error);
        throw error;
    }
}

/**
 * PUT /api/news/images/:imageId/caption?caption={caption}
 * Update image caption
 */
export async function updateNewsImageCaption(imageId: string, caption: string): Promise<UploadImageResponse> {
    try {
        const response = await axios.put(
            `${BASE_URL}/news/images/${imageId}/caption`,
            null,
            {
                params: { caption }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating news image caption:', error);
        throw error;
    }
}

/**
 * PUT /api/news/images/:imageId/sort-order?sortOrder={sortOrder}
 * Update image sort order
 */
export async function updateNewsImageSortOrder(imageId: string, sortOrder: number): Promise<UploadImageResponse> {
    try {
        const response = await axios.put(
            `${BASE_URL}/news/images/${imageId}/sort-order`,
            null,
            {
                params: { sortOrder }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating news image sort order:', error);
        throw error;
    }
}

/**
 * DELETE /api/news/images/:imageId
 * Delete image
 */
export async function deleteNewsImage(imageId: string): Promise<void> {
    try {
        await axios.delete(`${BASE_URL}/news/images/${imageId}`);
    } catch (error) {
        console.error('Error deleting news image:', error);
        throw error;
    }
}

/**
 * File Upload Helper Functions
 * These functions upload files to imgbb.com and return URLs
 * which are then used with NewsImageController APIs
 */

// Helper to map imgbb response to frontend format
function mapImgbbResponse(imgbbData: any, originalFile: File): FileUploadResponse {
    return {
        fileId: imgbbData.id || imgbbData.delete_url?.split('/').pop(),
        fileName: imgbbData.title || originalFile.name,
        originalFileName: originalFile.name,
        fileUrl: imgbbData.url,
        contentType: originalFile.type || 'image/jpeg',
        fileSize: originalFile.size,
        uploadedAt: new Date().toISOString(),
    };
}

/**
 * Upload a single news image file to imgbb.com
 * @param file - The image file to upload
 * @param ownerId - The owner ID (news ID or UUID) - not used by imgbb but kept for compatibility
 * @param uploadedBy - Optional uploaded by user ID - not used by imgbb but kept for compatibility
 * @returns FileUploadResponse with fileUrl
 */
export async function uploadNewsImageFile(
    file: File,
    ownerId: string,
    uploadedBy?: string
): Promise<FileUploadResponse> {
    try {
        // Compress image before upload to reduce file size and improve speed
        // More aggressive compression for faster uploads
        const compressedFile = await compressImage(file, {
            maxWidth: 1600,  // Reduced from 1920 for smaller files
            maxHeight: 1600,
            quality: 0.7,    // Reduced from 0.8 for smaller files
            maxSizeMB: 1     // Compress files > 1MB (reduced from 2MB)
        });

        console.log(`Image compressed: ${file.size} → ${compressedFile.size} bytes (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`);

        const formData = new FormData();
        formData.append('image', compressedFile);

        const response = await axios.post(
            UPLOAD_API_URL,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 30000, // 30 seconds timeout
            }
        );

        if (!response.data.success) {
            throw new Error(response.data.error?.message || 'Failed to upload image to imgbb');
        }

        return mapImgbbResponse(response.data.data, compressedFile);
    } catch (error) {
        console.error('Error uploading news image file to imgbb:', error);
        throw error;
    }
}

/**
 * Upload multiple news image files to imgbb.com
 * @param files - Array of image files to upload
 * @param ownerId - The owner ID (news ID or UUID) - not used by imgbb but kept for compatibility
 * @param uploadedBy - Optional uploaded by user ID - not used by imgbb but kept for compatibility
 * @returns Array of FileUploadResponse with fileUrl
 */
export async function uploadNewsImageFiles(
    files: File[],
    ownerId: string,
    uploadedBy?: string
): Promise<FileUploadResponse[]> {
    try {

        const uploadPromises = files.map(async (file) => {
            // Compress each file individually
            const compressedFile = await compressImage(file, {
                maxWidth: 1600,  // Reduced from 1920 for smaller files
                maxHeight: 1600,
                quality: 0.7,    // Reduced from 0.8 for smaller files
                maxSizeMB: 1     // Compress files > 1MB (reduced from 2MB)
            });

            // Upload immediately after compression (no waiting)
            const formData = new FormData();
            formData.append('image', compressedFile);

            const response = await axios.post(
                UPLOAD_API_URL,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 30000, // 30 seconds timeout
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.error?.message || 'Failed to upload image to imgbb');
            }

            return mapImgbbResponse(response.data.data, compressedFile);
        });

        // All compressions and uploads happen in parallel
        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        console.error('Error uploading multiple news image files to imgbb:', error);
        throw error;
    }
}




