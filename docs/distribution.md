# Distribution to consumer repositories

A push to `main` that changes skills or their distribution configuration runs **Distribute skills**. Each of the seven repositories listed in [distribution.json](../distribution.json) receives updates for the skills it has installed from `maestor/agent-skills`. Angular and Expo skills continue to be managed manually.

For each affected consumer, the workflow opens or refreshes one PR on `automation/sync-maestor-skills`. The PR mentions `@maestor` on creation. A new commit on an existing PR triggers a mention in a comment. Review the consumer's usual checks and **Squash and merge** on GitHub. An up-to-date consumer gets no PR.

## Adding a skill

1. Add `skills/<name>/SKILL.md` and any supporting files. Use the same skill name in the frontmatter and the directory.
2. Choose the repositories that need the first installation. Add an entry to `install` in `distribution.json` in the same PR. For example, `"pwa-offline-testing": ["finnish-national-parks-ui", "fantrax-stats-parser-ui"]` installs a new skill in the two PWAs. Use `[]` for a skill available for manual installation. Source PR validation checks the selection.
3. Merge the source PR. A listed target gets the skill even when it has no existing lock entry for it. Once installed, its lock entry also selects it for future updates. To retire a skill from a consumer, remove the target from this list and remove the installation in the consumer.

## One-time GitHub setup

1. In your personal GitHub settings, create a **private GitHub App** owned by `maestor`. Use this repository's URL for the homepage and disable the webhook. Under **Repository permissions**, grant **Contents** and **Pull requests** read and write access. GitHub includes metadata read access. [Register a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)
2. Under **Install App**, choose your account and **Only select repositories**. Select the seven consumers in `distribution.json`. The source workflow reads its own repository using its built-in token.
3. In the App settings, copy the **Client ID** and generate a private key. Open the source repository's **Settings → Secrets and variables → Actions**. Add a repository **variable** named `SKILLS_APP_CLIENT_ID` and a repository **secret** named `SKILLS_APP_PRIVATE_KEY` containing the entire PEM file, including its header, footer and line breaks. Configure these **before merging the workflow** if you want the first push to run immediately. [GitHub App authentication in Actions](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow)

## Previewing or retrying

On the source repository's **Actions → Distribute skills → Run workflow** screen, choose `main`. Leave **Preview changes without publishing PRs** checked for a read-only run. Enter a consumer name to target one repository, or leave it empty for all. The job summaries list changed skills and paths. Clear the preview checkbox to publish outstanding updates after fixing a failed run or configuring the App after merge.

The workflow uses a pinned `skills` CLI to stage Codex installations from the source checkout. It syncs the selected directories under `.agents/skills/` and their entries in `skills-lock.json`, preserving the consumer's v1 or v2 format. Each repository runs independently. A retry compares the latest source and consumer default branches.
