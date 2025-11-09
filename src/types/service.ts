export interface ServiceCategory {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number | null;
}

export interface Service {
  id: string;
  code?: string;
  name?: string;
  categoryId?: string;
  category?: ServiceCategory | null;
  pricingType?: string;
  bookingType?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number?: number;
  size?: number;
}

export interface CreateServicePayload {
  categoryId: string;
  code?: string;
  name: string;
  description?: string;
  location?: string;
  mapUrl?: string;
  pricingType?: string;
  bookingType?: string;
  pricePerHour?: number | null;
  pricePerSession?: number | null;
  maxCapacity?: number | null;
  minDurationHours?: number | null;
  maxDurationHours?: number | null;
  advanceBookingDays?: number | null;
  rules?: string;
  isActive?: boolean;
}

export type UpdateServicePayload = Partial<CreateServicePayload>;

export interface CreateServiceCategoryPayload {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number | null;
  isActive?: boolean;
}

export type UpdateServiceCategoryPayload = Partial<CreateServiceCategoryPayload>;

export interface ServiceCombo {
  id: string;
  name?: string;
  isActive?: boolean;
  price?: number | null;
}

export interface ServiceOption {
  id: string;
  name?: string;
  price?: number | null;
  isActive?: boolean;
}

export interface ServiceOptionGroup {
  id: string;
  name?: string;
  isActive?: boolean;
}

