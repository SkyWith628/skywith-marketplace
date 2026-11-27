# stack-diagram — 외부 스킬 사본

이 폴더는 외부 스킬을 **수정하지 않고 그대로 복사**한 것이다. 호출명은 `skywith:stack-diagram`.

| 항목 | 값 |
|---|---|
| 원본 | https://github.com/caru-ini/stack-diagram (`skills/stack-diagram/`) |
| 버전 | v0.8.0 (커밋 `1b375941783ff0b1503b91afa079cdf59a966523`) |
| 복사한 날 | 2026-11-27 |
| 라이선스 | MIT (`LICENSE`), 폰트는 SIL OFL 1.1 (`assets/fonts/`) |

## 쓸 때 주의
- 로고는 실행할 때 svgl·devicon·GitHub raw·jsdelivr·클라우드 회사 사이트에서 받는다(네트워크 필요). PNG에는 Playwright + Chromium이 필요하다.
- 7단계 `scripts/share.py`는 그림을 **공개 갤러리(stacks.caru.moe)에 올린다**. 학교·회사 이름, 내부 호스트가 들어간 그림은 올리지 않는다. 제안이 나오면 거절하면 된다.

## 원본 갱신 방법
1. 원하는 태그의 `skills/stack-diagram/`을 받아 이 폴더를 덮어쓴다(`UPSTREAM.md`는 남긴다).
2. `scripts/`의 접속 주소가 바뀌었는지 diff로 확인하고, 위 표의 버전·커밋·날짜를 고친다.
