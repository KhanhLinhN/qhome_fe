export interface Request {
    id: string;
    requestCode: string;
    residentId: string;
    residentName: string;
    imagePath: string | null;
    title: string;
    content: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    type?: string;
    fee?: number;
    repairedDate?: string;
}
