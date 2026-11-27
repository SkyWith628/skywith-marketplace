# floorplan — 외부 스킬 사본

이 폴더는 외부 플러그인의 스킬을 **수정하지 않고 그대로 복사**한 것이다. 호출명은 `skywith:floorplan`.

| 항목 | 값 |
|---|---|
| 원본 | https://github.com/haydenschmitty/floorplan (`skills/floorplan/`) |
| 버전 | v0.11.0 (커밋 `94f81b463b7617e06d873ac71323ce71644c8399`, 2026-11-16) |
| 복사한 날 | 2026-11-27 |
| 무결성 | 54개 파일 SHA-256이 원본의 `CHECKSUMS.txt`와 모두 일치 |
| 라이선스 | MIT (`LICENSE`, 원본 레포 루트에서 복사), 레이아웃 엔진 elkjs는 EPL-2.0, 폰트는 SIL OFL 1.1 (`assets/vendor/`) |

원본 레포 루트의 `.claude-plugin/`·`.codex-plugin/`·`tests/`·`docs/`는 가져오지 않았다. 스킬은 `${CLAUDE_SKILL_DIR}` 기준 경로만 써서 이 폴더만으로 동작한다.

## 복사 전 점검 (2026-11-27)
- 훅·MCP·의존성·설치 스크립트 없음. 스크립트는 Node 18+ 표준 모듈만 쓴다.
- 외부 통신은 `assets/serve.mjs`의 대기자 등록(Google Cloud Run) 한 곳뿐이고, 이메일을 직접 넣을 때만 보낸다. `FLOORPLAN_NO_PROMPTS=1`이면 안내도 꺼진다.
- 로컬 서버는 `127.0.0.1:4378`(사용 중이면 +20까지), 실행마다 무작위 토큰, Host·Origin 검사(DNS rebinding 방지).
- 프로젝트에 쓰는 것: `floorplan/`(자체 `.gitignore`로 전부 무시), 동의할 때만 `CLAUDE.local.md` + `.git/info/exclude`.

## 쓸 때 주의
- **Ask 바는 `claude -p`에 `Read`를 범위 제한 없이 준다.** 질문에 따라 `.env` 같은 비밀 파일 내용이 대화로 들어갈 수 있으니, 비밀값이 있는 레포에서는 Ask 바를 쓰지 않는다.
- Health check의 비밀값 힌트는 12자 이상이면 **앞 4글자**를 보여 준다(`starts "sk-a…"`). 지도를 공유하지 않는다.
- `CLAUDE.local.md` 메모 제안은 거절한다(규칙은 skywith 전역 규칙·프로젝트 `CLAUDE.md`로 관리).
- PUBLIC 레포에서 처음 돌린 뒤 `git status`로 `floorplan/`이 안 잡히는지 확인한다.

## 원본 갱신 방법
1. 원하는 커밋을 받아 `CHECKSUMS.txt`와 `skills/floorplan/` 파일 해시를 대조한다.
2. 이 폴더를 덮어쓴다(`UPSTREAM.md`·`LICENSE`는 남기고, LICENSE가 바뀌었으면 원본 것으로 교체).
3. `git diff`로 `assets/serve.mjs`의 접속 주소(`fetch`·URL)와 Ask 바의 `--tools`/`--allowedTools`가 바뀌었는지 확인하고, 위 표의 버전·커밋·날짜를 고친다.
