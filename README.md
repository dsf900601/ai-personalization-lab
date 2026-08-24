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
