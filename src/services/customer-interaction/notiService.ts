import axios from "@/src/lib/axios";
import { 
    Notification, 
    CreateNotificationRequest,
    UpdateNotificationRequest
} from "@/src/types/notification";

// Re-export types for convenience
export type { 
    Notification, 
    CreateNotificationRequest,
    UpdateNotificationRequest
};

const BASE_URL = 'http://localhost:8086/api';

/**
 * Notification Service - Customer Interaction API
 * Based on NotificationController.java
 */

/**
 * GET /api/notifications
 * Get all notifications (for management)
 */
export async function getNotificationsList(): Promise<Notification[]> {
    try {
        const response = await axios.get(`${BASE_URL}/notifications`, {
            withCredentials: true
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications list:', error);
        throw error;
    }
}

/**
 * GET /api/notifications/:id
 * Get notification detail by ID
 */
export async function getNotificationDetail(id: string): Promise<Notification> {
    try {
        const response = await axios.get(`${BASE_URL}/notifications/${id}`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching notification detail:', error);
        throw error;
    }
}

/**
 * POST /api/notifications
 * Create new notification
 */
export async function createNotification(data: CreateNotificationRequest): Promise<Notification> {
    try {
        console.log(data);
        const response = await axios.post(`${BASE_URL}/notifications`, data, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

/**
 * PUT /api/notifications/:id
 * Update existing notification
 */
export async function updateNotification(id: string, data: UpdateNotificationRequest): Promise<Notification> {
    try {
        const response = await axios.put(`${BASE_URL}/notifications/${id}`, data, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error updating notification:', error);
        throw error;
    }
}

/**
 * DELETE /api/notifications/:id
 * Delete notification (soft delete)
 */
export async function deleteNotification(id: string): Promise<void> {
    try {
        await axios.delete(`${BASE_URL}/notifications/${id}`, {
            withCredentials: true
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
}

/**
 * GET /api/notifications/resident?residentId={id}&buildingId={id}
 * Get notifications for resident
 */
export async function getNotificationsForResident(residentId: string, buildingId: string): Promise<Notification[]> {
    try {
        const response = await axios.get(`${BASE_URL}/notifications/resident`, {
            params: { residentId, buildingId },
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications for resident:', error);
        throw error;
    }
}

/**
 * GET /api/notifications/role?role={role}&userId={id}
 * Get notifications for role
 */
export async function getNotificationsForRole(role: string, userId: string): Promise<Notification[]> {
    try {
        const response = await axios.get(`${BASE_URL}/notifications/role`, {
            params: { role, userId },
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications for role:', error);
        throw error;
    }
}


