---
name: agent-dashboard
description: 멀티 에이전트·백그라운드 작업을 실시간으로 보여주는 "에이전트 관제실" 아티팩트를 띄우고, 작업 중 상태를 계속 기록한다. 사용자가 "관제실", "관제실 켜줘", "에이전트 대시보드", "/agent-dashboard"라고 하면 발동. "작업 현황"·"현황 브리핑" 같은 세션 상태 요약 요청은 dgaja이고 이 스킬이 아니다. 서브에이전트(Agent)·세션(start_session)·Workflow를 2개 이상 백그라운드로 돌리기 직전이면 한 줄로 켤지 제안한다. 왼쪽 어드바이저 레일, 위→아래 흐름(리드 → 팀 밴드 → 리드 복귀, 배선·패킷), 결과 목록, 세션 로그·타임라인을 한 화면에 그린다.
---

# 에이전트 관제실 (agent-dashboard)

**한 번 배포한 아티팩트 1개**에 실행(run)마다 기록을 쌓는다. 페이지는 `db` 저장소를 `onSnapshot`으로 구독하므로, Claude가 `ArtifactData`로 쓰는 즉시 열려 있는 화면에 반영된다. 기록이 없으면 페이지는 예시 시나리오(DEMO 배지)를 재생한다.

> 한계: 화면은 **Claude가 기록한 만큼만** 움직인다. 서브에이전트 내부 토큰 스트림을 자동으로 훔쳐보지 않는다. 그래서 "언제 기록하나"(§3)가 이 스킬의 핵심이다. 페이지는 상태(진행률·상태·로그·결과)를 도착 즉시 반영하고, 패킷·말풍선만 0.18초 간격으로 이어서 재생한다.

## 1. 대시보드 확보 (세션당 1회) — 어느 기기에서든 같은 관제실
아티팩트는 claude.ai 계정에 속해서 어느 기기에서 열어도 같은 URL이다. 반면 메모리는 기기·폴더마다 따로다. 그래서 아래 순서로 찾고, **새로 만드는 건 마지막 수단**이다(새로 만들면 실행 기록이 둘로 갈라진다).
1. 메모리에 `agent-dashboard` 항목(URL)이 있으면 그것을 쓴다.
2. 없으면 `Artifact` `action: "list"`(scope `mine`)에서 제목이 **에이전트 관제실**인 것을 찾는다. 있으면 그 URL을 쓰고 메모리(reference)에 `agent-dashboard`로 저장한다.
3. 그래도 없으면 새로 배포한다.
   - 이 스킬 폴더(스킬을 불러올 때 표시되는 base directory)의 `assets/dashboard.html`을 스크래치패드로 복사하고, 그 경로로 publish한다.
   - `icon: "monitor"`, `capabilities: {"db": {"rules": [{"path": "", "read": "view", "write": "admin"}]}}` (보는 사람은 읽기만, 쓰기는 소유자·편집자=Claude).
   - 받은 URL을 메모리에 저장한다.
4. 템플릿 버전을 맞춘다.
   - 템플릿 맨 위 `<meta name="agent-ops-version">` 값을 `Artifact` `read`로 읽은 배포본의 값과 비교한다.
   - 배포본이 더 낮으면 템플릿을 스크래치패드에 복사해 `url`을 지정해서 재배포한다. `capabilities`는 생략한다(기존 선언 유지).
   - db 기록은 재배포해도 남는다.
   - 다른 기기에서 옛 플러그인으로 배포한 경우를 위한 단계다. 세션당 한 번이면 충분하다.

## 2. 데이터 계약 — 이벤트 소싱, 추가 전용
문서는 **생성만** 한다(덮어쓰기 없음 → `if_version` 관리 불필요, 충돌 없음).

| 경로 | 언제 | 내용 |
|---|---|---|
| `runs/{runId}` | 실행 시작 1회 | `{title, goal, startedAt}` |
| `runs/{runId}/flushes/f0001…` | 기록할 때마다 1개 | 아래 flush 형식 |

