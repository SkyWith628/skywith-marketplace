# skywith — 개인 작업 규칙·스킬 플러그인

어떤 작업 폴더에서도 쓰는 개인 규칙과 스킬 모음이다. **이 폴더가 원본**이다.
- `rules/AGENTS.md` — 전역 규칙. 플러그인은 CLAUDE.md를 싣지 못하므로 `hooks/` 의 SessionStart 훅이 세션 시작(재개·compact 포함)마다 주입한다. 10,000자 이하로 유지한다.
- `skills/` — 스킬. 호출명은 `skywith:<이름>`.

## 포함 스킬
| 구분 | 스킬 |
|---|---|
| 모드 | `work`, `study` |
| 도메인 | `ai-ml`, `llm-agent`, `deploy` |
| 워크플로 | `dgaja`(드가자), `shimai`(시마이), `portfolio`, `blog`, `project-init`, `agent-dashboard`(관제실) |
| 외부 사본 | `stack-diagram`(스택 구조 그림, [caru-ini/stack-diagram](https://github.com/caru-ini/stack-diagram) v0.8.0, MIT) — 출처·갱신 방법은 폴더의 `UPSTREAM.md` |

트리거 단어("드가자", "시마이" 등)는 각 스킬의 description으로 동작하므로 평소 말투 그대로 쓰면 된다.

## 수정할 때
1. `~/dev/skywith-marketplace`(이 레포의 작업 사본)에서 `git pull` 후 `rules/AGENTS.md` 또는 `skills/`를 고친다. Claude가 설치한 캐시(`~/.claude/plugins/`)는 읽기 전용 복사본이라 거기서 고치지 않는다.
2. 커밋하고 `git push`한다.
3. 다른 기기는 자동 갱신(`autoUpdate`)으로 받는다. 바로 받으려면 `claude plugin update skywith@skywith-local`. 새 세션부터 적용된다.
- `plugin.json`에 `version`을 쓰지 않는다. 버전이 없으면 커밋 해시로 변경을 감지하므로 올릴 필요가 없다.

## agent-dashboard(관제실)
- 관제실 아티팩트는 claude.ai 계정에 속한다. 그래서 어느 기기에서든 같은 관제실을 쓴다.
  - 스킬이 메모리 → 계정의 아티팩트 목록 순으로 기존 관제실을 찾는다.
  - 둘 다 없을 때만 새로 배포한다.
- 화면 템플릿은 `skills/agent-dashboard/assets/dashboard.html`이다. 고칠 때는 `<meta name="agent-ops-version">` 숫자를 올린다. 그러면 다음 세션이 배포본을 자동으로 갱신한다.

## 한계
- 훅은 Node가 있어야 동작한다(`node --version`으로 확인). 규칙 파일을 못 읽어도 세션은 막지 않는다.
- 클라우드 세션에는 사용자 범위 플러그인이 적용되지 않는다.
- 같은 이름의 스킬을 `~/.claude/skills/`나 프로젝트 `.claude/skills/`에 다시 만들면 이중 로드된다.
- 전역 규칙을 다른 곳(`~/.claude/CLAUDE.md`, 프로젝트 `.claude/CLAUDE.md`)에도 복사해 두면 두 번 로드된다. 규칙은 이 플러그인 한 곳에만 둔다.
