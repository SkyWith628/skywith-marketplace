#!/usr/bin/env node
// PreToolUse(Read) 훅: 비밀 파일(.env, auth.json, 키 파일)을 읽기 전에 사용자에게 묻는다.
// 읽은 내용은 그대로 대화(모델 입력)에 들어가기 때문이다. .env.example 같은 견본은 묻지 않는다.
const { isSecretPath, ask } = require("./guard-bash.js");

let input;
try {
  input = JSON.parse(require("fs").readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}
const file = input && input.tool_input && input.tool_input.file_path;
if (input.tool_name === "Read" && typeof file === "string" && isSecretPath(file)) {
  const name = file.split(/[\\/]/).pop();
  ask(`비밀 파일(${name})을 읽는다. 값이 대화에 들어간다. 키 이름만 필요하면 .env.example을 본다.`);
}