- `runId`: `r` + `YYYYMMDD-HHmm` + `-` + 영문 슬러그. 예: `r20261127-1542-payment-refactor`. 영문·숫자·하이픈만(해시 라우팅에 쓰임). 시각은 Bash `date +%Y%m%d-%H%M`, PowerShell `Get-Date -Format yyyyMMdd-HHmm`.
- flush `doc_id`: `f` + 4자리 seq (`f0001`). `seq`는 1부터 1씩 증가하는 정수. 페이지는 seq 순으로 접는다. 같은 seq 재전송은 무시된다.

**flush 형식** (모든 필드 선택, 바뀐 것만 보낸다 — 에이전트는 id 기준 병합):
```json
{
  "seq": 7,
  "at": 1795715000000,
  "run":     {"status": "running|done|error|paused", "title": "", "goal": "", "summary": "", "startedAt": 0, "endedAt": 0},
  "agents":  [{"id": "grep", "name": "grep", "role": "lead|worker|fork|advisor|session",
               "model": "haiku 5.5", "team": "scout", "parent": "main",
               "status": "queued|thinking|working|waiting|done|error",
               "progress": 57, "task": "호출부 찾기", "now": "Grep 'chargeCard('",
               "tokens": 13800, "tools": 5}],
  "events":  [{"from": "grep", "to": "main", "kind": "spawn|msg|tool|result|error|note", "text": "호출부 12곳"}],
  "results": [{"id": "r-calls", "agent": "grep", "title": "호출부 12곳", "status": "ok|warn|fail",
               "body": "요약(줄바꿈 가능)", "files": ["src/a.ts"]}]
}
```
- `at`(epoch ms)은 있으면 피드 시각·경과 시간에 쓰이고, 없으면 페이지가 도착 시각을 쓴다. Bash `date +%s%3N`(PowerShell `[DateTimeOffset]::Now.ToUnixTimeMilliseconds()`)을 다른 명령에 붙여 얻을 수 있을 때만 넣는다. 이것 때문에 별도 호출을 만들지 않는다.
- 화면 배치는 `parent`(트리 깊이 → 행)와 `team`(같은 행에서 점선 프레임)으로 자동 결정된다. 루트(부모 없음)는 맨 윗줄.
- `to`가 있는 이벤트는 두 노드 사이로 패킷이 날아가고, `from` 노드 위에 말풍선이 뜬다. `tool`은 말풍선 없이 타임라인 눈금만.
- `status: done`이면 progress 생략 시 100으로 처리된다. 진행률을 실제로 모르면 `progress`를 **생략**한다 — 작업 중인데 0이면 페이지가 "보고 전" 불확정 막대와 경과 시간을 보여준다. 추정치를 지어내지 않는다.
- 어드바이저(`role: advisor`)는 흐름이 아니라 왼쪽 레일에 그려지고, 어드바이저에게 온 요청(◇)과 조언(»)이 레일에 쌓인다. 리드 ↔ 어드바이저 대화는 `msg` 이벤트로 남긴다.
- 텍스트는 짧게: `now` ≤ 40자, 이벤트 `text` ≤ 90자. 비밀값·토큰·개인정보는 절대 쓰지 않는다(공유 링크로 읽힌다).

## 3. 기록 프로토콜 — 언제, 무엇을
**쓰기는 항상 `ArtifactData` `batch` 1회**(flush 1개 + 필요 시 run 문서). 마일스톤마다 1번, 도구 호출마다가 아니다.

**즉시성 규칙** (화면이 늦게 움직이는 원인은 대부분 쓰기 지연이다):
- 투입 flush는 `Agent`/`start_session` 호출과 **같은 메시지**에 병렬로 보낸다. 투입 전에 따로 한 턴을 쓰지 않는다.
- 완료 알림을 받으면 그 턴의 **첫 호출**로 flush를 쓴다. 결과 검토·브라우저 확인 같은 다른 일 뒤로 미루지 않는다.
- 알림이 여러 개 몰려도 모아 두지 말고, 받은 것부터 알림마다 flush 1개씩 쓴다.
- 리드 자신의 단계 전환(검토 시작, 수정 시작)도 그 작업의 첫 도구 호출과 같은 메시지에 보낸다.

