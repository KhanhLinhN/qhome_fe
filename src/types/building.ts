export interface Building {
    id: string;
    code: string;
    name: string;
    address?: string;
    floorsMax: number;
    totalApartmentsAll: number;
    totalApartmentsActive: number;
    status?: 'INACTIVE' | 'ACTIVE' | boolean | string;
    createdBy?: string;
    createdAt?: string;
}
