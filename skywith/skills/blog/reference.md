# blog 스킬 참고서 — 스타일 + 본문 골격

DRAFT 단계에서 이 파일을 읽는다. 두 부분:
**① 디자인 스타일(다크 전용)** · **② 복습(review) 골격**
작성 규칙(말투·깊이·예제 배치 등)은 `SKILL.md`가 단일 출처다. 여기 골격엔 구조만 있다.

---

# ① 디자인 스타일 — 다크 전용 + 스캔 효율

특정인 블로그를 베끼지 않고 널리 쓰이는 기술 블로그 관례(가독성 우선 타이포그래피)를 추출했다.
**디자인은 다크모드 전용**이다 (사용자 확정 방향). 실제 색상 HEX는 `tistory.html`에 구현돼 있다.

## 1. 폰트 (Typography)
```
Pretendard (프리텐다드): 한글 웹폰트 사실상 표준. Apple SD고딕 계열 높은 가독성 +
  무료(상업용) + 경량 + 가변폰트. 대한민국 정부 디자인시스템도 채택.
```
- **본문**: `Pretendard` → 없으면 `system-ui` → OS 산세리프 폴백
- **코드**: `'D2Coding'` → `ui-monospace` → `Menlo` → `Consolas` 순 폴백
- Pretendard 웹 로딩:
  `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@latest/dist/web/static/pretendard.css">`
  (⚠️ 아티팩트·일부 플랫폼은 외부 폰트 차단 → system-ui 자동 폴백. 로컬/블로그에선 정상.)

## 2. 크기 · 간격
| 요소 | 값 | 이유 |
| --- | --- | --- |
| 본문 글자 | **17px** (최소 16px) | 가독성 하한선 |
| 행간 | **1.8**(본문) / 1.35(제목) | 긴 기술 글은 넉넉해야 안 답답함 |
| 콘텐츠 폭 | **720~760px** (한 줄 45~75자) | 너무 넓으면 다음 줄 놓침 |
| 정렬 | **왼쪽 정렬** | 양쪽정렬 금지 |

