import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FrameworkStatsProps {
  stats: {
    totalControls: number;
    implementedControls: number;
    implementationRate: number;
    partiallyImplementedControls?: number;
    notImplementedControls?: number;
  };
  className?: string;
}

export function FrameworkStats({ stats, className }: FrameworkStatsProps) {
  // Calculate additional stats if not provided
  const notImplemented = stats.notImplementedControls ??
    (stats.totalControls - stats.implementedControls - (stats.partiallyImplementedControls || 0));

  const partiallyImplemented = stats.partiallyImplementedControls ??
    (stats.totalControls - stats.implementedControls - notImplemented);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Implementation Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-1">
          <span>Overall progress</span>
          <span className="font-medium">{stats.implementationRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 mb-4">
          <div
            className="bg-primary h-2.5 rounded-full"
            style={{ width: `${stats.implementationRate}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-2">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span>Implemented:</span>
            <span className="font-medium">{stats.implementedControls}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-amber-500"></div>
            <span>Partial:</span>
            <span className="font-medium">{partiallyImplemented}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <span>Not Implemented:</span>
            <span className="font-medium">{notImplemented}</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          <span>{stats.implementedControls} out of {stats.totalControls} controls implemented</span>
        </div>
      </CardContent>
    </Card>
  );
}
