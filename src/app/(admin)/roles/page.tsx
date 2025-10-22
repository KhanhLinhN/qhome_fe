"use client";
import React from 'react';
import RolePermissionManager from '@/src/components/admin/RolePermissionManager';

export default function RolesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Role & Permission Management
        </h1>
        <p className="text-slate-600 mt-1">
          Xem và quản lý roles cùng permissions của hệ thống
        </p>
      </div>

      <RolePermissionManager />
    </div>
  );
}

