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
`<현재 작업 폴더>/<name>/` (사용자가 다른 위치를 말하면 그곳):
```
<name>/
├─ CLAUDE.md          # templates/CLAUDE.md 를 채움 (40줄 이내)
├─ README.md          # 제목 + 한 줄 정의만. 본문은 portfolio 스킬이 나중에 채움
├─ docs/decisions.md  # 결정 로그 (비어 있는 헤더만)
└─ .gitignore         # .env, .env.*, __pycache__/, node_modules/, *.pt, *.pth, *.safetensors, .DS_Store
```
- AI 프로젝트면 `ai-ml` / `llm-agent` 스킬의 파일 구조 절을 참고해 디렉터리를 제안만 한다 (사용자 확인 후 생성).
- `git init`을 실행한다.

## 3. 마무리
- 원격 URL이 있으면 `git remote add origin <url>`을 **제안**한다 (사용자 확인 후 반영).
- 생성한 파일 목록과 CLAUDE.md의 `mode:` 값을 보고하고, 다음 작업으로 `dgaja` 사용을 안내한다.
- 첫 커밋은 사용자가 요청할 때만.
