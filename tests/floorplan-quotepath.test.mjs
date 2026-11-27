// floorplan [skywith patch] 재발 방지 테스트: 한글 경로가 git 출력에서 "\352\262…"로 이스케이프되지 않아야 한다.
// 원본을 갱신해 패치가 빠지면 실패한다. 실행: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const lib = pathToFileURL(path.join(here, '..', 'skywith', 'skills', 'floorplan', 'scripts', 'lib', 'common.mjs')).href;

test('floorplan git helper returns non-ASCII paths unquoted', async (t) => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-quotepath-'));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  const g = (...a) => execFileSync('git', ['-C', repo, ...a], { stdio: 'ignore' });
  g('init', '-q');
  g('config', 'core.quotepath', 'true'); // git 기본값과 같게 고정
  fs.mkdirSync(path.join(repo, '결과'));
  fs.writeFileSync(path.join(repo, '결과', '보고.md'), 'a\n');
  fs.writeFileSync(path.join(repo, 'plain.md'), 'b\n');
  g('add', '-A');
  g('-c', 'user.name=test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'init');
  fs.appendFileSync(path.join(repo, '결과', '보고.md'), 'c\n');

  const { git } = await import(lib);
  assert.deepEqual(git(repo, ['ls-files']).split('\n').sort(), ['plain.md', '결과/보고.md']);
  assert.equal(git(repo, ['status', '--porcelain=v1', '-uall']), ' M 결과/보고.md');
  assert.match(git(repo, ['log', '--name-only', '--format=@@%h']), /결과\/보고\.md/);
});
