'use client';

import { useState, useCallback } from 'react';
import type { WorkflowQuestion, WorkflowAnswer } from '@/types/audit';

/**
 * Default questions for workflow launch configuration.
 * These questions help gather context for the templated prompt.
 */
const DEFAULT_QUESTIONS: WorkflowQuestion[] = [
  {
    id: 'change-type',
    header: 'Change Type',
    question: 'What type of change is this?',
    multiSelect: false,
    options: [
      { label: 'New functionality', description: 'Adding new features or capabilities' },
      { label: 'Bug fix', description: 'Fixing incorrect behavior or errors' },
      { label: 'Refactor', description: 'Improving code structure without changing behavior' },
      { label: 'Performance', description: 'Optimizing speed or resource usage' },
      { label: 'Documentation', description: 'Adding or updating documentation' },
      { label: 'Testing', description: 'Adding or improving tests' },
    ],
  },
  {
    id: 'affected-area',
    header: 'Affected Area',
    question: 'Which areas of the codebase are affected?',
    multiSelect: true,
    options: [
      { label: 'Frontend', description: 'UI components, pages, client-side logic' },
      { label: 'Backend', description: 'API routes, server-side logic' },
      { label: 'Database', description: 'Schema, migrations, queries' },
      { label: 'Infrastructure', description: 'Deployment, CI/CD, configuration' },
      { label: 'Testing', description: 'Test files, test utilities' },
      { label: 'Documentation', description: 'README, docs, comments' },
    ],
  },
  {
    id: 'description',
    header: 'Description',
    question: 'Describe what you want to accomplish:',
    multiSelect: false,
    options: [], // Empty options = free text input
  },
  {
    id: 'files-involved',
    header: 'Files Involved',
    question: 'Are there specific files or directories involved? (optional)',
    multiSelect: false,
    options: [], // Empty options = free text input
  },
];

export interface WorkflowPromptWizardProps {
  /** The workflow ID being configured */
  workflowId: string;
  /** Optional workflow name for display */
  workflowName?: string;
  /** Custom questions to use instead of defaults */
  questions?: WorkflowQuestion[];
  /** Callback when wizard is completed with all answers */
  onComplete: (answers: WorkflowAnswer[]) => void;
  /** Callback to cancel the wizard */
  onCancel?: () => void;
}

