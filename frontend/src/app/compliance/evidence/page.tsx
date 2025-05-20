'use client';

import { EvidenceCard } from '@/components/evidence/evidence-card';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useControls } from '@/hooks/use-controls';
import { useEvidence } from '@/hooks/use-evidence';
import { useFrameworks } from '@/hooks/use-frameworks';
import { CheckCircle, Clock, Search, Upload, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function EvidencePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState<string | null>(null);
  const [controlFilter, setControlFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(true);

  // Fetch frameworks for filter dropdown
  const { data: frameworks } = useFrameworks();

  // Fetch controls for filter dropdown - filter by framework if selected
  const { data: controls } = useControls({
    frameworkId: frameworkFilter || undefined
  });

  // Fetch evidence with filters
  const { data: evidenceItems, isLoading, error } = useEvidence({
    frameworkId: frameworkFilter || undefined,
    controlId: controlFilter || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    ...(activeFilter ? { active: true } : {}),
    search: searchTerm || undefined
  });

  // Evidence type options
  const typeOptions = [
    'document',
    'screenshot',
    'log',
    'report',
    'certificate',
    'policy',
    'procedure',
    'audit_result',
    'configuration',
    'other'
  ];

  // Filter evidence based on search term (client-side additional filtering)
  const filteredEvidence = evidenceItems?.filter(evidence =>
    !searchTerm ||
    evidence.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evidence.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evidence.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <DashboardLayout title="Compliance Evidence">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-muted-foreground">
            Manage evidence documents for compliance controls.
          </p>
        </div>
        <Button asChild>
          <Link href="/compliance/evidence/new">
            <Upload className="h-4 w-4 mr-2" />
            Upload Evidence
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
              placeholder="Search evidence..."
              className="pl-10 pr-4 py-2 border rounded-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              className="border rounded-md py-2 px-3"
              value={frameworkFilter || ''}
              onChange={(e) => {
                setFrameworkFilter(e.target.value || null);
                setControlFilter(null); // Reset control filter when framework changes
              }}
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
              value={controlFilter || ''}
              onChange={(e) => setControlFilter(e.target.value || null)}
              disabled={!frameworkFilter} // Disable if no framework selected
            >
              <option value="">All Controls</option>
              {controls?.map(control => (
                <option key={control.id} value={control.id}>
                  {control.code}: {control.title.length > 30 ? control.title.substring(0, 30) + '...' : control.title}
                </option>
              ))}
            </select>

            <select
              className="border rounded-md py-2 px-3"
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              className="border rounded-md py-2 px-3"
              value={typeFilter || ''}
              onChange={(e) => setTypeFilter(e.target.value || null)}
            >
              <option value="">All Types</option>
              {typeOptions.map(type => (
                <option key={type} value={type}>
                  {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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

      <div className="mb-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-1 text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span>Approved</span>
            </div>
            <span className="mx-1 text-muted-foreground">|</span>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-amber-500 mr-1" />
              <span>Pending</span>
            </div>
            <span className="mx-1 text-muted-foreground">|</span>
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-500 mr-1" />
              <span>Rejected</span>
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
            <p className="text-destructive">Error loading evidence. Please try again later.</p>
          </CardContent>
        </Card>
      )}

      {filteredEvidence && filteredEvidence.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No evidence found matching your criteria.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/compliance/evidence/new">
                <Upload className="h-4 w-4 mr-2" />
                Upload First Evidence
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {filteredEvidence?.map((evidence) => (
          <EvidenceCard key={evidence.id} evidence={evidence} />
        ))}
      </div>
    </DashboardLayout>
  );
}
