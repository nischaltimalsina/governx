import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export interface Control {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  description: string;
  guidance?: string;
  implementationStatus: 'not_implemented' | 'partially_implemented' | 'implemented';
  implementationDetails?: string;
  categories: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string;
    department?: string;
  };
  relatedControls?: string[];
  evidenceCount?: number;
}

interface UseControlsOptions {
  frameworkId?: string;
  status?: string;
  categories?: string[];
  ownerId?: string;
  active?: boolean;
  search?: string;
}

export function useControls(options: UseControlsOptions = {}) {
  const { frameworkId, status, categories, ownerId, active = true, search } = options;

  return useQuery({
    queryKey: ['controls', frameworkId, status, categories, ownerId, active, search],
    queryFn: async () => {
      const queryParams = new URLSearchParams();

      if (frameworkId) {
        queryParams.append('frameworkId', frameworkId);
      }

      if (status) {
        queryParams.append('implementationStatus', status);
      }

      if (categories && categories.length > 0) {
        queryParams.append('categories', categories.join(','));
      }

      if (ownerId) {
        queryParams.append('ownerId', ownerId);
      }

      if (active !== undefined) {
        queryParams.append('isActive', active.toString());
      }

      if (search) {
        queryParams.append('search', search);
      }

      const endpoint = `/compliance/controls${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return api.get<Control[]>(endpoint);
    }
  });
}

export function useControlDetails(id: string, includeRelated: boolean = true) {
  return useQuery({
    queryKey: ['control', id, includeRelated],
    queryFn: async () => {
      return api.get<Control>(`/compliance/controls/${id}?includeRelated=${includeRelated}`);
    },
    enabled: !!id, // Only run the query if id is provided
  });
}

export interface ControlInput {
  frameworkId: string;
  code: string;
  title: string;
  description: string;
  guidance?: string;
  implementationStatus: 'not_implemented' | 'partially_implemented' | 'implemented';
  implementationDetails?: string;
  categories: string[];
  isActive: boolean;
  ownerId?: string;
}

export function useCreateControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (control: ControlInput) => {
      return api.post<Partial<Control>>('/compliance/controls', control);
    },
    onSuccess: (data) => {
      // Invalidate controls list and associated framework queries
      queryClient.invalidateQueries({ queryKey: ['controls'] });
      queryClient.invalidateQueries({ queryKey: ['framework', data.frameworkId] });
    },
  });
}

export function useUpdateControl(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (control: Partial<ControlInput>) => {
      return api.patch<Partial<Control>>(`/compliance/controls/${id}`, control);
    },
    onSuccess: (data) => {
      // Invalidate control detail, controls list, and associated framework queries
      queryClient.invalidateQueries({ queryKey: ['control', id] });
      queryClient.invalidateQueries({ queryKey: ['controls'] });
      queryClient.invalidateQueries({ queryKey: ['framework', data.frameworkId] });
    },
  });
}

export function useUpdateControlImplementation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      implementationStatus: 'not_implemented' | 'partially_implemented' | 'implemented';
      implementationDetails?: string;
    }) => {
      return api.patch<Partial<Control>>(`/compliance/controls/${id}/implementation`, data);
    },
    onSuccess: (data) => {
      // Invalidate control detail, controls list, and associated framework queries
      queryClient.invalidateQueries({ queryKey: ['control', id] });
      queryClient.invalidateQueries({ queryKey: ['controls'] });
      queryClient.invalidateQueries({ queryKey: ['framework', data.frameworkId] });
    },
  });
}

export function useDeleteControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return api.delete<void>(`/compliance/controls/${id}`);
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuccess: (_, id) => {
      // Invalidate controls list query to refresh data
      queryClient.invalidateQueries({ queryKey: ['controls'] });
      // We can't directly invalidate the related framework without knowing its ID
      // but we could store the framework ID in mutation context if needed
    },
  });
}
