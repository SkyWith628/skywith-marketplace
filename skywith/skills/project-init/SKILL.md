---
name: project-init
description: 아직 폴더가 없는 새 프로젝트를 만들 때 발동. 사용자가 "새 프로젝트", "새 프로젝트 만들자", "project init"이라고 하면 발동하고, 이미 있는 프로젝트를 재개하는 말("프로젝트 시작하자" 등)이면 발동하지 않고 dgaja를 쓴다. 발동하면 목적·스택·모드·검증 명령을 정리해 <name>/ 폴더에 CLAUDE.md, docs/decisions.md, .gitignore, README 뼈대를 만들고 git init 한다. 프로젝트별 규칙을 둘 자리(3계층의 프로젝트 계층)를 만드는 스킬.
---

# project-init — 프로젝트 계층 만들기

전역 규칙은 얇게 두고, 프로젝트마다 다른 것(스택·명령어·함정·모드)은 `<name>/CLAUDE.md`에 둔다.
이 스킬은 그 파일과 최소 뼈대를 만든다. 템플릿: `templates/CLAUDE.md`.

## 1. 정보 수집 (모르는 것만 묻는다)
한 번에 묻는다 (AskUserQuestion 또는 한 메시지):
1. **이름** (폴더명, kebab-case) · **한 줄 정의**
2. **모드**: `work`(실제 프로젝트) / `study`(학습·실습)
3. **스택**: 언어·프레임워크·DB (AI 프로젝트면 모델/LLM, 벡터DB)
4. **검증 명령**: test / lint / typecheck / build (아직 없으면 "미정")
5. **원격 저장소 URL** (있으면)

사용자가 이미 말한 것은 다시 묻지 않는다. 기술 선택이 안 정해졌으면 후보와 Trade-off를 보여주고 고르게 한다 (고른 이유는 CLAUDE.md의 스택 표에 한 줄로).

## 2. 만들 것
**위치 결정:** 사용자가 말한 곳 > 현재 작업 폴더(클라우드 폴더가 **아닐** 때) > `~/dev/<name>/`.
- 경로에 `OneDrive`·`iCloud`·`CloudStorage`·`Mobile Documents`·`Dropbox`·`Google Drive`가 있으면 **거기에는 만들지 않는다.** 동기화 폴더 안에서는 `.git`이 깨지고 기기 간 충돌본이 생긴다. `~/dev/<name>/`(Windows는 `C:\Users\<사용자>\dev\<name>`)을 제안하고 확인받는다.
- 같은 이름의 폴더가 이미 있으면 덮어쓰지 않고 멈춘다(이어서 작업하는 경우는 `dgaja`).

```
<name>/
├─ CLAUDE.md          # templates/CLAUDE.md 를 채움 (40줄 이내)
├─ README.md          # 제목 + 한 줄 정의만. 본문은 portfolio 스킬이 나중에 채움
├─ docs/decisions.md  # 결정 로그 (비어 있는 헤더만)
├─ .claude/verify.json  # 검증 명령이 정해졌을 때만. 아래
├─ .gitattributes     # 아래. Windows·Mac 줄바꿈 차이로 가짜 변경이 생기는 것을 막는다
└─ .gitignore         # 아래
```
`.gitattributes`
```
* text=auto eol=lf
*.sh text eol=lf
```
`.claude/verify.json` — 턴을 끝내기 전에 skywith 훅이 돌리는 검증 명령이다. 코드가 바뀐 턴에만 돈다.
```json
{ "commands": ["<lint>", "<typecheck>"], "timeoutSec": 180 }
```
- 1번에서 받은 검증 명령 중 **빠른 것(수십 초 안)** 만 넣는다. 보통 lint·typecheck. 오래 걸리는 테스트·빌드는 넣지 않고 `CLAUDE.md`의 명령어에만 적는다.
- Windows·Mac 양쪽에서 같은 문자열로 도는 명령만 넣는다(`.venv/bin/python` 같은 OS별 경로 금지 — `python -m ruff check .`, `npm run lint`처럼 쓴다).
- 검증 명령이 "미정"이면 파일을 만들지 않고, 정해지면 만들자고 `CLAUDE.md`의 "다음"에 한 줄 남긴다.

`.gitignore` (`!.env.example` 줄이 `.env.*`보다 **뒤**에 와야 템플릿 파일이 무시되지 않는다)
```
.env
.env.*
!.env.example
__pycache__/
.venv/
venv/
node_modules/
.next/
dist/
build/
*.log
*.pt
*.pth
*.safetensors
*.ckpt
.DS_Store
.claude/worktrees/
.claude/settings.local.json
```
- AI 프로젝트면 `ai-ml` / `llm-agent` 스킬의 파일 구조 절을 참고해 디렉터리를 제안만 한다 (사용자 확인 후 생성).
- `git init -b main`을 실행한다.

## 3. 마무리
- 원격: URL이 있으면 `git remote add origin <url>`을 **제안**한다. 새로 만들 때는 **private이 기본**이다 — `gh repo create <owner>/<name> --private --source . --remote origin`. public은 사용자가 명시했을 때만 제안한다. 모두 사용자 확인 후 실행한다(푸시 전 공개 여부 확인은 `shimai` 규칙과 같다). 레포를 만든 직후 `gh repo view <owner>/<name> --json visibility`로 의도한 공개 여부(기본 PRIVATE)인지 확인하고 결과를 보고한다.
- 생성한 파일 목록과 CLAUDE.md의 `mode:` 값을 보고하고, 다음 작업으로 `dgaja` 사용을 안내한다.
- 첫 커밋은 사용자가 요청할 때만.
