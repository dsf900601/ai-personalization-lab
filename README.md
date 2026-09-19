# AI Personalization Lab

당신과 오래 대화한 ChatGPT는 어떤 유형의 AI로 개인화되어 있을까요?
서로 다른 상황의 짧은 질문 3개(Probe)에 대한 실제 응답을 모아
분석해보는 무료 웹페이지입니다.

- 성격 검사가 아닙니다. 분석 대상은 사용자와 장기간 상호작용한 결과
  나타나는 **ChatGPT의 행동적 특성**입니다.
- OpenAI API를 호출하지 않고, 로그인·데이터베이스·대화 수집이 없는
  순수 정적 사이트(MVP)입니다.
- 현재 사용자-facing 진단 흐름은 Probe 기반(Beta)이며, 아직 검증
  중인 방식입니다. 자세한 내용은 아래 "진단 흐름" 섹션을 보세요.

## 로컬에서 실행하기

빌드 과정 없이 순수 HTML/CSS/JS로만 되어 있습니다. 아래 중 편한 방법으로
확인하세요.

```bash
# 방법 1: 파일을 브라우저로 바로 열기
open index.html   # macOS
# 또는 브라우저에서 index.html 더블클릭

# 방법 2: 간단한 로컬 서버로 실행 (clipboard API 등을 위해 권장)
python3 -m http.server 8000
# 이후 브라우저에서 http://localhost:8000 접속
```

## 배포

정적 파일(`index.html`, `style.css`, `script.js`)만 있으면 되므로
GitHub Pages, Netlify, Vercel, Cloudflare Pages 등 어떤 정적 호스팅에도
그대로 올리면 됩니다. 별도 빌드 설정이 필요 없습니다.

## 파일 구조

```
index.html   메인 랜딩 페이지 (히어로, 개념 설명, 사용법, Probe 기반 진단 진입점, 결과 예시, 공유 폼)
style.css    모바일 우선 반응형 스타일
script.js    Probe/Analyzer Prompt 데이터, (내부 보존용) 기존 진단 프롬프트 데이터, 클립보드 복사, 공유 카드 생성 로직
```

## 진단 흐름 (Probe-based, Beta)

사이트의 진단 진입점은 Probe 기반 방식입니다. 사용자가 하나의 대형
Diagnostic Prompt를 직접 복사해서 붙여넣던 이전 UI는 페이지에서
제거되었고, 지금은 이 흐름이 진단 영역 자체입니다:

```
MY AI TYPE 소개 → 진단 시작 → Probe A → Probe B → Probe C
  → Analyzer Prompt 생성 → 분석 결과 입력 → 기존 Result UI → 기존 Share Card
```

- 서로 다른 상황의 짧은 Probe 3개(Exploration / Action / Reevaluation,
  `script.js`의 `PROBE_A`/`PROBE_B`/`PROBE_C`, 현재 v0.1·실험 문구)를
  순서대로 복사해 사용자가 평소 쓰는 AI에 입력하고, 그 응답을 매 단계
  붙여넣습니다. 세 응답이 모두 있어야 다음 단계로 진행됩니다.
- 세 응답이 모두 모이면 `buildAnalyzerPrompt()`가 별도의 Analyzer
  Prompt를 생성합니다. 이 Analyzer Prompt는 기존 Diagnostic Prompt와는
  독립된 텍스트이지만(의도적으로 공유 상수로 리팩터링하지 않음),
  **요구하는 최종 출력 형식은 기존 Schema 1.0과 완전히 동일**합니다.
- 생성된 Analyzer Prompt를 복사해 실행한 결과는, 이 페이지의 기존
  "결과 붙여넣기"(`#resultInput` / `#parseBtn`)에 그대로 붙여넣으면
  됩니다 — 별도의 파서나 결과 화면을 새로 만들지 않고, 기존
  parser/normalizer/Result UI/Share Card 파이프라인을 그대로 재사용합니다.
- Analyzer Prompt는 "Probe가 직접 요구한 행동"과 "AI가 자발적으로 추가한
  행동"을 구분하도록 명시적으로 요구합니다(Prompt Compliance
  Exclusion). Probe 질문에 답한 것 자체는 어떤 Axis의 Evidence도 아니며,
  질문이 요구하지 않은 행동만 Evidence 후보가 됩니다.
- 아직 API 연동·계정·히스토리는 없습니다. Probe 흐름 전용 analytics
  이벤트(`probe_beta_start`, `probe_a_copied`, `probe_b_copied`,
  `probe_c_copied`, `analyzer_prompt_copied`)만 기존 `track()` 패턴으로
  추가되어 있으며, Probe 응답 내용이나 진단 결과는 전송되지 않습니다.
- Probe 방식은 아직 실제 진단 검증이 끝나지 않아, 화면에 "Beta" 표시와
  "아직 검증 중인 진단 방식이에요" 안내를 유지합니다.

### (개발 문서) 기존 DIAGNOSTIC_PROMPT — 삭제하지 않고 내부 보존

