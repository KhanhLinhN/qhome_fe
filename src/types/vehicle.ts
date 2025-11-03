export enum VehicleKind {
    CAR = 'CAR',
    MOTORCYCLE = 'MOTORCYCLE',
    BICYCLE = 'BICYCLE',
    OTHER = 'OTHER'
}

export interface Vehicle {
    id: string;
    tenantId: string;
    residentId: string;
    residentName: string;
    unitId: string;
    unitCode: string;
    plateNo: string;
    kind: VehicleKind;
    color: string;
    active: boolean;
    activatedAt?: string;
    registrationApprovedAt?: string;
    approvedBy?: string;
    createdAt: string;
    updatedAt: string;
}

