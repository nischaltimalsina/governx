'use client';

import { useState } from 'react';
import { Bell, User, LogOut, Moon, Sun, Search } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';

export function Header({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      {title && (
        <h1 className="text-lg font-semibold">{title}</h1>
      )}

      <div className="ml-auto flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            className="rounded-md border bg-background pl-8 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-md p-2 hover:bg-accent"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              if (userMenuOpen) setUserMenuOpen(false);
            }}
            className="rounded-md p-2 hover:bg-accent relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 rounded-md border bg-popover p-4 shadow-md">
              <h3 className="mb-2 font-medium">Notifications</h3>
              <div className="space-y-2">
                <div className="rounded-md p-2 hover:bg-accent">
                  <p className="text-sm font-medium">New finding added to Audit #2023-01</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
                <div className="rounded-md p-2 hover:bg-accent">
                  <p className="text-sm font-medium">Document needs review: ISO 27001 Policy</p>
                  <p className="text-xs text-muted-foreground">Yesterday</p>
                </div>
                <div className="rounded-md p-2 hover:bg-accent">
                  <p className="text-sm font-medium">Risk treatment #RT-2023-05 needs approval</p>
                  <p className="text-xs text-muted-foreground">3 days ago</p>
                </div>
              </div>
              <div className="mt-2 text-center">
                <Link href="/notifications" className="text-xs text-primary hover:underline">
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              if (notificationsOpen) setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 rounded-md p-2 hover:bg-accent"
            aria-label="User menu"
          >
            <span className="hidden text-sm font-medium md:block">
              {user?.firstName || 'User'}
            </span>
            <User size={20} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-md border bg-popover p-1 shadow-md">
              <div className="border-b px-3 py-2">
                <p className="font-medium">{user?.fullName || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <div className="p-1">
                <Link
                  href="/profile"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  <User size={16} />
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
