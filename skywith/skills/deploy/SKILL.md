---
name: deploy
description: 컨테이너·배포 작업 시 발동. Docker(멀티스테이지 빌드, 헬스체크, non-root 실행), AWS 배포 서비스 선택 기준(Lambda/ECS/EC2/SageMaker), CI/CD 파이프라인, FastAPI 백엔드 구조를 제공한다. Dockerfile 작성/리뷰, 배포 전략 수립, AWS 인프라 선택 시 이 규칙을 먼저 적용한다. 배포 직전 최종 점검은 engineering:deploy-checklist와 함께 쓴다.
---

# Docker / 배포 규칙

비밀정보·`.env` 규칙은 전역 AGENTS.md. 용어 풀이는 `glossary.md` (study 모드에서만 읽는다).

## 1. Docker 체크리스트
- [ ] **멀티스테이지 빌드**: 빌드 단계(도구 포함) → 실행 단계(결과물만)로 이미지를 줄인다
- [ ] 비밀정보는 이미지에 굽지 않는다. 런타임 환경변수 또는 AWS Secrets Manager
- [ ] `GET /health → {"status":"ok"}` 헬스체크 엔드포인트와 `HEALTHCHECK`
- [ ] 로그는 stdout
- [ ] **non-root** 유저로 실행
- [ ] 베이스 이미지 버전 고정(`python:3.12-slim`), `.dockerignore`로 `.env`·데이터·모델 가중치 제외
- [ ] 의존성 레이어를 소스보다 먼저 복사해 빌드 캐시를 활용

## 2. AWS 배포 선택
| 서비스 | 언제 |
|---|---|
| **Lambda** | 간헐적 요청, 트래픽 예측 불가, 콜드스타트 허용 |
| **ECS (Fargate)** | 상시 서비스, 컨테이너 운영 |
| **EC2** | GPU 필요(p3, g4dn), 고성능 추론, 직접 제어 |
| **SageMaker** | 학습→배포 MLOps 파이프라인 전체 |

LLM API 호출 위주의 에이전트(GPU 불필요)는 Lambda 또는 ECS가 기본 후보. 추론 지연·상시성·비용으로 고른다.

## 3. CI/CD
- push → 자동 테스트(GitHub Actions) → 통과 시 이미지 빌드 → 레지스트리 푸시 → 배포.
- 배포 후 헬스체크 통과를 확인하고, **실패 시 롤백 방법**을 파이프라인에 명시한다.

## 4. FastAPI 백엔드 구조
```
api/
├── app/
│   ├── main.py               # 진입점
│   ├── routers/predict.py    # 엔드포인트
│   ├── models/schemas.py     # Pydantic 입출력 스펙
│   ├── services/inference.py # 추론·비즈니스 로직 (모델은 시작 시 1회 로드)
│   └── core/{config,security}.py
├── tests/ · Dockerfile · requirements.txt
```
