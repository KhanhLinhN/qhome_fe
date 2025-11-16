"use client";

import { useRef, useState } from "react";
import {
  downloadContractImportTemplate,
  importContracts,
  type ContractImportResponse,
} from "@/src/services/datadocs/contractImportService";

export default function ContractImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ContractImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0];
    setFile(f ?? null);
  };

  const onDownloadTemplate = async () => {
    try {
      const blob = await downloadContractImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contract_import_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || "Không thể tải template");
    }
  };

  const onImport = async () => {
    if (!file) {
      setError("Vui lòng chọn file .xlsx");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await importContracts(file);
      setResult(res);
      setSubmitting(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Có lỗi khi import");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0a0a0a]">Import hợp đồng (Excel)</h1>
        <p className="text-gray-600">Tải template, điền dữ liệu rồi import để tạo nhanh các hợp đồng.</p>
      </div>
      <div className="flex items-center gap-4">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          onChange={onSelect}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
        />
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm"
        >
          Tải mẫu Excel
        </button>
        <button
          type="button"
          onClick={onImport}
          disabled={!file || submitting}
          className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
        >
          {submitting ? "Đang import..." : "Import"}
        </button>
      </div>

      {error ? <div className="text-red-600 text-sm">{error}</div> : null}

      {result ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-700">
            Tổng dòng: <b>{result.totalRows}</b> • Thành công: <b>{result.successCount}</b> • Lỗi: <b>{result.failureCount}</b>
          </div>
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Contract No.</th>
                  <th className="px-3 py-2 text-left">Kết quả</th>
                  <th className="px-3 py-2 text-left">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.rowNumber} className="border-t">
                    <td className="px-3 py-2">{r.rowNumber}</td>
                    <td className="px-3 py-2">{r.contractNumber || "-"}</td>
                    <td className="px-3 py-2">{r.success ? "OK" : "Lỗi"}</td>
                    <td className="px-3 py-2">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}


