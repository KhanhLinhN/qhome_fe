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
    
    if (!f) {
      setFile(null);
      return;
    }

    // Validate file extension
    const fileName = f.name.toLowerCase();
    if (!fileName.endsWith('.xlsx')) {
      setError('File phải có định dạng .xlsx');
      setFile(null);
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (f.size > maxSize) {
      setError(`File quá lớn. Kích thước tối đa là 10MB. File hiện tại: ${(f.size / 1024 / 1024).toFixed(2)}MB`);
      setFile(null);
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file is not empty
    if (f.size === 0) {
      setError('File không được để trống');
      setFile(null);
      e.target.value = ''; // Reset input
      return;
    }

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
    // Validate file exists
    if (!file) {
      setError('Vui lòng chọn file Excel (.xlsx) để import');
      return;
    }

    // Validate file extension again
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx')) {
      setError('File phải có định dạng .xlsx');
      return;
    }

    // Validate file size again (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError(`File quá lớn. Kích thước tối đa là 10MB. File hiện tại: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Validate file is not empty
    if (file.size === 0) {
      setError('File không được để trống');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await importBuildings(file);
      setResult(res);
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || t('messages.importError');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800">{t('importPage.title')}</h2>
      
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Hướng dẫn:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Tải template Excel để xem cấu trúc file</li>
          <li>File phải có định dạng .xlsx</li>
          <li>Kích thước file tối đa: 10MB</li>
          <li>File phải có các cột: name, address (tùy chọn), numberOfFloors (bắt buộc)</li>
          <li>Tên building: bắt buộc, ít nhất 2 ký tự, tối đa 255 ký tự</li>
          <li>Địa chỉ: tùy chọn, nếu có thì ít nhất 5 ký tự, tối đa 500 ký tự</li>
          <li>Số tầng: bắt buộc, phải lớn hơn 0 và không vượt quá 200</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <button 
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition text-gray-800 font-medium"
            onClick={onDownloadTemplate}
          >
            {t('importPage.downloadTemplate')}
          </button>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn file Excel (.xlsx)
            </label>
            <input 
              type="file" 
              accept=".xlsx" 
              onChange={onChangeFile}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>
          <button 
            disabled={!file || loading} 
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition font-medium"
            onClick={onImport}
          >
            {loading ? t('actions.importing') : t('importPage.import')}
          </button>
        </div>

        {/* File info */}
        {file && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm text-green-800 font-medium">File đã chọn:</span>
              <span className="text-sm text-green-900">{file.name}</span>
              <span className="text-sm text-green-600">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-red-600 text-xl">✗</span>
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Lỗi:</h4>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      {result && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-4">
          {/* Summary */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <span className="text-sm text-blue-600 font-medium">Tổng số dòng:</span>
              <span className="ml-2 text-blue-900 font-semibold">{result.totalRows}</span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <span className="text-sm text-green-600 font-medium">Thành công:</span>
              <span className="ml-2 text-green-900 font-semibold">{result.successCount}</span>
            </div>
            {result.errorCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                <span className="text-sm text-red-600 font-medium">Lỗi:</span>
                <span className="ml-2 text-red-900 font-semibold">{result.errorCount}</span>
              </div>
            )}
          </div>

          {/* Warning if there are errors */}
          {result.errorCount > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-start">
                <span className="text-yellow-600 text-xl mr-2">⚠️</span>
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">
                    Có {result.errorCount} dòng lỗi trong quá trình import
                  </h4>
                  <p className="text-sm text-yellow-800">
                    Vui lòng kiểm tra bảng kết quả bên dưới để xem chi tiết các lỗi. Các dòng lỗi được đánh dấu bằng màu đỏ.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results table */}
          {result.rows.length > 0 && (
            <div className="overflow-auto border border-gray-200 rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      {t('importResult.row')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      {t('importResult.success')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r min-w-[300px]">
                      {t('importResult.message')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      {t('importResult.buildingId')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      {t('importResult.code')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('importResult.name')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.rows.map((r, idx) => (
                    <tr 
                      key={idx}
                      className={r.success 
                        ? 'bg-green-50/30 hover:bg-green-50/50' 
                        : 'bg-red-50/50 hover:bg-red-50/70 border-l-4 border-red-400'}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r">
                        {r.rowNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm border-r">
                        <span className={r.success ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {r.success ? "✓ Thành công" : "✗ Lỗi"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm border-r">
                        {r.message ? (
                          <div className={`max-w-md ${r.success ? 'text-gray-700' : 'text-red-700 font-medium'}`}>
                            <span 
                              className={`${r.success ? '' : 'text-red-600'} break-words`}
                              title={r.message}
                            >
                              {r.message}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 border-r">
                        {r.buildingId || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 border-r">
                        {r.code || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {r.name || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}




