'use client';

import { useState, useCallback } from 'react';
import type { WorkflowData } from './WorkflowDiagram';
import type { WorkflowAnswer, WorkflowLaunchResponse } from '@/types/audit';
import { WorkflowDiagram } from './WorkflowDiagram';
import { WorkflowPromptWizard } from './WorkflowPromptWizard';
import { CommandLaunchModal } from './CommandLaunchModal';

export interface WorkflowsClientProps {
  /** Array of workflows to display */
  workflows: WorkflowData[];
}

type ViewState = 'list' | 'wizard' | 'modal';

export function WorkflowsClient({ workflows }: WorkflowsClientProps) {
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowData | null>(null);
  const [wizardAnswers, setWizardAnswers] = useState<WorkflowAnswer[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle workflow tile click - show the wizard
  const handleWorkflowClick = useCallback((workflowId: string) => {
    const workflow = workflows.find(
      (w) => (w.id || w.name.toLowerCase().replace(/\s+/g, '-')) === workflowId
    );
    if (workflow) {
      setSelectedWorkflow(workflow);
      setViewState('wizard');
      setError(null);
    }
  }, [workflows]);

  // Handle wizard completion - call API and show modal
  const handleWizardComplete = useCallback(async (answers: WorkflowAnswer[]) => {
    if (!selectedWorkflow) return;

    setWizardAnswers(answers);
    setIsLoading(true);
    setError(null);

    try {
      const workflowId = selectedWorkflow.id || selectedWorkflow.name.toLowerCase().replace(/\s+/g, '-');

      const response = await fetch('/api/audit/workflows/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          answers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate command');
      }

      const data: WorkflowLaunchResponse = await response.json();
      setGeneratedPrompt(data.copyableText);
      setViewState('modal');
    } catch (err) {
      console.error('Error generating command:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate command');
      // Stay on wizard to allow retry or cancel
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkflow]);

  // Handle wizard cancel - return to list
  const handleWizardCancel = useCallback(() => {
    setSelectedWorkflow(null);
    setViewState('list');
    setError(null);
  }, []);

  // Handle modal close - return to list
  const handleModalClose = useCallback(() => {
    setSelectedWorkflow(null);
    setWizardAnswers([]);
    setGeneratedPrompt('');
    setViewState('list');
  }, []);

  // Render based on current view state
  if (viewState === 'wizard' && selectedWorkflow) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          type="button"
          onClick={handleWizardCancel}
          className="mb-4 flex items-center gap-2 text-xs text-[#1e293b] opacity-70 hover:opacity-100 transition-opacity"
        >
          {'\u2190'} Back to workflows
        </button>

        {/* Error display */}
        {error && (
          <div className="mb-4 border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="mb-4 border border-[#1e293b] bg-[#fffef5] px-4 py-3 text-sm text-[#1e293b]">
            Generating command...
          </div>
        )}

        {/* Wizard */}
        <div className="border border-[#1e293b] bg-[#fefcf3] p-6">
          <WorkflowPromptWizard
            workflowId={selectedWorkflow.id || selectedWorkflow.name.toLowerCase().replace(/\s+/g, '-')}
            workflowName={selectedWorkflow.name}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        </div>
      </div>
    );
  }

  // List view (default)
  return (
    <>
      {workflows.length === 0 ? (
        <div className="border border-[#1e293b] p-8 text-center">
          <p className="text-[#1e293b]/70">No workflows found</p>
          <p className="text-xs text-[#1e293b]/50 mt-2">
            Workflows are extracted from command files that define agent sequences
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-xs text-[#1e293b]/50">
              {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} defined
              {' '}{'\u2022'}{' '}
              Click a workflow to configure and launch
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {workflows.map((workflow, index) => (
              <WorkflowDiagram
                key={`${workflow.name}-${index}`}
                workflow={workflow}
                onClick={handleWorkflowClick}
                clickable
              />
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {selectedWorkflow && (
        <CommandLaunchModal
          isOpen={viewState === 'modal'}
          onClose={handleModalClose}
          workflowName={selectedWorkflow.name}
          answers={wizardAnswers}
          generatedPrompt={generatedPrompt}
        />
      )}
    </>
  );
}
