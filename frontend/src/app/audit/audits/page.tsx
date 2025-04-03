'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuditsPage() {
  return (
    <DashboardLayout title="Audit Management">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/dashboard">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
          <p className="text-muted-foreground">
            Plan, execute, and track internal and external audits.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Audit
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            This page is under development. Please check back later.
          </p>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
