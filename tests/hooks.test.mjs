// 훅 테스트: guard-bash(위험한 git 명령 확인)와 verify-stop(완료 전 검증). 실행: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const hooks = path.join(here, '..', 'skywith', 'hooks');
const require = createRequire(import.meta.url);
const guard = require(path.join(hooks, 'guard-bash.js'));

const kinds = (cmd) => guard.findRisks(cmd, '/repo').map((r) => r.kind);

test('guard: force push 변형을 모두 잡는다', () => {
  for (const cmd of [
    'git push --force',
    'git push -f origin main',
    'git push --force-with-lease=main origin main',
    'git push -uf origin feat',
    'git push origin +main',
    'cd sub && git push --force',
    'FOO=1 git -c user.name=x push -f',
    'git status; git push origin main --force',
  ]) {
    assert.deepEqual(kinds(cmd).filter((k) => k !== 'push'), ['force-push'], cmd);
  }
});

test('guard: reset --hard를 잡고, 일반 reset은 통과시킨다', () => {
  assert.deepEqual(kinds('git reset --hard HEAD~1'), ['reset-hard']);
  assert.deepEqual(kinds('git -C ../other reset --hard'), ['reset-hard']);
  assert.deepEqual(kinds('git reset --soft HEAD~1'), []);
  assert.deepEqual(kinds('git reset HEAD file.txt'), []);
});

test('guard: 따옴표 안의 글자·다른 명령은 잡지 않는다', () => {
  assert.deepEqual(kinds('git commit -m "docs: git push --force 금지, reset --hard 금지"'), []);
  assert.deepEqual(kinds("echo 'git reset --hard'"), []);
  assert.deepEqual(kinds('git log --oneline -f'), []);
  assert.deepEqual(kinds('npm run push -- --force'), []);
  assert.deepEqual(kinds('git push origin main'), ['push']);
});

test('guard: cd·-C로 바뀐 폴더와 remote를 따라간다', () => {
  const [a] = guard.findRisks('cd pkg && git push upstream main', '/repo');
  assert.equal(a.cwd, path.resolve('/repo', 'pkg'));
  assert.equal(a.remote, 'upstream');
  const [b] = guard.findRisks('git -C /elsewhere push', '/repo');
  assert.equal(b.cwd, path.resolve('/elsewhere'));
  assert.equal(b.remote, null);
});

test('guard: PUBLIC이거나 확인 못 한 레포 push에 사유가 붙는다', () => {
  assert.equal(guard.decide('git push origin main', '/repo', () => 'PRIVATE'), null);
  assert.match(guard.decide('git push origin main', '/repo', () => null), /공개로 간주/);
  assert.match(guard.decide('git push origin main', '/repo', () => 'PUBLIC'), /PUBLIC/);
  assert.match(guard.decide('git push -f', '/repo', () => 'PRIVATE'), /force push/);
  assert.equal(guard.decide('git status && npm test', '/repo', () => 'PUBLIC'), null);
});

test('guard: 스크립트로 실행하면 ask 결정을 JSON으로 낸다', () => {
  const run = (command) =>
    spawnSync('node', [path.join(hooks, 'guard-bash.js')], {
      input: JSON.stringify({ tool_name: 'Bash', tool_input: { command }, cwd: os.tmpdir() }),
      encoding: 'utf8',
    });
  const risky = run('git reset --hard');
  assert.equal(risky.status, 0);
  const out = JSON.parse(risky.stdout).hookSpecificOutput;
  assert.equal(out.hookEventName, 'PreToolUse');
  assert.equal(out.permissionDecision, 'ask');
  assert.match(out.permissionDecisionReason, /reset --hard/);
  const safe = run('git status');
  assert.equal(safe.status, 0);
  assert.equal(safe.stdout, '');
});

const MAC_OD = '/Users/u/Library/CloudStorage/OneDrive-학교/WorkSpace/app';
const WIN_OD = 'C:\\Users\\u\\OneDrive - 학교\\app';
const ICLOUD = '/Users/u/Library/Mobile Documents/com~apple~CloudDocs/WorkSpace_M';

test('guard: 클라우드 폴더를 알아본다', () => {
  for (const p of [MAC_OD, WIN_OD, ICLOUD, 'C:\\Users\\u\\iCloudDrive\\x']) assert.equal(guard.inCloud(p), true, p);
  for (const p of ['/Users/u/dev/app', 'C:\\Users\\u\\dev\\app', '/private/tmp/claude-501/-Users-u-Library-CloudStorage-OneDrive-x/scratchpad', '/Users/u/.claude/projects/-Users-u-OneDrive']) {
    assert.equal(guard.inCloud(p), false, p);
  }
});

test('guard: 클라우드 폴더 안의 git 쓰기·설치만 잡는다', () => {
  const k = (cmd, cwd) => guard.findRisks(cmd, cwd).map((r) => r.kind);
  assert.deepEqual(k('git commit -m x', MAC_OD), ['cloud-git']);
  assert.deepEqual(k('git init', ICLOUD), ['cloud-git']);
  assert.deepEqual(k('git status && git log --oneline', MAC_OD), []);
  assert.deepEqual(k('npm install', MAC_OD), ['cloud-install']);
  assert.deepEqual(k('python3 -m venv .venv && pip install -r requirements.txt', MAC_OD), ['cloud-install', 'cloud-install']);
  assert.deepEqual(k('npm run dev', MAC_OD), []);
  assert.deepEqual(k('npm install', '/Users/u/dev/app'), []);
  assert.deepEqual(k('git commit -m x', '/Users/u/dev/app'), []);
  assert.deepEqual(k('cd "' + ICLOUD + '" && git add -A', '/Users/u/dev/app'), ['cloud-git']);
  assert.deepEqual(k('git -C /Users/u/dev/app commit -m x', MAC_OD), []);
  assert.match(guard.decide('npm ci', MAC_OD), /클라우드 동기화 폴더/);
});

