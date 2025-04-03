'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function PoliciesPage() {
  return (
    <DashboardLayout title="Compliance Policies">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-muted-foreground">
            Manage policy documents to support compliance requirements.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Policy
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            This page is under development. Please check back later.
          </p>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href="/compliance/frameworks">
                View Frameworks
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
