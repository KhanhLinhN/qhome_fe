"use client";

import { useState } from "react";
import { downloadBuildingImportTemplate, importBuildings, BuildingImportResponse } from "@/src/services/base/buildingImportService";

export default function BuildingImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BuildingImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const onDownloadTemplate = async () => {
    try {
      const blob = await downloadBuildingImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "building_import_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Tải template thất bại"));
    }
  };

  const onImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await importBuildings(file);
      setResult(res);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Import thất bại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Import tòa nhà</h2>
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded bg-gray-200" onClick={onDownloadTemplate}>Tải template</button>
        <input type="file" accept=".xlsx" onChange={onChangeFile} />
        <button disabled={!file || loading} className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50" onClick={onImport}>
          {loading ? "Đang import..." : "Import"}
        </button>
      </div>
      {error && <div className="text-red-600">{error}</div>}
      {result && (
        <div className="space-y-2">
          <div>Tổng dòng: {result.totalRows} | Thành công: {result.successCount} | Lỗi: {result.errorCount}</div>
          <div className="overflow-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Row</th>
                  <th className="border px-2 py-1">Success</th>
                  <th className="border px-2 py-1">Message</th>
                  <th className="border px-2 py-1">BuildingId</th>
                  <th className="border px-2 py-1">Code</th>
                  <th className="border px-2 py-1">Name</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{r.rowNumber}</td>
                    <td className="border px-2 py-1">{r.success ? "✓" : "✗"}</td>
                    <td className="border px-2 py-1">{r.message}</td>
                    <td className="border px-2 py-1">{r.buildingId}</td>
                    <td className="border px-2 py-1">{r.code}</td>
                    <td className="border px-2 py-1">{r.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}





