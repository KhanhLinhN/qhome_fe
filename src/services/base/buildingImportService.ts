import axios from "@/src/lib/axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8081";

export interface BuildingImportRowResult {
  rowNumber: number;
  success: boolean;
  message: string | null;
  buildingId?: string;
  code?: string;
  name?: string;
}

export interface BuildingImportResponse {
  totalRows: number;
  successCount: number;
  errorCount: number;
  rows: BuildingImportRowResult[];
}

export async function downloadBuildingImportTemplate(): Promise<Blob> {
  const res = await axios.get(
    `${BASE_URL}/api/buildings/import/template`,
    { responseType: "blob", withCredentials: true }
  );
  return res.data as Blob;
}

export async function importBuildings(file: File): Promise<BuildingImportResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post(
    `${BASE_URL}/api/buildings/import`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    }
  );
  return res.data as BuildingImportResponse;
}


