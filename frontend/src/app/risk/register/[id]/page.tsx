'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  Edit,
  Link2,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { cn, formatDate } from '@/lib/utils';
import { useRiskDetails } from '@/hooks/use-risks';
import { useControlDetails } from '@/hooks/use-controls';
import { RiskTreatmentForm } from '@/components/risks/risk-treatment-form';
import { useRouter } from 'next/navigation';

export default function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const router = useRouter();

  // Fetch risk details
  const { data: risk, isLoading, refetch } = useRiskDetails(id);

  // Helper functions to calculate risk level
  const getImpactScore = (impact: string): number => {
    switch (impact) {
      case 'severe': return 5;
      case 'major': return 4;
      case 'moderate': return 3;
      case 'minor': return 2;
      case 'insignificant': return 1;
      default: return 1;
    }
  };

  const getLikelihoodScore = (likelihood: string): number => {
    switch (likelihood) {
      case 'almost_certain': return 5;
      case 'likely': return 4;
      case 'possible': return 3;
      case 'unlikely': return 2;
      case 'rare': return 1;
      default: return 1;
    }
  };

  const getRiskScore = (impact: string, likelihood: string): number => {
    return getImpactScore(impact) * getLikelihoodScore(likelihood);
  };

  const getRiskLevel = (score: number): string => {
    if (score >= 15) return 'Critical';
    if (score >= 8) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  };

  const getRiskLevelColor = (score: number): string => {
    if (score >= 15) return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    if (score >= 8) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
    if (score >= 4) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
    return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
  };

  // Calculate whether review is due
  const isReviewDue = (): boolean => {
    if (!risk?.nextReviewDate) return false;
    const nextReview = new Date(risk.nextReviewDate);
    const today = new Date();
    return nextReview <= today;
  };

  // Format risk level name for display
  const formatRiskLevel = (level: string): string => {
    return level.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Handle delete risk action
  const handleDeleteRisk = () => {
    if (confirm("Are you sure you want to delete this risk? This action cannot be undone.")) {
      // In a real app, this would call the API to delete the risk
      // For now, we'll just navigate back to the risk register
      router.push('/risk/register');
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/risk/register">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Risk Register
          </Link>
        </Button>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : risk ? (
          <>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                      risk.status === 'identified' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' :
                      risk.status === 'assessed' ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' :
                      risk.status === 'treated' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' :
                      risk.status === 'accepted' ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' :
                      'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400'
                    )}
                  >
                    {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
                  </span>

                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                    {risk.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>

                  {isReviewDue() && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium gap-1 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      Review Due
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold">{risk.name}</h1>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/risk/register/${id}/edit`}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDeleteRisk}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>

            <p className="mt-4 text-sm max-w-3xl">{risk.description}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {risk.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="space-y-6">
                {/* Inherent Risk Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Inherent Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Impact</p>
                          <p className="text-sm font-medium">{formatRiskLevel(risk.inherentImpact)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Likelihood</p>
                          <p className="text-sm font-medium">{formatRiskLevel(risk.inherentLikelihood)}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs text-muted-foreground">Risk Score</p>
                          <p className="text-sm font-medium">
                            {getRiskScore(risk.inherentImpact, risk.inherentLikelihood)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">Risk Level</p>
                          <p className={cn(
                            "text-sm font-medium px-2 py-0.5 rounded",
                            getRiskLevelColor(getRiskScore(risk.inherentImpact, risk.inherentLikelihood))
                          )}>
                            {getRiskLevel(getRiskScore(risk.inherentImpact, risk.inherentLikelihood))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Residual Risk Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Residual Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Impact</p>
                          <p className="text-sm font-medium">{formatRiskLevel(risk.residualImpact)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Likelihood</p>
                          <p className="text-sm font-medium">{formatRiskLevel(risk.residualLikelihood)}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs text-muted-foreground">Risk Score</p>
                          <p className="text-sm font-medium">
                            {getRiskScore(risk.residualImpact, risk.residualLikelihood)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">Risk Level</p>
                          <p className={cn(
                            "text-sm font-medium px-2 py-0.5 rounded",
                            getRiskLevelColor(getRiskScore(risk.residualImpact, risk.residualLikelihood))
                          )}>
                            {getRiskLevel(getRiskScore(risk.residualImpact, risk.residualLikelihood))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Owner and Review Schedule */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Management Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Risk Owner</p>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{risk.owner.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{risk.owner.department}</p>
                      </div>

                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Review Schedule</p>
                        <p className="text-sm">Every {risk.reviewPeriodMonths} months</p>

                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">
                            Next review: {risk.nextReviewDate ? formatDate(risk.nextReviewDate) : 'Not scheduled'}
                          </p>
                        </div>

                        {risk.lastReviewDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last reviewed: {formatDate(risk.lastReviewDate)}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Created:</span>
                          <span>{formatDate(risk.createdAt)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Last updated:</span>
                          <span>{formatDate(risk.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2 space-y-6">
                {/* Controls Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Related Controls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {risk.relatedControlIds && risk.relatedControlIds.length > 0 ? (
                      <div className="space-y-2">
                        {risk.relatedControlIds.map(controlId => (
                          <ControlLinkItem key={controlId} controlId={controlId} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">No controls are associated with this risk.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Treatments Card */}
                <Card>
                  <CardHeader className="pb-2 flex flex-row justify-between items-center">
                    <CardTitle className="text-lg">Treatment Plans</CardTitle>
                    <Button size="sm" onClick={() => setShowTreatmentForm(true)} disabled={showTreatmentForm}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Treatment
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {showTreatmentForm && (
                      <div className="mb-6">
                        <RiskTreatmentForm
                          risk={risk}
                          onSuccess={() => {
                            setShowTreatmentForm(false);
                            refetch();
                          }}
                          onCancel={() => setShowTreatmentForm(false)}
                        />
                      </div>
                    )}

                    {risk.treatments && risk.treatments.length > 0 ? (
                      <div className="space-y-4">
                        {risk.treatments.map(treatment => (
                          <div key={treatment.id} className="p-4 border rounded">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{treatment.name}</h3>
                                <span
                                  className={cn(
                                    "text-xs px-2 py-0.5 rounded",
                                    treatment.type === 'mitigate' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                                    treatment.type === 'transfer' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' :
                                    treatment.type === 'accept' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                                    'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                                  )}
                                >
                                  {treatment.type.charAt(0).toUpperCase() + treatment.type.slice(1)}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs px-2 py-0.5 rounded",
                                    treatment.status === 'planned' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                                    treatment.status === 'in_progress' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                                    treatment.status === 'completed' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                                    'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                                  )}
                                >
                                  {treatment.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </span>
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/risk/treatments/${treatment.id}`}>
                                  Edit
                                </Link>
                              </Button>
                            </div>

                            <p className="text-sm text-muted-foreground mt-2">{treatment.description}</p>

                            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Due Date</p>
                                <p>{treatment.dueDate ? formatDate(treatment.dueDate) : 'Not specified'}</p>
                              </div>
                              {treatment.completedDate && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Completed On</p>
                                  <p>{formatDate(treatment.completedDate)}</p>
                                </div>
                              )}
                              {treatment.assignee && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Assignee</p>
                                  <p>{treatment.assignee.name}</p>
                                </div>
                              )}
                            </div>

                            {treatment.relatedControlIds && treatment.relatedControlIds.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-muted-foreground mb-2">Related Controls</p>
                                <div className="flex flex-wrap gap-2">
                                  {treatment.relatedControlIds.map(controlId => (
                                    <ControlChip key={controlId} controlId={controlId} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">No treatment plans have been defined for this risk.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
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

// Control Link Item Component
function ControlLinkItem({ controlId }: { controlId: string }) {
  const { data: control, isLoading } = useControlDetails(controlId, false);

  if (isLoading) {
    return (
      <div className="animate-pulse flex items-center gap-2 p-2 rounded border">
        <div className="h-4 w-12 bg-muted rounded"></div>
        <div className="h-4 w-full bg-muted rounded"></div>
      </div>
    );
  }

  if (!control) {
    return <div className="p-2 rounded border text-sm text-muted-foreground">Control not found</div>;
  }

  return (
    <Link href={`/compliance/controls/${controlId}`}>
      <div className="flex items-center gap-2 p-2 rounded border hover:border-primary hover:bg-accent transition-colors">
        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{control.code}</span>
        <span className="text-sm truncate">{control.title}</span>
        <Link2 className="h-3 w-3 ml-auto text-muted-foreground" />
      </div>
    </Link>
  );
}

// Control Chip for compact display
function ControlChip({ controlId }: { controlId: string }) {
  const { data: control, isLoading } = useControlDetails(controlId, false);

  if (isLoading) {
    return (
      <div className="animate-pulse h-6 w-16 bg-muted rounded-full"></div>
    );
  }

  if (!control) {
    return null;
  }

  return (
    <Link href={`/compliance/controls/${controlId}`}>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-primary/10">
        {control.code}
      </span>
    </Link>
  );
}
