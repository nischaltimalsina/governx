'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Risk, RiskTreatmentInput, useCreateRiskTreatment, useUpdateRiskTreatment } from '@/hooks/use-risks';
import { useControls } from '@/hooks/use-controls';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Schema for risk treatment data
const treatmentSchema = z.object({
  riskId: z.string().min(1, { message: 'Risk ID is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  type: z.enum(['accept', 'mitigate', 'transfer', 'avoid'] as const),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled'] as const),
  dueDate: z.string().optional(),
  completedDate: z.string().optional(),
  assignee: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  relatedControlIds: z.array(z.string()).optional(),
});

export type RiskTreatmentFormData = z.infer<typeof treatmentSchema>;

interface RiskTreatmentFormProps {
  risk: Risk;
  initialData?: Partial<RiskTreatmentFormData>;
  isEdit?: boolean;
  treatmentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RiskTreatmentForm({
  risk,
  initialData,
  isEdit = false,
  treatmentId,
  onSuccess,
  onCancel
}: RiskTreatmentFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedControls, setSelectedControls] = useState<string[]>(initialData?.relatedControlIds || []);

  // Fetch controls for dropdown
  const { data: controls, isLoading: controlsLoading } = useControls();

  // Use context from a potential user management system - in a real app, this would fetch real users
  // For now, we'll use a mock current user
  const currentUser = {
    id: 'user123',
    name: 'John Smith'
  };

  const defaultValues = {
    riskId: risk.id,
    name: initialData?.name || '',
    description: initialData?.description || '',
    type: initialData?.type || 'mitigate',
    status: initialData?.status || 'planned',
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
    completedDate: initialData?.completedDate ? new Date(initialData.completedDate).toISOString().split('T')[0] : '',
    assignee: initialData?.assignee || currentUser,
    relatedControlIds: initialData?.relatedControlIds || [],
  };

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RiskTreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
    defaultValues
  });

  // Use our custom hooks for creating or updating risk treatments
  const createTreatment = useCreateRiskTreatment();
  const updateTreatment = useUpdateRiskTreatment(treatmentId || '');

  // Combined mutation callback based on operation
  const mutate = isEdit && treatmentId
    ? updateTreatment.mutate
    : createTreatment.mutate;

  // Combined mutation status
  const isSubmitting = isEdit
    ? updateTreatment.isPending
    : createTreatment.isPending;

  // Treatment type options
  const typeOptions = [
    { value: 'accept', label: 'Accept' },
    { value: 'mitigate', label: 'Mitigate' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'avoid', label: 'Avoid' }
  ];

  // Treatment status options
  const statusOptions = [
    { value: 'planned', label: 'Planned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Watch status to conditionally show completed date
  const status = watch('status');

  // Handle control selection
  const handleControlChange = (controlId: string) => {
    setSelectedControls(current => {
      if (current.includes(controlId)) {
        return current.filter(c => c !== controlId);
      } else {
        return [...current, controlId];
      }
    });
  };

  // Track success/error from the mutations
  React.useEffect(() => {
    if (createTreatment.isSuccess || updateTreatment.isSuccess) {
      setSuccess(isEdit ? 'Treatment updated successfully' : 'Treatment created successfully');

      // Call onSuccess callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    }

    if (createTreatment.isError || updateTreatment.isError) {
      const error = createTreatment.error || updateTreatment.error;
      console.error('Error saving treatment:', error);
      setError(error?.message || 'Failed to save treatment. Please try again.');
    }
  }, [
    createTreatment.isSuccess, createTreatment.isError, createTreatment.error,
    updateTreatment.isSuccess, updateTreatment.isError, updateTreatment.error,
    isEdit, onSuccess
  ]);

  const onSubmit = (data: RiskTreatmentFormData) => {
    setError(null);
    setSuccess(null);

    // Add selected controls
    data.relatedControlIds = selectedControls;

    // Convert date strings to ISO format if they exist
    if (data.dueDate) {
      data.dueDate = new Date(data.dueDate).toISOString();
    }

    if (data.completedDate) {
      data.completedDate = new Date(data.completedDate).toISOString();
    }

    mutate(data as RiskTreatmentInput);
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{isEdit ? 'Edit Treatment' : 'Add Treatment Plan'}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 pb-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive flex items-start gap-2 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-md bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 flex items-start gap-2 text-sm">
              <Check className="h-5 w-5 flex-shrink-0" />
              <p>{success}</p>
            </div>
          )}

          <input type="hidden" {...register('riskId')} value={risk.id} />

          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Treatment Name <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              {...register('name')}
              className={`w-full p-2 border rounded ${errors.name ? 'border-destructive' : 'border-input'}`}
              placeholder="e.g., Implement Password Policy"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium">
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              id="description"
              {...register('description')}
              className={`w-full p-2 border rounded ${errors.description ? 'border-destructive' : 'border-input'}`}
              rows={3}
              placeholder="Describe the treatment plan and how it addresses the risk..."
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="type" className="block text-sm font-medium">
                Treatment Type <span className="text-destructive">*</span>
              </label>
              <select
                id="type"
                {...register('type')}
                className="w-full p-2 border rounded border-input"
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium">
                Status <span className="text-destructive">*</span>
              </label>
              <select
                id="status"
                {...register('status')}
                className="w-full p-2 border rounded border-input"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="dueDate" className="block text-sm font-medium">
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                className="w-full p-2 border rounded border-input"
              />
            </div>

            {status === 'completed' && (
              <div className="space-y-2">
                <label htmlFor="completedDate" className="block text-sm font-medium">
                  Completion Date
                </label>
                <input
                  id="completedDate"
                  type="date"
                  {...register('completedDate')}
                  className="w-full p-2 border rounded border-input"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Assignee
            </label>
            <div className="p-2 border rounded">
              <p className="text-sm">{currentUser.name}</p>
              <input type="hidden" {...register('assignee.id')} value={currentUser.id} />
              <input type="hidden" {...register('assignee.name')} value={currentUser.name} />
            </div>
            <p className="text-xs text-muted-foreground">
              The current user is automatically assigned to this treatment plan.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Related Controls
            </label>
            <div className="border rounded p-2 max-h-48 overflow-y-auto">
              {controlsLoading ? (
                <div className="flex justify-center py-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : controls && controls.length > 0 ? (
                <div className="space-y-1">
                  {controls.map(control => (
                    <label key={control.id} className="flex items-center gap-2 text-sm p-1 hover:bg-muted rounded">
                      <input
                        type="checkbox"
                        checked={selectedControls.includes(control.id)}
                        onChange={() => handleControlChange(control.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="font-mono text-xs bg-muted px-1">{control.code}</span>
                      <span className="truncate">{control.title}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2 text-center">No controls available</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Select controls that will be implemented as part of this treatment plan.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => router.back())}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Update Treatment' : 'Add Treatment'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
