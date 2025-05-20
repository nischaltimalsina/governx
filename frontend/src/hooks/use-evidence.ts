import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export interface Evidence {
  id: string;
  title: string;
  description: string;
  type: string; // 'document', 'screenshot', 'log', etc.
  status: 'pending' | 'approved' | 'rejected';
  controlIds: string[];
  createdBy: {
    id: string;
    name: string;
  };
  reviewedBy?: {
    id: string;
    name: string;
  };
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  validityStartDate?: string;
  validityEndDate?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  tags: string[];
  isActive: boolean;
}

interface UseEvidenceOptions {
  controlId?: string;
  frameworkId?: string;
  status?: string | string[];
  type?: string | string[];
  createdBy?: string;
  active?: boolean;
  search?: string;
}

export function useEvidence(options: UseEvidenceOptions = {}) {
  const { controlId, frameworkId, status, type, createdBy, active = true, search } = options;

  return useQuery({
    queryKey: ['evidence', controlId, frameworkId, status, type, createdBy, active, search],
    queryFn: async () => {
      const queryParams = new URLSearchParams();

      if (controlId) {
        queryParams.append('controlId', controlId);
      }

      if (frameworkId) {
        queryParams.append('frameworkId', frameworkId);
      }

      if (status) {
        if (Array.isArray(status)) {
          queryParams.append('status', status.join(','));
        } else {
          queryParams.append('status', status);
        }
      }

      if (type) {
        if (Array.isArray(type)) {
          queryParams.append('type', type.join(','));
        } else {
          queryParams.append('type', type);
        }
      }

      if (createdBy) {
        queryParams.append('createdBy', createdBy);
      }

      if (active !== undefined) {
        queryParams.append('active', active.toString());
      }

      if (search) {
        queryParams.append('search', search);
      }

      const endpoint = `/compliance/evidence${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return api.get<Evidence[]>(endpoint);
    }
  });
}

export function useEvidenceDetails(id: string, includeControls: boolean = true) {
  return useQuery({
    queryKey: ['evidence', id, includeControls],
    queryFn: async () => {
      return api.get<Evidence>(`/compliance/evidence/${id}?includeControls=${includeControls}`);
    },
    enabled: !!id, // Only run the query if id is provided
  });
}

export interface EvidenceFormData {
  title: string;
  description: string;
  type: string;
  controlId: string[];
  validityStartDate?: string;
  validityEndDate?: string;
  tags: string[];
  file?: File;
}

export function useUploadEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EvidenceFormData) => {
      // For file uploads, we need to use FormData
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('type', data.type);
      formData.append('controlIds', JSON.stringify(data.controlId));

      if (data.validityStartDate) {
        formData.append('validityStartDate', data.validityStartDate);
      }

      if (data.validityEndDate) {
        formData.append('validityEndDate', data.validityEndDate);
      }

      if (data.tags && data.tags.length > 0) {
        formData.append('tags', JSON.stringify(data.tags));
      }

      if (data.file) {
        formData.append('file', data.file);
      }

      return api.post<Partial<Evidence>>('/compliance/evidence', Object.fromEntries(formData) as Partial<Evidence>, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
    },
    onSuccess: () => {
      // Invalidate evidence queries
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      // We could also invalidate specific control queries if we had the control IDs
    },
  });
}

export function useReviewEvidence(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { status: 'approved' | 'rejected'; notes?: string }) => {
      return api.patch<Partial<Evidence>>(`/compliance/evidence/${id}/review`, data);
    },
    onSuccess: () => {
      // Invalidate evidence details and list queries
      queryClient.invalidateQueries({ queryKey: ['evidence', id] });
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
    },
  });
}

export function useLinkEvidenceToControl(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (controlId: string) => {
      return api.post(`/compliance/evidence/${id}/controls`, { controlId});
    },
    onSuccess: () => {
      // Invalidate evidence details query
      queryClient.invalidateQueries({ queryKey: ['evidence', id] });
    },
  });
}

export function useDeleteEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return api.delete<void>(`/compliance/evidence/${id}`);
    },
    onSuccess: () => {
      // Invalidate evidence list query
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
    },
  });
}
