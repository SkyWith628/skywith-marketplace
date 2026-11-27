#!/usr/bin/env node
// PreToolUse(Bash) 훅: 전역 규칙 중 "말로만 두면 안 지켜지는 것"을 실행 전에 사용자 확인으로 돌린다.
//   - git push --force / -f / --force-with-lease / +refspec
//   - git reset --hard
//   - PUBLIC이거나 공개 여부를 확인하지 못한 레포로 가는 git push
//   - 클라우드 동기화 폴더(OneDrive·iCloud 등) 안에서의 git 쓰기 명령, 패키지 설치, 가상환경 생성
//   - 비밀 파일(.env, auth.json, 키 파일) 내용을 출력하는 명령
// 막지 않고 "ask"로 묻는다(전역 규칙: 확인받은 뒤에 한다). 해당 없으면 아무 결정도 내지 않는다.
const { execFileSync } = require("child_process");
const path = require("path");

const OPERATORS = new Set([";", "&&", "||", "|", "&", "(", ")", "\n"]);

/** 셸 명령을 따옴표를 존중해 세그먼트(토큰 배열)들로 나눈다. 완전한 셸 파서는 아니다. */
function splitSegments(command) {
  const segments = [];
  let tokens = [];
  let cur = "";
  let has = false;
  let quote = null;
  const pushToken = () => {
    if (has) tokens.push(cur);
    cur = "";
    has = false;
  };
  const pushSegment = () => {
    pushToken();
    if (tokens.length) segments.push(tokens);
    tokens = [];
  };
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (quote === "'") {
      if (ch === "'") quote = null;
      else cur += ch;
      continue;
    }
    if (quote === '"') {
      if (ch === '"') quote = null;
      else if (ch === "\\" && i + 1 < command.length) cur += command[++i];
      else cur += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      has = true;
    } else if (ch === "\\" && i + 1 < command.length) {
      if (command[i + 1] === "\n") i++; // 줄 이음
      else {
        cur += command[++i];
        has = true;
      }
    } else if (ch === " " || ch === "\t" || ch === "\r") {
      pushToken();
    } else if (OPERATORS.has(command.slice(i, i + 2))) {
      pushSegment();
      i++;
    } else if (OPERATORS.has(ch)) {
      pushSegment();
    } else {
      cur += ch;
      has = true;
    }
  }
  pushSegment();
  return segments;
}

const WRAPPERS = new Set(["sudo", "command", "env", "time", "nohup"]);

/** 세그먼트에서 환경변수 대입·래퍼를 건너뛰고 {bin, args}를 돌려준다. */
function head(tokens) {
  let i = 0;
  while (i < tokens.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i]) || WRAPPERS.has(tokens[i]))) i++;
  if (i >= tokens.length) return null;
  const bin = tokens[i]
    .split(/[\\/]/)
    .pop()
    .toLowerCase()
    .replace(/\.exe$/, "");
  return { bin, args: tokens.slice(i + 1) };
}

/** 세그먼트가 git 호출이면 {dir, sub, args}를, 아니면 null을 돌려준다. */
function parseGit(tokens) {
  const cmd = head(tokens);
  if (!cmd || cmd.bin !== "git") return null;
  const rest = cmd.args;
  let i = 0;
  let dir = null;
  while (i < rest.length && rest[i].startsWith("-")) {
    if (rest[i] === "-C") dir = rest[++i];
    else if (rest[i] === "-c" || rest[i] === "--git-dir" || rest[i] === "--work-tree") i++;
    i++;
  }
  if (i >= rest.length) return null;
  return { dir, sub: rest[i], args: rest.slice(i + 1) };
}

function isForcePush(args) {
  return args.some(
    (a) =>
      a === "--force" ||
      a.startsWith("--force-with-lease") ||
      a === "--force-if-includes" ||
      /^-[A-Za-z]*f[A-Za-z]*$/.test(a) ||
      (a.startsWith("+") && a.length > 1)
  );
}

const CLOUD = /(^|[\\/])(OneDrive[^\\/]*|iCloudDrive|Mobile Documents|CloudStorage|Dropbox|Google Drive)([\\/]|$)/i;
/** 경로가 클라우드 동기화 폴더 안이면 true. */
function inCloud(dir) {
  return CLOUD.test(dir);
}

// 작업 트리·.git을 바꾸지 않는 git 하위 명령. 이 밖의 git 명령은 클라우드 폴더에서 묻는다.
const GIT_READONLY = new Set([
  "status", "log", "diff", "show", "rev-parse", "ls-files", "blame", "grep", "describe", "shortlog",
  "cat-file", "ls-remote", "rev-list", "merge-base", "cherry", "remote", "config", "branch", "tag", "help", "version",
]);

const INSTALL_SUBS = new Set(["install", "i", "ci", "add"]);
/** 의존성 폴더나 가상환경을 만드는 명령이면 true. */
function isInstall({ bin, args }) {
  if (["npm", "pnpm", "bun"].includes(bin)) return INSTALL_SUBS.has(args[0]);
  if (bin === "yarn") return args.length === 0 || INSTALL_SUBS.has(args[0]);
  if (/^pip3?$/.test(bin)) return args[0] === "install";
  if (bin === "uv") return ["sync", "venv", "add"].includes(args[0]) || (args[0] === "pip" && args[1] === "install");
  if (/^python[0-9.]*$/.test(bin) || bin === "py") {
    const m = args.indexOf("-m");
    return m >= 0 && (args[m + 1] === "venv" || (args[m + 1] === "pip" && args[m + 2] === "install"));
  }
  return false;
}

