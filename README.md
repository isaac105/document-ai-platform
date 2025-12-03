<h1 align="center">사내 문서 정리 AI 플랫폼</h1>
<p align="center">PDF / Word / TXT 등 내부 문서를 업로드하고, 청킹 & 벡터 임베딩 후 LLM으로 질의응답을 제공하는 NestJS 백엔드입니다.</p>

---

## 아키텍처 개요

- **모듈 구조**
  - `DocumentsModule`: 업로드, 파싱, 청킹, 이벤트 기반 처리
  - `LlmModule`: FactChat(or fallback) LLM 연동
  - `QueriesModule`: 문서 검색 및 QA API
  - `CommonModule`: 전역 필터 · 파이프 등 공통 컴포넌트
- **흐름**
  1. 사용자가 `/documents/upload` 로 파일 업로드
  2. `DocumentUploadedEvent` 발행 → `ProcessDocumentHandler`
  3. 파싱 + 청킹 + 임베딩 + 요약 생성
  4. `/qa/ask` 에서 최신 문서를 기반으로 LLM 질의응답
- **기술 스택**
  - NestJS 11, TypeORM, PostgreSQL/pgvector, pdf-parse v2, Mammoth

## 데이터 모델링

| 엔티티 | 주요 필드 | 설명 |
| --- | --- | --- |
| `Document` | `status(enum)`, `team`, `uploadedBy`, `summary` | 업로드된 원본 메타데이터와 처리 상태 |
| `DocumentChunk` | `chunkIndex`, `startPosition`, `embedding(jsonb)` | 청킹된 본문 조각 및 임베딩 |

- `DocumentStatus` 열거형(`pending`, `processing`, `completed`, `failed`)으로 상태를 일관성 있게 관리합니다.
- `jsonb` 임베딩 저장 → DB 이식성 및 디버깅 편의 향상.
- `team`, `uploadedBy`, `status` 컬럼에 인덱스가 걸려 있어 필터링 성능이 안정적입니다.

## API 설계

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/documents/upload` | 파일 업로드 (team, uploadedBy 메타데이터 포함) |
| `GET` | `/documents` | 팀/상태/페이지네이션 기반 문서 목록 |
| `GET` | `/documents/:id` | 단일 문서 정보 |
| `GET` | `/documents/:id/content` | 파싱된 본문 조회 |
| `POST` | `/qa/ask` | 최신 완료 문서를 컨텍스트로 LLM 답변 |

- 모든 DTO는 `class-validator` + Global `ValidationPipe` 로 검증됩니다.
- QA 응답에는 참고된 문서 리스트가 포함되어 감사 추적이 가능합니다.
- LLM 의 경우 학교에서 제공되는 `FactChat` 을 기반으로 구성하였습니다.

## 에러 처리 & 보안

- 전역 `ValidationPipe` (whitelist + transform)로 입력 검증.
- `AllExceptionsFilter` 로 모든 예외를 표준 JSON 형식으로 반환하고 로깅.
- CORS 허용 도메인을 `.env` (`CORS_ORIGIN`) 로 제어.
- 파일 업로드 시 MIME/확장자/사이즈 점검 후 안전한 경로(`uploads/`)에 저장.
- LLM 오류 시 개발 환경에서 폴백 응답/임베딩을 제공하여 안정적인 테스트가 가능.

## 환경 변수

`src/config/env.validation.ts` 에서 검증합니다.

| Key | Description |
| --- | --- |
| `NODE_ENV`, `PORT` | 기본 서버 설정 |
| `DB_*` | PostgreSQL 연결 정보 |
| `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` | 챗 모델 |
| `LLM_CHAT_PATH`, `LLM_EMBEDDING_PATH`, `LLM_EMBEDDING_MODEL` | FactChat API 경로 |
| `UPLOAD_PATH`, `MAX_FILE_SIZE` | 파일 저장 경로/용량 |
| `CORS_ORIGIN` | 허용 오리진(콤마 구분) |

## 실행 방법

```bash
# 도커로 전부 실행할 경우
docker compose up --build

# Postgres / Node 가 로컬에 세팅 되어있을 경우
npm install
npm run start:dev || npm run start:prod
```

해당 프로젝트는 도커라이징이 되어 있어 컴포즈로 한번에 실행 가능합니다.
정적 프론트엔드는 `public/index.html` 로 서빙되며, 서버 기동 후 `http://localhost:<PORT>/` 에서 바로 접근할 수 있습니다.

## 테스트

```bash
npm run lint     # ESLint / Prettier
npm run build    # 타입 검증
npm run test     # 단위 테스트
```

## 주요 폴더 구조

```
src/
 ├─ app.module.ts
 ├─ common/
 │   └─ filters/all-exceptions.filter.ts
 ├─ config/
 │   ├─ env.validation.ts
 │   └─ database.config.ts
 ├─ documents/   # 업로드/파싱/청킹/쿼리
 ├─ llm/         # FactChat provider + service
 ├─ queries/     # QA API
 └─ main.ts      # 부트스트랩 + 전역 파이프/필터
```
