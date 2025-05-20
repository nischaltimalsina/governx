'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Calendar, ChevronDown, ChevronLeft, ChevronUp, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRisks } from '@/hooks/use-risks';
import { RiskCard } from '@/components/risks/risk-card';
import { RiskHeatmap } from '@/components/risks/risk-heatmap';
import { cn } from '@/lib/utils';

export default function RiskRegisterPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [useInherentRisk, setUseInherentRisk] = useState(false);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

  // Fetch risks with filters
  const { data: risks, isLoading, error } = useRisks({
    categories: categoryFilter || undefined,
    statuses: statusFilter || undefined,
    severities: severityFilter || undefined,
    active: activeFilter,
    search: searchTerm || undefined
  });

  // Risk category options
  const categoryOptions = [
    'security',
    'privacy',
    'operational',
    'financial',
    'strategic',
    'compliance',
    'reputational',
    'technological',
    'third_party',
    'legal',
    'environmental',
    'human_resources'
  ];

  // Risk severity levels
  const severityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  // Risk status options
  const statusOptions = [
    { value: 'identified', label: 'Identified' },
    { value: 'assessed', label: 'Assessed' },
    { value: 'treated', label: 'Treated' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'closed', label: 'Closed' }
  ];

  // Filter risks based on search term (client-side additional filtering)
  const filteredRisks = risks?.filter(risk =>
    !searchTerm ||
    risk.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    risk.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    risk.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate risk review stats
  const overdueReviews = risks?.filter(risk => {
    if (!risk.nextReviewDate) return false;
    const nextReview = new Date(risk.nextReviewDate);
    const today = new Date();
    return nextReview <= today;
  }).length || 0;

  // Get risks with upcoming reviews in next 30 days
  const upcomingReviews = risks?.filter(risk => {
    if (!risk.nextReviewDate) return false;
    const nextReview = new Date(risk.nextReviewDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return nextReview > today && nextReview <= thirtyDaysFromNow;
  }).length || 0;

  // Scroll to selected risk when coming from heatmap
  const handleRiskSelect = (riskId: string) => {
    setSelectedRiskId(riskId);
    setTimeout(() => {
      document.getElementById(`risk-${riskId}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <DashboardLayout title="Risk Register">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/dashboard">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
          <p className="text-muted-foreground">
            Identify, assess, and manage risks across your organization.
          </p>
        </div>
        <Button asChild>
          <Link href="/risk/register/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Risk
          </Link>
        </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Risks</h3>
              <p className="text-2xl font-bold">{risks?.length || 0}</p>
            </div>
            <div className="p-3 bg-muted rounded-full">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className={overdueReviews > 0 ? "border-red-300 dark:border-red-700" : ""}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Overdue Reviews</h3>
              <p className={cn("text-2xl font-bold", overdueReviews > 0 ? "text-red-600 dark:text-red-400" : "")}>
                {overdueReviews}
              </p>
            </div>
            <div className={cn("p-3 rounded-full", overdueReviews > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-muted")}>
              <Calendar className={cn("h-6 w-6", overdueReviews > 0 ? "text-red-600 dark:text-red-400" : "text-primary")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Upcoming Reviews (30d)</h3>
              <p className="text-2xl font-bold">{upcomingReviews}</p>
            </div>
            <div className="p-3 bg-muted rounded-full">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="flex items-center gap-1 mb-2"
        >
          {showHeatmap ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide Risk Heatmap
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show Risk Heatmap
            </>
          )}
        </Button>

        {showHeatmap && (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Risk Heatmap</h3>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={useInherentRisk}
                      onChange={() => setUseInherentRisk(!useInherentRisk)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Show Inherent Risk
                  </label>
                </div>
              </div>

              {risks && risks.length > 0 ? (
                <RiskHeatmap
                  risks={risks}
                  isInherent={useInherentRisk}
                  selectedRiskId={selectedRiskId || undefined}
                  onRiskSelect={handleRiskSelect}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No risks available to display on the heatmap.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search risks..."
            className="pl-10 pr-4 py-2 border rounded-md w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            className="border rounded-md py-2 px-3"
            value={categoryFilter || ''}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
          >
            <option value="">All Categories</option>
            {categoryOptions.map(category => (
              <option key={category} value={category}>
                {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>

          <select
            className="border rounded-md py-2 px-3"
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
          >
            <option value="">All Statuses</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="border rounded-md py-2 px-3"
            value={severityFilter || ''}
            onChange={(e) => setSeverityFilter(e.target.value || null)}
          >
            <option value="">All Severities</option>
            {severityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="flex border py-2 px-3 rounded-md items-center space-x-2">
            <input
              type="checkbox"
              checked={activeFilter}
              onChange={() => setActiveFilter(!activeFilter)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">Active only</span>
          </label>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading risks. Please try again later.</p>
          </CardContent>
        </Card>
      )}

      {filteredRisks && filteredRisks.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No risks found matching your criteria.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/risk/register/new">
                <Plus className="h-4 w-4 mr-2" />
                Add First Risk
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRisks?.map((risk) => (
          <div key={risk.id} id={`risk-${risk.id}`}>
            <RiskCard risk={risk} />
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
