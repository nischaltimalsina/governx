'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Shield,
  AlertTriangle,
  BarChart3,
  Server,
  Clipboard,
  Settings,
  Menu,
  X,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

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

  const isActive = pathname === href || (content && pathname.startsWith(href));

  // Handle submenu items
  if (content) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "sidebar-item w-full flex justify-between",
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
                  "sidebar-item block",
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
        "sidebar-item",
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
    role => ['ADMIN', 'RISK_MANAGER', 'COMPLIANCE_MANAGER'].includes(role)
  );

  const canAccessAudit = user?.roles?.some(
    role => ['ADMIN', 'AUDITOR', 'COMPLIANCE_MANAGER'].includes(role)
  );

  const canAccessReporting = user?.roles?.some(
    role => ['ADMIN', 'COMPLIANCE_MANAGER', 'RISK_MANAGER', 'AUDITOR'].includes(role)
  );

  const canAccessSettings = user?.roles?.some(
    role => ['ADMIN'].includes(role)
  );

  return (
    <div className={cn(
      "flex flex-col border-r bg-background h-screen transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed ? (
          <div className="flex justify-between items-center w-full">
            <h1 className="text-lg font-semibold">Doqett</h1>
            <button onClick={() => setCollapsed(true)} className="p-1 rounded-md hover:bg-secondary">
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex justify-center p-1 rounded-md hover:bg-secondary"
          >
            <Menu size={20} />
          </button>
        )}
      </div>

      <div className={cn(
        "flex-1 overflow-auto py-4",
        collapsed ? "px-2" : "px-4"
      )}>
        {!collapsed ? (
          <nav className="flex flex-col gap-1">
            <SidebarItem
              href="/dashboard"
              icon={<LayoutDashboard size={20} />}
              title="Dashboard"
            />

            <SidebarItem
              href="/compliance"
              icon={<Shield size={20} />}
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
                icon={<AlertTriangle size={20} />}
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
                icon={<Clipboard size={20} />}
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
              icon={<Server size={20} />}
              title="Assets"
            />

            {canAccessReporting && (
              <SidebarItem
                href="/reporting"
                icon={<BarChart3 size={20} />}
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
                icon={<Settings size={20} />}
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
              <LayoutDashboard size={20} />
            </Link>

            <Link href="/compliance/frameworks" className={cn(
              "p-2 rounded-md hover:bg-secondary",
              pathname.startsWith("/compliance") && "bg-secondary text-primary"
            )}>
              <Shield size={20} />
            </Link>

            {canAccessRisk && (
              <Link href="/risk/register" className={cn(
                "p-2 rounded-md hover:bg-secondary",
                pathname.startsWith("/risk") && "bg-secondary text-primary"
              )}>
                <AlertTriangle size={20} />
              </Link>
            )}

            {canAccessAudit && (
              <Link href="/audit/audits" className={cn(
                "p-2 rounded-md hover:bg-secondary",
                pathname.startsWith("/audit") && "bg-secondary text-primary"
              )}>
                <Clipboard size={20} />
              </Link>
            )}

            <Link href="/assets" className={cn(
              "p-2 rounded-md hover:bg-secondary",
              pathname.startsWith("/assets") && "bg-secondary text-primary"
            )}>
              <Server size={20} />
            </Link>

            {canAccessReporting && (
              <Link href="/reporting/reports" className={cn(
                "p-2 rounded-md hover:bg-secondary",
                pathname.startsWith("/reporting") && "bg-secondary text-primary"
              )}>
                <BarChart3 size={20} />
              </Link>
            )}

            {canAccessSettings && (
              <Link href="/settings" className={cn(
                "p-2 rounded-md hover:bg-secondary",
                pathname.startsWith("/settings") && "bg-secondary text-primary"
              )}>
                <Settings size={20} />
              </Link>
            )}
          </nav>
        )}
      </div>

      <div className="mt-auto border-t p-4">
        {!collapsed && (
          <div className="text-xs text-muted-foreground">
            <p>Logged in as {user?.firstName} {user?.lastName}</p>
            <p>{user?.roles?.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