## 3. 색 (Color) — 다크 전용
순수 검정(#000) 배경은 피하고 살짝 든 다크 톤. 본문 대비 4.5:1 이상(WCAG AA).

| 용도 | 값 |
| --- | --- |
| 본문 글자 | `#e6e7ea` |
| 흐린 글자(muted) | `#9aa0ab` |
| 포인트(링크) | `#7da9ff` / 보조 `#b794f6` |
| 구분선(border) | `#2c2e35` |
| 인라인 코드 | 배경 `#262932`, 글자 `#e9d9b0` |
| 코드 블록 | 배경 `#0f1013`, 글자 `#e6e6e6`, **테두리 없음** |
| 콜아웃 | note `#151d2b` / tip `#132318` / warn `#241f12` / use `#1d1830` |
| 개념 지도·TOC | 배경 `#1e2026`, 박스 `#26282f` |

> **티스토리에 붙일 땐 컨테이너 배경을 `transparent`로.** 블로그 자체 다크 배경을 그대로 써서
> "카드 안 카드" 이중 배경을 피한다. 코드 블록도 테두리 없이 단일 배경 한 겹만.

## 4. 구성 요소
- **개념 지도(concept map)**: 도입부에 개념들의 관계를 한눈에 보여주는 다이어그램 (아래 5번)
- **콜아웃**: 💡 팁(tip) / ⚠️ 주의(warn) / 📌 핵심(note) / 🔗 어디에 쓰나(use) — 색 있는 박스로 리듬
- **코드 블록**: 어두운 배경 + 구문 강조, 가로 스크롤(줄바꿈 강제 금지), 결과는 주석으로
- **표**: 얇은 구분선, 헤더 강조, 좁은 화면 가로 스크롤. **"예시/매칭 결과" 열**을 넣어 스캔 가능하게
- **제목 위계**: h1(글 제목) → h2(섹션). 3단계 이상 중첩 지양
- **여백**: 요소 사이 숨 쉴 공간

## 5. 개념 지도 패턴 (복습 모드 권장)
도입부에서 "이 주제의 조각들이 어떻게 맞물리는가"를 다이어그램 한 장으로.
예 — 정규식: `무슨 글자? / 몇 번? / 어디서? / 어떻게 묶어?` 4칸으로 6개 개념 관계 압축.
독자가 이후 내용을 "따로 노는 목록"이 아니라 "지도의 각 칸을 채우는 이야기"로 읽게 만드는 장치.
`tistory.html`의 `div.map > (c>mb / ar / row>cell>q,s / ft)` 구조로 렌더링.

**근거**: Pretendard [GitHub](https://github.com/orioncactus/pretendard) — 무료·경량·정부 디자인시스템 채택 /
타이포그래피 [USWDS](https://designsystem.digital.gov/components/typography/) — 45~75자/줄, 왼쪽정렬, WCAG 4.5:1

---

# ② 복습(review) 골격 — HTML (바로 작성)

**markdown 없이 처음부터 이 HTML을 채운다.** 아래는 `tistory.html`의 `{{CONTENT}}` 자리에 들어갈 본문
(바깥 `.rp` 래퍼는 `tistory.html`이 제공하므로 여기엔 넣지 않는다). 클래스는 `tistory.html` 참조.

```html
<!-- title: <핵심 개념> 제대로 이해하기 | date: <YYYY-MM-DD> | tags: <주제>, <프레임워크>, 복습 -->
<!-- ↑ 티스토리 편집기에서 제목·태그 입력용 메모. 본문엔 아래 {{CONTENT}}만 붙여넣는다. -->

<!-- 도입: 자료 가볍게 리뷰(정형구 없이). 무슨 자료였고, 뭘 다뤘고, 이 글에서 어떤 흐름으로 짚을지. -->
<p><도입 한두 문단></p>

<h2>1. 큰 그림 — 조각들이 어떻게 맞물리나</h2>
<!-- 개념 지도: 핵심 개념들이 서로 어떤 관계인지 한 장으로 (reference.md ① 5번) -->
<div class="map">
  <div class="c"><span class="mb"><b><주제></b> 을 이렇게 쪼갠다</span></div>
  <div class="ar">▼</div>
  <div class="row">
    <div class="cell"><span class="q"><질문1></span><설명><span class="s"><코드힌트></span></div>
    <div class="cell"><span class="q"><질문2></span><설명><span class="s"><코드힌트></span></div>
    <div class="cell"><span class="q"><질문3></span><설명><span class="s"><코드힌트></span></div>
    <div class="cell"><span class="q"><질문4></span><설명><span class="s"><코드힌트></span></div>
  </div>
  <div class="ft"><이후 각 섹션이 지도의 한 칸을 채운다는 예고></div>
</div>

<h2>2. <첫 개념></h2>
<!-- 연결문장 → 용어 정의 → 직관 → [공식 설명+예제 ↔ 실습 코드 대조] → 🔗 어디에 쓰나 → 다음 전환 -->
<p><앞 섹션에서 이어받는 연결 문장></p>
<p><code><용어></code> (한국어 의미): 한 줄 설명 / 예시</p>
<p><직관·비유 한두 줄></p>

<p><b>공식 문서는 이렇게 설명합니다.</b> <공식 설명을 내 언어로 + 짧은 인용>
   <span class="src">(출처: <docs URL>)</span></p>
<pre><span class="cm"># 공식 문서 예제 — 대조 기준</span>
<span class="kw">def</span> <span class="fn">example</span>():
    <span class="kw">return</span> <span class="st">"..."</span></pre>

<p><b>강의 실습에서는 이렇게 썼습니다.</b></p>
<pre><실습 코드>  <span class="cm"># 실행 결과: ...</span></pre>

<!-- 대조 표. 실습 없으면 이 표 생략, 공식 예제 없으면 "공식 예제 없음(설명만)" -->
<div class="ts"><table>
  <thead><tr><th>항목</th><th>공식 문서 예제</th><th>실습 코드</th><th>차이 · 이유</th></tr></thead>
  <tbody><tr><td><...></td><td><...></td><td><...></td><td><왜 변형했나 / 실무에선></td></tr></tbody>
</table></div>

<div class="box use"><span class="h">🔗 어디에 쓰나</span> — <이 개념의 실무 활용처 1~2개></div>

<p class="next">→ 다음은 <다음 개념>입니다.</p>

<h2>3. <둘째 개념></h2>
<!-- 동일 패턴: 연결 → 정의 → 공식 설명+예제 ↔ 실습 대조 → 🔗 → 전환. 개념 수만큼 반복. -->

<h2>치트시트 & 핵심 N가지</h2>
<div class="ts"><table>
  <thead><tr><th>용도</th><th>패턴</th></tr></thead>
  <tbody><tr><td><...></td><td><code><...></code></td></tr></tbody>
</table></div>
<div class="box tip">💡 딱 N가지만 기억하면 됩니다.<br>1. <...>　2. <...>　3. <...></div>

<h2>참고 자료</h2>
<ul>
  <li><a href="URL"><공식 문서/논문 제목></a></li>
</ul>
```

**콜아웃 매핑**: 💡 팁 `box tip` · ⚠️ 주의 `box warn` · 📌 핵심 `box note` · 🔗 어디에 쓰나 `box use`(`.h`로 제목 강조).
**구문강조 span**: 주석 `cm` · 문자열 `st` · 숫자 `nu` · 함수 `fn` · 키워드 `kw`.
