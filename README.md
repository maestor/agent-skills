# agent-skills

Reusable agent skills for especially JavaScript/TypeScript infrastructure, including web apps, mobile apps, APIs, and other product codebases that benefit from shared engineering workflows.

## Skills

| Skill                      | Use for                                                           | Key bias                                                | Project type      |
| -------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------- | ----------------- |
| `intelligence-testing`     | Behavior-first TDD for real user, API, and operator flows         | Highest-signal failing test first                       | backend, frontend |
| `mutation-testing`         | Effective backend mutation testing with incremental reruns        | Survived, no-coverage, and timeout mutants are failures | backend           |
| `api-contract-sync`        | Keeping backend contracts, generated types, and consumers aligned | Source of truth first, no drift                         | backend, frontend |
| `local-first-verification` | Choosing the cheapest honest local verification path              | Escalate only when needed                               | backend, frontend |
| `browser-ui-verification`  | Browser-validated web UI changes, especially themes and dark mode | Real browser before handoff                             | web frontend      |
| `accessibility-first-ui`   | Building accessible web and mobile UI from the start              | Accessibility is behavior, not garnish                  | frontend          |
| `project-documentation`    | Keeping README and docs current, concise, and project-specific    | Docs change with the workflow                           | backend, frontend |
| `git-pr-workflow`          | Standardizing branch, review, verify, commit, push, PR notes, and post-merge cleanup | Review pause; safe cleanup leaves latest `main`         | backend, frontend |

## Repository Layout

| Path                                     | Purpose                                          |
| ---------------------------------------- | ------------------------------------------------ |
| `skills/<skill-name>/SKILL.md`           | Main workflow and trigger description            |
| `skills/<skill-name>/agents/openai.yaml` | UI metadata for the skill                        |
| `skills/<skill-name>/references/`        | Optional deeper guidance loaded only when needed |

## Install

The primary install path is the standard [`skills.sh`](https://skills.sh/docs/cli) CLI, which works across popular AI coding agents.

Install one skill:

```bash
npx skills add maestor/agent-skills --skill <skill-name>
```

Example:

```bash
npx skills add maestor/agent-skills --skill intelligence-testing
```

If you want the full collection, use the repository itself:

```bash
npx skills add maestor/agent-skills
```

## Update Installed Skills

If a consumer has already installed a skill from this repository, they can refresh it with the `skills` CLI update command.
The CLI updates one scope at a time, so if you use both project and global installs, run the project and global examples separately.

Update one installed skill by name:

```bash
npx skills update intelligence-testing
```

Update multiple installed skills by name:

```bash
npx skills update intelligence-testing git-pr-workflow
```

Update all installed project skills in the current repository:

```bash
npx skills update -p -y
```

According to the `skills.sh` FAQ, the ecosystem works with popular agents including Claude Code, Cursor, Windsurf, and others. Check your agent's own docs for exact local integration details.
