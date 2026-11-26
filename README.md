# skywith-marketplace

SkyWith628 개인 Claude Code 플러그인 마켓플레이스입니다. 플러그인 하나(`skywith`)에 전역 규칙과 스킬이 들어 있습니다. 내용과 수정 방법은 [skywith/README.md](skywith/README.md)에 있습니다.

## 새 기기에 설치 (기기당 한 번)
비공개 저장소라서 먼저 GitHub 인증이 돼 있어야 합니다. 백그라운드 자동 갱신은 프롬프트를 못 띄우므로 git 자격 증명이 필요합니다.
```bash
gh auth login
gh auth setup-git
```
그다음 `~/.claude/settings.json`(Windows는 `%USERPROFILE%\.claude\settings.json`)에 아래를 합칩니다. 이미 있는 키는 유지하고 이 두 키만 추가합니다.
```json
{
  "extraKnownMarketplaces": {
    "skywith-local": {
      "source": { "source": "github", "repo": "SkyWith628/skywith-marketplace" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": {
    "skywith@skywith-local": true
  },
  "env": {
    "HANDOFF_DIR": "<iCloud 폴더>/_handoff"
  }
}
```
`HANDOFF_DIR`는 `시마이`·`드가자`가 인수인계 파일을 읽고 쓰는 폴더입니다. 기기마다 값이 다릅니다(`settings.json`은 동기화되지 않음).
| 기기 | 값 |
|---|---|
| Windows | `C:\\Users\\<사용자>\\iCloudDrive\\_handoff` (JSON 안에서는 `\\`) |
| Mac | `/Users/<사용자>/Library/Mobile Documents/com~apple~CloudDocs/_handoff` |

설정하지 않으면 스킬이 iCloud 기본 위치를 자동으로 찾습니다.
Claude를 한 번 실행하면 마켓플레이스를 받고 플러그인을 설치합니다. 같은 결과를 명령으로도 낼 수 있습니다.
```bash
claude plugin marketplace add SkyWith628/skywith-marketplace
claude plugin install skywith@skywith-local
```
설치 후 새 세션부터 적용됩니다. 확인: 세션에서 `/plugin`, 규칙이 들어왔는지는 첫 응답이 역할 태그(`[🏗️ 아키텍트]` 등)로 시작하는지 봅니다.

## 업데이트
레포에 푸시하면 자동 갱신 설정이 된 기기가 세션 시작 후 최대 10분 안에 받습니다. 바로 받으려면:
```bash
claude plugin marketplace update skywith-local
claude plugin update skywith@skywith-local
```
