# agent-skills

Reusable agent skills for especially JavaScript/TypeScript infrastructure, including web apps, mobile apps, APIs, and other product codebases that benefit from shared engineering workflows.

## Skills

| Skill                      | Use for                                                           | Key bias                                                | Project type      |
| -------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------- | ----------------- |
| `clean-code-typescript`    | Writing, refactoring, and reviewing TypeScript and TSX            | Express domain rules in names, types, and functions     | backend, frontend |
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

## Distribution to consumer repositories

A push to `main` that changes skills or their distribution configuration runs **Distribute skills**. Each of the seven repositories listed in [distribution.json](./distribution.json) receives updates for the skills it has installed from `maestor/agent-skills`. Angular and Expo skills continue to be managed manually.

For each affected consumer, the workflow opens or refreshes one PR on `automation/sync-maestor-skills`. The PR mentions `@maestor` on creation. A new commit on an existing PR triggers a mention in a comment. Review the consumer's usual checks and **Squash and merge** on GitHub. An up-to-date consumer gets no PR.

### Adding a skill

1. Add `skills/<name>/SKILL.md` and any supporting files. Use the same skill name in the frontmatter and the directory.
2. Choose the repositories that need the first installation. Add an entry to `install` in `distribution.json` in the same PR. For example, `"pwa-offline-testing": ["finnish-national-parks-ui", "fantrax-stats-parser-ui"]` installs a new skill in the two PWAs. Use `[]` for a skill available for manual installation. Source PR validation checks the selection.
3. Merge the source PR. A listed target gets the skill even when it has no existing lock entry for it. Once installed, its lock entry also selects it for future updates. To retire a skill from a consumer, remove the target from this list and remove the installation in the consumer.

### One-time GitHub setup

1. In your personal GitHub settings, create a **private GitHub App** owned by `maestor`. Use this repository's URL for the homepage and disable the webhook. Under **Repository permissions**, grant **Contents** and **Pull requests** read and write access. GitHub includes metadata read access. [Register a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)
2. Under **Install App**, choose your account and **Only select repositories**. Select the seven consumers in `distribution.json`. The source workflow reads its own repository using its built-in token.
3. In the App settings, copy the **Client ID** and generate a private key. Open the source repository's **Settings → Secrets and variables → Actions**. Add a repository **variable** named `SKILLS_APP_CLIENT_ID` and a repository **secret** named `SKILLS_APP_PRIVATE_KEY` containing the entire PEM file, including its header, footer and line breaks. Configure these **before merging the workflow** if you want the first push to run immediately. [GitHub App authentication in Actions](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow)

### Previewing or retrying

On the source repository's **Actions → Distribute skills → Run workflow** screen, choose `main`. Leave **Preview changes without publishing PRs** checked for a read-only run. Enter a consumer name to target one repository, or leave it empty for all. The job summaries list changed skills and paths. Clear the preview checkbox to publish outstanding updates after fixing a failed run or configuring the App after merge.

The workflow uses a pinned `skills` CLI to stage Codex installations from the source checkout. It syncs the selected directories under `.agents/skills/` and their entries in `skills-lock.json`, preserving the consumer's v1 or v2 format. Each repository runs independently. A retry compares the latest source and consumer default branches.

## Manual updates

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
