# BigTurbo — Multi-Agent SaaS Workflow

A structured multi-agent workflow system for building SaaS applications with **Next.js**, **Neon/Postgres**, **Stripe**, and **Clerk**.

## What is this?

This repo provides a team of 10 specialized AI agents and operational workflows for building and maintaining SaaS applications. Instead of using a single AI assistant for everything, tasks are routed through specialized agents with clear ownership and handoff protocols.

**Built for [Claude Code](https://docs.anthropic.com/claude-code)** — Uses subagents for parallel execution.

## The Agent Team

| Agent | Responsibility |
|-------|---------------|
| **fullstack-developer** | End-to-end feature implementation |
| **api-designer** | API contracts, server actions, error models |
| **sql-pro** | Migrations, indexes, query performance |
| **code-reviewer** | Code quality, architecture review |
| **qa-expert** | Tests, test plans, regression coverage |
| **security-auditor** | Auth, tenant isolation, payment security |
| **devops-engineer** | Deployment, observability, runbooks |
| **dependency-manager** | Updates, CVEs, bundle optimization |
| **documentation-engineer** | User docs, support docs |
| **refactoring-specialist** | Code cleanup (no behavior changes) |

## Quick Start

In Claude Code, use the slash commands:

```
/feature   — Implement a new feature (full workflow)
/bugfix    — Fix a bug (streamlined workflow)
/migration — Database schema changes
/maintenance — Weekly cleanup and updates
```

Each command includes a full tutorial and will orchestrate subagents automatically.

## Project Structure

```
.claude/
├── agents/          # 10 specialized agent definitions (subagents)
└── commands/        # Workflow tutorials (slash commands)
    ├── feature.md      →  /feature
    ├── bugfix.md       →  /bugfix
    ├── migration.md    →  /migration
    └── maintenance.md  →  /maintenance

docs/ai/
├── AGENT_CHARTER.md    # Agent ownership & rules
├── HANDOFF_TEMPLATE.md # Standard handoff format
├── WORKFLOWS.md        # Detailed workflow definitions
└── CHECKLISTS.md       # Clerk/Next.js checklists
```

## Stack

- **Next.js** (App Router) — React framework
- **Neon/Postgres** — Serverless Postgres database
- **Clerk** — Authentication and user management

## Documentation

- [Agent Charter](docs/ai/AGENT_CHARTER.md) — Who does what, escalation rules, stop rules
- [Handoff Template](docs/ai/HANDOFF_TEMPLATE.md) — Standard format for task handoffs
- [Workflows](docs/ai/WORKFLOWS.md) — Step-by-step agent sequences
- [Checklists](docs/ai/CHECKLISTS.md) — Stack-specific security and quality checks

## Agent Source

Agents are sourced from [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents).
