import { cn } from '@/lib/utils';
import { Risk, RiskImpact, RiskLikelihood } from '@/hooks/use-risks';

interface RiskHeatmapProps {
  risks: Risk[];
  className?: string;
  isInherent?: boolean;
  selectedRiskId?: string;
  onRiskSelect?: (riskId: string) => void;
}

export function RiskHeatmap({
  risks,
  className,
  isInherent = false,
  selectedRiskId,
  onRiskSelect
}: RiskHeatmapProps) {
  const formatLabel = (str: string): string => {
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Create 5x5 cells for the heatmap
  const impactScores = ['insignificant', 'minor', 'moderate', 'major', 'severe'] as const;
  const likelihoodScores = ['rare', 'unlikely', 'possible', 'likely', 'almost_certain'] as const;

  // Get risks for each cell
  const getRisksForCell = (impact: RiskImpact, likelihood: RiskLikelihood): Risk[] => {
    return risks.filter(risk => {
      if (isInherent) {
        return risk.inherentImpact === impact && risk.inherentLikelihood === likelihood;
      } else {
        return risk.residualImpact === impact && risk.residualLikelihood === likelihood;
      }
    });
  };

  // Get cell color based on risk level
  const getCellColor = (impactIndex: number, likelihoodIndex: number): string => {
    const score = (impactIndex + 1) * (likelihoodIndex + 1);
    if (score >= 15) return 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50';
    if (score >= 8) return 'bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50';
    if (score >= 4) return 'bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50';
    return 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50';
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-center mb-1">
        <div className="w-32"></div>
        <div className="flex-1 text-center font-medium text-sm">Impact</div>
      </div>
      <div className="flex">
        {/* Y-axis (Likelihood) label */}
        <div className="w-32 flex flex-col justify-center">
          <div className="text-sm font-medium -rotate-90 h-32 flex items-center justify-center">
            Likelihood
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="flex-1">
          {/* X-axis (Impact) labels */}
          <div className="flex mb-1 text-xs">
            {impactScores.map((impact) => (
              <div key={impact} className="flex-1 text-center">
                {formatLabel(impact)}
              </div>
            ))}
          </div>

          {/* Heatmap cells with risks */}
          <div className="border rounded overflow-hidden">
            {likelihoodScores.map((likelihood, y) => (
              <div key={likelihood} className="flex border-b last:border-b-0">
                {/* Row label (Likelihood) */}
                <div className="w-24 px-2 py-1 text-xs border-r bg-muted flex items-center justify-center">
                  {formatLabel(likelihood)}
                </div>

                {/* Risk cells */}
                {impactScores.map((impact, x) => {
                  const cellRisks = getRisksForCell(impact, likelihood);
                  return (
                    <div
                      key={`${impact}-${likelihood}`}
                      className={cn(
                        "flex-1 min-h-20 p-1 border-r last:border-r-0",
                        getCellColor(x, y)
                      )}
                    >
                      <div className="h-full flex flex-wrap items-start content-start gap-1">
                        {cellRisks.map(risk => (
                          <button
                            key={risk.id}
                            onClick={() => onRiskSelect && onRiskSelect(risk.id)}
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded border whitespace-nowrap max-w-full truncate",
                              selectedRiskId === risk.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 border-gray-300"
                            )}
                            title={risk.name}
                          >
                            {risk.name.length > 20 ? risk.name.substring(0, 17) + '...' : risk.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-end mt-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 border"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-100 dark:bg-amber-900/30 border"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-100 dark:bg-orange-900/30 border"></div>
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 dark:bg-red-900/30 border"></div>
              <span>Critical</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
