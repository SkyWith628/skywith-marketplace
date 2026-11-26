# skywith-marketplace

SkyWith628 개인 Claude Code 플러그인 마켓플레이스입니다. 플러그인 하나(`skywith`)가 들어 있습니다. 스킬 목록과 관리 방법은 [skywith/README.md](skywith/README.md)에 있습니다.

## 새 기기에 설치
비공개 저장소라서 그 기기에서 GitHub 인증이 먼저 돼 있어야 합니다(`gh auth login` 또는 git 자격 증명).
```bash
claude plugin marketplace add SkyWith628/skywith-marketplace
claude plugin install skywith@skywith-local
```
설치 후 새 세션부터 적용됩니다. OneDrive 워크스페이스가 있는 기기라면 GitHub 대신 로컬 폴더(`<WorkSpace>/claude/marketplace`)를 등록해도 됩니다. 마켓플레이스 이름이 같으니 한 기기에는 둘 중 하나만 등록합니다.

## 업데이트
원본을 고친 기기에서 `skywith/.claude-plugin/plugin.json`의 `version`을 올리고 커밋·푸시합니다. 다른 기기에서는 아래를 실행합니다.
```bash
claude plugin marketplace update skywith-local
claude plugin update skywith@skywith-local
```
