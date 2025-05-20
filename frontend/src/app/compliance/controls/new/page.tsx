'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { ControlForm } from '@/components/controls/control-form';
import { useSearchParams } from 'next/navigation';

export default function NewControlPage() {
  const searchParams = useSearchParams();
  const frameworkId = searchParams.get('frameworkId');

  return (
    <DashboardLayout title="Add New Control">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={frameworkId ? `/compliance/frameworks/${frameworkId}` : "/compliance/controls"}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {frameworkId ? 'Back to Framework' : 'Back to Controls'}
          </Link>
        </Button>

        <ControlForm defaultFrameworkId={frameworkId || undefined} />
      </div>
    </DashboardLayout>
  );
}
