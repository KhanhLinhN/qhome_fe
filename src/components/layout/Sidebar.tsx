"use client";
import React, {useState, useMemo} from "react";
import Link from "next/link";
import Image from "next/image";
import {usePathname} from "next/navigation";
import {useAuth} from "@/src/contexts/AuthContext";
import {useTranslations} from "next-intl";
import DropdownArrow from "@/src/assets/DropdownArrow.svg";

type SidebarVariant = "admin" | "tenant-owner" | "technician";

type NavItem = {
  href: string;
  icon: string;
  labelKey?: string;
  label?: string;
};

type NavSection = {
  titleKey: string;
  items: NavItem[];
};

const adminSections: NavSection[] = [
  {
    titleKey: "overview",
    items: [
      {href: "/dashboard", labelKey: "dashboard", icon: "📊"},
    ],
  },
  // {
  //   titleKey: "systemAdmin",
  //   items: [
  //     {href: "/roles", labelKey: "permissions", icon: "🛡️"},
  //     {href: "/tenants", labelKey: "tenant", icon: "🏢"},
  //     {href: "/tenant-deletions", labelKey: "tenantDeletionRequests", icon: "🗑️"},
  //     {href: "/users/permissions", labelKey: "userPermissions", icon: "⚙️"},
  //   ],
  // },
  {
    titleKey: "accounts",
    items: [
      {href: "/accountList", labelKey: "accountList", icon: "👥"},
      {href: "/accountNewStaff", labelKey: "createStaffAccount", icon: "🧑‍💼"},
      {href: "/accountNewRe", labelKey: "createResidentAccount", icon: "🏘️"},
    ],
  },
  {
    titleKey: "buildingsAndResidents",
    items: [
      {href: "/base/building/buildingList", labelKey: "buildingManagement", icon: "🏢"},
      {href: "/base/unit/unitList", labelKey: "unitManagement", icon: "🏠"},
      {href: "/base/residentView", labelKey: "residentList", icon: "👨‍👩‍👧‍👦"},
      {href: "/base/regisresiView", labelKey: "approveResidentAccount", icon: "📝"},
      {href: "/base/household/householdMemberRequests", labelKey: "approveFamilyMember", icon: "👪"},
      {href: "/base/contract/contracts", labelKey: "unitContracts", icon: "📄"},
      {href: "/base/contract/rental-review", labelKey: "rentalContractReview", icon: "📋"},
      {href: "/base/vehicles/vehicleAll", labelKey: "vehicleManagement", icon: "🚗"},
      {href: "/base/cards/elevator", labelKey: "elevatorCard", icon: "🛗"},
      {href: "/base/cards/resident", labelKey: "residentCard", icon: "🔑"},
      {href: "/base/cards/approved", labelKey: "approvedCard", icon: "✅"},
      {href: "/base/cards/pricing", labelKey: "cardPricingManagement", icon: "💰"},
    ],
  },
  {
    titleKey: "assetManagement",
    items: [
      {href: "/base/asset-management", labelKey: "assetManagement", icon: "🔧"},
      {href: "/base/meter-management", labelKey: "meterManagement", icon: "⚙️"},
      {href: "/base/asset-inspection-management", labelKey: "assetInspectionManagement", icon: "📋"},
      {href: "/base/asset-inspection-approval", labelKey: "assetInspectionApproval", icon: "✅"},
    ],
  },
  {
    titleKey: "services",
    items: [
      {href: "/base/serviceCateList", labelKey: "serviceCategories", icon: "🗂️"},
      {href: "/base/serviceList", labelKey: "serviceList", icon: "🧾"},
      {href: "/base/serviceNew", labelKey: "createService", icon: "➕"},
      // {href: "/base/serviceType", labelKey: "serviceType", icon: "📂"},
      // {href: "/base/serviceRequest", labelKey: "serviceRequests", icon: "📬"},
    ],
  },
  {
    titleKey: "waterElectric",
    items: [
      {href: "/base/readingCycles", labelKey: "readingCycles", icon: "📈"},
      // {href: "/base/readingSessions", labelKey: "readingSessions", icon: "🧮"},
      {href: "/base/readingAssign", labelKey: "assignReading", icon: "📝"},
      // {href: "/base/showAssign", labelKey: "assignmentList", icon: "📋"},
      // {href: "/base/waterShow", labelKey: "waterMonitoring", icon: "💧"},
      {href: "/base/billingCycles", labelKey: "billingCycles", icon: "💡"},
      {href: "/base/finance/invoices", labelKey: "incomeExpenseManagement", icon: "💰"},
      {href: "/base/finance/pricing-tiers", labelKey: "pricingTiersManagement", icon: "📊"},
    ],
  },
  {
    titleKey: "residentInteraction",
    items: [
      {href: "/customer-interaction/new/newList", labelKey: "news", icon: "📰"},
      {href: "/customer-interaction/notiList", labelKey: "notifications", icon: "🔔"},
      {href: "/customer-interaction/request", labelKey: "supportRequests", icon: "📨"},
      // {href: "/customer-interaction/requestTicket", labelKey: "tickets", icon: "🎫"},
    ],
  },
];

