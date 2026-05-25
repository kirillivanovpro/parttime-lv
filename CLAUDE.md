@AGENTS.md
@.claude/skills/emil-design-eng/SKILL.md

## gstack — Available Slash Commands

### Planning & Review
- `/plan-ceo-review` — Review a plan from a CEO/product perspective: market fit, user value, business risk
- `/plan-eng-review` — Review a plan from an engineering perspective: architecture, feasibility, edge cases
- `/review` — Code review for the current branch or a specific PR number
- `/office-hours` — Open-ended Q&A / advisory session; ask anything about the codebase or decisions

### Shipping
- `/ship` — End-to-end ship sequence: build check → tests → commit → push → PR
- `/autoplan` — Automatically generate an implementation plan from a task description
- `/cso` — Chief Shipping Officer mode: cut scope ruthlessly, ship the smallest thing that works

### Quality & Safety
- `/qa` — Full QA pass: build, lint, type-check, and smoke-test critical paths
- `/qa-only` — Run QA checks without making any code changes
- `/careful` — Extra-cautious mode: confirm before every file write or destructive action
- `/freeze` — Freeze mode: read-only analysis, no edits under any circumstances
- `/guard` — Guard mode: watch for regressions while making changes

### Investigation & Learning
- `/investigate` — Deep-dive investigation into a bug, behaviour, or codebase area
- `/retro` — Retrospective on recent changes: what went well, what to improve
- `/learn` — Explain a concept, pattern, or piece of the codebase in depth

### Documentation
- `/document-release` — Generate a release changelog from recent commits or a PR range
- `/document-generate` — Generate or update docs (README, API reference, inline comments) for changed code
