'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useFrameworks } from '@/hooks/use-frameworks';
import { FrameworkCard } from '@/components/frameworks/framework-card';

// Framework type is imported from the use-frameworks hook

export default function FrameworksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Fetch frameworks data using our custom hook
  const { data: frameworks, isLoading, error } = useFrameworks({
    active: activeFilter,
    category: categoryFilter || undefined
  });

  // Filter frameworks based on search term
  const filteredFrameworks = frameworks?.filter(framework =>
    framework.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    framework.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    framework.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique categories for filter dropdown
  const categories = frameworks ?
    Array.from(new Set(frameworks.map(f => f.category))) :
    [];

  return (
    <DashboardLayout title="Compliance Frameworks">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search frameworks..."
              className="pl-10 pr-4 py-2 border rounded-md w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="border rounded-md py-2 pl-4 pr-8"
              value={categoryFilter || ''}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <label className="flex border py-2 px-2 rounded-md items-center space-x-2">
            <input
              type="checkbox"
              checked={activeFilter}
              onChange={() => setActiveFilter(!activeFilter)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">Active only</span>
          </label>
        </div>
        <Button asChild>
          <Link href="/compliance/frameworks/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Framework
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading frameworks. Please try again later.</p>
          </CardContent>
        </Card>
      )}

      {filteredFrameworks && filteredFrameworks.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No frameworks found matching your criteria.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFrameworks?.map((framework) => (
          <FrameworkCard key={framework.id} framework={framework} />
        ))}
      </div>
    </DashboardLayout>
  );
}
