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

## How It Works

1. **User selects agents** - Pick 1-5 agents from the team
2. **User provides focus notes** - Custom instructions for each agent
3. **Agents run in parallel** - All selected agents work simultaneously
4. **Quick results** - No heavy handoffs, just get it done

---

## Available Agents

Choose from these specialized agents:

| Agent | Use For |
|-------|---------|
| **fullstack-developer** | Implement features, fix code, build components |
| **api-designer** | Design API contracts, plan architecture |
| **sql-pro** | Database queries, schema changes, optimization |
| **code-reviewer** | Review code quality, security, best practices |
| **qa-expert** | Write tests, create test plans, verify quality |
| **security-auditor** | Security review, vulnerability scanning |
| **devops-engineer** | Deployment, CI/CD, monitoring setup |
| **dependency-manager** | Package updates, dependency audits |
| **documentation-engineer** | Write docs, improve clarity, API documentation |
| **refactoring-specialist** | Code cleanup, pattern improvements |
| **prompt-engineer** | Optimize AI prompts, improve agent definitions |

---

## Instructions

### Step 1: Select Agents (1-5 maximum)

Which agents do you need? (You can select up to 5)

- [ ] fullstack-developer
- [ ] api-designer
- [ ] sql-pro
- [ ] code-reviewer
- [ ] qa-expert
- [ ] security-auditor
- [ ] devops-engineer
- [ ] dependency-manager
- [ ] documentation-engineer
- [ ] refactoring-specialist
- [ ] prompt-engineer

### Step 2: Provide Focus Notes

For each selected agent, provide specific instructions:

**Example Format:**
```
Agent: code-reviewer
Focus: Review the authentication middleware in src/middleware.ts for security issues

Agent: security-auditor
Focus: Audit the Stripe webhook handler for signature verification and idempotency
```

### Step 3: Execution

I will:
1. Launch all selected agents **in parallel** using multiple Task tool calls in a single message
2. Each agent receives ONLY their specific focus instructions
3. Agents work independently and simultaneously
4. Return all results to you when complete

---

## Example Usage

### Example 1: Quick Component Fix

**Selected Agents:** fullstack-developer

**Focus:**
- fullstack-developer: Add loading state to the Button component in src/components/ui/Button.tsx

**Result:** One agent, quick fix, done in 5 minutes

---

### Example 2: Security Review

**Selected Agents:** code-reviewer, security-auditor

**Focus:**
- code-reviewer: Review error handling patterns in src/app/api/*
- security-auditor: Check for SQL injection vulnerabilities and input validation

**Result:** Two agents run in parallel, comprehensive security assessment

---

### Example 3: Full Stack Enhancement

**Selected Agents:** api-designer, fullstack-developer, qa-expert

**Focus:**
- api-designer: Design API contract for user profile update endpoint
- fullstack-developer: Implement the user profile update feature based on API design
- qa-expert: Write integration tests for the profile update flow

**Result:** Three agents collaborate in parallel, feature delivered end-to-end

---

### Example 4: Documentation Sprint

**Selected Agents:** documentation-engineer, code-reviewer

**Focus:**
- documentation-engineer: Create API documentation for all routes in src/app/api/
- code-reviewer: Review inline code comments and add missing JSDoc

**Result:** Documentation improved across codebase simultaneously

---

### Example 5: Optimization Pass

**Selected Agents:** sql-pro, devops-engineer, refactoring-specialist

**Focus:**
- sql-pro: Optimize the user query in src/lib/db/users.ts
- devops-engineer: Add performance monitoring to production deployment
- refactoring-specialist: Clean up repeated code patterns in src/components/

**Result:** Multiple optimization improvements in parallel

---

## Workflow

```
User runs /spot
    ↓
Select 1-5 agents
    ↓
Provide focus notes for each
    ↓
Claude launches all agents in PARALLEL
    ↓
Agents work independently
    ↓
All results returned to user
    ↓
Done!
```

---

## Output Format

Each agent will provide a brief report:

**Agent: [name]**
- **Summary:** What was done
- **Changes:** Files modified
- **Next Steps:** Any follow-up needed
- **Issues:** Blockers or questions

---

## Tips

- **Be specific** - Clear focus notes = better results
- **Parallel > Sequential** - Select multiple agents to save time
- **No dependencies** - Agents work independently, avoid tasks that depend on each other
- **Keep it focused** - For complex work, use `/feature` instead
- **Use liberally** - This is your fast-track tool for everyday work

---

## When to Escalate to `/feature`

If you find yourself needing:
- More than 5 agents
- Heavy coordination between agents
- Full QA, security review, and deployment pipeline
- Comprehensive documentation
- Complex multi-step workflows

→ Use `/feature` instead for full production workflow

---

## Ready?

Tell me:
1. Which agents you want (1-5)
2. Focus notes for each agent

I'll launch them all in parallel and return results quickly!
