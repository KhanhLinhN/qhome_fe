"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { exportContractPdf, type BuyerRequest } from "@/src/services/datadocs/pdfService";

export default function ContractExportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [buyer, setBuyer] = useState<BuyerRequest>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (k: keyof BuyerRequest, v: string) => {
    setBuyer((prev) => ({ ...prev, [k]: v }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const blob = await exportContractPdf(id, buyer, { filename: `hop_dong_${id}.pdf`, flatten: true });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hop_dong_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Không thể xuất PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <button className="text-sm text-slate-600" onClick={() => router.back()}>
        ← Quay lại
      </button>
      <h1 className="text-2xl font-semibold">Xuất hợp đồng PDF</h1>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Tên người mua</label>
          <input className="border rounded p-2 w-full" onChange={e => setField("name", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">CCCD/Hộ chiếu</label>
          <input className="border rounded p-2 w-full" onChange={e => setField("idNo", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Ngày cấp (dd/MM/yyyy)</label>
          <input className="border rounded p-2 w-full" onChange={e => setField("idDate", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Nơi cấp</label>
          <input className="border rounded p-2 w-full" onChange={e => setField("idPlace", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Nơi cư trú</label>
          <input className="border rounded p-2 w-full" onChange={e => setField("residence", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Địa chỉ liên hệ</label>
          <input className="border rounded p-2 w-full" onChange={e => setField("address", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Điện thoại</label>
          <input className="border rounded p-2 w-full" onChange={e => setField("phone", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">MST (nếu có)</label>
          <input className="border rounded p-2 w-full" onChange={e => setField("taxCode", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Số tài khoản</label>
          <input className="border rounded p-2 w-full" onChange={e => setField("bankAcc", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Ngân hàng</label>
          <input className="border rounded p-2 w-full" onChange={e => setField("bankName", e.target.value)} />
        </div>
      </form>

      {error ? <div className="text-red-600 text-sm">{error}</div> : null}

      <button
        onClick={onSubmit}
        disabled={loading}
        className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
      >
        {loading ? "Đang tạo..." : "Xuất PDF"}
      </button>
    </div>
  );
}
