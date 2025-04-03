'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  AlertTriangle,
  Clipboard,
  FileText,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useFrameworks } from '@/hooks/use-frameworks';

// These would normally come from an API call, but we'll hard-code for now
const statsData = {
  frameworksCount: 4,
  controlsImplemented: 78,
  totalControls: 126,
  implementationRate: 61.9,
  risksByLevel: {
    critical: 3,
    high: 8,
    medium: 12,
    low: 6
  },
  upcomingAudits: 2,
  overdueFindings: 5,
  pendingEvidence: 12
};

export default function DashboardPage() {
  // Fetch a limited number of frameworks for the dashboard
  const { data: frameworks, isLoading } = useFrameworks();

  return (
    <DashboardLayout title="Dashboard">
      <h1 className="text-2xl font-bold mb-6">Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Compliance Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compliance Posture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="text-2xl font-bold">
                {statsData.implementationRate}%
              </div>
              <div className="text-xs text-muted-foreground">
                {statsData.controlsImplemented} of {statsData.totalControls} controls implemented
              </div>
              <div className="w-full h-2 bg-muted rounded-full mt-2">
                <div
                  className="h-2 bg-primary rounded-full"
                  style={{ width: `${statsData.implementationRate}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Risk Exposure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="text-2xl font-bold">
                {statsData.risksByLevel.critical + statsData.risksByLevel.high}
              </div>
              <div className="text-xs text-muted-foreground">
                Critical and high risks requiring attention
              </div>
              <div className="flex gap-1 mt-2">
                <div className="h-2 rounded-l-full bg-red-500" style={{ width: `${statsData.risksByLevel.critical * 10}%` }}></div>
                <div className="h-2 bg-orange-500" style={{ width: `${statsData.risksByLevel.high * 5}%` }}></div>
                <div className="h-2 bg-yellow-500" style={{ width: `${statsData.risksByLevel.medium * 3}%` }}></div>
                <div className="h-2 rounded-r-full bg-green-500" style={{ width: `${statsData.risksByLevel.low * 5}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Audit Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="text-2xl font-bold">
                {statsData.upcomingAudits}
              </div>
              <div className="text-xs text-muted-foreground">
                Upcoming audits in the next 30 days
              </div>
              <div className="mt-2 text-sm">
                <div className="flex justify-between text-xs">
                  <span className="text-destructive">
                    {statsData.overdueFindings} overdue findings
                  </span>
                  <span>
                    {statsData.pendingEvidence} pending evidence items
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Frameworks Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Frameworks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="text-2xl font-bold">
                {statsData.frameworksCount}
              </div>
              <div className="text-xs text-muted-foreground">
                Active compliance frameworks
              </div>
              <div className="mt-2 text-xs">
                Most recent: {!isLoading && frameworks && frameworks?.length > 0 ? frameworks[0]?.name : 'Loading...'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Links */}
      <h2 className="text-xl font-bold mb-4">Quick Access</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <Link href="/compliance/frameworks" className="block p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Compliance Frameworks</h3>
                <p className="text-sm text-muted-foreground">
                  Manage frameworks and controls
                </p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </Card>

        <Card className="hover:border-primary transition-colors cursor-pointer">
          <Link href="/risk/register" className="block p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <AlertTriangle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Risk Management</h3>
                <p className="text-sm text-muted-foreground">
                  Review and manage risk register
                </p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </Card>

        <Card className="hover:border-primary transition-colors cursor-pointer">
          <Link href="/audit/audits" className="block p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Clipboard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Audit Management</h3>
                <p className="text-sm text-muted-foreground">
                  Schedule and manage audits
                </p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </Card>
      </div>

      {/* Recent Frameworks */}
      <h2 className="text-xl font-bold mb-4">Recent Frameworks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            </CardContent>
          </Card>
        ) : frameworks && frameworks.length > 0 ? (
          frameworks.slice(0, 3).map(framework => (
            <Card key={framework.id} className="hover:border-primary transition-colors">
              <CardHeader className="pb-2">
                <Link href={`/compliance/frameworks/${framework.id}`}>
                  <CardTitle className="text-base hover:text-primary">
                    {framework.name}
                    {framework.version && <span className="ml-2 text-sm text-muted-foreground">v{framework.version}</span>}
                  </CardTitle>
                </Link>
                <div className="text-xs text-muted-foreground">{framework.organization}</div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-2 text-muted-foreground mb-2">{framework.description}</p>

                {framework.stats && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span>Implementation</span>
                      <span className="font-medium">{framework.stats.implementationRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{ width: `${framework.stats.implementationRate}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No frameworks found</p>
              <Button variant="outline" size="sm" asChild className="mt-4">
                <Link href="/compliance/frameworks/new">
                  Create your first framework
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {frameworks && frameworks.length > 0 && (
        <div className="flex justify-center mb-10">
          <Button variant="outline" asChild>
            <Link href="/compliance/frameworks">
              View All Frameworks
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* To-Do Section */}
      <h2 className="text-xl font-bold mb-4">Your To-Do List</h2>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 border rounded-md hover:bg-accent">
              <div className="p-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-sm">5 Audit Findings Overdue</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Update remediation status to avoid compliance gaps
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">
                View
              </Button>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-md hover:bg-accent">
              <div className="p-1 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Evidence Request Due</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  12 evidence items need to be uploaded for SOC 2 controls
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">
                Upload
              </Button>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-md hover:bg-accent">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                <Clipboard className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Upcoming Audit in 14 days</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Prepare for the ISO 27001 surveillance audit scheduled for April 17, 2025
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">
                Prepare
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