test('guard: 비밀 파일 이름을 가린다', () => {
  for (const p of ['.env', 'backend/.env', '.env.production', 'C:\\app\\.env.local', 'auth.json', '~/.ssh/id_rsa', 'certs/server.pem']) assert.equal(guard.isSecretPath(p), true, p);
  for (const p of ['.env.example', '.env.production.example', '.env.sample', 'env.py', 'README.md', 'package.json', 'environment.yml']) assert.equal(guard.isSecretPath(p), false, p);
});

test('guard: 비밀 파일 내용을 출력하는 명령을 잡는다', () => {
  const k = (cmd) => guard.findRisks(cmd, '/repo').map((r) => r.kind);
  assert.deepEqual(k('cat .env'), ['secret-read']);
  assert.deepEqual(k('grep -n KEY backend/.env.production'), ['secret-read']);
  assert.deepEqual(k('ls -la && head -3 auth.json'), ['secret-read']);
  assert.deepEqual(k('cat .env.example'), []);
  assert.deepEqual(k('cp .env.example .env'), []);
  assert.deepEqual(k('ls -la .env'), []);
  assert.deepEqual(k('git commit -m "cat .env 금지"'), []);
});

test('guard-read: 비밀 파일 Read만 묻는다', () => {
  const run = (file_path) =>
    spawnSync('node', [path.join(hooks, 'guard-read.js')], { input: JSON.stringify({ tool_name: 'Read', tool_input: { file_path } }), encoding: 'utf8' });
  const secret = run('/repo/backend/.env');
  assert.equal(secret.status, 0);
  assert.equal(JSON.parse(secret.stdout).hookSpecificOutput.permissionDecision, 'ask');
  for (const p of ['/repo/.env.example', '/repo/src/app.py']) {
    const r = run(p);
    assert.equal(r.status, 0);
    assert.equal(r.stdout, '');
  }
});

function makeRepo(t, commands) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-verify-'));
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-data-'));
  t.after(() => {
    fs.rmSync(repo, { recursive: true, force: true });
    fs.rmSync(data, { recursive: true, force: true });
  });
  const g = (...a) => execFileSync('git', ['-C', repo, ...a], { stdio: 'ignore' });
  g('init', '-q');
  fs.writeFileSync(path.join(repo, 'ok.txt'), 'yes\n');
  if (commands) {
    fs.mkdirSync(path.join(repo, '.claude'));
    fs.writeFileSync(path.join(repo, '.claude', 'verify.json'), JSON.stringify({ commands, timeoutSec: 30 }));
  }
  g('add', '-A');
  g('-c', 'user.name=test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'init');
  const hook = (mode, cwd = repo) =>
    spawnSync('node', [path.join(hooks, 'verify-stop.js'), ...(mode ? [mode] : [])], {
      input: JSON.stringify({ session_id: 's1', cwd, hook_event_name: mode ? 'SessionStart' : 'Stop' }),
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PLUGIN_DATA: data },
    });
  return { repo, hook, g };
}

// ok.txt 내용이 yes일 때만 통과하는 검증 명령 (셸 종류와 무관하게 node로 판정)
const CHECK = `node -e "process.exit(require('fs').readFileSync('ok.txt','utf8').trim()==='yes'?0:1)"`;

test('verify: verify.json이 없으면 아무것도 하지 않는다', (t) => {
  const { repo, hook } = makeRepo(t, null);
  fs.writeFileSync(path.join(repo, 'ok.txt'), 'no\n');
  assert.equal(hook().status, 0);
});

test('verify: 세션 시작 뒤 바뀐 게 없으면 검증을 돌리지 않는다', (t) => {
  const { hook } = makeRepo(t, ['node -e "process.exit(1)"']);
  assert.equal(hook('baseline').status, 0);
  assert.equal(hook().status, 0);
});

test('verify: 실패하면 한 번 막고, 같은 상태에서는 다시 막지 않고, 고치면 통과한다', (t) => {
  const { repo, hook } = makeRepo(t, [CHECK]);
  hook('baseline');
  fs.writeFileSync(path.join(repo, 'ok.txt'), 'no\n');
  const blocked = hook();
  assert.equal(blocked.status, 2);
  assert.match(blocked.stderr, /완료 전 검증 실패/);
  assert.equal(hook().status, 0, '같은 작업 트리 상태는 다시 막지 않는다');
  fs.writeFileSync(path.join(repo, 'ok.txt'), 'yes\n');
  assert.equal(hook().status, 0);
});

test('verify: 하위 폴더에서도, 커밋한 뒤에도 변경을 알아챈다', (t) => {
  const { repo, hook, g } = makeRepo(t, [CHECK]);
  hook('baseline');
  fs.mkdirSync(path.join(repo, 'src'));
  fs.writeFileSync(path.join(repo, 'ok.txt'), 'no\n');
  g('add', '-A');
  g('-c', 'user.name=test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'break');
  assert.equal(hook(null, path.join(repo, 'src')).status, 2);
});
