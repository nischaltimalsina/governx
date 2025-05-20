import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export type RiskImpact = 'insignificant' | 'minor' | 'moderate' | 'major' | 'severe';
export type RiskLikelihood = 'rare' | 'unlikely' | 'possible' | 'likely' | 'almost_certain';
export type RiskTreatmentType = 'accept' | 'mitigate' | 'transfer' | 'avoid';
export type RiskStatus = 'identified' | 'assessed' | 'treated' | 'accepted' | 'closed';

export interface RiskOwner {
  id: string;
  name: string;
  department: string;
}

export interface Risk {
  id: string;
  name: string;
  description: string;
  category: string;
  inherentImpact: RiskImpact;
  inherentLikelihood: RiskLikelihood;
  inherentRiskScore?: {value:number, severity: string};
  residualImpact: RiskImpact;
  residualLikelihood: RiskLikelihood;
  residualRiskScore?: {value:number, severity: string};
  status: RiskStatus;
  owner: RiskOwner;
  relatedControlIds: string[];
  reviewPeriodMonths: number;
  nextReviewDate?: string;
  lastReviewDate?: string;
  tags: string[];
  treatments?: RiskTreatment[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface RiskTreatment {
  id: string;
  riskId: string;
  name: string;
  description: string;
  type: RiskTreatmentType;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  completedDate?: string;
  assignee?: {
    id: string;
    name: string;
  };
  relatedControlIds?: string[];
  createdAt: string;
  updatedAt: string;
}

interface UseRisksOptions {
  categories?: string | string[];
  statuses?: string | string[];
  severities?: string | string[];
  ownerId?: string;
  controlId?: string;
  reviewDue?: boolean;
  active?: boolean;
  search?: string;
}

export function useRisks(options: UseRisksOptions = {}) {
  const { categories, statuses, severities, ownerId, controlId, reviewDue, active = true, search } = options;

  return useQuery({
    queryKey: ['risks', categories, statuses, severities, ownerId, controlId, reviewDue, active, search],
    queryFn: async () => {
      const queryParams = new URLSearchParams();

      if (categories) {
        if (Array.isArray(categories)) {
          queryParams.append('categories', categories.join(','));
        } else {
          queryParams.append('categories', categories);
        }
      }

      if (statuses) {
        if (Array.isArray(statuses)) {
          queryParams.append('statuses', statuses.join(','));
        } else {
          queryParams.append('statuses', statuses);
        }
      }

      if (severities) {
        if (Array.isArray(severities)) {
          queryParams.append('severities', severities.join(','));
        } else {
          queryParams.append('severities', severities);
        }
      }

      if (ownerId) {
        queryParams.append('ownerId', ownerId);
      }

      if (controlId) {
        queryParams.append('controlId', controlId);
      }

      if (reviewDue !== undefined) {
        queryParams.append('reviewDue', reviewDue.toString());
      }

      if (active !== undefined) {
        queryParams.append('active', active.toString());
      }

      if (search) {
        queryParams.append('search', search);
      }

      const endpoint = `/risk/risks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return api.get<Risk[]>(endpoint);
    }
  });
}

export function useRiskDetails(id: string, includeTreatments: boolean = true, includeControls: boolean = true) {
  return useQuery({
    queryKey: ['risk', id, includeTreatments, includeControls],
    queryFn: async () => {
      return api.get<Risk>(
        `/risk/risks/${id}?includeTreatments=${includeTreatments}&includeControls=${includeControls}`
      );
    },
    enabled: !!id, // Only run the query if id is provided
  });
}

export interface RiskInput {
  name: string;
  description: string;
  category: string;
  inherentImpact: RiskImpact;
  inherentLikelihood: RiskLikelihood;
  residualImpact: RiskImpact;
  residualLikelihood: RiskLikelihood;
  status: RiskStatus;
  owner: {
    id: string;
    name: string;
    department: string;
  };
  relatedControlIds: string[];
  reviewPeriodMonths: number;
  tags: string[];
}

export function useCreateRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (risk: RiskInput) => {
      return api.post<Partial<Risk>>('/risk/risks', risk);
    },
    onSuccess: () => {
      // Invalidate risks list query
      queryClient.invalidateQueries({ queryKey: ['risks'] });
    },
  });
}

export function useUpdateRisk(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (risk: Partial<RiskInput>) => {
      return api.patch<Partial<Risk>>(`/risk/risks/${id}`, risk);
    },
    onSuccess: () => {
      // Invalidate risk detail and risks list queries
      queryClient.invalidateQueries({ queryKey: ['risk', id] });
      queryClient.invalidateQueries({ queryKey: ['risks'] });
    },
  });
}

export function useDeleteRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return api.delete<void>(`/risk/risks/${id}`);
    },
    onSuccess: () => {
      // Invalidate risks list query
      queryClient.invalidateQueries({ queryKey: ['risks'] });
    },
  });
}

// Risk Treatments

export interface RiskTreatmentInput {
  riskId: string;
  name: string;
  description: string;
  type: RiskTreatmentType;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  completedDate?: string;
  assignee?: {
    id: string;
    name: string;
  };
  relatedControlIds?: string[];
}

export function useRiskTreatments(riskId?: string) {
  return useQuery({
    queryKey: ['treatments', riskId],
    queryFn: async () => {
      const endpoint = riskId
        ? `/risk/treatments?riskId=${riskId}`
        : '/risk/treatments';

      return api.get<RiskTreatment[]>(endpoint);
    },
    enabled: !riskId || !!riskId, // Only run if no riskId is provided or if riskId is provided
  });
}

export function useCreateRiskTreatment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (treatment: RiskTreatmentInput) => {
      return api.post<Partial<RiskTreatment>>('/risk/treatments', treatment);
    },
    onSuccess: (data) => {
      // Invalidate treatments list query and associated risk
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({ queryKey: ['risk', data.riskId] });
    },
  });
}

export function useUpdateRiskTreatment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (treatment: Partial<RiskTreatmentInput>) => {
      return api.patch<Partial<RiskTreatment>>(`/risk/treatments/${id}`, treatment);
    },
    onSuccess: (data) => {
      // Invalidate treatments list query and associated risk
      queryClient.invalidateQueries({ queryKey: ['treatments', id] });
      queryClient.invalidateQueries({ queryKey: ['risk', data.riskId] });
    },
  });
}

export function useDeleteRiskTreatment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return api.delete<void>(`/risk/treatments/${id}`);
    },
    onSuccess: () => {
      // Invalidate treatments list query
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
    },
  });
}
