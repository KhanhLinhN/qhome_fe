import axios from '@/src/lib/axios';
import {
  CreateServiceCategoryPayload,
  CreateServicePayload,
  Service,
  ServiceCategory,
  ServiceCombo,
  ServiceOption,
  ServiceOptionGroup,
  UpdateServiceCategoryPayload,
  UpdateServicePayload,
} from '@/src/types/service';

const BASE_URL = process.env.NEXT_PUBLIC_ASSET_MAINTENANCE_URL || 'http://localhost:8084';

export interface GetServicesParams {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

const withCredentials = { withCredentials: true as const };

export async function getServices(): Promise<Service> {
  const response = await axios.get(`${BASE_URL}/api/asset-maintenance/services`, {
    ...withCredentials,
  });

  const data = response.data;
  return data;
}

export async function getService(id: string): Promise<Service> {
  const response = await axios.get(
    `${BASE_URL}/api/asset-maintenance/services/${id}`,
    withCredentials,
  );
  return response.data as Service;
}

export async function createService(data: CreateServicePayload): Promise<Service> {
  const response = await axios.post(
    `${BASE_URL}/api/asset-maintenance/services`,
    data,
    withCredentials,
  );
  return response.data as Service;
}

export async function updateService(
  id: string,
  data: UpdateServicePayload,
): Promise<Service> {
  const response = await axios.put(
    `${BASE_URL}/api/asset-maintenance/services/${id}`,
    data,
    withCredentials,
  );
  return response.data as Service;
}

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const response = await axios.get(
    `${BASE_URL}/api/asset-maintenance/service-categories`,
    withCredentials,
  );
  return response.data as ServiceCategory[];
}

export async function createServiceCategory(
  data: CreateServiceCategoryPayload,
): Promise<ServiceCategory> {
  const response = await axios.post(
    `${BASE_URL}/api/asset-maintenance/service-categories`,
    data,
    withCredentials,
  );
  return response.data as ServiceCategory;
}

export async function updateServiceCategory(
  id: string,
  data: UpdateServiceCategoryPayload,
): Promise<ServiceCategory> {
  const response = await axios.put(
    `${BASE_URL}/api/asset-maintenance/service-categories/${id}`,
    data,
    withCredentials,
  );
  return response.data as ServiceCategory;
}

export async function deleteServiceCategory(id: string): Promise<void> {
  const response = await axios.delete(
    `${BASE_URL}/api/asset-maintenance/service-categories/${id}`,
    withCredentials,
  );
  return response.data;
}

export async function getServiceCombos(
  serviceId: string,
  isActive?: boolean,
): Promise<ServiceCombo[]> {
  const response = await axios.get(
    `${BASE_URL}/api/asset-maintenance/services/${serviceId}/combos`,
    {
      params: {
        isActive,
      },
      ...withCredentials,
    },
  );
  return response.data as ServiceCombo[];
}

export async function getServiceOptions(
  serviceId: string,
  isActive?: boolean,
): Promise<ServiceOption[]> {
  const response = await axios.get(
    `${BASE_URL}/api/asset-maintenance/services/${serviceId}/options`,
    {
      params: {
        isActive,
      },
      ...withCredentials,
    },
  );
  return response.data as ServiceOption[];
}

export async function getServiceOptionGroups(serviceId: string): Promise<ServiceOptionGroup[]> {
  const response = await axios.get(
    `${BASE_URL}/api/asset-maintenance/services/${serviceId}/option-groups`,
    withCredentials,
  );
  return response.data as ServiceOptionGroup[];
}
