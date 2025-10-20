export interface Building{
    id: number,
    tenantId: number,
    code: string,
    name: string,
    address: string,
    floorsMax: number,
    totalApartmentsAll: number,
    totalApartmentsActive: number
}