`script.js`의 `DIAGNOSTIC_PROMPT` 상수와 그 전용 파서 진입점
(`#promptText`/`#copyBtn` DOM 연결부, 여전히 `if (el)`로 안전하게
가드되어 있음), 그리고 Schema 1.0 검증/정규화
(`findSchemaV1Json`/`validateSchemaV1`/`normalizeSchemaV1`), 6-Axis
semantics, Role/Habit/Derived Pattern 규칙, Type Confidence Gate,
Result UI, Share Card, 레거시 `[SHARE_RESULT]` 파싱 호환성은 모두 코드
상에 그대로 남아 있습니다. 현재 UI(`index.html`)에는 이 긴 프롬프트를
노출하는 화면이 없지만, 이는 **삭제된 것이 아니라 의도적으로 보존된
것**입니다 — Probe 기반 진단 방식이 실제로 유효한지 검증될 때까지
rollback 경로 및 두 방식의 결과를 서로 비교할 기준(reference)으로
남겨둡니다.

## Share Card v1 (공유 이미지 정보 구조)

공유 이미지(PNG, `script.js`의 `buildCardSVGv1`)는 **Type + 6축 행동
프로필 + 역할**을 핵심 정보 계층으로 사용합니다.

- 6축은 진단 엔진이 반환한 Axis Result(Schema 1.0 `axes[]`)를 있는
  그대로, 엔진이 준 순서대로 표시합니다. 프론트엔드가 임의로 일부만
  선택하거나 중요도를 랭킹하지 않습니다.
- 프론트엔드는 새로운 진단 점수나 진단 결과를 생성하지 않습니다 —
  표시(display)만 담당하며, 엔진이 내리지 않은 판단을 카드에서
  합성하지 않습니다.
- Type Label이 null이어도 6축 프로필과 확인된 역할만으로 유효한 결과
  카드가 성립합니다(빈 결과로 취급하지 않음).

## 익명 퍼널 분석 (Analytics)

`myaitype.kr` 프로덕션에서만, 자동화 브라우저(`navigator.webdriver`)를
제외하고 [Umami Cloud](https://cloud.umami.is)로 익명 이벤트를 전송합니다.
로더는 `index.html`의 `<head>`에, 이벤트 발생 지점은 `script.js`의
`track()` 호출부에 있습니다.

- 쿠키 없음, 개인 식별자 없음. 전송되는 값은 **이벤트 이름뿐**입니다.
- 프롬프트 전문, 붙여넣은 ChatGPT 응답, 결과 JSON(Schema 1.0)이나
  레거시 `SHARE_RESULT` 원문, 그 안의 유형·역할·행동 축 등 어떤 필드도,
  만족도·자유 의견 텍스트도 절대 전송하지 않습니다.
- 각 이벤트는 페이지 로드당 최초 1회만 기록됩니다(재클릭·재생성으로
  인한 중복 집계 방지).
- Umami 대시보드에서 사이트를 만든 뒤, `index.html`의
  `REPLACE_WITH_UMAMI_WEBSITE_ID`를 실제 website ID로 교체해야 이벤트가
  수집되기 시작합니다.

### 메인 퍼널 (순차 이벤트)

Probe 흐름이 사이트의 진단 진입점이 되면서, 아래가 현재의 메인 퍼널
순서입니다.

| 이벤트 | 발생 시점 |
|---|---|
| `page_view` | 페이지 로드 (Umami 기본 제공, 자동 전송) |
| `start_observation` | 히어로의 "내 AI 관찰하기" 클릭 |
| `probe_beta_start` | 진단 진입점의 "진단 시작하기" 클릭 |
| `probe_a_copied` / `probe_b_copied` / `probe_c_copied` | 각 Probe 질문 클립보드 복사 **성공** 시 |
| `analyzer_prompt_copied` | Analyzer Prompt 클립보드 복사 **성공** 시 |
| `reach_result_input` | 결과 붙여넣기 textarea 최초 focus |
| `result_generated` | 결과 파싱 성공(= 결과 카드 생성 성공). Schema 1.0 JSON 또는 레거시 `[SHARE_RESULT]` 중 어느 쪽이 파싱됐는지는 구분해 전송하지 않습니다 |

Probe에 붙여넣은 AI 응답이나 생성된 Analyzer Prompt 내용은 어떤 이벤트에도
포함되지 않습니다.

`copy_prompt`(기존 진단 프롬프트 클립보드 복사 이벤트)는 그 UI
(`#copyBtn`)가 현재 페이지에서 제거되어 있어 지금은 발생하지 않습니다.
코드 자체는 `DIAGNOSTIC_PROMPT`와 함께 보존되어 있으므로, 그 UI가 다시
노출되면 별도 수정 없이 다시 집계됩니다.

### 완주 후 참여 이벤트 (퍼널 단계 아님, 순차적이지 않음)

| 이벤트 | 발생 시점 |
|---|---|
| `result_image_saved` | 결과 카드 PNG 생성·다운로드 성공 시 |
| `share_text_copied` | "텍스트 복사하기" 클립보드 복사 성공 시 |
| `share_sheet_opened` | "결과 공유" 클릭으로 Web Share API 호출 시. 브라우저가 실제 전송 완료 여부를 신뢰성 있게 알려주지 않으므로, 공유 시트를 연 것까지만 측정하고 전송 성공 여부는 측정하지 않습니다. |
