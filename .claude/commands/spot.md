# Spot Command - Targeted Agent Work

Use this command for **fast, focused work** with 1-5 agents running in parallel.

## When to Use `/spot`

- ✅ Quick targeted improvements (not full feature delivery)
- ✅ Specific file or component changes
- ✅ Surgical fixes or enhancements
- ✅ Code review of specific areas
- ✅ Documentation updates
- ✅ Security audits of specific features
- ✅ Performance optimization of specific code

## When NOT to Use `/spot`

- ❌ Full feature implementation (use `/feature`)
- ❌ Complex multi-file refactoring (use `/feature`)
- ❌ Database migrations (use `/migration`)
- ❌ Bug fixes requiring investigation (use `/bugfix`)

---

## Workflow

```
User runs /spot
    ↓
Step 1: Select agents (AskUserQuestion with multiSelect)
    ↓
Step 2: Answer templated questions about the change
    ↓
Step 3: Orchestrator crafts implementation plan
    ↓
Step 4: Agents execute in parallel
    ↓
Results returned to user
    ↓
Done!
```

---

## Step 1: Agent Selection

**REQUIRED**: Use `AskUserQuestion` tool with `multiSelect: true` to present agent options.

```json
{
  "questions": [{
    "question": "Which agents do you want to work on this task? (Select 1-5)",
    "header": "Agents",
    "multiSelect": true,
    "options": [
      {"label": "fullstack-developer", "description": "Implement features, fix code, build components"},
      {"label": "api-designer", "description": "Design API contracts, plan architecture"},
      {"label": "sql-pro", "description": "Database queries, schema changes, optimization"},
      {"label": "code-reviewer", "description": "Review code quality, security, best practices"}
    ]
  }]
}
```

**Note**: Due to 4-option limit, ask follow-up questions for remaining agents if user selects "Other":
- qa-expert, security-auditor, devops-engineer
- dependency-manager, documentation-engineer, refactoring-specialist, prompt-engineer

---

## Step 2: Templated Questions

After agent selection, ask these questions using `AskUserQuestion`:

### Question Set

1. **What type of change is this?**
   - Options: New functionality, Bug fix, Refactor, Documentation, Performance, Security

2. **What area of the codebase does this affect?**
   - Options: Frontend (UI/components), Backend (API/server), Database, Infrastructure, Multiple areas

3. **Describe the change in one sentence:**
   - Free text input (user selects "Other")

4. **What files or components are involved?** (if known)
   - Free text input (user selects "Other")

---

## Step 3: Orchestrator Creates Implementation Plan

After gathering answers, invoke the **orchestrator** agent via Task tool:

```
Prompt to orchestrator:
"Based on the following user requirements, create a focused implementation plan for the selected agents:

Selected Agents: [list from Step 1]
Change Type: [answer 1]
Affected Area: [answer 2]
Description: [answer 3]
Files/Components: [answer 4]

Create a brief implementation plan with:
1. Scope - What exactly needs to be done
2. Agent assignments - What each selected agent should focus on
3. File targets - Which files will be touched
4. Success criteria - How we know it's done

IMPORTANT: If you need clarification on any aspect, do NOT ask the user. Instead, consult the appropriate agent from .claude/agents/ and use their recommendation. Document any decisions made this way in the plan."
```

---

## Step 4: Parallel Execution

Launch all selected agents **in parallel** using multiple Task tool calls in a single message.

Each agent receives:
- Their specific assignment from the orchestrator's plan
- Relevant context and file paths
- Success criteria for their portion

---

## Clarification Protocol

**CRITICAL**: When clarification is needed during planning:

1. **Do NOT** ask the user
2. **Instead**, consult the most relevant agent in `.claude/agents/`:
   - Technical decisions → `fullstack-developer` or `api-designer`
   - Security concerns → `security-auditor`
   - Testing approach → `qa-expert`
   - Database choices → `sql-pro`
   - Code quality → `code-reviewer`
   - Infrastructure → `devops-engineer`
   - Documentation → `documentation-engineer`
3. **Document** the agent consulted and their recommendation in the plan
4. **Proceed** with the agent's decision

---

## Output Format

Each agent provides a brief report:

**Agent: [name]**
- **Summary:** What was done
- **Changes:** Files modified
- **Next Steps:** Any follow-up needed
- **Issues:** Blockers or questions

---

## Example Flow

### User runs `/spot`

**Step 1 - Agent Selection:**
```
Claude uses AskUserQuestion:
"Which agents do you want?" [multiSelect: true]
User selects: code-reviewer, security-auditor
```

**Step 2 - Templated Questions:**
```
Claude asks:
- Change type? → "Security"
- Affected area? → "Backend (API/server)"
- Description? → "Review auth middleware for vulnerabilities"
- Files? → "src/middleware.ts, src/app/api/*"
```

**Step 3 - Orchestrator Plans:**
```
Orchestrator creates plan:
- code-reviewer: Review error handling and input validation
- security-auditor: Check for OWASP vulnerabilities, auth bypass
```

**Step 4 - Parallel Execution:**
```
Both agents run simultaneously, return results
```

---

## Tips

- **Be specific** in your description for better plans
- **Select relevant agents** - quality over quantity
- **Trust agent decisions** - they're consulted for clarification
- **Keep it focused** - for complex work, use `/feature` instead
