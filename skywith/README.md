# skywith — 개인 작업 스킬 플러그인

어떤 작업 폴더에서도 쓰는 개인 스킬 모음이다. **이 폴더의 `skills/`가 스킬의 원본**이다.
Claude Code는 설치할 때 이 폴더를 캐시(`~/.claude/plugins/cache/skywith-local/skywith/<version>/`)로 복사해서 읽는다. Codex용 사본(`.agents/skills/`)은 워크스페이스 루트의 `bash sync.sh`가 만든다.

## 포함 스킬 (호출명 `skywith:<이름>`)
| 구분 | 스킬 |
|---|---|
| 모드 | `work`, `study` |
| 도메인 | `ai-ml`, `llm-agent`, `deploy` |
| 워크플로 | `dgaja`(드가자), `shimai`(시마이), `portfolio`, `blog`, `project-init`, `agent-dashboard`(관제실, Claude 전용) |

트리거 단어("드가자", "시마이" 등)는 각 스킬의 description으로 동작하므로 평소 말투 그대로 쓰면 된다.

## 새 환경(PC)에 설치
어느 기기든(GitHub 인증 필요, 비공개 저장소):
```bash
claude plugin marketplace add SkyWith628/skywith-marketplace
claude plugin install skywith@skywith-local
```
OneDrive가 동기화된 기기라면 GitHub 대신 이 폴더의 상위(`marketplace/`) 실제 경로로 등록해도 된다(한 기기에는 둘 중 하나만).
```bash
claude plugin marketplace add "<WorkSpace>/claude/marketplace"
claude plugin install skywith@skywith-local
```
설치 후 새 세션부터 적용된다.

## 스킬을 고칠 때
1. `skills/<이름>/`을 수정한다.
2. `.claude-plugin/plugin.json`의 `version`을 올린다. 설치본은 버전별 캐시라서, 버전을 올리지 않으면 다른 기기에 반영되지 않는다.
3. `marketplace/`에서 커밋하고 `git push`한다. GitHub(`SkyWith628/skywith-marketplace`, 비공개)로 설치한 기기는 푸시된 내용을 받는다.
4. 각 기기에서 업데이트한다(설치된 세션은 새 세션부터 적용):
   ```bash
   claude plugin marketplace update skywith-local
   claude plugin update skywith@skywith-local
   ```
5. Codex 사본이 필요하면 워크스페이스 루트에서 `bash sync.sh`를 실행한다. `agent-dashboard`는 Codex로 복사하지 않는다(`SKIP_CODEX`).

## agent-dashboard(관제실)
- 관제실 아티팩트는 claude.ai 계정에 속한다. 그래서 어느 기기에서든 같은 관제실을 쓴다.
  - 스킬이 메모리 → 계정의 아티팩트 목록 순으로 기존 관제실을 찾는다.
  - 둘 다 없을 때만 새로 배포한다.
- 화면 템플릿은 `skills/agent-dashboard/assets/dashboard.html`이다. 고칠 때는 `<meta name="agent-ops-version">` 숫자를 올린다. 그러면 다음 세션이 배포본을 자동으로 갱신한다.

## 한계
- 전역 규칙(`AGENTS.md` / `.claude/CLAUDE.md`)은 플러그인에 들어가지 않는다. 워크스페이스 폴더에서만 로드된다.
- 같은 이름의 스킬을 `.claude/skills/`에 다시 만들면 이중 로드된다(`sync.sh`가 경고).
- 되돌리기: `claude plugin uninstall skywith@skywith-local`, 이전 프로젝트 사본은 `.claude/backups/pre-dedupe-20261127/`.
