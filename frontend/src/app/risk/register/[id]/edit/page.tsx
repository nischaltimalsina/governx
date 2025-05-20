'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { RiskForm, RiskFormData } from '@/components/risks/risk-form';
import { api } from '@/lib/api/client';
import React from 'react';

export default function EditRiskPage({ params }: { params: Promise<{ id: string }> }) {
  // Get risk ID from params
  const { id } = React.use(params);

  // Fetch risk details
  const { data: risk, isLoading, error } = useQuery({
    queryKey: ['risk', id],
    queryFn: async () => {
      return api.get<RiskFormData>(`/risk/risks/${id}`);
    }
  });

  return (
    <DashboardLayout title="Edit Risk">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/risk/register">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Risk Register
            </Link>
          </Button>
          {risk && (
            <span className="mx-2 text-muted-foreground">/</span>
          )}
          {risk && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/risk/register/${id}`}>
                {risk.name}
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
            <p className="text-destructive">Error loading risk data. Please try again.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/risk/register">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Risk Register
              </Link>
            </Button>
          </div>
        ) : risk ? (
          <RiskForm
            initialData={risk}
            isEdit
            riskId={id}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Risk not found</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/risk/register">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Risk Register
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
