# 토큰타운 · TokenTown (한국어)

<p align="center">
  <a href="https://sigco3111.github.io/token-town-kr"><img alt="Live Demo" src="https://img.shields.io/badge/LIVE%20DEMO-FF6B6B?style=for-the-badge&logo=vercel&logoColor=white" /></a>
  <a href="https://github.com/sigco3111/token-town-kr"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-sigco3111%2Ftoken--town--kr-181717?style=for-the-badge&logo=github" /></a>
  <a href="https://laurentiugabriel.github.io/token-town/"><img alt="Original" src="https://img.shields.io/badge/Original-LaurenGabriel%2FTokenTown-blue?style=for-the-badge" /></a>
</p>

<p align="center">
  <a href="#hero">🇰🇷 한국어</a> · <a href="#english">🇬🇧 English (mirror)</a>
</p>

---

<a id="hero"></a>

## 🇰🇷 한국어

> **언어 모델을 도시로 펼쳤습니다. 토큰 하나가 한 바퀴 돌면 다음 단어가 됩니다.**

아이소메트릭 도시 안에서 미니어처 트랜스포머가 실시간으로 돌아갑니다. 차량 행렬이 은닉 상태를 도로를 따라 나르고, 도시는 그 길을 13개 구역으로 가릅니다. 독에서 토큰으로 잘리고, 주조소에서 벡터로 캐스팅되고, 위치를 stamp 당하고, 층 링을 한 바퀴씩 돌고, 스타디움이 확률 분포로 바꾸고, 샘플러가 토큰 하나를 뽑습니다. 그 토큰은 되먹임 고속도로를 타고 다시 도시 위로 돌아가고, 도시 전체가 다음 단어를 위해 다시 돕니다.

```
   ┌─ 도로 (한 바퀴 13개 구역) ───────────────────────────────┐
   │                                                          │
   │   ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌──────┐  │
   │   │독   │→ │주조소│→ │신호등│→ │어텐션│→ │FFN  │→ │스타  │  │
   │   │     │  │     │  │     │  │광장  │  │공방 │  │디움  │  │
   │   └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └──────┘  │
   │       ↓                                              ↓    │
   │   ┌─────┐                                       ┌──────┐  │
   │   │샘플러│ ← ─ ─ ─ 되먹임 고속도로 ─ ─ ─ ─ ─ ─ │출력  │  │
   │   └─────┘                                       └──────┘  │
   └──────────────────────────────────────────────────────────┘
```

### 🚀 시작하기

| 채널 | URL |
|---|---|
| 🌐 **라이브 데모 (Vercel, 즉시 플레이)** | **<https://sigco3111.github.io/token-town-kr>** |
| 💻 GitHub 저장소 | <https://github.com/sigco3111/token-town-kr> |
| 🇬🇧 원본 (영문) | <https://laurentiugabriel.github.io/token-town/> |

> 💡 **팁**: 라이브 데모는 빌드 도구 / 설치 / 다운로드 없이 브라우저에서 바로 실행됩니다. 첫 토큰 생성은 가이드가 따라가며 약 4분 30초 걸립니다.

### 🎯 라이브 데모가 보여주는 것

브라우저에서 처음 페이지를 열면, 도시가 정지된 상태에서 **프롬프트**가 보이고, 누른 키에 따라 다음이 실시간으로 계산·시각화됩니다:

| HUD 라벨 | 라이브 수치 예시 | 의미 |
|---|---|---|
| 패스 | `prefill` ↔ `decode` | 다중 토큰 일괄 처리 vs 한 토큰씩 생성 |
| 층 | `3 / 6` (조정 가능 2~12) | 현재 transformer 블록 진행 |
| KV 캐시 | `5 토큰` | 캐시에 누적된 과거 토큰 수 |
| 생성됨 | `12 / 60` | 지금까지 생성된 토큰 수 |

**`About & accuracy` 모달**을 열면, "이 도시가 실제로 무엇을 계산하고 무엇을 단순화했는지"가 정리돼 있습니다.

### 🧱 무엇이 다른가 — 한국어 vs 원본