const technicianSections: NavSection[] = [
  {
    titleKey: "overview",
    items: [
      {href: "/dashboard", labelKey: "dashboard", icon: "📊"},
    ],
  },
  {
    titleKey: "accounts",
    items: [
      {href: "/staffProfile", labelKey: "personalInfo", icon: "👤"},
    ],
  },
  {
    titleKey: "services",
    items: [
      {href: "/base/asset-inspection-assignments", labelKey: "assetInspectionAssignments", icon: "🔧"},
    ],
  },
  {
    titleKey: "waterElectric",
    items: [
      {href: "/base/showAssign", labelKey: "taskList", icon: "🧾"},
    ],
  },
  {
    titleKey: "residentInteraction",
    items: [
      {href: "/customer-interaction/request", labelKey: "supportRequests", icon: "📨"},
    ],
  },
];

const tenantOwnerSections: NavSection[] = [
  {
    titleKey: "overview",
    items: [
      {href: "/tenant-owner", labelKey: "home", icon: "🏠"},
    ],
  },
  {
    titleKey: "management",
    items: [
      {href: "/tenant-owner/buildings", labelKey: "buildings", icon: "🏢"},
      {href: "/tenant-owner/employees", labelKey: "employees", icon: "👥"},
    ],
  },
];

const menuConfig: Record<SidebarVariant, NavSection[]> = {
  admin: adminSections,
  technician: technicianSections,
  "tenant-owner": tenantOwnerSections,
};

interface SidebarProps {
  variant?: SidebarVariant;
}

export default function Sidebar({variant = "admin"}: SidebarProps) {
  const pathname = usePathname();
  const {user} = useAuth();
  const t = useTranslations('Sidebar');

  const normalizedRoles = user?.roles?.map(role => role.toLowerCase()) ?? [];

  const resolvedVariant: SidebarVariant =
    variant === "admin"
      ? normalizedRoles.includes("admin")
        ? "admin"
        : normalizedRoles.includes("technician")
          ? "technician"
          : "admin"
      : variant;

  const sections = menuConfig[resolvedVariant];

  // Helper function to check if a pathname matches an item
  const isItemActive = (item: NavItem, currentPath: string): boolean => {
    return currentPath === item.href || currentPath.startsWith(`${item.href}/`);
  };

  // Helper function to find sections that should be open (contain active items)
  const getOpenSections = (sections: NavSection[], currentPath: string): Set<string> => {
    const openSections = new Set<string>();
    sections.forEach(section => {
      const hasActiveItem = section.items.some(item => isItemActive(item, currentPath));
      if (hasActiveItem) {
        openSections.add(section.titleKey);
      }
    });
    return openSections;
  };

  // Initialize sections: all collapsed except those containing active items
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    const allSections = new Set(sections.map(section => section.titleKey));
    const openSections = getOpenSections(sections, pathname);
    // Remove open sections from collapsed set
    openSections.forEach(key => allSections.delete(key));
    return allSections;
  });

  // Track previous variant to detect variant changes
  const prevVariantRef = React.useRef(resolvedVariant);

  // Update collapsed sections when variant or pathname changes
  React.useEffect(() => {
    const variantChanged = prevVariantRef.current !== resolvedVariant;
    prevVariantRef.current = resolvedVariant;

    if (variantChanged) {
      // When variant changes, reset all sections and open only those with active items
      const allSections = new Set(sections.map(section => section.titleKey));
      const openSections = getOpenSections(sections, pathname);
      openSections.forEach(key => allSections.delete(key));
      setCollapsedSections(allSections);
    } else {
      // When only pathname changes, ensure sections with active items are open
      // but keep other open sections as they are
      setCollapsedSections(prev => {
        const newSet = new Set(prev);
        const openSections = getOpenSections(sections, pathname);
        // Remove sections with active items from collapsed set (open them)
        openSections.forEach(key => newSet.delete(key));
        return newSet;
      });
    }
  }, [resolvedVariant, pathname, sections]);

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  return (
    <aside className="w-60 hidden md:flex flex-col border-r border-slate-200 bg-white fixed h-screen max-h-screen overflow-hidden">
      <nav className="p-3 space-y-6 overflow-y-auto overflow-x-hidden flex-1 min-h-0 max-h-full">
        {sections.map((section) => {
          const isCollapsed = collapsedSections.has(section.titleKey);
          return (
            <div key={section.titleKey} className="space-y-2">
              <button
                onClick={() => toggleSection(section.titleKey)}
                className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span>{t(section.titleKey)}</span>
                <Image
                  src={DropdownArrow}
                  alt="Toggle"
                  width={12}
                  height={12}
                  className={`transition-transform ${isCollapsed ? "rotate-180" : ""}`}
                />
              </button>
              {!isCollapsed && (
                <div className="space-y-1">
                  {section.items.map((item: NavItem) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          active ? "bg-[#6B9B6E] text-white" : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span aria-hidden className="w-5 text-center flex items-center justify-center">
                          {item.icon}
                        </span>
                        <span className="truncate">
                          {item.labelKey ? t(item.labelKey) : item.label ?? item.href}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
