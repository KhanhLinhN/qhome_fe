export interface Unit {
    id: string;
    buildingId: string;
    tenantId?: string;
    code: string;
    name: string;
    floor: number;
    area?: number;
    bedrooms?: number;
    status?: string;
    ownerName?: string;
    ownerContact?: string;
}