| 항목 | 원본 (영문) | 이 포크 (한국어) |
|---|---|---|
| 사용자 가시 영문 UI 텍스트 | 13개 구역 × 4필드 + HUD + 패널 + About 본문 (~80개) | **0개** — 전부 한국어로 교체 |
| 13개 구역 이름/태그/본문 | 영문 | 한국어 (예: *Tokenizer Docks → 토크나이저 독*, *Attention Plaza → 어텐션 광장*) |
| 헤더 / HUD / 패널 / About 모달 | 영문 | 한국어 |
| `<html lang>` | `"en"` | `"ko"` |
| 빌드 도구 / 의존성 | 없음 | 없음 (원본 그대로 보존) |
| 시뮬레이션 / 그래픽 / 수학 로직 | — | 원본 그대로 (수정 없음) |

한국어 번역은 **하드코딩 교체 방식**입니다 — 원본에 i18n 사전·토글 시스템이 없었기 때문에, 모든 영문 텍스트를 한국어로 직접 교체했습니다. 원본 구조·동작·게임 로직은 한 줄도 건드리지 않았습니다. (`Top-p`는 통계/ML 컨텍스트에서 한국어 카탈로그도 그대로 쓰는 표준 기술 용어라 영문 유지)

### 🗺️ 13개 구역 (5막 구성)

| 막 | 구역 (한국어) | 구역 (원본 영문) | 단계 |
|---|---|---|---|
| **1막** · 입력 | 토크나이저 독 | Tokenizer Docks | 텍스트 → 토큰 |
| | 임베딩 주조소 | Embedding Foundry | 토큰 ID → 벡터 |
| | 위치 신호등 | Positional Beacon | 사인 위치 인코딩 |
| **2막** · 정규화 | 사전 정규화 관문 | Pre-Norm Gate | LayerNorm |
| **3막** · 어텐션 | 어텐션 광장 | Attention Plaza | Q/K/V 투영, 스케일드 닷 프로덕트 |
| | KV 캐시 창고 | KV Cache Warehouse | 토큰마다 사일로 |
| | 잔차 다리 | Residual Bridge | 잔차 스트림 우회 차선 |
| | 피드포워드 공방 | Feed-Forward Mill | 12 → 24 → 12, GELU |
| | 층 계산 아치 | Layer Counter Arch | ×N 블록 |
| | 마지막 정규화 | Final Norm | 출력 전 LayerNorm |
| **4막** · 출력 | 어휘 스타디움 | Vocabulary Stadium | logits → softmax |
| | 샘플러 | The Sampler | 온도, top-p, 주사위 |
| **5막** · 생성 | 출력 광장 | Output Plaza | 토큰 하나가 나감 |
| | 되먹임 고속도로 | Feedback Highway | 자기회귀 |

### 🎮 조작법

| 키 / 동작 | 의미 |
|---|---|
| **스페이스바** | 재생/일시정지 (해설 정류장에서 계속 머무름) |
| **S** | 한 단계 진행 |
| **R** | 초기화 후 천천히 다시 시작 |
| **F** | 카메라 따라가기 |
| **L** | 라벨 표시 |
| **드래그** | 화면 이동 |
| **스크롤** | 확대/축소 |
| **더블 클릭** | 도시 전체 보기 |
| **+ − ⤢** | 왼쪽 가장자리의 줌 컨트롤, ⤢은 도시 전체 보기 |
| **구역 클릭** | 설명을 고정 (빈 바닥을 누르면 해설로 복귀) |

### 🎚️ 슬라이더

| 슬라이더 | 범위 | 효과 |
|---|---|---|
| **속도** | 0.4× ~ 8× | 읽기 정류장까지 모두 비례 |
| **층 수** | 2 ~ 12 | 트랜스포머 블록 깊이 |
| **온도** | 0.05 ~ 1.6 | 1 미만은 봉우리 sharp, 1 초과는 long shot 허용 |
| **Top-p** | 0.1 ~ 1.0 | 핵 샘플링 컷오프 (확률 누적 p까지) |

온도와 Top-p는 **실제 샘플러**로 들어가서, 차가운 모델은 하나의 탑에, 뜨거운 모델은 여러 후보에 베팅을 펼치는 모습을 볼 수 있습니다.

### 📐 정확도 매트릭스 (How much of it is real)

원본 README의 "How much of it is real"을 그대로 가져온 표 — 도시가 실제로 무엇을 계산하고 무엇을 단순화했는지:

