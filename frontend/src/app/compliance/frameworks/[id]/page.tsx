'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ExternalLink,
  Edit,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useFrameworkDetails } from '@/hooks/use-frameworks';
import { FrameworkStats } from '@/components/frameworks/framework-stats';
import { api } from '@/lib/api/client';

// Framework type is imported from use-frameworks hook

interface Control {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  description: string;
  guidance?: string;
  implementationStatus: 'not_implemented' | 'partially_implemented' | 'implemented';
  implementationDetails?: string;
  categories: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string;
  };
}

export default function FrameworkDetailPage({ params }: { params: Promise<{ id: string } >}) {
  const { id } = React.use(params)
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Fetch framework details using our custom hook
  const { data: framework, isLoading: frameworkLoading } = useFrameworkDetails(id);

  // Fetch controls for this framework
  const { data: controls, isLoading: controlsLoading } = useQuery({
    queryKey: ['controls', id, statusFilter, categoryFilter],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('frameworkId', id);
      queryParams.append('isActive', 'true');

      if (statusFilter) {
        queryParams.append('implementationStatus', statusFilter);
      }

      if (categoryFilter) {
        queryParams.append('categories', categoryFilter);
      }

      return api.get<Control[]>(`/compliance/controls?${queryParams.toString()}`);
    }
  });

  const isLoading = frameworkLoading || controlsLoading;

  // Get unique categories for filter dropdown
  const categories = controls ?
    Array.from(new Set(controls.flatMap(c => c.categories))) :
    [];

  // Group controls by implementation status for summary
  const statusGroups = controls ? {
    not_implemented: controls.filter(c => c.implementationStatus === 'not_implemented').length,
    partially_implemented: controls.filter(c => c.implementationStatus === 'partially_implemented').length,
    implemented: controls.filter(c => c.implementationStatus === 'implemented').length,
  } : { not_implemented: 0, partially_implemented: 0, implemented: 0 };

  // Apply filters to controls
  const filteredControls = controls;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'partially_implemented':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
      case 'not_implemented':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle className="h-4 w-4" />;
      case 'partially_implemented':
        return <Clock className="h-4 w-4" />;
      case 'not_implemented':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/compliance/frameworks">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Frameworks
          </Link>
        </Button>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : framework ? (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-1 flex items-center">
                  {framework.name}
                  {framework.version && (
                    <span className="ml-2 text-sm text-muted-foreground">v{framework.version}</span>
                  )}
                  {!framework.isActive && (
                    <span className="ml-3 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </h1>
                <p className="text-muted-foreground">{framework.organization}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/compliance/frameworks/${id}/edit`}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </Button>
                {framework.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={framework.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Website
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            <p className="mt-4 text-sm max-w-3xl">{framework.description}</p>

            {/* Implementation progress using our stats component */}
            {framework.stats && (
              <FrameworkStats
                stats={{
                  ...framework.stats,
                  partiallyImplementedControls: statusGroups.partially_implemented,
                  notImplementedControls: statusGroups.not_implemented
                }}
                className="mt-6"
              />
            )}

            {/* Controls List */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Controls</h2>
                <div className="flex space-x-2">
                  <select
                    className="border rounded-md py-1 px-2 text-sm"
                    value={statusFilter || ''}
                    onChange={(e) => setStatusFilter(e.target.value || null)}
                  >
                    <option value="">All Statuses</option>
                    <option value="not_implemented">Not Implemented</option>
                    <option value="partially_implemented">Partially Implemented</option>
                    <option value="implemented">Implemented</option>
                  </select>

                  <select
                    className="border rounded-md py-1 px-2 text-sm"
                    value={categoryFilter || ''}
                    onChange={(e) => setCategoryFilter(e.target.value || null)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/compliance/controls/new?frameworkId=${id}`}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Control
                    </Link>
                  </Button>
                </div>
              </div>

              {controlsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : filteredControls && filteredControls.length > 0 ? (
                <div className="space-y-4">
                  {filteredControls.map(control => (
                    <Card key={control.id} className="hover:border-primary transition-colors">
                      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                              {control.code}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium gap-1",
                                getStatusColor(control.implementationStatus)
                              )}
                            >
                              {getStatusIcon(control.implementationStatus)}
                              {control.implementationStatus.replace('_', ' ')}
                            </span>
                          </div>
                          <Link href={`/compliance/controls/${control.id}`}>
                            <CardTitle className="text-base mt-1 hover:text-primary">
                              {control.title}
                            </CardTitle>
                          </Link>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/compliance/controls/${control.id}`}>
                            <span className="text-xs">View Details</span>
                          </Link>
                        </Button>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {control.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {control.categories.map(category => (
                            <span
                              key={category}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No controls found for this framework.</p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href={`/compliance/controls/new?frameworkId=${id}`}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add First Control
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Framework not found</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/compliance/frameworks">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Frameworks
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
