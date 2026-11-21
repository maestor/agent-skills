import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = 'maestor/agent-skills';
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const stat = path => lstatSync(path, { throwIfNoEntry: false });

export function validate(config, skillsRoot) {
  const { consumers, install } = config;
  if (!Array.isArray(consumers) || !consumers.length || new Set(consumers).size !== consumers.length ||
      !consumers.every(repo => typeof repo === 'string' && slug.test(repo))) {
    throw new Error('Expected unique repository names in distribution.json consumers');
  }
  const skills = readdirSync(skillsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory()).map(entry => entry.name);
  for (const name of skills) {
    if (!slug.test(name) || !stat(join(skillsRoot, name, 'SKILL.md'))?.isFile()) {
      throw new Error(`Invalid skill directory: ${name}`);
    }
    if (!Object.hasOwn(install, name)) throw new Error(`Choose install targets for ${name} (an empty list is valid)`);
  }
  for (const [name, targets] of Object.entries(install)) {
    if (!skills.includes(name) || !Array.isArray(targets) || new Set(targets).size !== targets.length ||
        !targets.every(repo => consumers.includes(repo))) throw new Error(`Invalid install targets for ${name}`);
  }
}

function legacyHash(directory) {
  // skills-lock v1 hashes paths in locale order followed by the original bytes.
  const files = readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => join(entry.parentPath, entry.name).slice(directory.length + 1))
    .sort((a, b) => a.localeCompare(b));
  const hash = createHash('sha256');
  for (const path of files) hash.update(path).update(readFileSync(join(directory, path)));
  return hash.digest('hex');
}

function sameTree(a, b) {
  const diff = spawnSync('git', ['diff', '--no-index', '--quiet', '--no-ext-diff', '--no-textconv', '--', a, b]);
  if (diff.status === 0) return true;
  if (diff.status === 1) return false;
  throw diff.error ?? new Error(`Cannot compare installed skill: ${diff.stderr}`);
}

export function sync({ config, repo, checkout, bundle, sourceRoot = root }) {
  if (!config.consumers.includes(repo)) throw new Error(`Unknown consumer: ${repo}`);
  const lockPath = join(checkout, 'skills-lock.json');
  if (!stat(lockPath)?.isFile()) throw new Error(`Expected a regular lockfile at ${lockPath}`);
  const lock = json(lockPath);
  if (![1, 2].includes(lock.version) || !lock.skills || typeof lock.skills !== 'object' || Array.isArray(lock.skills)) {
    throw new Error('Expected skills-lock.json version 1 or 2 with skill entries');
  }
  const packaged = json(join(bundle, 'skills-lock.json')).skills;
  for (const path of [join(checkout, '.agents'), join(checkout, '.agents/skills')]) {
    const existing = stat(path);
    if (existing && !existing.isDirectory()) throw new Error(`Expected a directory at ${path}`);
  }

  const changed = [];
  for (const [name, targets] of Object.entries(config.install)) {
    const previous = lock.skills[name];
    if (previous?.source !== source && !targets.includes(repo)) continue;
    if (previous && previous.source !== source) throw new Error(`${name} already belongs to ${previous.source}`);
    const from = join(bundle, '.agents/skills', name);
    const to = join(checkout, '.agents/skills', name);
    if (!stat(join(from, 'SKILL.md'))?.isFile() || !packaged[name]?.computedHash) {
      throw new Error(`The skills CLI did not package ${name} under its directory name`);
    }
    const installed = stat(to);
    if (installed && (!installed.isDirectory() || !previous)) throw new Error(`Conflicting installation at ${to}`);
    const computedHash = lock.version === 1 ? legacyHash(from) : packaged[name].computedHash;
    const contentMatches = installed && sameTree(from, to);
    if (contentMatches && previous.computedHash === computedHash) continue;

    const entry = { ...previous, source, sourceType: 'github', skillPath: `skills/${name}/SKILL.md`, computedHash };
    if (lock.version === 2) {
      // Stable across unrelated pushes, including while a consumer PR is open.
      entry.commit = execFileSync('git', ['log', '-1', '--format=%H', 'HEAD', '--', `skills/${name}`],
        { cwd: sourceRoot, encoding: 'utf8' }).trim();
      if (!/^[a-f0-9]{40}$/.test(entry.commit)) throw new Error(`No committed revision for ${name}`);
      if (entry.ref) entry.ref = entry.commit;
    }
    if (!contentMatches) {
      if (installed) rmSync(to, { recursive: true });
      mkdirSync(to, { recursive: true });
      cpSync(from, to, { recursive: true });
    }
    lock.skills[name] = entry;
    changed.push(name);
  }
  if (changed.length) writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
  return changed;
}

if (import.meta.main) {
  const [command, repo, checkout, bundle] = process.argv.slice(2);
  const config = json(join(root, 'distribution.json'));
  validate(config, join(root, 'skills'));
  if (repo && !config.consumers.includes(repo)) throw new Error(`Unknown consumer: ${repo}`);
  if (command === 'consumers') {
    console.log(JSON.stringify(repo ? [repo] : config.consumers));
  } else if (command === 'sync') {
    const changes = sync({ config, repo, checkout: resolve(checkout), bundle: resolve(bundle) });
    console.log(changes.join(', '));
  } else {
    throw new Error('Use consumers [repo] or sync <repo> <consumer-checkout> <staging-directory>');
  }
}
