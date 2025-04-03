import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export interface Framework {
  id: string;
  name: string;
  version: string;
  organization: string;
  category: string;
  description: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalControls: number;
    implementedControls: number;
    implementationRate: number;
  };
}

interface UseFrameworksOptions {
  active?: boolean;
  category?: string;
}

export function useFrameworks(options: UseFrameworksOptions = {}) {
  const { active = true, category } = options;

  return useQuery({
    queryKey: ['frameworks', active, category],
    queryFn: async () => {
      const queryParams = new URLSearchParams();

      if (active) {
        queryParams.append('active', 'true');
      }

      if (category) {
        queryParams.append('category', category);
      }

      const endpoint = `/compliance/frameworks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return api.get<Framework[]>(endpoint);
    }
  });
}

export function useFrameworkDetails(id: string, includeStats: boolean = true) {
  return useQuery({
    queryKey: ['framework', id, includeStats],
    queryFn: async () => {
      return api.get<Framework>(`/compliance/frameworks/${id}?includeStats=${includeStats}`);
    },
    enabled: !!id, // Only run the query if id is provided
  });
}

export interface FrameworkInput {
  id: string;
  name: string;
  version: string;
  description: string;
  organization: string;
  category: string;
  website?: string;
  isActive: boolean;
  isDeprecated: boolean;
  isDeprecatedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export function useCreateFramework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (framework: FrameworkInput) => {
      return api.post<Framework>('/compliance/frameworks', framework);
    },
    onSuccess: () => {
      // Invalidate frameworks list query to refresh data
      queryClient.invalidateQueries({ queryKey: ['frameworks'] });
    },
  });
}

export function useUpdateFramework(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (framework: FrameworkInput) => {
      return api.patch<Framework>(`/compliance/frameworks/${id}`, framework);
    },
    onSuccess: () => {
      // Invalidate both the framework detail and frameworks list queries
      queryClient.invalidateQueries({ queryKey: ['framework', id] });
      queryClient.invalidateQueries({ queryKey: ['frameworks'] });
    },
  });
}

export function useDeleteFramework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return api.delete<void>(`/compliance/frameworks/${id}`);
    },
    onSuccess: () => {
      // Invalidate frameworks list query to refresh data
      queryClient.invalidateQueries({ queryKey: ['frameworks'] });
    },
  });
}
