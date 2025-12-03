"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { downloadBuildingImportTemplate, importBuildings, BuildingImportResponse } from "@/src/services/base/buildingImportService";

export default function BuildingImportPage() {
  const t = useTranslations('Building');
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
    } catch (e: any) {
      setError(e?.response?.data?.message || t('messages.downloadTemplateError'));
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
    } catch (e: any) {
      setError(e?.response?.data?.message || t('messages.importError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">{t('importPage.title')}</h2>
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded bg-gray-200" onClick={onDownloadTemplate}>{t('importPage.downloadTemplate')}</button>
        <input type="file" accept=".xlsx" onChange={onChangeFile} />
        <button disabled={!file || loading} className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50" onClick={onImport}>
          {loading ? t('actions.importing') : t('importPage.import')}
        </button>
      </div>
      {error && <div className="text-red-600">{error}</div>}
      {result && (
        <div className="space-y-2">
          <div>{t('importResult.summary', { 
            totalRows: result.totalRows, 
            successCount: result.successCount, 
            errorCount: result.errorCount 
          })}</div>
          <div className="overflow-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">{t('importResult.row')}</th>
                  <th className="border px-2 py-1">{t('importResult.success')}</th>
                  <th className="border px-2 py-1">{t('importResult.message')}</th>
                  <th className="border px-2 py-1">{t('importResult.buildingId')}</th>
                  <th className="border px-2 py-1">{t('importResult.code')}</th>
                  <th className="border px-2 py-1">{t('importResult.name')}</th>
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








