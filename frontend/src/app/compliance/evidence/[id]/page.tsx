'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  ArrowDownToLine,
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  Edit,
  FileText,
  ImageIcon,
  Link2,
  Terminal,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { useEvidenceDetails, useLinkEvidenceToControl, useReviewEvidence } from '@/hooks/use-evidence';
import { useControlDetails, useControls } from '@/hooks/use-controls';
import { useState } from 'react';

export default function EvidenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isLinkingControl, setIsLinkingControl] = useState(false);

  // Fetch evidence details
  const { data: evidence, isLoading: evidenceLoading, refetch } = useEvidenceDetails(id);

  // Set up the review mutation
  const reviewMutation = useReviewEvidence(id);

  // Identify the file type icon
  const getFileIcon = (type?: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-10 w-10 text-primary" />;
      case 'image':
      case 'screenshot':
        return <ImageIcon className="h-10 w-10 text-primary" />;
      case 'log':
        return <Terminal className="h-10 w-10 text-primary" />;
      default:
        return <FileText className="h-10 w-10 text-primary" />;
    }
  };

  // Handle review submission
  const handleReviewSubmit = async () => {
    if (!reviewStatus) return;

    try {
      await reviewMutation.mutateAsync({
        status: reviewStatus,
        notes: reviewNotes
      });

      setIsReviewing(false);
      refetch(); // Refresh data after successful review
    } catch (error) {
      console.error("Failed to submit review:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/compliance/evidence">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Evidence
          </Link>
        </Button>

        {evidenceLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : evidence ? (
          <>
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-muted rounded">
                  {getFileIcon(evidence.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium gap-1",
                        evidence.status === 'approved' ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' :
                        evidence.status === 'pending' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' :
                        'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
                      )}
                    >
                      {evidence.status === 'approved' ? <CheckCircle className="h-3 w-3" /> :
                        evidence.status === 'pending' ? <AlertCircle className="h-3 w-3" /> :
                        <XCircle className="h-3 w-3" />}
                      {evidence.status}
                    </span>
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                      {evidence.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold">{evidence.title}</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Uploaded by {evidence.createdBy.name} on {formatDateTime(evidence.createdAt)}
                  </p>

                  {evidence.reviewedBy && (
                    <p className="text-muted-foreground text-sm">
                      Reviewed by {evidence.reviewedBy.name} on {formatDateTime(evidence.reviewedAt || '')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <ArrowDownToLine className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/compliance/evidence/${id}/edit`}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Metadata
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-line">{evidence.description}</p>
                  </CardContent>
                </Card>

                {evidence.reviewNotes && (
                  <Card className="mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Review Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-line">{evidence.reviewNotes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* File preview card - in a real app, this would display the actual file */}
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">File Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center min-h-64 bg-muted">
                    <div className="text-center">
                      {getFileIcon(evidence.type)}
                      <p className="mt-2 text-muted-foreground">{evidence.fileName || 'File preview not available'}</p>
                      {evidence.fileSize && (
                        <p className="text-xs text-muted-foreground">
                          {(evidence.fileSize / 1024).toFixed(2)} KB
                        </p>
                      )}
                      <Button variant="outline" size="sm" className="mt-4">
                        <ArrowDownToLine className="h-4 w-4 mr-1" />
                        Download File
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Review section for pending evidence */}
                {evidence.status === 'pending' && !isReviewing && (
                  <Card className="mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Review Evidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        This evidence is waiting for your review. Approve or reject it based on your evaluation.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setIsReviewing(true);
                            setReviewStatus('approved');
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsReviewing(true);
                            setReviewStatus('rejected');
                          }}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Review form when actively reviewing */}
                {isReviewing && (
                  <Card className="mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {reviewStatus === 'approved' ? 'Approve Evidence' : 'Reject Evidence'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          Review Notes
                        </label>
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          className="w-full p-2 border rounded min-h-24"
                          placeholder="Add your review comments here..."
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t">
                      <Button
                        variant="outline"
                        onClick={() => setIsReviewing(false)}
                        disabled={reviewMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleReviewSubmit}
                        disabled={reviewMutation.isPending}
                        className={reviewStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                      >
                        {reviewMutation.isPending ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            {reviewStatus === 'approved' ? <Check className="h-4 w-4 mr-1" /> : <X className="h-4 w-4 mr-1" />}
                            {reviewStatus === 'approved' ? 'Submit Approval' : 'Submit Rejection'}
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                {/* Control linking dialog */}
                {isLinkingControl && (
                  <Card className="mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Link to Control</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LinkControlForm
                        evidenceId={id}
                        existingControlIds={evidence.controlIds || []}
                        onClose={() => setIsLinkingControl(false)}
                        onSuccess={() => {
                          setIsLinkingControl(false);
                          refetch(); // Refresh data after successful linking
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                {/* Metadata card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {evidence.validityStartDate && evidence.validityEndDate && (
                        <div>
                          <h3 className="text-sm font-medium mb-1">Validity Period</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(evidence.validityStartDate)} to {formatDate(evidence.validityEndDate)}</span>
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="text-sm font-medium mb-1">Tags</h3>
                        {evidence.tags && evidence.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {evidence.tags.map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No tags</p>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-sm font-medium">Associated Controls</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsLinkingControl(true)}
                            className="text-xs px-2 py-1 h-auto"
                          >
                            <Link2 className="h-3 w-3 mr-1" />
                            Link Control
                          </Button>
                        </div>
                        {evidence.controlIds && evidence.controlIds.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {evidence.controlIds.map(controlItemId => (
                              <ControlLinkItem key={controlItemId} controlId={controlItemId} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No associated controls</p>
                        )}
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Created:</span>
                          <span>{formatDate(evidence.createdAt)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Last updated:</span>
                          <span>{formatDate(evidence.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t flex">
                    <Button variant="destructive" size="sm" className="flex-1">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Evidence
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Evidence not found</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/compliance/evidence">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Evidence
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Control Link Item Component
function ControlLinkItem({ controlId }: { controlId: string }) {
  const { data: control, isLoading } = useControlDetails(controlId, false);

  if (isLoading) {
    return (
      <div className="animate-pulse flex items-center gap-2 p-2 rounded border">
        <div className="h-4 w-12 bg-muted rounded"></div>
        <div className="h-4 w-full bg-muted rounded"></div>
      </div>
    );
  }

  if (!control) {
    return <div className="p-2 rounded border text-sm text-muted-foreground">Control not found</div>;
  }

  return (
    <Link href={`/compliance/controls/${controlId}`}>
      <div className="flex items-center gap-2 p-2 rounded border hover:border-primary hover:bg-accent transition-colors">
        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{control.code}</span>
        <span className="text-sm truncate">{control.title}</span>
        <Link2 className="h-3 w-3 ml-auto text-muted-foreground" />
      </div>
    </Link>
  );
}

// Link Control Form Component
function LinkControlForm({
  evidenceId,
  existingControlIds,
  onClose,
  onSuccess
}: {
  evidenceId: string;
  existingControlIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedControl, setSelectedControl] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all controls
  const { data: controls, isLoading } = useControls();

  // Set up linking mutation
  const linkMutation = useLinkEvidenceToControl(evidenceId);

  // Filter controls that are not already linked
  const availableControls = controls?.filter(control =>
    !existingControlIds.includes(control.id) &&
    (searchTerm === '' ||
     control.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
     control.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle linking
  const handleLink = async () => {
    if (!selectedControl) return;

    try {
      await linkMutation.mutateAsync(selectedControl);
      onSuccess();
    } catch (error) {
      console.error("Failed to link control:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Search Controls
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded border-input"
          placeholder="Search by code or title..."
        />
      </div>

      <div className="border rounded max-h-48 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : availableControls && availableControls.length > 0 ? (
          <div className="space-y-1 p-1">
            {availableControls.map(control => (
              <label
                key={control.id}
                className={cn(
                  "flex items-center gap-2 text-sm p-2 rounded hover:bg-accent cursor-pointer",
                  selectedControl === control.id && "bg-accent"
                )}
                onClick={() => setSelectedControl(control.id)}
              >
                <input
                  type="radio"
                  name="control"
                  value={control.id}
                  checked={selectedControl === control.id}
                  onChange={() => setSelectedControl(control.id)}
                  className="h-4 w-4"
                />
                <span className="font-mono text-xs bg-muted px-1">{control.code}</span>
                <span className="truncate">{control.title}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {searchTerm ? "No matching controls found" : "No available controls to link"}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={linkMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleLink}
          disabled={!selectedControl || linkMutation.isPending}
        >
          {linkMutation.isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
              Linking...
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-1" />
              Link Control
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
