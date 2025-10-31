"use client";
import React from "react";
import Link from "next/link";
// import TenantList from "@/src/components/dashboard/TenantList";
import InvoicesFilters from "@/src/components/account/InvoicesFilters";
import InvoiceTable from "@/src/components/account/InvoiceTable";
import NotifyPreviewDialog from "@/src/components/account/NotifyPreviewDialog";
import { CatalogApi } from "@/src/services/finance";
import { InvoiceApi } from "@/src/services/finance";
import { Building, BillingCycle, NotificationTemplate, NotificationChannel, PreviewItem } from "@/src/types/domain";
import { useNotifications } from "@/src/hooks/useNotifications";
import { useAuth } from "@/src/contexts/AuthContext";

// TODO: lấy tenantId từ token/session
const TENANT_ID = "tenant-1";

export default function AccountingDashboard(){
  const { show } = useNotifications();

  // catalogs
  const [buildings, setBuildings] = React.useState<Building[]>([]);
  const [cycles, setCycles] = React.useState<BillingCycle[]>([]);
  const [templates, setTemplates] = React.useState<NotificationTemplate[]>([]);

  // filters
  const [filters, setFilters] = React.useState<{buildingIds: string[]; billingCycleId?:string; templateId?:string}>({
    buildingIds: []
  });

  // table
  const [rows, setRows] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(0);
  const [size] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  // preview dialog
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewItems, setPreviewItems] = React.useState<PreviewItem[]>([]);

  // load catalogs once
  React.useEffect(()=>{
    // TODO: Uncomment khi backend có các API này
    // (async ()=>{
    //   const [b, c, t] = await Promise.all([
    //     CatalogApi.buildings(TENANT_ID),
    //     CatalogApi.billingCyclesOpen(TENANT_ID),
    //     CatalogApi.feeTemplates(TENANT_ID),
    //   ]);
    //   setBuildings(b); setCycles(c); setTemplates(t);
    //   // default cycle = first OPEN if not chosen
    //   setFilters(f=>({ ...f, billingCycleId: f.billingCycleId ?? c[0]?.id }));
    // })().catch(e=>show(String(e),"error"));
  },[]); // eslint-disable-line

  // load table when filters/page change & have minimal filter
  const refresh = React.useCallback(async ()=>{
    // TODO: Uncomment khi backend có InvoiceApi
    // if(!filters.billingCycleId) return;
    // const resp = await InvoiceApi.list({
    //   tenantId:TENANT_ID,
    //   billingCycleId: filters.billingCycleId,
    //   buildingIds: filters.buildingIds,
    //   status: "PUBLISHED",
    //   page, size, sort: "unitCode,asc"
    // });
    // setRows(resp.content);
    // setTotal(resp.totalElements);
    // setSelected(new Set()); // reset selection khi refresh
  },[filters, page, size]);

  // React.useEffect(()=>{ refresh().catch(e=>show(String(e),"error")); }, [refresh]);

  // handlers
  const handleToggleNotify = async (id:string, enabled:boolean)=>{
    await InvoiceApi.toggleNotify(id, enabled);
    setRows(prev => prev.map(r => r.id===id ? {...r, notifyEnabled: enabled}: r));
    show(enabled ? "Đã bật thông báo cho hóa đơn" : "Đã tắt thông báo cho hóa đơn", "success");
  };

  const handleView = async (id:string)=>{
    const detail = await InvoiceApi.get(id);
    alert(JSON.stringify(detail, null, 2)); // Bạn có thể thay bằng modal chi tiết đẹp mắt
  };

  const handlePreview = async ()=>{
    if(!filters.templateId){ show("Chọn template trước khi gửi", "error"); return; }
    const ids = Array.from(selected);
    if(!ids.length){ show("Chọn ít nhất 1 hóa đơn để gửi", "error"); return; }
    const { items } = await InvoiceApi.preview(ids, filters.templateId);
    setPreviewItems(items);
    setPreviewOpen(true);
  };

  const handleSend = async (channels: NotificationChannel[])=>{
    if(!channels.length){ show("Chọn ít nhất 1 kênh gửi", "error"); return; }
    const ids = Array.from(selected);
    const res = await InvoiceApi.send(ids, filters.templateId!, channels, false);
    setPreviewOpen(false);
    show(`Gửi thành công: ${res.accepted.length} • Lỗi: ${res.rejected.length}`, res.rejected.length? "error":"success");
    // optional: refresh để cập nhật notifyStatus
    refresh().catch(()=>{});
  };

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="max-w-screen overflow-x-hidden ">
        <h1 className="text-2xl font-semibold text-[#02542D] mb-4">Accounting Dashboard</h1>
        
        {/* Danh sách Tenants - Mục đầu tiên, click để xem Buildings */}
        {/* <TenantList /> */}

        {/* Admin Quick Actions */}
        <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/roles"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🔐</div>
            <div className="font-medium text-slate-800 text-center">Roles & Permissions</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý phân quyền</div>
          </Link>

          <Link 
            href="/users"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">👥</div>
            <div className="font-medium text-slate-800 text-center">User Management</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý người dùng</div>
          </Link>

          <Link 
            href="/settings"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">⚙️</div>
            <div className="font-medium text-slate-800 text-center">System Settings</div>
            <div className="text-xs text-slate-500 text-center mt-1">Cài đặt hệ thống</div>
          </Link>

          <Link 
            href="/reports"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📊</div>
            <div className="font-medium text-slate-800 text-center">Reports</div>
            <div className="text-xs text-slate-500 text-center mt-1">Báo cáo thống kê</div>
          </Link>
        </div>
      </div>

        {/* Hàng thẻ thống kê gọn */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4">
          <div className="text-slate-500 text-sm">Hộ cư dân</div>
          <div className="text-2xl font-semibold mt-1">—</div>
        </div>

        {/* Filters */}
        <InvoicesFilters
          buildings={buildings} cycles={cycles} templates={templates}
          value={filters}
          onChange={(v)=>setFilters(f=>({ ...f, ...v }))}
          onRefresh={()=>{ setPage(0); refresh().catch(e=>show(String(e),"error")); }}
        />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Đã chọn: <b>{selected.size}</b>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={handlePreview}>Gửi thông báo</button>
          </div>
        </div>

        {/* Table */}
        <InvoiceTable
          rows={rows}
          page={page} size={size} total={total}
          onPageChange={p=>setPage(p)}
          selected={selected} onSelectChange={setSelected}
          onView={handleView}
          onToggleNotify={handleToggleNotify}
        />

        {/* Preview & Send */}
        <NotifyPreviewDialog
          open={previewOpen}
          onClose={()=>setPreviewOpen(false)}
          items={previewItems}
          onSend={handleSend}
        />
        </div>
      </div>
    </div>
  );
}
