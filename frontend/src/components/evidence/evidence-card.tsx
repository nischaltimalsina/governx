import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, File, FileText, Image, Terminal, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Evidence } from '@/hooks/use-evidence';
import { cn } from '@/lib/utils';

interface EvidenceCardProps {
  evidence: Evidence;
}

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-6 w-6 text-primary" />;
      case 'image':
      case 'screenshot':
        return <Image className="h-6 w-6 text-primary" />;
      case 'log':
        return <Terminal className="h-6 w-6 text-primary" />;
      default:
        return <File className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <Card className={!evidence.isActive ? 'opacity-70' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-muted rounded">
            {getFileIcon(evidence.type)}
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
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium gap-1",
                  getStatusColor(evidence.status)
                )}
              >
                {getStatusIcon(evidence.status)}
                {evidence.status}
              </span>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {evidence.description}
            </p>

            <div className="flex flex-wrap gap-1 mb-2">
              {evidence.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="text-xs text-muted-foreground">
              Uploaded by {evidence.createdBy.name} on {formatDate(evidence.createdAt)}
            </div>

            {evidence.reviewedBy && (
              <div className="text-xs text-muted-foreground">
                Reviewed by {evidence.reviewedBy.name} on {formatDate(evidence.reviewedAt || '')}
              </div>
            )}

            {evidence.validityStartDate && evidence.validityEndDate && (
              <div className="text-xs text-muted-foreground mt-1">
                Valid from {formatDate(evidence.validityStartDate)} to {formatDate(evidence.validityEndDate)}
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
  );
}
