import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Edit, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Risk } from '@/hooks/use-risks';
import { cn } from '@/lib/utils';

interface RiskCardProps {
  risk: Risk;
}

export function RiskCard({ risk }: RiskCardProps) {

  console.log(risk)
  // Function to get risk level color
  const getRiskLevelColor = (impact?: string, likelihood?: string, riskScore?: number): string => {
    const impactScore = getImpactScore(impact!);
    const likelihoodScore = getLikelihoodScore(likelihood!);
    const score =  riskScore || impactScore * likelihoodScore;

    if (score >= 15) return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    if (score >= 8) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
    if (score >= 4) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
    return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
  };

  // Helper functions to convert risk levels to scores
  const getImpactScore = (impact: string): number => {
    switch (impact) {
      case 'severe': return 5;
      case 'major': return 4;
      case 'moderate': return 3;
      case 'minor': return 2;
      case 'insignificant': return 1;
      default: return 1;
    }
  };

  const getLikelihoodScore = (likelihood: string): number => {
    switch (likelihood) {
      case 'almost_certain': return 5;
      case 'likely': return 4;
      case 'possible': return 3;
      case 'unlikely': return 2;
      case 'rare': return 1;
      default: return 1;
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'identified': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
      case 'assessed': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400';
      case 'treated': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
      case 'accepted': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'closed': return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  // Calculate whether review is due
  const isReviewDue = (): boolean => {
    if (!risk.nextReviewDate) return false;
    const nextReview = new Date(risk.nextReviewDate);
    const today = new Date();
    return nextReview <= today;
  };

  return (
    <Card className={!risk.isActive ? 'opacity-70' : ''}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium gap-1",
                getStatusColor(risk.status)
              )}
            >
              {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
            </span>
            {isReviewDue() && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium gap-1 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400">
                <AlertTriangle className="h-3 w-3" />
                Review Due
              </span>
            )}
          </div>
          <CardTitle className="text-lg mb-1">
            <Link href={`/risk/register/${risk.id}`} className="hover:text-primary">
              {risk.name}
            </Link>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Category: {risk.category.charAt(0).toUpperCase() + risk.category.slice(1)}
          </p>
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/risk/register/${risk.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{risk.description}</p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs font-medium mb-1">Inherent Risk</p>
            <div className="flex items-center">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
                  getRiskLevelColor("0","0",risk.inherentRiskScore?.value)
                )}
              >
                {risk.inherentRiskScore?.value} / {risk.inherentRiskScore?.severity}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-1">Residual Risk</p>
            <div className="flex items-center">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
                  getRiskLevelColor("0","0",risk.residualRiskScore?.value)
                )}
              >
                {risk.residualRiskScore?.value} / {risk.residualRiskScore?.severity}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-3 border-t">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{risk.owner.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Next review: {risk.nextReviewDate ? formatDate(risk.nextReviewDate) : 'N/A'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
