import axios from '@/src/lib/axios';
import {
  CreateServiceCategoryPayload,
  CreateServiceComboPayload,
  CreateServiceOptionGroupPayload,
  CreateServiceOptionPayload,
  CreateServicePayload,
  CreateServiceTicketPayload,
  Service,
  ServiceCategory,
  ServiceCombo,
  ServiceOption,
  ServiceOptionGroup,
  ServiceTicket,
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

export async function getServiceTickets(
  serviceId: string,
  isActive?: boolean,
): Promise<ServiceTicket[]> {
  const response = await axios.get(
    `${BASE_URL}/api/asset-maintenance/services/${serviceId}/tickets`,
    {
      params: {
        isActive,
      },
      ...withCredentials,
    },
  );
  return response.data as ServiceTicket[];
}

export async function getServiceOptionGroups(serviceId: string): Promise<ServiceOptionGroup[]> {
  const response = await axios.get(
    `${BASE_URL}/api/asset-maintenance/services/${serviceId}/option-groups`,
    withCredentials,
  );
  return response.data as ServiceOptionGroup[];
}

export async function createServiceCombo(
  serviceId: string,
  data: CreateServiceComboPayload,
): Promise<ServiceCombo> {
  const response = await axios.post(
    `${BASE_URL}/api/asset-maintenance/services/${serviceId}/combos`,
    data,
    withCredentials,
  );
  return response.data as ServiceCombo;
}

export async function createServiceOption(
  serviceId: string,
  data: CreateServiceOptionPayload,
): Promise<ServiceOption> {
  const response = await axios.post(
    `${BASE_URL}/api/asset-maintenance/services/${serviceId}/options`,
    data,
    withCredentials,
  );
  return response.data as ServiceOption;
}

export async function createServiceOptionGroup(
  serviceId: string,
  data: CreateServiceOptionGroupPayload,
): Promise<ServiceOptionGroup> {
  const response = await axios.post(
    `${BASE_URL}/api/asset-maintenance/services/${serviceId}/option-groups`,
    data,
    withCredentials,
  );
  return response.data as ServiceOptionGroup;
}

export async function createServiceTicket(
  serviceId: string,
  data: CreateServiceTicketPayload,
): Promise<ServiceTicket> {
  const response = await axios.post(
    `${BASE_URL}/api/asset-maintenance/services/${serviceId}/tickets`,
    data,
    withCredentials,
  );
  return response.data as ServiceTicket;
}

export async function deleteServiceCombo(comboId: string): Promise<void> {
  await axios.delete(
    `${BASE_URL}/api/asset-maintenance/service-combos/${comboId}`,
    withCredentials,
  );
}

export async function deleteServiceOption(optionId: string): Promise<void> {
  await axios.delete(
    `${BASE_URL}/api/asset-maintenance/service-options/${optionId}`,
    withCredentials,
  );
}

export async function deleteServiceTicket(ticketId: string): Promise<void> {
  await axios.delete(
    `${BASE_URL}/api/asset-maintenance/service-tickets/${ticketId}`,
    withCredentials,
  );
}
