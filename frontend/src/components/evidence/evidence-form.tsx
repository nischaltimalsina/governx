'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { EvidenceFormData, useUploadEvidence } from '@/hooks/use-evidence';
import { useControls } from '@/hooks/use-controls';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, File, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Schema for evidence data
const evidenceSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  type: z.string().min(1, { message: 'Type is required' }),
  controlId: z.array(z.string()).min(1, { message: 'At least one control is required' }),
  validityStartDate: z.string().optional(),
  validityEndDate: z.string().optional(),
  tags: z.array(z.string()),
});

interface EvidenceFormProps {
  initialData?: Partial<EvidenceFormData>;
  defaultControlId?: string;
}

export function EvidenceForm({ initialData, defaultControlId }: EvidenceFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedControls, setSelectedControls] = useState<string[]>(
    initialData?.controlId || (defaultControlId ? [defaultControlId] : [])
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch controls for dropdown
  const { data: controls, isLoading: controlsLoading } = useControls();

  const defaultValues = {
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'document',
    controlId: initialData?.controlId || (defaultControlId ? [defaultControlId] : []),
    validityStartDate: initialData?.validityStartDate || '',
    validityEndDate: initialData?.validityEndDate || '',
    tags: initialData?.tags || [],
  };

  const { register, handleSubmit, formState: { errors } } = useForm<EvidenceFormData>({
    resolver: zodResolver(evidenceSchema),
    defaultValues
  });

  // Use our custom hook for uploading evidence
  const uploadEvidence = useUploadEvidence();

  // Evidence type options
  const typeOptions = [
    'document',
    'screenshot',
    'log',
    'report',
    'certificate',
    'policy',
    'procedure',
    'audit_result',
    'configuration',
    'other'
  ];

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
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
    if (uploadEvidence.isSuccess) {
      setSuccess('Evidence uploaded successfully');

      // Redirect after short delay to show success message
      setTimeout(() => {
        if (uploadEvidence.data) {
          router.push(`/compliance/evidence/${uploadEvidence.data.id}`);
        } else {
          router.push('/compliance/evidence');
        }
      }, 1500);
    }

    if (uploadEvidence.isError) {
      console.error('Error uploading evidence:', uploadEvidence.error);
      setError(uploadEvidence.error?.message || 'Failed to upload evidence. Please try again.');
    }
  }, [
    uploadEvidence.isSuccess, uploadEvidence.isError, uploadEvidence.data, uploadEvidence.error,
    router
  ]);

  const onSubmit = (data: EvidenceFormData) => {
    setError(null);
    setSuccess(null);

    // Make sure controlId and tags are properly set from our state
    data.controlId = selectedControls;
    data.tags = selectedTags;

    // Add the file to the form data
    if (selectedFile) {
      data.file = selectedFile;
    }

    uploadEvidence.mutate(data);
  };

  return (
    <Card className="w-full max-wxl mx-auto">
      <CardHeader>
        <CardTitle>Upload Evidence</CardTitle>
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
            <label htmlFor="title" className="block text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              {...register('title')}
              className={`w-full p-2 border rounded ${errors.title ? 'border-destructive' : 'border-input'}`}
              placeholder="e.g., Password Policy Document"
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
              rows={3}
              placeholder="Describe the evidence and its purpose..."
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="type" className="block text-sm font-medium">
                Evidence Type <span className="text-destructive">*</span>
              </label>
              <select
                id="type"
                {...register('type')}
                className={`w-full p-2 border rounded ${errors.type ? 'border-destructive' : 'border-input'}`}
              >
                <option value="">Select a type</option>
                {typeOptions.map(type => (
                  <option key={type} value={type}>
                    {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-xs text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="file" className="block text-sm font-medium">
                Upload File <span className="text-destructive">*</span>
              </label>
              <div className={`border rounded p-2 ${!selectedFile ? 'border-dashed' : 'border-solid'}`}>
                {selectedFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <File className="h-5 w-5 text-primary" />
                      <span className="text-sm truncate max-w-52">{selectedFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-3">
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload or drag and drop</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
              {!selectedFile && (
                <p className="text-xs text-muted-foreground">Supported formats: PDF, DOCX, XLSX, PNG, JPG, etc.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Associated Controls <span className="text-destructive">*</span>
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
            {errors.controlId && (
              <p className="text-xs text-destructive">{errors.controlId.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="validityStartDate" className="block text-sm font-medium">
                Validity Start Date
              </label>
              <input
                id="validityStartDate"
                type="date"
                {...register('validityStartDate')}
                className="w-full p-2 border rounded border-input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="validityEndDate" className="block text-sm font-medium">
                Validity End Date
              </label>
              <input
                id="validityEndDate"
                type="date"
                {...register('validityEndDate')}
                className="w-full p-2 border rounded border-input"
              />
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
                      <X className="h-3 w-3" />
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
            disabled={uploadEvidence.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={uploadEvidence.isPending || !selectedFile}>
            {uploadEvidence.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Evidence
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