const SECRET_NAMES = new Set(["auth.json", "credentials.json", ".netrc", "id_rsa", "id_ed25519", "id_ecdsa"]);
/** 비밀값이 들어 있을 파일 이름이면 true. .env.example 같은 견본은 제외한다. */
function isSecretPath(file) {
  const base = String(file).split(/[\\/]/).pop().toLowerCase();
  if (base === ".env") return true;
  if (base.startsWith(".env.")) return !/\.(example|sample|template|dist)$/.test(base);
  return SECRET_NAMES.has(base) || base.endsWith(".pem");
}

// 파일 내용을 출력으로 내보내는 명령
const READERS = new Set(["cat", "head", "tail", "less", "more", "bat", "grep", "rg", "awk", "sed", "cut", "strings", "xxd", "od", "nl", "base64"]);

/**
 * 명령을 훑어 확인이 필요한 항목을 찾는다.
 * @returns {{kind: "force-push"|"reset-hard"|"push"|"cloud-git"|"cloud-install"|"secret-read", cwd: string, remote?: string|null, what?: string}[]}
 */
function findRisks(command, cwd) {
  const risks = [];
  let dir = cwd;
  for (const tokens of splitSegments(command)) {
    if (tokens[0] === "cd" && tokens[1]) {
      dir = path.resolve(dir, tokens[1].replace(/^~(?=$|\/)/, process.env.HOME || process.env.USERPROFILE || "~"));
      continue;
    }
    const cmd = head(tokens);
    if (!cmd) continue;
    const git = parseGit(tokens);
    if (git) {
      const at = git.dir ? path.resolve(dir, git.dir) : dir;
      if (git.sub === "reset" && git.args.includes("--hard")) {
        risks.push({ kind: "reset-hard", cwd: at });
      } else if (git.sub === "push") {
        const remote = git.args.find((a) => !a.startsWith("-")) || null;
        risks.push({ kind: isForcePush(git.args) ? "force-push" : "push", cwd: at, remote });
      }
      if (inCloud(at) && !GIT_READONLY.has(git.sub)) risks.push({ kind: "cloud-git", cwd: at, what: `git ${git.sub}` });
      continue;
    }
    if (inCloud(dir) && isInstall(cmd)) risks.push({ kind: "cloud-install", cwd: dir, what: `${cmd.bin} ${cmd.args[0] || ""}`.trim() });
    if (READERS.has(cmd.bin)) {
      const secret = cmd.args.find((a) => !a.startsWith("-") && isSecretPath(a));
      if (secret) risks.push({ kind: "secret-read", cwd: dir, what: secret.split(/[\\/]/).pop() });
    }
  }
  return risks;
}

/** push 대상 레포의 공개 여부. 알 수 없으면 null. */
function visibility(cwd, remote) {
  const run = (bin, args) =>
    execFileSync(bin, args, { cwd, encoding: "utf8", timeout: 8000, stdio: ["ignore", "pipe", "ignore"] }).trim();
  try {
    const args = ["repo", "view"];
    if (remote) args.push(/[:/]/.test(remote) ? remote : run("git", ["remote", "get-url", remote]));
    args.push("--json", "visibility", "-q", ".visibility");
    return run("gh", args).toUpperCase() || null;
  } catch {
    return null;
  }
}

function decide(command, cwd, lookup = visibility) {
  const reasons = [];
  for (const risk of findRisks(command, cwd)) {
    if (risk.kind === "force-push") reasons.push("force push다. 원격 이력을 덮어쓴다.");
    else if (risk.kind === "reset-hard") reasons.push("`git reset --hard`다. 커밋하지 않은 변경이 사라진다.");
    else if (risk.kind === "cloud-git" || risk.kind === "cloud-install") {
      reasons.push(`클라우드 동기화 폴더 안에서 \`${risk.what}\`이다. .git·의존성 폴더가 동기화 충돌을 만든다. 코드는 ~/dev에서 작업한다.`);
    } else if (risk.kind === "secret-read") {
      reasons.push(`비밀 파일(${risk.what}) 내용을 출력한다. 값이 대화에 들어간다. 키 이름만 필요하면 .env.example을 본다.`);
    }
    if (risk.kind === "push" || risk.kind === "force-push") {
      const vis = lookup(risk.cwd, risk.remote);
      if (vis === "PUBLIC") reasons.push("대상 레포가 PUBLIC이다. WIP·내부 문서·비밀이 섞이지 않았는지 확인한다.");
      else if (!vis) reasons.push("대상 레포의 공개 여부를 확인하지 못했다. 공개로 간주한다.");
    }
  }
  return reasons.length ? [...new Set(reasons)].join(" ") : null;
}

/** PreToolUse "ask" 결정을 stdout으로 낸다. */
function ask(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: `skywith 가드: ${reason}`,
      },
    })
  );
}

function main() {
  let input;
  try {
    input = JSON.parse(require("fs").readFileSync(0, "utf8"));
  } catch {
    process.exit(0);
  }
  const command = input && input.tool_input && input.tool_input.command;
  if (input.tool_name !== "Bash" || typeof command !== "string") process.exit(0);
  const reason = decide(command, input.cwd || process.cwd());
  if (reason) ask(reason);
}

if (require.main === module) main();
module.exports = { splitSegments, parseGit, isForcePush, inCloud, isInstall, isSecretPath, findRisks, decide, ask };
