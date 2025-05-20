'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ControlInput, useCreateControl, useUpdateControl } from '@/hooks/use-controls';
import { useFrameworks } from '@/hooks/use-frameworks';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Schema for control data
const controlSchema = z.object({
  id: z.string().optional(),
  frameworkId: z.string().min(1, { message: 'Framework is required' }),
  code: z.string().min(1, { message: 'Control code is required' }),
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  guidance: z.string().optional(),
  implementationStatus: z.enum(['not_implemented', 'partially_implemented', 'implemented']),
  implementationDetails: z.string().optional(),
  categories: z.array(z.string()).min(1, { message: 'At least one category is required' }),
  isActive: z.boolean().default(true).optional(),
  ownerId: z.string().optional(),
});

export type ControlFormData = z.infer<typeof controlSchema>;

interface ControlFormProps {
  initialData?: Partial<ControlFormData>;
  isEdit?: boolean;
  controlId?: string;
  defaultFrameworkId?: string;
}

export function ControlForm({ initialData, isEdit = false, controlId, defaultFrameworkId }: ControlFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.categories || []);

  // Fetch frameworks for dropdown
  const { data: frameworks } = useFrameworks();

  const defaultValues = {
    frameworkId: defaultFrameworkId || initialData?.frameworkId || '',
    code: initialData?.code || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    guidance: initialData?.guidance || '',
    implementationStatus: initialData?.implementationStatus || 'not_implemented',
    implementationDetails: initialData?.implementationDetails || '',
    categories: initialData?.categories || [],
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    ownerId: initialData?.ownerId || '',
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ControlFormData>({
    resolver: zodResolver(controlSchema),
    defaultValues
  });

  // Use our custom hooks for creating or updating controls
  const createControl = useCreateControl();
  const updateControl = useUpdateControl(controlId || '');

  // Combined mutation callback based on operation
  const mutate = isEdit && controlId
    ? updateControl.mutate
    : createControl.mutate;

  // Combined mutation status
  const isSubmitting = isEdit
    ? updateControl.isPending
    : createControl.isPending;

  // Category options - typically these might come from the backend, but we'll hard-code for now
  const categoryOptions = [
    'access_control',
    'change_management',
    'risk_management',
    'security',
    'data_protection',
    'business_continuity',
    'compliance',
    'governance',
    'operations',
    'monitoring',
    'incident_response',
    'vendor_management',
    'awareness_training'
  ];

  // Track success/error from the mutations
  React.useEffect(() => {
    if (createControl.isSuccess) {
      setSuccess('Control created successfully');
      reset(); // Clear form on create

      // Redirect after short delay to show success message
      setTimeout(() => {
        if (createControl.data) {
          router.push(`/compliance/controls/${createControl.data.id}`);
        }
      }, 1500);
    }

    if (updateControl.isSuccess) {
      setSuccess('Control updated successfully');
    }

    if (createControl.isError || updateControl.isError) {
      const error = createControl.error || updateControl.error;
      console.error('Error saving control:', error);
      setError(error?.message || 'Failed to save control. Please try again.');
    }
  }, [
    createControl.isSuccess, createControl.isError, createControl.data, createControl.error,
    updateControl.isSuccess, updateControl.isError, updateControl.error,
    reset, router
  ]);

  const onSubmit = (data: ControlFormData) => {
    setError(null);
    setSuccess(null);

    // Make sure categories is properly set from our state
    data.categories = selectedCategories;

    mutate(data as ControlInput);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(current => {
      if (current.includes(category)) {
        return current.filter(c => c !== category);
      } else {
        return [...current, category];
      }
    });
  };

  return (
    <Card className="w-full max-wxl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Control' : 'Add New Control'}</CardTitle>
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

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="frameworkId" className="block text-sm font-medium">
                Framework <span className="text-destructive">*</span>
              </label>
              <select
                id="frameworkId"
                {...register('frameworkId')}
                className={`w-full p-2 border rounded ${errors.frameworkId ? 'border-destructive' : 'border-input'}`}
                disabled={isEdit || !!defaultFrameworkId} // Disable if editing or default framework provided
              >
                <option value="">Select a framework</option>
                {frameworks?.map(framework => (
                  <option key={framework.id} value={framework.id}>
                    {framework.name} {framework.version ? `(${framework.version})` : ''}
                  </option>
                ))}
              </select>
              {errors.frameworkId && (
                <p className="text-xs text-destructive">{errors.frameworkId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="code" className="block text-sm font-medium">
                Control Code <span className="text-destructive">*</span>
              </label>
              <input
                id="code"
                {...register('code')}
                className={`w-full p-2 border rounded ${errors.code ? 'border-destructive' : 'border-input'}`}
                placeholder="e.g., AC-1"
              />
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              {...register('title')}
              className={`w-full p-2 border rounded ${errors.title ? 'border-destructive' : 'border-input'}`}
              placeholder="e.g., Access Control Policy"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
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
              rows={4}
              placeholder="Provide a description of the control..."
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="guidance" className="block text-sm font-medium">
              Implementation Guidance
            </label>
            <textarea
              id="guidance"
              {...register('guidance')}
              className="w-full p-2 border rounded border-input"
              rows={3}
              placeholder="Provide guidance on how to implement this control..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Categories <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categoryOptions.map(category => (
                <label key={category} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </label>
              ))}
            </div>
            {errors.categories && (
              <p className="text-xs text-destructive">{errors.categories.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="implementationStatus" className="block text-sm font-medium">
              Implementation Status <span className="text-destructive">*</span>
            </label>
            <select
              id="implementationStatus"
              {...register('implementationStatus')}
              className="w-full p-2 border rounded border-input"
            >
              <option value="not_implemented">Not Implemented</option>
              <option value="partially_implemented">Partially Implemented</option>
              <option value="implemented">Implemented</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="implementationDetails" className="block text-sm font-medium">
              Implementation Details
            </label>
            <textarea
              id="implementationDetails"
              {...register('implementationDetails')}
              className="w-full p-2 border rounded border-input"
              rows={3}
              placeholder="Provide details about the implementation status..."
            />
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm">
              Control is active
            </label>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
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
                {isEdit ? 'Save Changes' : 'Create Control'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
