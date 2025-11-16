import axios from "@/src/lib/axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8081";

export interface UnitImportRowResult {
  rowNumber: number;
  success: boolean;
  message: string | null;
  unitId?: string;
  buildingId?: string;
  buildingCode?: string;
  code?: string;
}

export interface UnitImportResponse {
  totalRows: number;
  successCount: number;
  errorCount: number;
  rows: UnitImportRowResult[];
}

export async function downloadUnitImportTemplate(): Promise<Blob> {
  const res = await axios.get(
    `${BASE_URL}/api/units/import/template`,
    { responseType: "blob", withCredentials: true }
  );
  return res.data as Blob;
}

export async function importUnits(file: File): Promise<UnitImportResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post(
    `${BASE_URL}/api/units/import`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    }
  );
  return res.data as UnitImportResponse;
}


