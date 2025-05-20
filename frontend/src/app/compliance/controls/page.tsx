'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useFrameworks } from '@/hooks/use-frameworks';
import { useControls } from '@/hooks/use-controls';
import { ControlCard } from '@/components/controls/control-card';
import { cn } from '@/lib/utils';

export default function ControlsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState(true);

  // Fetch frameworks for filter dropdown
  const { data: frameworks } = useFrameworks();

  // Fetch controls with filters
  const { data: controls, isLoading, error } = useControls({
    frameworkId: frameworkFilter || undefined,
    status: statusFilter || undefined,
    categories: categoryFilter.length > 0 ? categoryFilter : undefined,
    ...(activeFilter ? { active: true } : {}),
    search: searchTerm || undefined
  });

  // Filter controls based on search term (client-side additional filtering)
  const filteredControls = controls?.filter(control =>
    !searchTerm ||
    control.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    control.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    control.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique categories for filter
  const categories = controls ?
    Array.from(new Set(controls.flatMap(c => c.categories))) :
    [];

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setCategoryFilter(current =>
      current.includes(category)
        ? current.filter(c => c !== category)
        : [...current, category]
    );
  };

  return (
    <DashboardLayout title="Compliance Controls">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-muted-foreground">
            Manage your compliance controls across all frameworks.
          </p>
        </div>
        <Button asChild>
          <Link href="/compliance/controls/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Control
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search controls..."
            className="pl-10 pr-4 py-2 border rounded-md w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            className="border rounded-md py-2 px-3"
            value={frameworkFilter || ''}
            onChange={(e) => setFrameworkFilter(e.target.value || null)}
          >
            <option value="">All Frameworks</option>
            {frameworks?.map(framework => (
              <option key={framework.id} value={framework.id}>
                {framework.name} {framework.version ? `(${framework.version})` : ''}
              </option>
            ))}
          </select>

          <select
            className="border rounded-md py-2 px-3"
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
          >
            <option value="">All Statuses</option>
            <option value="not_implemented">Not Implemented</option>
            <option value="partially_implemented">Partially Implemented</option>
            <option value="implemented">Implemented</option>
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

      {categoryFilter.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1 items-center">
          <span className="text-sm text-muted-foreground mr-2">Categories:</span>
          {categoryFilter.map(category => (
            <span
              key={category}
              onClick={() => toggleCategory(category)}
              className="cursor-pointer inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary-foreground hover:bg-primary/20"
            >
              {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              <span className="ml-1">×</span>
            </span>
          ))}
          <button
            onClick={() => setCategoryFilter([])}
            className="text-xs text-muted-foreground hover:text-foreground ml-2 underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto py-1">
        <span className="text-sm text-muted-foreground whitespace-nowrap self-center mr-1">Filter by:</span>
        {categories.slice(0, 15).map(category => (
          <span
            key={category}
            onClick={() => toggleCategory(category)}
            className={cn(
              "cursor-pointer whitespace-nowrap inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
              categoryFilter.includes(category)
                ? "bg-primary/10 text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </span>
        ))}
      </div>

      <div className="mb-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-1 text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span>Implemented</span>
            </div>
            <span className="mx-1 text-muted-foreground">|</span>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-amber-500 mr-1" />
              <span>Partial</span>
            </div>
            <span className="mx-1 text-muted-foreground">|</span>
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
              <span>Not Implemented</span>
            </div>
          </div>
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
            <p className="text-destructive">Error loading controls. Please try again later.</p>
          </CardContent>
        </Card>
      )}

      {filteredControls && filteredControls.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No controls found matching your criteria.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/compliance/controls/new">
                <Plus className="h-4 w-4 mr-2" />
                Add First Control
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredControls?.map((control) => (
          <ControlCard key={control.id} control={control} />
        ))}
      </div>
    </DashboardLayout>
  );
}
