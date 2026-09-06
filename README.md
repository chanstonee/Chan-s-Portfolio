# CHANSTONE Portfolio

Framer에서 직접 제작한 CHANSTONE 포트폴리오를 GitHub Pages 등 정적 호스팅으로 옮긴 프로젝트입니다.

**공개된 Framer의 HTML·CSS·실행 모듈을 로컬 파일로 이식했습니다.** 원본 애니메이션·레이아웃의 보존을 우선하며, 수작업으로 새로 작성한 React 컴포넌트 소스나 Framer 편집기 파일은 아닙니다. Framer 편집기에서 변경한 내용이 자동으로 동기화되지는 않습니다.

## 전달 ZIP 사용

- `CHANSTONE-GitHub.zip`: 압축을 푼 **내용물**을 GitHub 저장소에 올립니다. ZIP 파일 자체를 저장소에 올리지 않습니다. 빌드 스크립트와 자동 배포 설정이 포함됩니다.
- `CHANSTONE-deploy.zip`: 루트 경로(`/`)로 빌드한 완성 파일입니다. 일반 정적 호스팅에 압축을 푼 내용물을 올립니다. GitHub의 저장소별 하위 경로 사이트에는 위 GitHub ZIP과 Actions 방식을 사용합니다.

## 바로 실행

Node.js 20 이상을 설치한 뒤 이 폴더에서 실행합니다. 외부 npm 패키지는 필요 없습니다. 첫 빌드에서 압축 리소스가 자동으로 복원됩니다.

```sh
npm run build
npm run dev
```

브라우저에서 `http://127.0.0.1:4173/`을 엽니다. 파일을 더블클릭하는 `file://` 방식은 ES 모듈을 지원하지 않으므로 사용하지 않습니다.

```sh
npm run check
```

## GitHub Pages 배포

대상 저장소: https://github.com/chanstonee/Chan-s-Portfolio

WORK 섹션의 프로젝트는 COLUMN/LIST 모드 모두 현재 탭에서 상세 페이지로 이동합니다.

1. GitHub에 저장소를 만들고 이 프로젝트의 파일을 `main` 브랜치에 올립니다. `.github/workflows/pages.yml`도 반드시 포함합니다.
2. 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 선택합니다.
3. **Actions → Deploy portfolio to GitHub Pages → Run workflow**를 실행합니다. 이후 `main`에 올릴 때마다 자동 배포됩니다.
4. 완료되면 Actions의 deployment 링크 또는 Settings → Pages의 주소로 접속합니다.

워크플로는 저장소 이름에 따른 하위 경로(`/저장소명/`)를 자동 적용합니다. 사용자 사이트(`사용자명.github.io`)와 Pages의 커스텀 도메인 설정도 Pages가 제공한 주소로 빌드합니다. GitHub에 올린 뒤 공개 배포는 자동 배포 워크플로가 담당합니다.

Git을 사용하는 경우:

