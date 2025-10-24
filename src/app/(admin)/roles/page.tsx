"use client";
import React from 'react';
import RolePermissionManager from '@/src/components/admin/RolePermissionManager';

export default function RolesPage() {
  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="max-w-screen overflow-x-hidden bg-[#F5F7FA]">
        <h1 className="text-2xl font-semibold text-[#02542D] mb-4">
          Role & Permission Management
        </h1>
        <p className="text-slate-600 mb-4">
          Xem và quản lý roles cùng permissions của hệ thống
        </p>

        <RolePermissionManager />
      </div>
    </div>
  );
}

