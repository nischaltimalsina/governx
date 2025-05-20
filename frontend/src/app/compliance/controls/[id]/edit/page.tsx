'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { ControlForm, ControlFormData } from '@/components/controls/control-form';
import { api } from '@/lib/api/client';
import React from 'react';

export default function EditControlPage({ params }: { params: Promise<{ id: string }> }) {
  // Get control ID from params
  const { id } = React.use(params);

  // Fetch control details
  const { data: control, isLoading, error } = useQuery({
    queryKey: ['control', id],
    queryFn: async () => {
      return api.get<ControlFormData>(`/compliance/controls/${id}`);
    }
  });

  return (
    <DashboardLayout title="Edit Control">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/compliance/controls">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Controls
            </Link>
          </Button>
          {control && (
            <span className="mx-2 text-muted-foreground">/</span>
          )}
          {control && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/compliance/controls/${id}`}>
                {control.code}: {control.title.length > 30 ? control.title.substring(0, 30) + '...' : control.title}
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
            <p className="text-destructive">Error loading control data. Please try again.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/compliance/controls">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Controls
              </Link>
            </Button>
          </div>
        ) : control ? (
          <ControlForm
            initialData={control}
            isEdit
            controlId={id}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Control not found</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/compliance/controls">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Controls
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