```sh
git init
git add .
git commit -m "Add CHANSTONE portfolio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

GitHub Desktop으로 폴더를 추가해 Publish repository를 사용해도 됩니다. `dist/`와 `evidence/`는 저장소 업로드 대상에서 제외됩니다.

## 다른 정적 호스팅

`npm run build` 후 **dist 폴더 내용 전체**를 호스팅 루트에 올립니다. 서버·데이터베이스·API 키가 필요하지 않습니다. 원본 미디어·폰트·JS가 로컬에 포함되어 있습니다.

하위 디렉터리에 배포할 때:

```sh
BASE_PATH=/portfolio/ npm run build
```

Windows에서는 `config/site.json`의 `basePath`를 `/portfolio/`로 수정한 후 `npm run build`를 실행할 수 있습니다. 기본값은 `/`입니다. CMS 인덱스 보존 때문에 지나치게 긴 저장소 경로는 빌드에서 거부될 수 있습니다. 이 경우 짧은 저장소 이름 또는 사용자 사이트·커스텀 도메인을 사용합니다. SEO canonical 주소가 필요하면 `siteUrl`에 실제 사이트 주소를 입력합니다.

## 문의 폼

Framer의 서버 전송 기능은 정적 호스팅으로 함께 이전할 수 없습니다. 현재 폼은 입력값을 검증하고 `chan_stone@naver.com` 앞으로 **메일 초안**을 엽니다. 방문자가 메일 앱에서 전송해야 실제로 발송됩니다. 전송 완료로 오인할 수 있는 성공 메시지는 표시하지 않습니다. 메일 앱이 연결되지 않은 환경에서는 이메일 주소를 복사해 직접 연락해야 합니다.

수신 주소는 `config/site.json`의 `email`을 수정합니다. 이메일 연결과 문의 폼을 변경하는 코드는 `src/self-host.js`에 있습니다. 별도 이메일 서비스나 서버를 연결하면 실제 웹 폼 전송으로 확장할 수 있습니다.

## 파일 구성 및 수정

| 경로 | 역할 |
|---|---|
| `source/home.html` | 원본 메인 HTML·CSS 및 초기 화면 |
| `source/projects-*.html` | 프로젝트 5개의 원본 상세 HTML |
| `source/packed/` | 이미지·폰트·실행 모듈 압축 묶음. 빌드 시 자동 복원 |
| `source/files/` | 원본 이미지·영상·폰트·CMS 데이터·Framer 실행 모듈 |
| `source/manifest.json` | 원본 URL과 로컬 파일 매핑 |
| `source/unused-images.json` | 제거된 이미지의 숨은 Framer 참조를 로컬 대체 이미지로 연결하는 목록 |
| `src/self-host.js` | 메일 연결·문의 폼·접근성 보완 |
| `src/image-placeholder.svg` | 숨은 이전 참조가 외부 이미지를 요청하지 않게 하는 투명 대체 이미지 |
| `config/site.json` | 이메일·배포 경로·사이트 주소 |
| `scripts/build.mjs` | 모든 정적 참조를 로컬 경로로 변환 |
| `scripts/serve.mjs` | 영상 Range 요청을 지원하는 로컬 서버 |
| `.github/workflows/pages.yml` | GitHub Pages 자동 배포 |
| `dist/` | 빌드 결과. 이 폴더 전체를 배포 |
| `ANALYSIS.md` | 구조·사이즈·인터랙션 이식 메모 |
| `design-qa.md` | 실제 브라우저 검증 결과 |

현재 사이트에서 쓰는 이미지만 52개 보존했습니다. 공통 이미지는 `avatar.png`, `home-tv-frame.png`처럼 용도를 이름에 적었고, 프로젝트 이미지는 `dssystem-01.jpg`, `playon-01.jpg`처럼 프로젝트별 순번으로 정리했습니다.

이미지를 교체하려면 먼저 `npm run build`로 `source/files/`를 복원하고, 읽기 쉬운 해당 파일을 같은 형식·파일명으로 바꿉니다. 이후 `npm run pack-assets`와 `npm run build`를 실행하고 압축 묶음과 메타데이터를 커밋합니다. 이미지 비율을 유지하면 원본 레이아웃이 유지됩니다. 상세 이미지 속 문구는 이 프로젝트에서 재작성하지 않았습니다.

본문 텍스트를 바꾸려면 HTML 초기 화면과 해당 Framer 실행 모듈 양쪽을 수정해야 합니다. 상세 본문의 동적 데이터는 바이너리 CMS 파일에도 들어 있습니다. 한쪽만 바꾸면 화면이 로드되면서 원래 문구로 돌아갈 수 있습니다. 자주 수정하는 사이트로 확장하려면 추후 편집하기 쉬운 컴포넌트와 콘텐츠 데이터로 분리하는 작업이 적합합니다.

## 범위

메인, MTS Design System, SH MY CAR, AI PHOTO BOOTH, GACHA APP, CAPTAIN CRIX, 원본 404 화면을 포함합니다. 원본 텍스트·이미지를 보존했습니다. 사용자 요청에 따라 Made in Framer 플로팅 배지는 모든 페이지에서 제거했습니다. Framer 편집기 호출과 Framer 분석 스크립트는 독립 호스팅에서 제거했습니다.

소스에는 공개 웹페이지의 산출물만 포함하며 계정 로그인 정보는 포함하지 않습니다. 이미지·폰트·템플릿의 기존 사용권은 별도로 유지됩니다. 원본 Framer의 편집 가능한 프로젝트, 비공개 설정, 서버 기능을 내보낸 파일은 아닙니다.
