import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, Edit } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Control } from '@/hooks/use-controls';
import { cn } from '@/lib/utils';

interface ControlCardProps {
  control: Control;
}

export function ControlCard({ control }: ControlCardProps) {
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

  return (
    <Card className={!control.isActive ? 'opacity-70' : ''}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
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
          </div>
          <CardTitle className="text-lg mb-1">
            <Link href={`/compliance/controls/${control.id}`} className="hover:text-primary">
              {control.title}
            </Link>
          </CardTitle>
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/compliance/controls/${control.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{control.description}</p>

        <div className="mt-2 flex flex-wrap gap-1">
          {control.categories.map(category => (
            <span
              key={category}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
            >
              {category}
            </span>
          ))}
        </div>

        <div className="flex justify-between text-xs text-muted-foreground mt-4">
          {control.evidenceCount !== undefined && (
            <span>{control.evidenceCount} evidence items</span>
          )}
          <span>Updated {formatDate(control.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
