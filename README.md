# AI Personalization Lab

당신과 오래 대화한 ChatGPT는 어떤 유형의 AI로 개인화되어 있을까요?
진단 프롬프트를 복사해서 자신의 ChatGPT에 붙여넣고 결과를 확인해보는
무료 웹페이지입니다.

- 성격 검사가 아닙니다. 분석 대상은 사용자와 장기간 상호작용한 결과
  나타나는 **ChatGPT의 행동적 특성**입니다.
- OpenAI API를 호출하지 않고, 로그인·데이터베이스·대화 수집이 없는
  순수 정적 사이트(MVP)입니다.

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
index.html   메인 랜딩 페이지 (히어로, 개념 설명, 사용법, 진단 프롬프트, 결과 예시, 공유 폼)
style.css    모바일 우선 반응형 스타일
script.js    진단 프롬프트 데이터, 클립보드 복사, 공유 카드 생성 로직
```

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

| 이벤트 | 발생 시점 |
|---|---|
| `page_view` | 페이지 로드 (Umami 기본 제공, 자동 전송) |
| `start_observation` | 히어로의 "내 AI 관찰하기" 클릭 |
| `copy_prompt` | 진단 프롬프트 클립보드 복사 **성공** 시 |
| `reach_result_input` | 결과 붙여넣기 textarea 최초 focus |
| `result_generated` | 결과 파싱 성공(= 결과 카드 생성 성공). Schema 1.0 JSON 또는 레거시 `[SHARE_RESULT]` 중 어느 쪽이 파싱됐는지는 구분해 전송하지 않습니다 |

### 완주 후 참여 이벤트 (퍼널 단계 아님, 순차적이지 않음)

| 이벤트 | 발생 시점 |
|---|---|
| `result_image_saved` | 결과 카드 PNG 생성·다운로드 성공 시 |
| `share_text_copied` | "텍스트 복사하기" 클립보드 복사 성공 시 |
| `share_sheet_opened` | "결과 공유" 클릭으로 Web Share API 호출 시. 브라우저가 실제 전송 완료 여부를 신뢰성 있게 알려주지 않으므로, 공유 시트를 연 것까지만 측정하고 전송 성공 여부는 측정하지 않습니다. |
