'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { EvidenceForm } from '@/components/evidence/evidence-form';
import { useSearchParams } from 'next/navigation';

export default function UploadEvidencePage() {
  const searchParams = useSearchParams();
  const controlId = searchParams.get('controlId');

  return (
    <DashboardLayout title="Upload Evidence">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={controlId ? `/compliance/controls/${controlId}` : "/compliance/evidence"}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {controlId ? 'Back to Control' : 'Back to Evidence'}
          </Link>
        </Button>

        <EvidenceForm defaultControlId={controlId || undefined} />
      </div>
    </DashboardLayout>
  );
}
