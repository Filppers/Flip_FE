# Flip FE

## 사전 준비

- [Node.js](https://nodejs.org/) 20 이상
- npm (또는 yarn / pnpm / bun)

## 설치 및 실행

```bash
npm install
cp .env.sample .env
```

`.env` 파일에 아래 [환경 변수](#환경-변수)를 채워주세요.

## 환경 변수

`.env`는 프로젝트 루트에 생성하며 gitignore 처리됩니다.

| 변수 | 필수 여부 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | 필수 (Google 로그인) | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | 필수 (Google 로그인) | Google OAuth 클라이언트 시크릿 (서버 전용) |
| `OPENAI_API_KEY` | 필수 (여행 계획 생성) | `/api/chat`에서 사용하는 OpenAI API 키 (모델: `gpt-4o`) |
| `NEXT_PUBLIC_REDIRECT_URI` | 선택 | OAuth 리다이렉트 URI. 미설정 시 `http://localhost:3000/oauth/callback/google` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | 선택 | 지도 표시용 Google Maps API 키 |

> 참고: `src/api/config.tsx`에 백엔드 URL(`http://localhost:8080`)이 하드코딩되어 있으나 아직 사용되지 않습니다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 (기본 포트 3000) |
| `npm run build` | 프로덕션 빌드 생성 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint 실행 |

주요 라우트:
- `/` — Google 로그인 랜딩 페이지
- `/oauth/callback/[provider]` — OAuth 콜백
- `/trip/plan` — 여행 선호도 설정 및 AI 여행 계획

## API 라우트

| 라우트 | 메서드 | 설명 |
| --- | --- | --- |
| `/api/oauth/callback` | GET | Google 인증 코드를 사용자 프로필로 교환 |
| `/api/chat` | POST | 사용자 입력 기반 여행 계획 생성 |

## 기술 스택

Next.js 14.2 (Pages Router), React 18, Tailwind CSS, TanStack React Query, axios, Google OAuth, OpenAI, Google Maps

## 프로젝트 구조

```
src/
├── pages/          # 라우트 및 API 핸들러
├── components/     # UI 컴포넌트
├── constant/       # OpenAI 프롬프트 템플릿
├── api/            # Axios 설정 (백엔드 base URL)
├── constants.ts    # 선호도 옵션, Google 로그인 URL
└── styles/         # 전역 CSS
```
