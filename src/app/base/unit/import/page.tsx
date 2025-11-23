"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { downloadUnitImportTemplate, importUnits, UnitImportResponse } from "@/src/services/base/unitImportService";

export default function UnitImportPage() {
  const t = useTranslations('Unit.import');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UnitImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const onDownloadTemplate = async () => {
    try {
      const blob = await downloadUnitImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "unit_import_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.response?.data?.message || t('downloadFailed'));
    }
  };

  const onImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await importUnits(file);
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.message || t('importFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">{t('title')}</h2>
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded bg-gray-200" onClick={onDownloadTemplate}>{t('downloadTemplate')}</button>
        <input type="file" accept=".xlsx" onChange={onChangeFile} />
        <button disabled={!file || loading} className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50" onClick={onImport}>
          {loading ? t('importing') : t('import')}
        </button>
      </div>
      {error && <div className="text-red-600">{error}</div>}
      {result && (
        <div className="space-y-2">
          <div>{t('summary', { total: result.totalRows, success: result.successCount, errors: result.errorCount })}</div>
          <div className="overflow-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">{t('tableHeaders.row')}</th>
                  <th className="border px-2 py-1">{t('tableHeaders.success')}</th>
                  <th className="border px-2 py-1">{t('tableHeaders.message')}</th>
                  <th className="border px-2 py-1">{t('tableHeaders.unitId')}</th>
                  <th className="border px-2 py-1">{t('tableHeaders.buildingId')}</th>
                  <th className="border px-2 py-1">{t('tableHeaders.buildingCode')}</th>
                  <th className="border px-2 py-1">{t('tableHeaders.code')}</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{r.rowNumber}</td>
                    <td className="border px-2 py-1">{r.success ? "✓" : "✗"}</td>
                    <td className="border px-2 py-1">{r.message}</td>
                    <td className="border px-2 py-1">{r.unitId}</td>
                    <td className="border px-2 py-1">{r.buildingId}</td>
                    <td className="border px-2 py-1">{r.buildingCode}</td>
                    <td className="border px-2 py-1">{r.code}</td>
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








