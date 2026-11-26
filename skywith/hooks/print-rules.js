#!/usr/bin/env node
// SessionStart 훅: 플러그인의 전역 규칙(rules/AGENTS.md)을 세션 컨텍스트로 주입한다.
// 플러그인은 CLAUDE.md를 싣지 못하므로 이 훅이 대신한다. 규칙 수정은 rules/AGENTS.md만 고친다.
// 주입 한도는 10,000자 — 넘으면 Claude는 앞 2,000자만 받는다(공식 문서).
const fs = require("fs");
const path = require("path");

const LIMIT = 10000;
const file = path.join(__dirname, "..", "rules", "AGENTS.md");

let text;
try {
  text = fs.readFileSync(file, "utf8");
} catch (err) {
  // 규칙 파일이 없어도 세션을 막지 않는다.
  process.stderr.write(`skywith: 규칙 파일을 읽지 못했습니다 (${err.message})\n`);
  process.exit(0);
}

if (text.length > LIMIT) {
  process.stderr.write(`skywith: 규칙 ${text.length}자가 한도 ${LIMIT}자를 넘습니다. 줄이세요.\n`);
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: text,
    },
  })
);
