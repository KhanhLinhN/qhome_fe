export interface NewsImage {
    id?: string;
    newsId?: string;
    url: string;
    caption: string;
    sortOrder: number;
    fileSize?: number | null;
    contentType?: string | null;
}

export interface NewsTarget {
    id?: string;
    targetType: string;
    buildingId: string | null;
    buildingName?: string | null;
}

export interface News {
    id?: string;
    title: string;
    summary: string;
    bodyHtml: string;
    coverImageUrl: string;
    status: string;
    publishAt: string;
    expireAt: string;
    displayOrder: number;
    viewCount?: number;
    images: NewsImage[];
    targets: NewsTarget[];
    createdBy?: string;
    createdAt?: string;
    updatedBy?: string;
    updatedAt?: string;
    stats?: any;
}

// Request DTO to send to backend
export interface CreateNewsRequest {
    title: string;
    summary: string;
    bodyHtml: string;
    coverImageUrl: string;
    status: string;
    publishAt: string;
    expireAt: string;
    displayOrder: number;
    images: NewsImage[];
    targetType: string;           // "ALL" or "BUILDING"
    buildingIds?: string[];       // Array of building UUIDs (when targetType = BUILDING)
}

export interface GetNewsParams {
    status?: string;
    buildingId?: string;
    targetType?: string;
    pageNo?: number;
    pageSize?: number;
}

export interface NewsPage {
    content: News[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

