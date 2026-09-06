# 원본 및 이식 메모

확인한 원본: https://chanstone.framer.website/ 및 사용자 로그인 상태의 CHANSTONE Framer 프로젝트.

## 레이아웃

Framer Layers에서 Desktop / Tablet / Phone과 `smooth-scroll`, `glitch-gif`, `loader`, `section-hero`, `section-intro`, `section-work`, `section-approach`, `section-services`, `section-about`, `section-contact`, `menu-overlay`를 확인했습니다.

| 항목 | 원본 설정 또는 측정 |
|---|---|
| Desktop | 1200px 이상 |
| Tablet | 810–1199px |
| Phone | 809px 이하 |
| Hero | 폭 Fill, 높이 100vh, `Others/DynamicViewport`의 `withDvh` override |
| Hero desktop 패딩 | 위 96px, 오른쪽/아래/왼쪽 64px |
| Hero Stack gap | 8px |
| 데스크톱 상세 본문 | 1440px 화면에서 1008px, 좌우 각 216px |
| 모바일 상세 본문 | 390px 화면에서 326px, 좌우 각 32px |
| 기본 색 | Dark #242424, Grey #9e9e9e, White #fff 및 원본 토큰 |
| 서체 | Geist, Geist Mono, Lemon, Inspiration, Inter, Noto Sans KR, SUIT, HUWebGulim |

## 인터랙션

- 로딩 퍼센트 및 TV 도입 연출, TV 프레임 내부의 반복 영상, 화면 질감 영상.
- 섹션 anchor와 smooth scroll, 스크롤에 따른 글자 reveal/scramble, 위치·투명도·밝기 전환.
- Desktop 프로젝트 `[COLUMN]` / `[LIST]` 전환, 프로젝트 링크와 이미지 hover 상태.
- Approach의 고정 제목과 스크롤 카드, Services/Contact의 어두운 배경 전환.
- About의 픽셀 형태 인물 이미지 등장, 푸터 TV 안의 반복 텍스트 이동.
- 모바일 메뉴 전체 화면 overlay, 닫기와 anchor 이동.
- 대한민국 현지 시각 표기.

이 동작들을 새로 근사해서 그리지 않고 원본 공개 실행 모듈을 이식했습니다. SSR 초기 HTML과 실행 후 상태가 같은 컴포넌트·CSS를 사용합니다.

## 호스팅 변경

- 이미지·폰트·영상·모듈을 같은 사이트의 `/assets/` 경로에서 제공합니다.
- Framer 편집기 iframe과 외부 분석 스크립트를 로드하지 않습니다.
- 사용자 요청에 따라 Made in Framer 배지 HTML과 배지 실행 코드를 제거했습니다.
- CMS 파일 두 개도 포함하고 내부 이미지 URL을 로컬 경로로 변환했습니다. 인덱스 바이트 위치를 유지하여 상세 페이지 데이터가 정상 로드됩니다.
- GitHub Pages 저장소 하위 경로를 빌드 시 적용합니다. 상세 URL 직접 접속과 새로고침을 위해 각 경로에 `index.html`을 생성합니다.
- 사이트 내 메일 링크는 Naver의 일반 메일 작성 화면에서 `mailto:` 링크로 변경했습니다. 폼도 메일 초안 방식이며 자동 발송 기능은 없습니다.
- 원본 이미지의 문구·디자인은 재작성하지 않았습니다. 사용자 요청에 따라 상세 이미지의 추가 분석·별도 내용 문서화는 중단했습니다.

## 확인 범위의 한계

공개 사이트 동작과 Framer의 레이어·반응형·Hero 속성을 확인했습니다. 모든 비공개 CMS 필드나 편집기 내부 설정을 개별 열람했다고 주장하지 않습니다. 전달물은 자체 호스팅용 공개 사이트 산출물이며 Framer 편집기 프로젝트 원본은 아닙니다.
