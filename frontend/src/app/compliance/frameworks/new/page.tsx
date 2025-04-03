'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { FrameworkForm } from '@/components/frameworks/framework-form';

export default function NewFrameworkPage() {
  return (
    <DashboardLayout title="Add New Framework">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/compliance/frameworks">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Frameworks
          </Link>
        </Button>

        <FrameworkForm />
      </div>
    </DashboardLayout>
  );
}
