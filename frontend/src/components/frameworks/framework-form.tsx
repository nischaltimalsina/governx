'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FrameworkInput, useCreateFramework, useUpdateFramework } from '@/hooks/use-frameworks';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Schema for framework data
const frameworkSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'Name is required' }),
  version: z.string().optional(),
  description: z.string().min(1, { message: 'Description is required' }),
  organization: z.string().min(1, { message: 'Organization is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  website: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
  isActive: z.boolean().default(true).optional(),
});

export type FrameworkFormData = z.infer<typeof frameworkSchema>;

interface FrameworkFormProps {
  initialData?: FrameworkFormData;
  isEdit?: boolean;
  frameworkId?: string;
}

export function FrameworkForm({ initialData, isEdit = false, frameworkId }: FrameworkFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FrameworkFormData>({
    resolver: zodResolver(frameworkSchema),
    defaultValues: initialData || {
      name: '',
      version: '',
      description: '',
      organization: '',
      category: '',
      website: '',
      isActive: true,
    }
  });

  // Use our custom hooks for creating or updating frameworks
  const createFramework = useCreateFramework();
  const updateFramework = useUpdateFramework(frameworkId || '');

  // Combined mutation callback based on operation
  const mutate = isEdit && frameworkId
    ? updateFramework.mutate
    : createFramework.mutate;

  // Combined mutation status
  const isSubmitting = isEdit
    ? updateFramework.isPending
    : createFramework.isPending;

  // Track success/error from the mutations
  React.useEffect(() => {
    if (createFramework.isSuccess) {
      setSuccess('Framework created successfully');
      reset(); // Clear form on create

      // Redirect after short delay to show success message
      setTimeout(() => {
        if (createFramework.data) {
          router.push(`/compliance/frameworks/${createFramework.data.id}`);
        }
      }, 1500);
    }

    if (updateFramework.isSuccess) {
      setSuccess('Framework updated successfully');
    }

    if (createFramework.isError || updateFramework.isError) {
      const error = createFramework.error || updateFramework.error;
      console.error('Error saving framework:', error);
      setError(error?.message || 'Failed to save framework. Please try again.');
    }
  }, [
    createFramework.isSuccess, createFramework.isError, createFramework.data, createFramework.error,
    updateFramework.isSuccess, updateFramework.isError, updateFramework.error,
    reset, router
  ]);

  const onSubmit = (data: FrameworkFormData) => {
    setError(null);
    setSuccess(null);
    mutate(data as FrameworkInput);
  };

  const categoryOptions = [
    'security',
    'privacy',
    'compliance',
    'financial',
    'operational',
    'governance',
    'regulatory',
    'industry_specific',
    'other'
  ];

  return (
    <Card className="w-full max-wxl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? `Edit ${initialData?.name} Framework` : 'Add New Framework'}</CardTitle>
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
              <label htmlFor="name" className="block text-sm font-medium">
                Framework Name <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                {...register('name')}
                className={`w-full p-2 border rounded ${errors.name ? 'border-destructive' : 'border-input'}`}
                placeholder="e.g., SOC 2"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="version" className="block text-sm font-medium">
                Version
              </label>
              <input
                id="version"
                {...register('version')}
                className="w-full p-2 border rounded border-input"
                placeholder="e.g., 2023"
              />
            </div>
          </div>

          <div className="space-y-2">
                          <label htmlFor="organization" className="block text-sm font-medium">
              Organization <span className="text-destructive">*</span>
              </label>
              <input
                id="organization"
                {...register('organization')}
                className={`w-full p-2 border rounded ${errors.organization ? 'border-destructive' : 'border-input'}`}
                placeholder="e.g., AICPA"
              />
              {errors.organization && (
                <p className="text-xs text-destructive">{errors.organization.message}</p>
              )}
            </div>

          <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium">
              Category <span className="text-destructive">*</span>
            </label>
            <select
              id="category"
              {...register('category')}
              className={`w-full p-2 border rounded ${errors.category ? 'border-destructive' : 'border-input'}`}
            >
              <option value="">Select a category</option>
              {categoryOptions.map(option => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
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
              placeholder="Provide a description of the framework..."
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="website" className="block text-sm font-medium">
              Website URL
            </label>
            <input
              id="website"
              type="url"
              {...register('website')}
              className={`w-full p-2 border rounded ${errors.website ? 'border-destructive' : 'border-input'}`}
              placeholder="e.g., https://www.aicpa.org"
            />
            {errors.website && (
              <p className="text-xs text-destructive">{errors.website.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm">
              Framework is active
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
                {isEdit ? 'Save Changes' : 'Create Framework'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
