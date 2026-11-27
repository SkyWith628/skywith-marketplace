// 글로 적힌 연결이 깨지지 않았는지 확인한다. 실행: node --test tests/
// 규칙·스킬·에이전트 본문은 서로를 이름으로만 가리키므로, 이름을 바꾸거나 파일을 지워도 오류가 나지 않는다.
// 외부 사본(floorplan, stack-diagram)의 본문은 검사하지 않는다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const plugin = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'skywith');
const VENDORED = new Set(['floorplan', 'stack-diagram']);

const skills = fs.readdirSync(path.join(plugin, 'skills')).filter((d) => fs.existsSync(path.join(plugin, 'skills', d, 'SKILL.md')));
const agents = fs.readdirSync(path.join(plugin, 'agents')).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
const known = new Set([...skills, ...agents]);

/** 우리가 쓴 문서 목록(플러그인 폴더 기준 상대 경로). */
function ownDocs() {
  const docs = ['rules/AGENTS.md', 'README.md', ...agents.map((a) => `agents/${a}.md`)];
  for (const s of skills) {
    if (VENDORED.has(s)) continue;
    const walk = (dir) => {
      for (const e of fs.readdirSync(path.join(plugin, dir), { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) walk(rel);
        else if (e.name.endsWith('.md')) docs.push(rel);
      }
    };
    walk(`skills/${s}`);
  }
  return docs;
}

const frontmatterName = (file) => (fs.readFileSync(file, 'utf8').match(/^---\n[\s\S]*?^name:\s*(.+)$/m) || [])[1]?.trim();

test('참조: 본문의 skywith:<이름>이 실제 스킬·에이전트를 가리킨다', () => {
  const broken = [];
  for (const doc of ownDocs()) {
    const text = fs.readFileSync(path.join(plugin, doc), 'utf8');
    for (const m of text.matchAll(/skywith:([a-z][a-z0-9-]*)/g)) {
      if (!known.has(m[1])) broken.push(`${doc}: skywith:${m[1]}`);
    }
  }
  assert.deepEqual(broken, [], '없는 스킬·에이전트를 가리키는 참조');
});

test('참조: hooks.json이 가리키는 스크립트가 있다', () => {
  const { hooks } = JSON.parse(fs.readFileSync(path.join(plugin, 'hooks', 'hooks.json'), 'utf8'));
  const missing = [];
  let count = 0;
  for (const [event, groups] of Object.entries(hooks)) {
    for (const group of groups) {
      for (const hook of group.hooks) {
        for (const arg of [hook.command, ...(hook.args || [])]) {
          if (!String(arg).includes('${CLAUDE_PLUGIN_ROOT}')) continue;
          count++;
          const file = String(arg).replace('${CLAUDE_PLUGIN_ROOT}', plugin);
          if (!fs.existsSync(file)) missing.push(`${event}: ${arg}`);
        }
      }
    }
  }
  assert.ok(count > 0, 'hooks.json에서 스크립트 경로를 하나도 찾지 못했다');
  assert.deepEqual(missing, [], '없는 훅 스크립트');
});

test('참조: 스킬·에이전트의 name이 폴더·파일 이름과 같다', () => {
  const mismatched = [];
  for (const s of skills) {
    const name = frontmatterName(path.join(plugin, 'skills', s, 'SKILL.md'));
    if (name !== s) mismatched.push(`skills/${s}/SKILL.md: name=${name}`);
  }
  for (const a of agents) {
    const name = frontmatterName(path.join(plugin, 'agents', `${a}.md`));
    if (name !== a) mismatched.push(`agents/${a}.md: name=${name}`);
  }
  assert.deepEqual(mismatched, [], '호출명(skywith:<이름>)과 다른 name');
});

test('참조: 전역 규칙의 트리거가 모두 스킬로 이어진다', () => {
  const rules = fs.readFileSync(path.join(plugin, 'rules', 'AGENTS.md'), 'utf8');
  const refs = [...rules.matchAll(/skywith:([a-z][a-z0-9-]*)/g)].map((m) => m[1]);
  assert.ok(refs.length >= 5, '전역 규칙에서 참조를 찾지 못했다(정규식이나 표기 방식이 바뀌었는지 확인)');
});
