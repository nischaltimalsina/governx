'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { RiskForm } from '@/components/risks/risk-form';

export default function NewRiskPage() {
  return (
    <DashboardLayout title="Add New Risk">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/risk/register">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Risk Register
          </Link>
        </Button>

        <RiskForm />
      </div>
    </DashboardLayout>
  );
}
