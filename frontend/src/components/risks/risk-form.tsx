'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskImpact, RiskInput, RiskLikelihood, RiskStatus, useCreateRisk, useUpdateRisk } from '@/hooks/use-risks';
import { useControls } from '@/hooks/use-controls';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Schema for risk data
const riskSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  inherentImpact: z.enum(['insignificant', 'minor', 'moderate', 'major', 'severe'] as const),
  inherentLikelihood: z.enum(['rare', 'unlikely', 'possible', 'likely', 'almost_certain'] as const),
  residualImpact: z.enum(['insignificant', 'minor', 'moderate', 'major', 'severe'] as const),
  residualLikelihood: z.enum(['rare', 'unlikely', 'possible', 'likely', 'almost_certain'] as const),
  status: z.enum(['identified', 'assessed', 'treated', 'accepted', 'closed'] as const),
  owner: z.object({
    id: z.string(),
    name: z.string(),
    department: z.string(),
  }),
  relatedControlIds: z.array(z.string()),
  reviewPeriodMonths: z.number().int().min(1),
  tags: z.array(z.string()),
});

export type RiskFormData = z.infer<typeof riskSchema>;

interface RiskFormProps {
  initialData?: Partial<RiskFormData>;
  isEdit?: boolean;
  riskId?: string;
}