| 범주 | 내용 |
|---|---|
| ✅ **실제로 계산** | 토크나이저 분리 · 임베딩 룩업 · 사인 위치 인코딩 · LayerNorm · 실제 누적되는 KV 캐시 위 2-헤드 스케일드 닷 프로덕트 어텐션(인과 마스킹) · 잔차 덧셈 · GELU 피드포워드 · 온도·top-p 샘플링 |
| ⚖️ **축소** | 12 차원 (vs 수천) · 2 어텐션 헤드 (vs 수십) · 2~12 층 (vs 80) · 수백 단어 어휘 (vs 10만+) |
| 🎭 **의도적 거짓** | 가중치는 무작위 · 학습 안 됨 · 출력이 읽히도록 마지막 logit에 바이그램 사전 분포를 섞음 · 어텐션에 sink·recency 편향 추가 → 학습된 모델처럼 보이게 |
| 🖼️ **풍경** | 도시가 써내는 글자 (의미 있는 출력이 아닌 그림 역할) |

### 🏃 진행 속도

| 단계 | 시간 | 설명 |
|---|---|---|
| 첫 토큰 (가이드 투어) | 약 **4분 30초** | 정류장마다 9~26초 정지, 본문 길이에 비례 |
| 그 이후 토큰 (감시 모드) | 약 **40초/토큰** | 모든 구역이 한 번씩 설명된 뒤 — 반복되는 층은 빨리 감기 |
| HUD 안내 | 표시 | 현재 모드(prefill / decode / fast-forward) 가시화 |
| **Reset** (⟲) | — | 천천히 진행하는 안내 투어를 처음부터 다시 |
| **Run** | — | 이미 읽은 부분을 유지한 채 이어서 |

### 🧩 로컬에서 실행

정적 사이트라 브라우저에서 `index.html`을 열기만 하면 됩니다.

```bash
cd /Users/mac/work/token-town-kr

# 방법 1 — 그냥 열기
open index.html          # macOS
xdg-open index.html      # Linux

# 방법 2 — 로컬 서버 (모바일 / CORS 회피 시 권장)
python3 -m http.server 8000
# → http://localhost:8000
```

빌드 도구가 없고 외부 라이브러리도 없습니다. 모든 그래픽은 캔버스 2D에 폴리곤만으로 그려집니다.

### 📦 디렉토리 구조

```
.github/workflows/  GitHub Pages 배포
index.html          마크업, 컨트롤, About 모달 (한국어)
css/styles.css      라이트 미니멀 UI
js/iso.js           아이소메트릭 투영 + 박스/실린더/리본 프리미티브
js/toy-model.js     트랜스포머: 토크나이저, 어텐션, FFN, 샘플러
js/city.js          13개 구역 + 도로 + 정류장 (한국어 데이터)
js/sim.js           토큰 한 개를 도시 한 바퀴 도는 상태 기계
js/render.js        캔버스 2D painter's-algorithm 렌더러
js/ui.js            패널, 내레이션, 컨트롤 (한국어 라벨)
js/main.js          카메라, 입력, 프레임 루프
```

`City.routes`가 차량 행렬이 도는 폴리라인을, `City.stations`이 거리를 단계 ID로 매핑합니다. `Sim`이 차량 행렬이 정류장에 도착하면 단계 핸들러를 발화하고, 그 안에서 모든 모델 계산이 일어납니다.

### 🌐 배포

| 항목 | 값 |
|---|---|
| 호스팅 | Vercel (sigco3111s-projects 스코프) |
| 빌드 | 없음 (`@vercel/static` 자동 처리) |
| 자동배포 | ✅ GitHub `main` push → 약 20초 안에 새 배포 |
| 첫 배포 명령 | `vercel --yes --prod --non-interactive --scope sigco3111s-projects --token "$VERCEL_TOKEN"` |

### 🌍 영문 미러

원본 영문 README의 한국어 미러는 본 저장소에 없습니다 — 원본 자체가 영문이므로 <https://laurentiugabriel.github.io/token-town/> 으로 가시면 됩니다.

### 📜 원본 attribution

