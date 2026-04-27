# agent-skills

Reusable agent skills for especially JavaScript/TypeScript infrastructure, including web apps, mobile apps, APIs, and other product codebases that benefit from shared engineering workflows.

## Skills

| Skill | Use for | Key bias | Project type |
| --- | --- | --- | --- |
| `intelligence-testing` | Behavior-first TDD for real user, API, and operator flows | Highest-signal failing test first | backend, frontend |
| `api-contract-sync` | Keeping backend contracts, generated types, and consumers aligned | Source of truth first, no drift | backend, frontend |
| `local-first-verification` | Choosing the cheapest honest local verification path | Escalate only when needed | backend, frontend |
| `accessibility-first-ui` | Building accessible web and mobile UI from the start | Accessibility is behavior, not garnish | frontend |

## Repository Layout

| Path | Purpose |
| --- | --- |
| `skills/<skill-name>/SKILL.md` | Main workflow and trigger description |
| `skills/<skill-name>/agents/openai.yaml` | UI metadata for the skill |
| `skills/<skill-name>/references/` | Optional deeper guidance loaded only when needed |

## Install

The primary install path is the standard [`skills.sh`](https://skills.sh/docs/cli) CLI, which works across popular AI coding agents.

Install one skill:

```bash
npx skills add maestor/agent-skills --skill intelligence-testing
```

Examples:

```bash
npx skills add maestor/agent-skills --skill api-contract-sync
npx skills add maestor/agent-skills --skill local-first-verification
npx skills add maestor/agent-skills --skill accessibility-first-ui
```

If you want the full collection, use the repository itself:

```bash
npx skills add maestor/agent-skills
```

According to the `skills.sh` FAQ, the ecosystem works with popular agents including Claude Code, Cursor, Windsurf, and others. Check your agent's own docs for exact local integration details.
