'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useRiskTreatments } from '@/hooks/use-risks';
import { cn, formatDate } from '@/lib/utils';

export default function RiskTreatmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch all treatments
  const { data: treatments, isLoading, error } = useRiskTreatments();

  // Treatment type options
  const typeOptions = [
    { value: 'accept', label: 'Accept' },
    { value: 'mitigate', label: 'Mitigate' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'avoid', label: 'Avoid' }
  ];

  // Treatment status options
  const statusOptions = [
    { value: 'planned', label: 'Planned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Filter treatments based on search term and filters
  const filteredTreatments = treatments?.filter(treatment =>
    (!searchTerm ||
     treatment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     treatment.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!typeFilter || treatment.type === typeFilter) &&
    (!statusFilter || treatment.status === statusFilter)
  );

  // Calculate overdue treatments
  const overdueTreatments = treatments?.filter(treatment => {
    if (!treatment.dueDate || treatment.status === 'completed' || treatment.status === 'cancelled') return false;
    const dueDate = new Date(treatment.dueDate);
    const today = new Date();
    return dueDate < today;
  }).length || 0;

  return (
    <DashboardLayout title="Risk Treatments">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/dashboard">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
          <p className="text-muted-foreground">
            Track and manage treatment plans for identified risks.
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Treatments</h3>
            <p className="text-2xl font-bold">{treatments?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">In Progress</h3>
            <p className="text-2xl font-bold">{
              treatments?.filter(t => t.status === 'in_progress').length || 0
            }</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
            <p className="text-2xl font-bold">{
              treatments?.filter(t => t.status === 'completed').length || 0
            }</p>
          </CardContent>
        </Card>

        <Card className={overdueTreatments > 0 ? "border-red-300 dark:border-red-700" : ""}>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Overdue</h3>
            <p className={cn("text-2xl font-bold", overdueTreatments > 0 ? "text-red-600 dark:text-red-400" : "")}>
              {overdueTreatments}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search treatments..."
            className="pl-10 pr-4 py-2 border rounded-md w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            className="border rounded-md py-2 px-3"
            value={typeFilter || ''}
            onChange={(e) => setTypeFilter(e.target.value || null)}
          >
            <option value="">All Types</option>
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
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
            <p className="text-destructive">Error loading treatments. Please try again later.</p>
          </CardContent>
        </Card>
      )}

      {filteredTreatments && filteredTreatments.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No treatments found matching your criteria.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {filteredTreatments?.map((treatment) => {
          const isOverdue = treatment.dueDate &&
                           treatment.status !== 'completed' &&
                           treatment.status !== 'cancelled' &&
                           new Date(treatment.dueDate) < new Date();

          return (
            <Card key={treatment.id} className={isOverdue ? "border-red-300 dark:border-red-700" : ""}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
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
                      {isOverdue && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                          Overdue
                        </span>
                      )}
                    </div>

                    <h3 className="font-medium">
                      <Link
                        href={`/risk/register/${treatment.riskId}`}
                        className="hover:text-primary"
                      >
                        {treatment.name}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{treatment.description}</p>
                  </div>

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/risk/register/${treatment.riskId}`}>
                      View Risk
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
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
                  <div>
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p>{formatDate(treatment.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