export function WorkflowPromptWizard({
  workflowId,
  workflowName,
  questions = DEFAULT_QUESTIONS,
  onComplete,
  onCancel,
}: WorkflowPromptWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Map<string, WorkflowAnswer>>(new Map());

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const isFirstStep = currentStep === 0;
  const isFreeText = currentQuestion?.options.length === 0;

  // Get current answer for this question
  const currentAnswer = answers.get(currentQuestion?.id || '');
  const selectedOptions = currentAnswer?.selectedOptions || [];
  const customText = currentAnswer?.customText || '';

  const handleOptionToggle = useCallback((optionLabel: string) => {
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      const existing = newAnswers.get(currentQuestion.id);
      const currentSelected = existing?.selectedOptions || [];

      let newSelected: string[];
      if (currentQuestion.multiSelect) {
        // Toggle option in multi-select
        if (currentSelected.includes(optionLabel)) {
          newSelected = currentSelected.filter((o) => o !== optionLabel);
        } else {
          newSelected = [...currentSelected, optionLabel];
        }
      } else {
        // Single select - replace
        newSelected = [optionLabel];
      }

      newAnswers.set(currentQuestion.id, {
        questionId: currentQuestion.id,
        selectedOptions: newSelected,
        customText: existing?.customText,
      });

      return newAnswers;
    });
  }, [currentQuestion]);

  const handleTextChange = useCallback((text: string) => {
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      const existing = newAnswers.get(currentQuestion.id);

      newAnswers.set(currentQuestion.id, {
        questionId: currentQuestion.id,
        selectedOptions: existing?.selectedOptions || [],
        customText: text,
      });

      return newAnswers;
    });
  }, [currentQuestion]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      // Convert Map to array and call onComplete
      const answersArray = Array.from(answers.values());
      onComplete(answersArray);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, answers, onComplete]);

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [isFirstStep]);

  // Check if current step has a valid answer
  const hasValidAnswer = isFreeText
    ? customText.trim().length > 0
    : selectedOptions.length > 0;

  // For optional questions (like files-involved), allow skipping
  const isOptional = currentQuestion?.id === 'files-involved';

  return (
    <div className="font-mono">
      {/* Header */}
      <div className="mb-6 border-b border-[#1e293b] pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0f172a]">
              Configure {workflowName || workflowId}
            </h2>
            <p className="mt-1 text-xs text-[#1e293b] opacity-70">
              Answer the following questions to generate your command
            </p>
          </div>
          <span className="text-xs text-[#1e293b] opacity-60">
            step {currentStep + 1} / {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1 w-full bg-[#1e293b] opacity-20">
          <div
            className="h-full bg-[#1e293b] transition-all duration-300"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="mb-6">
          <div className="mb-2 text-xs text-[#1e293b] opacity-60 uppercase">
            {currentQuestion.header}
          </div>
          <h3 className="text-sm font-bold text-[#0f172a] mb-4">
            {currentQuestion.question}
          </h3>

          {isFreeText ? (
            /* Free text input */
            <textarea
              value={customText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Enter your response..."
              className="w-full h-32 border border-[#1e293b] bg-[#fffef5] px-3 py-2 text-sm text-[#0f172a] placeholder-[#1e293b] placeholder-opacity-40 outline-none focus:border-[#0f172a] resize-none"
              style={{ borderRadius: 0 }}
            />
          ) : (
            /* Options list */
            <div className="space-y-2">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOptions.includes(option.label);
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleOptionToggle(option.label)}
                    className={`w-full text-left border px-4 py-3 transition-colors ${
                      isSelected
                        ? 'border-[#0f172a] bg-[#0f172a] text-[#fefcf3]'
                        : 'border-[#1e293b] bg-[#fffef5] text-[#0f172a] hover:bg-[#fefcf3]'
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox/radio indicator */}
                      <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center border ${
                        isSelected
                          ? 'border-[#fefcf3] bg-[#fefcf3] text-[#0f172a]'
                          : 'border-[#1e293b]'
                      }`}>
                        {isSelected && (currentQuestion.multiSelect ? '\u2713' : '\u2022')}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-bold">{option.label}</div>
                        <div className={`text-xs mt-0.5 ${
                          isSelected ? 'opacity-80' : 'opacity-60'
                        }`}>
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.multiSelect && !isFreeText && (
            <p className="mt-2 text-xs text-[#1e293b] opacity-60">
              Select all that apply
            </p>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between border-t border-[#1e293b] pt-4">
        <div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="border border-[#1e293b] bg-transparent px-4 py-2 text-xs text-[#1e293b] hover:bg-[#1e293b] hover:text-[#fefcf3] transition-colors"
              style={{ borderRadius: 0 }}
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <button
              type="button"
              onClick={handleBack}
              className="border border-[#1e293b] bg-transparent px-4 py-2 text-xs text-[#1e293b] hover:bg-[#1e293b] hover:text-[#fefcf3] transition-colors"
              style={{ borderRadius: 0 }}
            >
              {'\u2190'} Back
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={!hasValidAnswer && !isOptional}
            className={`border px-4 py-2 text-xs transition-colors ${
              hasValidAnswer || isOptional
                ? 'border-[#0f172a] bg-[#0f172a] text-[#fefcf3] hover:bg-[#1e293b]'
                : 'border-[#1e293b] bg-[#1e293b] text-[#fefcf3] opacity-50 cursor-not-allowed'
            }`}
            style={{ borderRadius: 0 }}
          >
            {isLastStep ? 'Generate Command' : 'Next'} {'\u2192'}
          </button>
        </div>
      </div>
    </div>
  );
}
