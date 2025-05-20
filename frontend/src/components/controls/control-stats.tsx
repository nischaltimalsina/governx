import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ControlStatsProps {
  stats: {
    evidenceCount: number;
    approvedEvidenceCount: number;
    pendingEvidenceCount: number;
    rejectedEvidenceCount: number;
    lastReviewDate?: string;
    lastUpdatedDate?: string;
  };
  className?: string;
}

export function ControlStats({ stats, className }: ControlStatsProps) {
  // Calculate evidence approval percentage
  const approvalPercentage = stats.evidenceCount > 0
    ? Math.round((stats.approvedEvidenceCount / stats.evidenceCount) * 100)
    : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Evidence Status</CardTitle>
      </CardHeader>
      <CardContent>
        {stats.evidenceCount > 0 ? (
          <>
            <div className="flex justify-between items-center mb-1">
              <span>Evidence approval</span>
              <span className="font-medium">{approvalPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 mb-4">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${approvalPercentage}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-2">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span>Approved:</span>
                <span className="font-medium">{stats.approvedEvidenceCount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                <span>Pending:</span>
                <span className="font-medium">{stats.pendingEvidenceCount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <span>Rejected:</span>
                <span className="font-medium">{stats.rejectedEvidenceCount}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-2 text-muted-foreground">
            No evidence items uploaded yet
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-4 grid grid-cols-2 gap-2">
          {stats.lastReviewDate && (
            <div>
              <span className="font-medium">Last reviewed:</span> {new Date(stats.lastReviewDate).toLocaleDateString()}
            </div>
          )}
          {stats.lastUpdatedDate && (
            <div>
              <span className="font-medium">Last updated:</span> {new Date(stats.lastUpdatedDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