| | |
|---|---|
| 원본 저장소 | <https://github.com/LaurentiuGabriel/token-town> |
| 원작자 | Laurentiu Gabriel ([@LaurentiuGabriel](https://github.com/LaurentiuGabriel)) |
| 원본 라이선스 | 명시되지 않음 (저장소에 `LICENSE` 파일 없음) — 공개 GitHub 저장소이나 라이선스 표기 부재. 사용 전 원작자 문의 권장 |
| 라이브 데모 (원본) | <https://laurentiugabriel.github.io/token-town/> |
| 영감 | PGSimCity (PostgreSQL을 도시 모양으로 모델링한 프로젝트)에서 아이디어를 빌려옴 |
| 클론 시점 | 2026-08-11 |
| 한국어 번역 | sigco3111 ([@sigco3111](https://github.com/sigco3111)) |
| 한국어 저작물 라이선스 | MIT |

원본 게임 로직·그래픽·시뮬레이션은 모두 원작자의 것입니다. 이 저장소는 **한국어화 (사용자 가시 텍스트의 한국어 교체) + Vercel 배포 환경 구성만** 추가합니다.

### 📋 상태 뱃지

| | |
|---|---|
| ✅ Live | <https://sigco3111.github.io/token-town-kr> (Vercel Production, 자동배포 활성화) |
| 📄 한국어 | UI 100% (사용자 가시 영문 잔재 0개 — `Top-p`는 통계/ML 기술 용어로 영문 유지) |
| 🔓 License | 한국어 저작물은 MIT · 원본은 라이선스 미명시 |
| 🤖 Build | `MiniMax-M3` + Hermes Agent로 번역 및 배포 |
| ⚡ Runtime | 순수 정적 사이트, 빌드 도구 0, 외부 라이브러리 0, 네트워크 호출 0 |

### ❓ FAQ

<details>
<summary><b>Q. 왜 i18n 시스템(언어 토글) 없이 한국어만 있나요?</b></summary>

원본에 i18n 사전·언어 토글이 없었기 때문에, 가장 단순한 "ko 하드코딩" 방식을 채택했습니다. 토글을 원하시면 별도 요청 주세요 — `js/dict.js` 사전 + `lang` 변수를 추가하는 작업이 필요합니다.

</details>

<details>
<summary><b>Q. 한자/혼종 문자가 있나요?</b></summary>

없음 — 모든 텍스트가 자연스러운 한국어입니다 (한자 0개 확인).

</details>

<details>
<summary><b>Q. 원본에 PR을 보낼 수 있나요?</b></summary>

원작자가 명시한 라이선스가 없고 한국어화는 본 저장소의 한국어 저작물이라 PR 대상이 아닙니다. 본 저장소는 **독립 운영**됩니다.

</details>

<details>
<summary><b>Q. 다른 게임도 한국어 포크가 있나요?</b></summary>

같은 작가의 시리즈 3부작이 모두 한국어 포크로 배포되어 있습니다:

| 게임 | 라이브 | 저장소 |
|---|---|---|
| 🏭 칩타이쿤 | <https://chiptycoon-kr.vercel.app> | <https://github.com/sigco3111/chiptycoon-kr> |
| 🏙️ 토큰타운 (이 저장소) | <https://sigco3111.github.io/token-town-kr> | <https://github.com/sigco3111/token-town-kr> |
| 🏎️ 엔진웍스 | <https://engineworks-kr.vercel.app> | <https://github.com/sigco3111/engineworks-kr> |

</details>

---

<a id="english"></a>

## 🇬🇧 English (mirror)

This repository is the **Korean-language independent fork** of [LaurentiuGabriel/TokenTown](https://github.com/LaurentiuGabriel/token-town), an isometric city that runs a miniature transformer in real time. All user-visible English text has been replaced with Korean.

- **Live demo**: <https://sigco3111.github.io/token-town-kr>
- **Original (English)**: <https://laurentiugabriel.github.io/token-town/>
- **What changed**: 13 districts × 4 fields + HUD + panel + About modal — all Korean
- **What did NOT change**: simulation math, isometric graphics, canvas renderer, transformer logic — all original

The original work is by Laurentiu Gabriel ([@LaurentiuGabriel](https://github.com/LaurentiuGabriel)). The Korean translation layer (the file contents under `index.html`, `js/city.js`, `js/ui.js`) is © sigco3111 under MIT.

<p align="right">
  <a href="#hero">⬆️ back to top</a>
</p>