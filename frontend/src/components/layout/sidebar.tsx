'use client';

import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Clipboard,
  LayoutDashboard,
  Server,
  Settings,
  Shield,
  SidebarClose,
  SidebarIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type SidebarItemProps = {
  href: string;
  icon: React.ReactNode;
  title: string;
  content?: { title: string; href: string }[];
};

const SidebarItem = ({ href, icon, title, content }: SidebarItemProps) => {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(
    pathname.startsWith(href) && href !== '/dashboard'
  );

  const isActive = pathname === href || (content && (pathname.startsWith(href) || pathname.includes(href)))

  // Handle submenu items
  if (content) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "sidebar-item cursor-pointer text-sm w-full hover:bg-secondary rounded-sm flex items-center px-2 py-1.5 justify-between",
            isActive && "text-primary"
          )}
        >
          <span className="flex items-center gap-3">
            {icon}
            <span>{title}</span>
          </span>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {expanded && (
          <div className="ml-8 mt-2 space-y-1">
            {content.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className={cn(
                  "sidebar-item text-sm px-2 py-1.5 block hover:bg-secondary rounded-sm",
                  pathname === item.href && "bg-secondary text-primary font-medium"
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Regular menu item
  return (
    <Link
      href={href}
      className={cn(
        "sidebar-item text-sm flex hover:bg-secondary rounded-sm items-center gap-3 px-2 py-1.5",
        isActive && "bg-secondary text-primary font-medium"
      )}
    >
      {icon}
      <span>{title}</span>
    </Link>
  );
};

export function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname()

  // Only show sidebar items relevant to user's roles
  const canAccessRisk = user?.roles?.some(
    role => ['ADMIN', 'RISK_MANAGER', 'COMPLIANCE_MANAGER'].includes(role.toUpperCase())
  );

  const canAccessAudit = user?.roles?.some(
    role => ['ADMIN', 'AUDITOR', 'COMPLIANCE_MANAGER'].includes(role.toUpperCase())
  );

  const canAccessReporting = user?.roles?.some(
    role => ['ADMIN', 'COMPLIANCE_MANAGER', 'RISK_MANAGER', 'AUDITOR'].includes(role.toUpperCase())
  );

  const canAccessSettings = user?.roles?.some(
    role => ['ADMIN'].includes(role.toUpperCase())
  );

  return (
    <div className={cn(
      "flex flex-col border-r bg-background h-screen transition-all duration-200",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-14 items-center justify-center border-b px-2">
        {!collapsed ? (
          <div className="flex justify-between items-center w-full">
            <h1 className="text-lg font-semibold">Doqett</h1>
            <button onClick={() => setCollapsed(true)} className="p-1 rounded-md hover:bg-secondary">
              <SidebarClose size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="flex items-center justify-center p-1 h-8 w-8 rounded-md hover:bg-secondary"
          >
            <SidebarIcon size={16} />
          </button>
        )}
      </div>

      <div className={cn(
        "flex-1 overflow-auto py-2",
        collapsed ? "px-2" : "px-2"
      )}>
        {!collapsed ? (
          <nav className="flex flex-col gap-1">
            <SidebarItem
              href="/dashboard"
              icon={<LayoutDashboard size={16} />}
              title="Dashboard"
            />

            <SidebarItem
              href="/compliance"
              icon={<Shield size={16} />}
              title="Compliance"
              content={[
                { title: "Frameworks", href: "/compliance/frameworks" },
                { title: "Controls", href: "/compliance/controls" },
                { title: "Evidence", href: "/compliance/evidence" },
                { title: "Policies", href: "/compliance/policies" },
              ]}
            />

            {canAccessRisk && (
              <SidebarItem
                href="/risk"
                icon={<AlertTriangle size={16} />}
                title="Risk Management"
                content={[
                  { title: "Risk Register", href: "/risk/register" },
                  { title: "Risk Treatments", href: "/risk/treatments" },
                  { title: "Risk Assessment", href: "/risk/assessment" },
                ]}
              />
            )}

            {canAccessAudit && (
              <SidebarItem
                href="/audit"
                icon={<Clipboard size={16} />}
                title="Audit Management"
                content={[
                  { title: "Audits", href: "/audit/audits" },
                  { title: "Findings", href: "/audit/findings" },
                  { title: "Templates", href: "/audit/templates" },
                ]}
              />
            )}

            <SidebarItem
              href="/assets"
              icon={<Server size={16} />}
              title="Assets"
            />

            {canAccessReporting && (
              <SidebarItem
                href="/reporting"
                icon={<BarChart3 size={16} />}
                title="Reporting"
                content={[
                  { title: "Reports", href: "/reporting/reports" },
                  { title: "Dashboards", href: "/reporting/dashboards" },
                  { title: "Metrics", href: "/reporting/metrics" },
                ]}
              />
            )}

            {canAccessSettings && (
              <SidebarItem
                href="/settings"
                icon={<Settings size={16} />}
                title="Settings"
              />
            )}
          </nav>
        ) : (
          <nav className="flex flex-col gap-1 items-center">
            <Link href="/dashboard" className={cn(
              "p-2 rounded-md hover:bg-secondary",
              pathname === "/dashboard" && "bg-secondary text-primary"
            )}>
              <LayoutDashboard size={16} />
            </Link>

            <Link href="/compliance/frameworks" className={cn(
              "p-2 rounded-md hover:bg-secondary",
              pathname.startsWith("/compliance") && "bg-secondary text-primary"
            )}>
              <Shield size={16} />
            </Link>

            {canAccessRisk && (
              <Link href="/risk/register" className={cn(
                "p-2 rounded-md hover:bg-secondary",
                pathname.startsWith("/risk") && "bg-secondary text-primary"
              )}>
                <AlertTriangle size={16} />
              </Link>
            )}

            {canAccessAudit && (
              <Link href="/audit/audits" className={cn(
                "p-2 rounded-md hover:bg-secondary",
                pathname.startsWith("/audit") && "bg-secondary text-primary"
              )}>
                <Clipboard size={16} />
              </Link>
            )}

            <Link href="/assets" className={cn(
              "p-2 rounded-md hover:bg-secondary",
              pathname.startsWith("/assets") && "bg-secondary text-primary"
            )}>
              <Server size={16} />
            </Link>

            {canAccessReporting && (
              <Link href="/reporting/reports" className={cn(
                "p-2 rounded-md hover:bg-secondary",
                pathname.startsWith("/reporting") && "bg-secondary text-primary"
              )}>
                <BarChart3 size={16} />
              </Link>
            )}

            {canAccessSettings && (
              <Link href="/settings" className={cn(
                "p-2 rounded-md hover:bg-secondary",
                pathname.startsWith("/settings") && "bg-secondary text-primary"
              )}>
                <Settings size={16} />
              </Link>
            )}
          </nav>
        )}
      </div>

      {!collapsed && (
        <div className="mt-auto h-12 border-t p-4">
            <div className="text-xs text-muted-foreground">
              <p>Logged in as {user?.firstName} {user?.lastName}</p>
            </div>
        </div>
        )}
    </div>
  );
}
