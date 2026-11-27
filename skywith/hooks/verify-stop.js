#!/usr/bin/env node
// 완료 전 검증 훅. 프로젝트에 .claude/verify.json이 있을 때만 동작한다(없으면 아무것도 안 함).
//   SessionStart:  node verify-stop.js baseline  → 세션 시작 시점의 작업 트리 상태를 기억한다.
//   Stop:          node verify-stop.js           → 그 뒤로 코드가 바뀌었으면 검증 명령을 돌리고, 실패하면 종료를 막는다.
// 같은 작업 트리 상태는 한 번만 검사한다. 그래서 실패를 한 번 알린 뒤 아무것도 안 바꾸고 끝내면 통과한다(무한 루프 없음).
//
// verify.json: {"commands": ["npm run typecheck", "npm test"], "timeoutSec": 180}
const { execFileSync, spawnSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const TAIL = 3000;

/** start에서 위로 올라가며 .claude/verify.json이 있는 폴더를 찾는다. */
function findRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(dir, ".claude", "verify.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function loadConfig(root) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(root, ".claude", "verify.json"), "utf8"));
    const commands = Array.isArray(cfg.commands) ? cfg.commands.filter((c) => typeof c === "string" && c.trim()) : [];
    const timeoutSec = Number.isFinite(cfg.timeoutSec) && cfg.timeoutSec > 0 ? cfg.timeoutSec : 180;
    return commands.length ? { commands, timeoutSec } : null;
  } catch {
    return null;
  }
}

/** 작업 트리 상태 지문(HEAD + 변경 내용 + 미추적 파일). git 레포가 아니면 null. */
function fingerprint(root) {
  const git = (...args) =>
    execFileSync("git", ["-c", "core.quotepath=false", ...args], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  try {
    const hash = crypto.createHash("sha256");
    let head = "";
    try {
      head = git("rev-parse", "HEAD");
    } catch {
      // 커밋이 아직 없는 레포
    }
    hash.update(head);
    hash.update(git("status", "--porcelain=v1", "-uall"));
    if (head) hash.update(git("diff", "HEAD"));
    for (const file of git("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean)) {
      try {
        const st = fs.statSync(path.join(root, file));
        hash.update(`${file}:${st.size}:${st.mtimeMs}`);
      } catch {
        // 사라진 파일은 건너뛴다
      }
    }
    return hash.digest("hex");
  } catch {
    return null;
  }
}

function statePath(sessionId, root) {
  const base = process.env.CLAUDE_PLUGIN_DATA || path.join(os.tmpdir(), "skywith");
  const key = crypto.createHash("sha256").update(`${sessionId}\n${root}`).digest("hex").slice(0, 24);
  return path.join(base, "verify", `${key}.json`);
}

function readState(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function writeState(file, state) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(state));
  } catch {
    // 상태를 못 써도 세션은 막지 않는다
  }
}

/** 명령을 차례로 돌린다. 첫 실패에서 멈춘다. */
function runCommands(root, config) {
  const deadline = Date.now() + config.timeoutSec * 1000;
  for (const command of config.commands) {
    const left = deadline - Date.now();
    if (left <= 0) return { ok: false, command, code: "timeout", output: "" };
    const res = spawnSync(command, { cwd: root, shell: true, encoding: "utf8", timeout: left, maxBuffer: 64 * 1024 * 1024 });
    if (res.error && res.error.code === "ETIMEDOUT") return { ok: false, command, code: "timeout", output: tail(res) };
    if (res.status !== 0) return { ok: false, command, code: res.status ?? String(res.signal || res.error?.code), output: tail(res) };
  }
  return { ok: true };
}

function tail(res) {
  const text = `${res.stdout || ""}\n${res.stderr || ""}`.trim();
  return text.length > TAIL ? `…\n${text.slice(-TAIL)}` : text;
}

/**
 * @returns {null | {block: string}} null이면 종료를 허용한다.
 */
function check(mode, input, run = runCommands) {
  const root = findRoot(input.cwd || process.cwd());
  if (!root) return null;
  const config = loadConfig(root);
  if (!config) return null;
  const fp = fingerprint(root);
  if (!fp) return null;
  const file = statePath(String(input.session_id || "nosession"), root);
  const state = readState(file);

  if (mode === "baseline") {
    if (!state) writeState(file, { checked: fp });
    return null;
  }
  if (state && state.checked === fp) return null; // 세션 시작 때와 같거나 이미 검사한 상태
  const result = run(root, config);
  writeState(file, { checked: fp, ok: result.ok });
  if (result.ok) return null;
  return {
    block:
      `완료 전 검증 실패 (.claude/verify.json): \`${result.command}\` → ${result.code}\n` +
      `${result.output}\n\n` +
      "원인을 고친 뒤 끝낸다. 지금 고칠 수 없으면 실패한 명령과 출력을 사용자에게 그대로 보고하고 끝낸다. " +
      "작업 트리가 바뀌지 않으면 이 검사는 다시 막지 않는다.",
  };
}

function main() {
  let input = {};
  try {
    input = JSON.parse(fs.readFileSync(0, "utf8")) || {};
  } catch {
    // 입력이 없으면 현재 폴더 기준으로 본다
  }
  let outcome = null;
  try {
    outcome = check(process.argv[2] === "baseline" ? "baseline" : "stop", input);
  } catch (err) {
    process.stderr.write(`skywith verify: ${err.message}\n`);
  }
  if (outcome) {
    // Stop 훅은 exit 2 + stderr로 종료를 막는다(공식 문서에서 확인된 방식).
    process.stderr.write(outcome.block);
    process.exitCode = 2;
  }
}

if (require.main === module) main();
module.exports = { findRoot, loadConfig, fingerprint, check };