export function RiskForm({ initialData, isEdit = false, riskId }: RiskFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedControls, setSelectedControls] = useState<string[]>(initialData?.relatedControlIds || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Fetch controls for dropdown
  const { data: controls, isLoading: controlsLoading } = useControls();

  // Use context from a potential user management system - in a real app, this would fetch real users
  // For now, we'll use a mock current user
  const currentUser = {
    id: 'user123',
    name: 'John Smith',
    department: 'Information Security'
  };

  const defaultValues = {
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    inherentImpact: initialData?.inherentImpact || 'moderate' as RiskImpact,
    inherentLikelihood: initialData?.inherentLikelihood || 'possible' as RiskLikelihood,
    residualImpact: initialData?.residualImpact || 'minor' as RiskImpact,
    residualLikelihood: initialData?.residualLikelihood || 'unlikely' as RiskLikelihood,
    status: initialData?.status || 'identified' as RiskStatus,
    owner: initialData?.owner || currentUser,
    relatedControlIds: initialData?.relatedControlIds || [],
    reviewPeriodMonths: initialData?.reviewPeriodMonths || 3,
    tags: initialData?.tags || [],
  };

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<RiskFormData>({
    resolver: zodResolver(riskSchema),
    defaultValues
  });

  // Use our custom hooks for creating or updating risks
  const createRisk = useCreateRisk();
  const updateRisk = useUpdateRisk(riskId || '');

  // Combined mutation callback based on operation
  const mutate = isEdit && riskId
    ? updateRisk.mutate
    : createRisk.mutate;

  // Combined mutation status
  const isSubmitting = isEdit
    ? updateRisk.isPending
    : createRisk.isPending;

  // Category options
  const categoryOptions = [
    'security',
    'privacy',
    'operational',
    'financial',
    'strategic',
    'compliance',
    'reputational',
    'technological',
    'third_party',
    'legal',
    'environmental',
    'human_resources'
  ];

  // Impact and likelihood options for display in UI
  const impactOptions = [
    { value: 'insignificant', label: 'Insignificant' },
    { value: 'minor', label: 'Minor' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'major', label: 'Major' },
    { value: 'severe', label: 'Severe' }
  ];

  const likelihoodOptions = [
    { value: 'rare', label: 'Rare' },
    { value: 'unlikely', label: 'Unlikely' },
    { value: 'possible', label: 'Possible' },
    { value: 'likely', label: 'Likely' },
    { value: 'almost_certain', label: 'Almost Certain' }
  ];

  const statusOptions = [
    { value: 'identified', label: 'Identified' },
    { value: 'assessed', label: 'Assessed' },
    { value: 'treated', label: 'Treated' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'closed', label: 'Closed' }
  ];

  // Watch values for displaying risk heat map
  const inherentImpact = watch('inherentImpact');
  const inherentLikelihood = watch('inherentLikelihood');
  const residualImpact = watch('residualImpact');
  const residualLikelihood = watch('residualLikelihood');

  // Helper functions to calculate risk level
  const getImpactScore = (impact: RiskImpact): number => {
    switch (impact) {
      case 'severe': return 5;
      case 'major': return 4;
      case 'moderate': return 3;
      case 'minor': return 2;
      case 'insignificant': return 1;
    }
  };

  const getLikelihoodScore = (likelihood: RiskLikelihood): number => {
    switch (likelihood) {
      case 'almost_certain': return 5;
      case 'likely': return 4;
      case 'possible': return 3;
      case 'unlikely': return 2;
      case 'rare': return 1;
    }
  };

  const getRiskScore = (impact: RiskImpact, likelihood: RiskLikelihood): number => {
    return getImpactScore(impact) * getLikelihoodScore(likelihood);
  };

  const getRiskLevel = (score: number): string => {
    if (score >= 15) return 'Critical';
    if (score >= 8) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  };

  const getRiskLevelColor = (score: number): string => {
    if (score >= 15) return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    if (score >= 8) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
    if (score >= 4) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
    return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
  };

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

  // Add a tag
  const addTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove a tag
  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  // Track success/error from the mutations
  React.useEffect(() => {
    if (createRisk.isSuccess) {
      setSuccess('Risk created successfully');
      reset(); // Clear form on create

      // Redirect after short delay to show success message
      setTimeout(() => {
        if (createRisk.data) {
          router.push(`/risk/register/${createRisk.data.id}`);
        }
      }, 1500);
    }

    if (updateRisk.isSuccess) {
      setSuccess('Risk updated successfully');
    }

    if (createRisk.isError || updateRisk.isError) {
      const error = createRisk.error || updateRisk.error;
      console.error('Error saving risk:', error);
      setError(error?.message || 'Failed to save risk. Please try again.');
    }
  }, [
    createRisk.isSuccess, createRisk.isError, createRisk.data, createRisk.error,
    updateRisk.isSuccess, updateRisk.isError, updateRisk.error,
    router
  ]);

  const onSubmit = (data: RiskFormData) => {
    setError(null);
    setSuccess(null);

    // Make sure relatedControlIds and tags are properly set from our state
    data.relatedControlIds = selectedControls;
    data.tags = selectedTags;

    mutate(data as RiskInput);
  };

  return (
    <Card className="w-full max-wxl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Risk' : 'Add New Risk'}</CardTitle>
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

          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Risk Name <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              {...register('name')}
              className={`w-full p-2 border rounded ${errors.name ? 'border-destructive' : 'border-input'}`}
              placeholder="e.g., Weak Password Controls"
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
              placeholder="Describe the risk and its potential impact..."
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
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
              {categoryOptions.map(category => (
                <option key={category} value={category}>
                  {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Inherent Risk <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="inherentImpact" className="block text-xs text-muted-foreground mb-1">
                    Impact
                  </label>
                  <select
                    id="inherentImpact"
                    {...register('inherentImpact')}
                    className="w-full p-2 border rounded border-input"
                  >
                    {impactOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="inherentLikelihood" className="block text-xs text-muted-foreground mb-1">
                    Likelihood
                  </label>
                  <select
                    id="inherentLikelihood"
                    {...register('inherentLikelihood')}
                    className="w-full p-2 border rounded border-input"
                  >
                    {likelihoodOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-2 p-2 rounded border">
                <div className="flex justify-between text-xs">
                  <span>Risk Score:</span>
                  <span className="font-medium">{getRiskScore(inherentImpact, inherentLikelihood)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Risk Level:</span>
                  <span className={getRiskLevelColor(getRiskScore(inherentImpact, inherentLikelihood))}>
                    {getRiskLevel(getRiskScore(inherentImpact, inherentLikelihood))}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Residual Risk <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="residualImpact" className="block text-xs text-muted-foreground mb-1">
                    Impact
                  </label>
                  <select
                    id="residualImpact"
                    {...register('residualImpact')}
                    className="w-full p-2 border rounded border-input"
                  >
                    {impactOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="residualLikelihood" className="block text-xs text-muted-foreground mb-1">
                    Likelihood
                  </label>
                  <select
                    id="residualLikelihood"
                    {...register('residualLikelihood')}
                    className="w-full p-2 border rounded border-input"
                  >
                    {likelihoodOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-2 p-2 rounded border">
                <div className="flex justify-between text-xs">
                  <span>Risk Score:</span>
                  <span className="font-medium">{getRiskScore(residualImpact, residualLikelihood)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Risk Level:</span>
                  <span className={getRiskLevelColor(getRiskScore(residualImpact, residualLikelihood))}>
                    {getRiskLevel(getRiskScore(residualImpact, residualLikelihood))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium">
                Risk Status <span className="text-destructive">*</span>
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

            <div className="space-y-2">
              <label htmlFor="reviewPeriodMonths" className="block text-sm font-medium">
                Review Period (Months) <span className="text-destructive">*</span>
              </label>
              <input
                id="reviewPeriodMonths"
                type="number"
                min="1"
                max="24"
                {...register('reviewPeriodMonths', { valueAsNumber: true })}
                className={`w-full p-2 border rounded ${errors.reviewPeriodMonths ? 'border-destructive' : 'border-input'}`}
              />
              {errors.reviewPeriodMonths && (
                <p className="text-xs text-destructive">{errors.reviewPeriodMonths.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Risk Owner</label>
            <div className="p-2 border rounded">
              <p className="text-sm">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser.department}</p>
              <input type="hidden" {...register('owner.id')} value={currentUser.id} />
              <input type="hidden" {...register('owner.name')} value={currentUser.name} />
              <input type="hidden" {...register('owner.department')} value={currentUser.department} />
            </div>
            <p className="text-xs text-muted-foreground">
              The current user is automatically assigned as the risk owner.
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
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 p-2 border rounded border-input"
                placeholder="Add tags and press Enter"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTags.map(tag => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                {isEdit ? 'Save Changes' : 'Create Risk'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
