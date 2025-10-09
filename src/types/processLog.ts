export interface ProcessLog{
    id: number;
    recordType?: string;
    recordId: number;
    staffInChargeId: number;
    content: string;
    requestStatus: string;
    logType: string;
    staffInChargeName: string;
    createdDate: string;
}
