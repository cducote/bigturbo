import fs from 'fs/promises';
import path from 'path';

export const IMPLEMENTATION_PLAN_MD_PATH = 'docs/audit/IMPLEMENTATION_PLAN.md';

export interface TraceSummary {
  trace_id: string;
  goal: string;
  date?: string;
  tool_usage?: Record<string, number>;
  outcome?: string;
  [key: string]: unknown;
}

export interface PromptIssue {
  symptom?: string;
  root_cause?: string;
  recommendation?: string;
}

export interface PromptDiagnosis {
  issues: PromptIssue[];
}

export interface RefactorTranslation {
  files_to_change: string[];
  new_constraints: string[];
}

export interface SynthesisInput {
  traceSummary: TraceSummary;
  diagnosis: PromptDiagnosis;
  translation: RefactorTranslation;
  generatedAt?: string;
}

function toDate(traceDate?: string, generatedAt?: string): string {
  if (traceDate && traceDate.trim()) return traceDate;
  if (generatedAt && generatedAt.trim()) return generatedAt;
  return new Date().toISOString().slice(0, 10);
}

function formatList(items: (string | undefined)[], fallback = '- None provided'): string {
  const cleaned = items
    .map(item => (item ? item.trim() : ''))
    .filter(item => item.length > 0);
  return cleaned.length > 0 ? cleaned.map(item => `- ${item}`).join('\n') : fallback;
}

function dedupe(items: (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    if (!item) continue;
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

export function synthesizeImplementationPlan({
  traceSummary,
  diagnosis,
  translation,
  generatedAt,
}: SynthesisInput): string {
  const date = toDate(traceSummary.date, generatedAt);

  const observedIssues = formatList((diagnosis?.issues || []).map(issue => issue.symptom));
  const rootCauses = formatList(dedupe((diagnosis?.issues || []).map(issue => issue.root_cause)));

  const proposedSections = (() => {
    const issues = diagnosis?.issues || [];
    if (issues.length === 0) return '### 1. No proposed changes provided';

    return issues
      .map((issue, index) => {
        const title = issue.recommendation || issue.symptom || `Change ${index + 1}`;
        const lines = [
          issue.symptom ? `- Symptom: ${issue.symptom}` : undefined,
          issue.root_cause ? `- Root Cause: ${issue.root_cause}` : undefined,
          issue.recommendation ? `- Recommendation: ${issue.recommendation}` : undefined,
        ].filter(Boolean);

        return `### ${index + 1}. ${title}\n${lines.join('\n')}`;
      })
      .join('\n\n');
  })();

  const additionalConstraints = formatList(translation?.new_constraints || [], '');
  const constraintBlock = additionalConstraints ? `\n### Additional Constraints\n${additionalConstraints}\n` : '';

  const filesToModify = formatList(translation?.files_to_change || []);

  const stepLines = (() => {
    const steps: string[] = [];
    (translation?.files_to_change || []).forEach((filePath, idx) => {
      steps.push(`${idx + 1}. Update ${filePath} to apply the planned prompt or config changes.`);
    });

    if ((translation?.new_constraints || []).length > 0) {
      steps.push(
        `${steps.length + 1}. Document and enforce these constraints: ${translation.new_constraints.join('; ')}.`
      );
    }

    if (steps.length === 0) {
      steps.push('1. Apply recommended prompt and configuration updates derived from the audit findings.');
    }

    return steps.join('\n');
  })();

  const acceptance = [
    '- >=1 post-change run shows a PLAN section emitted before first tool call.',
    '- Tool calls per task decrease versus the audited trace.',
    '- Task success rate does not drop (binary success flag unchanged or improved).',
  ].join('\n');

  const constraintSection = constraintBlock ? `${constraintBlock}\n` : '';

  const guardrails = `Guardrails:\n- No runtime code changes; prompt/config files only.\n- No package upgrades or installs.\n- No infra changes, secrets, or environment edits.\n- Stop and ask if scope is unclear.`;

  return `# Audit Implementation Plan

## Source Trace
- Trace ID: ${traceSummary.trace_id}
- Goal: ${traceSummary.goal}
- Date: ${date}

## Observed Issues
${observedIssues}

## Root Causes (Prompt-Level)
${rootCauses}

## Proposed Changes
${proposedSections}
${constraintSection}## Files to Modify
${filesToModify}

## Claude Code Execution Prompt

${guardrails}

/plop
Goal: Improve ${traceSummary.goal} based on audit findings.

Steps:
${stepLines}

Acceptance Criteria (measurable):
${acceptance}
`;
}

export async function writeImplementationPlan(markdown: string): Promise<string> {
  const planPath = path.join(process.cwd(), IMPLEMENTATION_PLAN_MD_PATH);
  await fs.mkdir(path.dirname(planPath), { recursive: true });
  await fs.writeFile(planPath, markdown, 'utf-8');
  return planPath;
}
