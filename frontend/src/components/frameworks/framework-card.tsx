import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Framework } from '@/hooks/use-frameworks';

interface FrameworkCardProps {
  framework: Framework;
}

export function FrameworkCard({ framework }: FrameworkCardProps) {
  return (
    <Card className={!framework.isActive ? 'opacity-70' : ''}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-xl mb-1">
            <Link href={`/compliance/frameworks/${framework.id}`} className="hover:text-primary">
              {framework.name}
            </Link>
            {framework.version && <span className="ml-2 text-sm text-muted-foreground">v{framework.version}</span>}
          </CardTitle>
          <div className="text-sm font-medium text-muted-foreground">{framework.organization}</div>
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/compliance/frameworks/${framework.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          {framework.website && (
            <Button variant="ghost" size="icon" asChild>
              <a href={framework.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{framework.description}</p>

        {framework.stats && (
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1 text-sm">
              <span>Implementation</span>
              <span className="font-medium">{framework.stats.implementationRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${framework.stats.implementationRate}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{framework.stats.implementedControls} / {framework.stats.totalControls} controls</span>
              <span>Updated {formatDate(framework.updatedAt)}</span>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary-foreground">
            {framework.category}
          </span>
          {!framework.isActive && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              Inactive
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
