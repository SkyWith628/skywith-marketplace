---
name: ai-ml
description: ML/DL 학습·실험·서빙 작업 시 발동하는 프레임워크 공통 규칙. 실험 재현성(PyTorch·TensorFlow·HuggingFace seed 고정), 하이퍼파라미터 관리, 실험 추적(MLflow/W&B/DVC), 과적합·데이터 불균형 처리, 평가지표 선정, 추론 서버 설계, AI 특화 보안을 제공한다. PyTorch·TensorFlow/Keras·scikit-learn·YOLO·OpenCV 학습 코드나 추론 서버를 작성/리뷰할 때 먼저 적용. NLP·LLM Agent·RAG는 llm-agent, 컨테이너·API 구조는 deploy 참조.
---

# AI / ML 실무 규칙

전역 AGENTS.md의 공통 원칙 위에 얹는 ML 전용 체크리스트. 용어 풀이는 `glossary.md` (study 모드에서만 읽는다).

## 1. 재현성 (모든 학습 코드 필수)
```python
# PyTorch
import random, numpy as np, torch
SEED = 42
random.seed(SEED); np.random.seed(SEED)
torch.manual_seed(SEED); torch.cuda.manual_seed_all(SEED)
torch.backends.cudnn.deterministic = True
torch.backends.cudnn.benchmark = False
```
```python
# TensorFlow / Keras
import random, numpy as np, tensorflow as tf
SEED = 42
random.seed(SEED); np.random.seed(SEED)
tf.random.set_seed(SEED)
tf.config.experimental.enable_op_determinism()  # TF 2.9+
```
HuggingFace: `transformers.set_seed(SEED)` 한 줄로 torch/tf/numpy 고정. 데이터 분할 seed도 별도로 고정한다.

## 2. 하이퍼파라미터는 코드와 분리
```yaml
# config/config.yaml
model: { name: "yolov8n", num_classes: 80 }
train: { epochs: 100, batch_size: 16, learning_rate: 0.001, optimizer: "Adam" }
data:  { train_path: "data/train", val_path: "data/val", img_size: 640 }
```
코드에 숫자를 박지 않는다. 실험마다 사용한 config를 결과와 함께 저장한다.

## 3. 실험 관리
- [ ] 추적 도구 초기화: MLflow(파라미터·지표·모델) / W&B(곡선 시각화) / DVC(데이터·모델 버전)
- [ ] epoch별 loss·metric·학습 시간 로깅
- [ ] 체크포인트: `best_model.pt`(최고 시점) · `last_model.pt`(마지막)
- [ ] **베이스라인과 비교**. 베이스라인보다 높아야 의미가 있다

## 4. 학습 코드 필수
- [ ] **과적합/과소적합 판단**: train↑ val↓ → Dropout·증강·Early Stopping. 둘 다 낮음 → 모델 확대·학습률 조정·에포크 증가.
- [ ] **데이터 불균형**: 오버/언더샘플링, class weight, focal loss. 정확도만 보지 않는다.
- [ ] **평가 지표 선정 이유 명시**: Accuracy · Precision · Recall · F1 · mAP(탐지). 불균형이면 Accuracy 단독 금지.
- [ ] **Early Stopping**: val loss가 N 에포크 개선 없으면 중단.
- [ ] 데이터 누수 점검: 분할 전에 전처리 통계(평균 등)를 계산하지 않는다.

## 5. 추론 서버
- 선택: FastAPI(기본) / TorchServe(PyTorch 공식) / Triton(GPU 최적화). 프로젝트 구조는 `deploy` 스킬.
- **모델은 서버 시작 시 1회 로드**(싱글턴). 요청마다 로드 금지.
- 여러 요청은 배치 추론으로 묶어 GPU 효율을 높인다.
- 입출력 스펙은 Pydantic으로 명시한다 (이미지 크기·타입, 클래스·확률).

## 6. 모델 테스트
- 입력 shape 검증 (예: 이미지 `(3, 640, 640)`)
- 출력 범위 검증: 확률 0~1, 클래스 수 일치, 합 검증
- 추론 속도 측정: 목표 latency 달성 여부

## 7. AI 특화 보안
- **적대적 입력** 방어: 미세 변형으로 모델을 속이는 입력에 대한 입력 검증·이상 탐지.
- **모델 파일 접근 제어**: `.pt/.pth`가 외부에 노출되지 않게 권한 설정. 저장소에 커밋하지 않는다.
- **추론 결과 검증**: 음수 확률, 합 초과 등 이상값 반환 검사.
- 신뢰할 수 없는 pickle/체크포인트는 로드하지 않는다 (`torch.load(weights_only=True)`).

## 8. 디렉터리 구조
```
project/
├── config/config.yaml
├── data/{raw,processed,augmented}/   # raw는 수정 금지
├── src/{dataset,model,train,evaluate,utils}.py
├── tests/test_*.py
├── notebooks/eda.ipynb
└── api/ · Dockerfile · requirements.txt   # 구조는 deploy 스킬
```