| 시점 | flush 내용 |
|---|---|
| 실행 시작 | `runs/{runId}` 생성 + flush: run(title, goal, status running, startedAt), 리드(`main`, role lead, 내 모델), 어드바이저가 있으면 함께 |
| 서브에이전트/세션/워크플로 투입 직전 | 새 에이전트들(parent=투입한 쪽, team, status working, task) + `spawn` 이벤트 각각 |
| 백그라운드 알림 도착(완료/실패) | 해당 에이전트 status done/error, 토큰·도구 수(알림에 있으면) + `result`/`error` 이벤트 + `results` 카드 |
| SendMessage로 지시/질문 | `msg` 이벤트(from=main, to=대상) |
| 리드 단계 전환(탐색→구현→검증) | 리드 `now`/`progress` 갱신 + 필요 시 `note` |
| 같은 오류 반복·차단 | `error` 이벤트, status error 또는 waiting |
| 실행 종료 | run(status done, summary, endedAt) + 리드 done + 최종 `results` 요약 카드 |

매핑 규칙:
- 메인 세션 = `role: lead`, id `main`. Agent 도구 서브에이전트 = `worker`(Explore·general-purpose 등) 또는 `fork`(subagent_type fork). start_session 세션 = `session`. 리뷰·자문 역할 = `advisor`.
- 모델명은 소문자 짧게(`sonnet 5.5`, `haiku 5.5`, `opus 5.5`).
- Workflow 내부 에이전트는 알림/결과로 확인된 것만 기록한다. 추측으로 진행률을 꾸며내지 않는다.

비용 가드: 실행당 flush 대략 5~30개. 단일 작업·서브에이전트 1개짜리 짧은 일에는 쓰지 않는다. db 한도 25,000 문서 — 오래된 실행 정리는 사용자가 원할 때만(삭제는 확인 후).

## 4. 실행 예 (요약)
```
[시작]  batch: set runs/r20261127-1542-auth-audit {title, goal, startedAt}
               set runs/r20261127-1542-auth-audit/flushes f0001 {seq:1, run:{...}, agents:[main], events:[note]}
[투입]  batch: set .../flushes f0002 {seq:2, agents:[search, grep(parent main, team scout)], events:[spawn×2]}
[완료]  batch: set .../flushes f0003 {seq:3, agents:[{id:search,status:done}], events:[result], results:[...]}
[종료]  batch: set .../flushes f00NN {seq:NN, run:{status:done, summary}, agents:[{id:main,status:done}], results:[요약]}
```
사용자에게는 실행 시작 때 대시보드 링크를 한 번만 알린다(`#runId`를 붙이면 그 실행으로 바로 열림). 이후엔 기록을 조용히 이어간다.

## 5. 페이지가 보여주는 것 (참고)
- **흐름(가운데)**: 맨 위 리드 카드 → `parent` 깊이와 `team`별 밴드(카드가 폭에 맞춰 줄바꿈) → 맨 아래 "back to 리드 · 복귀 n/m". 부모 → 버스 → 자식 배선, 진행 중이면 흐르는 점선. 이벤트는 패킷 + 말풍선.
- **보기 조절**: 흐름 영역 오른쪽 아래 툴바(− / 배율 / + / 맞춤 / 크게 보기). 마우스로 끌어 이동(글자 선택·요소 끌림은 막음), 휠 상하·Shift+휠 좌우 이동, Ctrl+휠 확대·축소, 키보드 `+ − 0 F 화살표`, `Esc`로 크게 보기 해제. 기본은 "맞춤"(새 에이전트가 오면 자동으로 전체가 보이게). 오른쪽 패널 너비·아래 패널 높이는 경계를 끌어 조절하고 브라우저에 기억된다.
- **카드**: 이름·모델·맡은 일·진행 막대(모르면 불확정)·지금 하는 일·상태·경과 시간(1초마다 갱신)·토큰/도구.
- **어드바이저 레일(왼쪽)**: 요청 ◇ / 조언 » 기록, calls·tokens read·경과.
- **결과(오른쪽)**: 한 줄 요약 목록, 누르면 본문·파일이 펼쳐짐. 카드를 누르면 에이전트 상세.
- **아래**: 세션 로그(시간순 한 줄, 누르면 펼침) / 타임라인(활동 구간 + 이벤트 눈금, x축 = flush seq).
- 헤더: 실행 상태·작업 중 수·완료 n/m·토큰·도구 호출·경과 + 모델·역할 범례. 맨 아래 상태줄. 실행이 2개 이상이면 선택 드롭다운, 새 실행이 생기면 자동으로 따라감.
