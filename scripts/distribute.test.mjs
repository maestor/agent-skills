import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { sync, validate } from './distribute.mjs';

const upstream = 'maestor/agent-skills';
const config = {
  consumers: ['mobile', 'web'],
  install: { shared: [], 'web-only': ['web'] },
};
const thirdParty = { source: 'expo/skills', sourceType: 'github', computedHash: 'manually-managed' };

function write(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}

function fixture(t, version, repo) {
  const directory = mkdtempSync(join(tmpdir(), 'distribute-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const checkout = join(directory, 'consumer');
  const sourceRoot = join(directory, 'source');
  const bundle = join(directory, 'bundle');
  const packaged = {};
  for (const name of Object.keys(config.install)) {
    const files = { 'SKILL.md': name, 'references/guide.md': 'new guide' };
    for (const [path, content] of Object.entries(files)) {
      write(join(sourceRoot, 'skills', name, path), content);
      write(join(bundle, '.agents/skills', name, path), content);
    }
    packaged[name] = { computedHash: 'v2-hash-from-cli-' + name };
  }
  const git = (...args) => execFileSync('git', ['-C', sourceRoot, ...args], { encoding: 'utf8' }).trim();
  git('init', '-q');
  git('add', 'skills');
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'Initial skills');
  write(join(bundle, 'skills-lock.json'), JSON.stringify({ version: 2, skills: packaged }));
  const lockPath = join(checkout, 'skills-lock.json');
  write(lockPath, JSON.stringify({ version, skills: { shared: { source: upstream }, 'expo-ui': thirdParty } }));
  const installed = name => join(checkout, '.agents/skills', name);
  write(join(installed('shared'), 'SKILL.md'), 'shared');
  write(join(installed('shared'), 'references/obsolete.md'), 'removed upstream');
  write(join(installed('expo-ui'), 'SKILL.md'), 'installed by maintainer');
  return {
    apply: () => sync({ config, repo, checkout, bundle, sourceRoot }),
    lockPath, installed, sourceRoot, checkout, commit: git('rev-parse', 'HEAD'),
  };
}

for (const [version, repo] of [[1, 'mobile'], [2, 'web']]) {
  test(`reconciles v${version} ${repo} and preserves third-party installations`, t => {
    const { apply, lockPath, installed, checkout, commit } = fixture(t, version, repo);
    assert.deepEqual(apply(), repo === 'web' ? ['shared', 'web-only'] : ['shared']);
    const raw = readFileSync(lockPath, 'utf8');
    const lock = JSON.parse(raw);
    assert.equal(lock.version, version);
    assert.equal(readFileSync(join(installed('shared'), 'references/guide.md'), 'utf8'), 'new guide');
    assert.throws(() => readFileSync(join(installed('shared'), 'references/obsolete.md')), { code: 'ENOENT' });
    if (version === 1) {
      const legacy = createHash('sha256').update('references/guide.mdnew guideSKILL.mdshared').digest('hex');
      assert.equal(lock.skills.shared.computedHash, legacy);
      assert.equal(lock.skills['web-only'], undefined);
      assert.throws(() => readFileSync(join(installed('web-only'), 'SKILL.md')), { code: 'ENOENT' });
    } else {
      assert.equal(lock.skills.shared.computedHash, 'v2-hash-from-cli-shared');
      assert.equal(lock.skills['web-only'].commit, commit);
      assert.equal(lock.skills['web-only'].source, upstream);
      assert.equal(readFileSync(join(installed('web-only'), 'SKILL.md'), 'utf8'), 'web-only');
    }
    assert.deepEqual(lock.skills['expo-ui'], thirdParty);
    assert.equal(readFileSync(join(installed('expo-ui'), 'SKILL.md'), 'utf8'), 'installed by maintainer');
    assert.throws(() => readFileSync(join(checkout, '.claude/skills/shared/SKILL.md')), { code: 'ENOENT' });
    assert.deepEqual(apply(), []);
    assert.equal(readFileSync(lockPath, 'utf8'), raw);
  });
}

test('requires a target decision for each skill and rejects unknown consumers', t => {
  const { sourceRoot } = fixture(t, 1, 'web');
  const validateInstall = install => validate({ ...config, install }, join(sourceRoot, 'skills'));
  validateInstall(config.install);
  assert.throws(() => validateInstall({ shared: [] }), /Choose install targets for web-only/);
  assert.throws(() => validateInstall({ ...config.install, shared: ['unknown'] }), /Invalid install targets/);
});

test('reports a target name already owned by a third party', t => {
  const { apply, lockPath } = fixture(t, 1, 'web');
  write(lockPath, JSON.stringify({ version: 1, skills: { 'web-only': thirdParty } }));
  assert.throws(apply, /web-only already belongs to expo\/skills/);
});
