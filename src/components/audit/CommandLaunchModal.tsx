'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { WorkflowAnswer } from '@/types/audit';

export interface CommandLaunchModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Name of the workflow being launched */
  workflowName: string;
  /** User's answers from the wizard */
  answers: WorkflowAnswer[];
  /** Pre-generated prompt text (optional) */
  generatedPrompt?: string;
}

/**
 * Generates a copyable command/prompt from workflow answers.
 */
function generateCopyableText(workflowName: string, answers: WorkflowAnswer[]): string {
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));

  const changeType = answerMap.get('change-type')?.selectedOptions[0] || 'General change';
  const affectedAreas = answerMap.get('affected-area')?.selectedOptions || [];
  const description = answerMap.get('description')?.customText || '';
  const filesInvolved = answerMap.get('files-involved')?.customText || '';

  // Format the command as a structured prompt
  const lines: string[] = [
    `/${workflowName.toLowerCase().replace(/\s+/g, '-')}`,
    '',
    '## Context',
    '',
    `**Change Type:** ${changeType}`,
  ];

  if (affectedAreas.length > 0) {
    lines.push(`**Affected Areas:** ${affectedAreas.join(', ')}`);
  }

  if (description) {
    lines.push('', '**Description:**', description);
  }

  if (filesInvolved) {
    lines.push('', '**Files Involved:**', filesInvolved);
  }

  return lines.join('\n');
}

export function CommandLaunchModal({
  isOpen,
  onClose,
  workflowName,
  answers,
  generatedPrompt,
}: CommandLaunchModalProps) {
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const copyableText = generatedPrompt || generateCopyableText(workflowName, answers);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyableText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [copyableText]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle click outside to close
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl border border-[#1e293b] bg-[#fefcf3] font-mono shadow-lg"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e293b] px-6 py-4">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-[#0f172a]">
              Launch {workflowName}
            </h2>
            <p className="mt-1 text-xs text-[#1e293b] opacity-70">
              Copy the command below and paste it into Claude Code
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border border-[#1e293b] text-[#1e293b] hover:bg-[#1e293b] hover:text-[#fefcf3] transition-colors"
            style={{ borderRadius: 0 }}
            aria-label="Close modal"
          >
            {'\u00d7'}
          </button>
        </div>

        {/* Instructions */}
        <div className="border-b border-[#1e293b] bg-[#fffef5] px-6 py-4">
          <div className="text-xs text-[#1e293b] opacity-60 uppercase mb-2">
            Instructions
          </div>
          <ol className="space-y-2 text-sm text-[#1e293b]">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center border border-[#1e293b] text-xs">
                1
              </span>
              <span>Copy the command below using the button</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center border border-[#1e293b] text-xs">
                2
              </span>
              <span>Open Claude Code in your terminal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center border border-[#1e293b] text-xs">
                3
              </span>
              <span>Paste the command and press Enter</span>
            </li>
          </ol>
        </div>

        {/* Command display */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-[#1e293b] opacity-60 uppercase">
              Generated Command
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`border px-3 py-1.5 text-xs transition-colors ${
                copied
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-[#0f172a] bg-[#0f172a] text-[#fefcf3] hover:bg-[#1e293b]'
              }`}
              style={{ borderRadius: 0 }}
            >
              {copied ? '\u2713 Copied!' : 'Copy to Clipboard'}
            </button>
          </div>

          <div
            className="border border-[#1e293b] bg-[#0f172a] p-4 overflow-x-auto"
            style={{ borderRadius: 0 }}
          >
            <pre className="text-sm text-[#fefcf3] whitespace-pre-wrap break-words">
              {copyableText}
            </pre>
          </div>
        </div>

        {/* Footer with tips */}
        <div className="border-t border-[#1e293b] px-6 py-4">
          <div className="text-xs text-[#1e293b] opacity-60">
            <strong>Tip:</strong> You can modify the prompt after pasting it in Claude Code
            to add more context or adjust the parameters.
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 border-t border-[#1e293b] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-[#1e293b] bg-transparent px-4 py-2 text-xs text-[#1e293b] hover:bg-[#1e293b] hover:text-[#fefcf3] transition-colors"
            style={{ borderRadius: 0 }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={`border px-4 py-2 text-xs transition-colors ${
              copied
                ? 'border-green-600 bg-green-600 text-white'
                : 'border-[#0f172a] bg-[#0f172a] text-[#fefcf3] hover:bg-[#1e293b]'
            }`}
            style={{ borderRadius: 0 }}
          >
            {copied ? '\u2713 Copied!' : 'Copy Command'}
          </button>
        </div>
      </div>
    </div>
  );
}
