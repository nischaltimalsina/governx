'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Clock,
  Download,
  Edit,
  FileText,
  Link2,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { cn, formatDate } from '@/lib/utils';
import { useControlDetails } from '@/hooks/use-controls';
import { ControlStats } from '@/components/controls/control-stats';
import { useFrameworkDetails } from '@/hooks/use-frameworks';

export default function ControlDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  // Fetch control details
  const { data: control, isLoading: controlLoading } = useControlDetails(id);

  // Fetch framework details if control is loaded
  const { data: framework, isLoading: frameworkLoading } = useFrameworkDetails(
    control?.frameworkId || '',
    false // Don't need framework stats
  );

  const isLoading = controlLoading || frameworkLoading;

  // This would come from an API in a real implementation
  const mockEvidenceStats = {
    evidenceCount: 8,
    approvedEvidenceCount: 5,
    pendingEvidenceCount: 2,
    rejectedEvidenceCount: 1,
    lastReviewDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    lastUpdatedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
  };

  // Mock evidence data (would come from an API)
  const mockEvidence = [
    {
      id: 'ev1',
      title: 'Password Policy Document',
      type: 'document',
      status: 'approved',
      uploadedBy: 'John Smith',
      uploadedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      reviewedBy: 'Jane Doe',
      reviewedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ev2',
      title: 'Access Control Matrix',
      type: 'spreadsheet',
      status: 'approved',
      uploadedBy: 'Sarah Johnson',
      uploadedDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      reviewedBy: 'Jane Doe',
      reviewedDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ev3',
      title: 'Security Training Attendance',
      type: 'document',
      status: 'pending',
      uploadedBy: 'Michael Chen',
      uploadedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'partially_implemented':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
      case 'not_implemented':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle className="h-4 w-4" />;
      case 'partially_implemented':
        return <Clock className="h-4 w-4" />;
      case 'not_implemented':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getEvidenceStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
      case 'rejected':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/compliance/controls">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Controls
          </Link>
        </Button>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : control ? (
          <>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                    {control.code}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium gap-1",
                      getStatusColor(control.implementationStatus)
                    )}
                  >
                    {getStatusIcon(control.implementationStatus)}
                    {control.implementationStatus.replace('_', ' ')}
                  </span>
                  {framework && (
                    <Link
                      href={`/compliance/frameworks/${framework.id}`}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    >
                      <Link2 className="h-3 w-3 mr-1" />
                      {framework.name} {framework.version && `(${framework.version})`}
                    </Link>
                  )}
                </div>
                <h1 className="text-2xl font-bold mb-1">
                  {control.title}
                  {!control.isActive && (
                    <span className="ml-3 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </h1>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/compliance/controls/${id}/edit`}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            <p className="mt-4 text-sm max-w-3xl">{control.description}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {control.categories.map(category => (
                <span
                  key={category}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                >
                  {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Implementation Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Implementation Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {control.implementationDetails ? (
                    <p className="text-sm whitespace-pre-line">{control.implementationDetails}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No implementation details provided</p>
                  )}

                  {control.owner && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-1">Control Owner</h4>
                      <p className="text-sm">{control.owner.name}</p>
                      {control.owner.department && (
                        <p className="text-xs text-muted-foreground">{control.owner.department}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Last updated: {formatDate(control.updatedAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Implementation Guidance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Implementation Guidance</CardTitle>
                </CardHeader>
                <CardContent>
                  {control.guidance ? (
                    <p className="text-sm whitespace-pre-line">{control.guidance}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No implementation guidance provided</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Evidence stats using our component */}
            <ControlStats stats={mockEvidenceStats} className="mt-6" />

            {/* Evidence Section */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Evidence</h2>
                <Button asChild>
                  <Link href={`/compliance/evidence/new?controlId=${id}`}>
                    <Upload className="h-4 w-4 mr-1" />
                    Upload Evidence
                  </Link>
                </Button>
              </div>

              {mockEvidence.length > 0 ? (
                <div className="space-y-4">
                  {mockEvidence.map(evidence => (
                    <Card key={evidence.id} className="hover:border-primary transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-muted rounded">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium hover:text-primary">
                                <Link href={`/compliance/evidence/${evidence.id}`}>
                                  {evidence.title}
                                </Link>
                              </h3>
                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                  getEvidenceStatusColor(evidence.status)
                                )}
                              >
                                {evidence.status}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Uploaded by {evidence.uploadedBy} on {formatDate(evidence.uploadedDate)}
                            </div>
                            {evidence.reviewedBy && (
                              <div className="text-xs text-muted-foreground">
                                Reviewed by {evidence.reviewedBy} on {formatDate(evidence.reviewedDate)}
                              </div>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/compliance/evidence/${evidence.id}`}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No evidence found for this control.</p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href={`/compliance/evidence/new?controlId=${id}`}>
                        <Upload className="h-4 w-4 mr-1" />
                        Upload First Evidence
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
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
