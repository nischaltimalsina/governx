'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { FrameworkForm, FrameworkFormData } from '@/components/frameworks/framework-form';
import { api } from '@/lib/api/client';
import React from 'react';

export default function EditFrameworkPage({ params }: { params: Promise<{ id: string }> }) {
  // Fetch framework details
  const {id} = React.use(params);
  const { data: framework, isLoading, error } = useQuery({
    queryKey: ['framework', id],
    queryFn: async () => {
      return api.get<FrameworkFormData>(`/compliance/frameworks/${id}`);
    }
  });

  return (
    <DashboardLayout title="Edit Framework">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/compliance/frameworks">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Frameworks
            </Link>
          </Button>
          {framework && (
            <span className="mx-2 text-muted-foreground">/</span>
          )}
          {framework && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/compliance/frameworks/${id}`}>
                {framework.name}
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading framework data. Please try again.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/compliance/frameworks">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Frameworks
              </Link>
            </Button>
          </div>
        ) : framework ? (
          <FrameworkForm
            initialData={framework}
            isEdit
            frameworkId={id}
          />
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
