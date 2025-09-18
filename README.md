
<p align="center">
    <img src = "./public/favicon.png" height = "96px" alt = "Hyuns PKM Utils 아이콘"/>
</p>
<h1 align="center">hyuns-pkm-utils-web</h1>

PKM(Personal Knowledge Management) 워크플로에서 자주 반복되는 아트워크 작업을 빠르게 끝낼 수 있도록 만든 웹 도구 모음입니다. 디자인 툴을 열지 않고도 아이콘, 배경, 라인 배너를 브라우저에서 즉시 만들어 다운로드할 수 있습니다.

## 주요 기능
- `SVG 아이콘 생성`: SVG 코드에 배경, 여백, 색상을 입혀 아이콘과 배경 이미지를 동시에 만들어 줍니다.
- `이미지 아이콘 생성`: 이미지 파일을 업로드하면 1:1 아이콘과 헤더/배너용 배경 이미지를 자동으로 생성합니다.
- `라인 생성`: 노션 등에서 사용할 얇은 라인 배너를 원하는 길이·굵기·컬러로 만들어 SVG/PNG로 내려받을 수 있습니다.
- 공통 기능: 색상 프리셋, 파일명 관리, SVG → PNG 변환, 클립보드 복사, 즉시 미리보기 등을 지원합니다.

## 기술 스택
- React 19 + TypeScript
- React Router v7 (SPA 모드)
- Vite 6
- Tailwind CSS v4, Radix UI, Lucide Icons
- Sonner 토스트, pnpm 워크플로

## 빠르게 시작하기
### 요구 사항
- Node.js 20 이상 권장
- 패키지 매니저: pnpm (또는 npm/yarn 변환 사용 가능)

### 설치
```bash
pnpm install
```

### 개발 서버 실행
```bash
pnpm dev
```
- 기본 접속 주소: `http://localhost:5173`

### 프로덕션 빌드
```bash
pnpm build
```
- 출력물은 `build/client`(정적 파일)과 `build/server`(SSR 번들)로 생성됩니다.

### 타입 검사
```bash
pnpm typecheck
```

## 프로젝트 구조 (요약)
```text
app/
├─ routes/
│  ├─ home.tsx              # 도구 허브 및 소개 화면
│  ├─ svg-icon/page.tsx     # SVG 아이콘 생성
│  ├─ image-icon/page.tsx   # 이미지 아이콘 생성
│  └─ line/page.tsx         # 라인 배너 생성
├─ components/ui            # 공통 UI 컴포넌트 (Radix 기반)
├─ containers               # 레이아웃 및 사이드바 컨테이너
├─ data                     # 색상 프리셋 등 정적 데이터
├─ hooks, lib               # 유틸리티 훅과 헬퍼
└─ provider.tsx             # 전역 상태 및 토스트 Provider
```

## 배포 메모
- `pnpm build` 결과를 Node 환경에서 `pnpm start`(= `react-router-serve`)로 제공하거나, 원하는 호스팅에서 정적/서버 번들을 활용할 수 있습니다.
- Dockerfile이 포함되어 있어 `docker build -t hyuns-pkm-utils-web .` 형태로 이미지 빌드가 가능합니다.

## 기여 및 문의
- 이 저장소는 개인 실험 프로젝트입니다. 개선 아이디어나 버그 제보는 Issue 또는 Pull Request로 남겨주세요.
- 제작자: [HyunsDev](https://hyuns.dev)
