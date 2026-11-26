# llm-agent 용어집 + NLP 기초 (study 모드 전용)

형식: `용어 (한국어 의미): 한 줄 설명 — 예시`. 처음 등장할 때 1회만 사용한다.

## NLP / Transformer 기초
- Tokenizer (토크나이저): 텍스트를 모델 입력 토큰(정수 ID)으로 쪼개는 도구 — BPE, WordPiece. "unhappiness" → `un`,`happi`,`ness`.
- Embedding (임베딩): 토큰·문장을 의미를 담은 벡터로 바꾼 것. 비슷한 의미는 벡터 공간에서 가깝다 — RAG 검색의 핵심.
- Attention (어텐션): 각 토큰이 다른 토큰을 얼마나 참조할지 가중치를 계산 — `Attention(Q,K,V)=softmax(QKᵀ/√d)V`.
- Context Window (컨텍스트 윈도우): 모델이 한 번에 볼 수 있는 최대 토큰 수. 초과분은 잘리며, RAG·요약이 필요한 근본 이유.
- Encoder / Decoder: 인코더(BERT 계열, 이해·분류) / 디코더(GPT 계열, 생성) / 인코더-디코더(T5, 번역·요약).

## 프롬프트
- Zero/Few-shot: 예시 없이 / 몇 개 예시를 넣고 원하는 출력 형식을 유도.
- Chain-of-Thought (CoT, 사고의 연쇄): "단계별로 생각하라"로 추론 과정을 쓰게 해 정답률을 높임.
- Structured Output (구조화 출력): JSON 스키마로 출력 형식을 강제해 파싱을 안정화.

## 에이전트
- Agent (에이전트): LLM이 스스로 도구를 호출하며 목표를 달성하는 자율 실행 루프.
- Tool / Function Calling (툴 호출): LLM이 함수 스펙을 보고 호출할 함수와 인자를 JSON으로 반환 → 코드가 실행 → 결과를 다시 LLM에 전달.
- ReAct (Reason + Act): 생각 → 행동(도구 호출) → 관찰을 반복하는 가장 흔한 에이전트 루프.
- Plan-and-Execute (플래닝): 복잡한 작업을 하위 단계로 분해한 뒤 실행.
- Memory (메모리): 단기(대화 히스토리) / 장기(벡터DB에 저장한 과거 상호작용) — 컨텍스트 한계 보완.
- Multi-Agent (멀티 에이전트): 역할(플래너·리서처·라이터·비평가)을 나눈 여러 에이전트의 협업.
- LangChain / LangGraph / LlamaIndex: 체인·툴 생태계 / 상태 그래프(순환·분기) / RAG·인덱싱 특화 프레임워크.

## RAG
- RAG (검색 증강 생성): 외부 지식을 검색해 프롬프트에 붙여 답하게 하는 기법 — 환각↓, 최신성·출처 확보.
- Chunking (청킹): 문서를 검색 단위로 쪼개는 일. 너무 크면 노이즈, 너무 작으면 맥락 손실.
- Vector Database (벡터DB): 임베딩을 저장하고 유사도로 검색하는 DB — FAISS, Chroma, Pinecone, pgvector.
- Top-k: 유사도가 높은 상위 k개 청크.
- Reranking (리랭킹): 1차 검색 결과를 Cross-Encoder로 재정렬해 정밀도를 높임.
- Hybrid Search (하이브리드 검색): 키워드(BM25) + 벡터 검색 결합.
- Faithfulness (충실도): 답변이 검색된 근거에 충실한가 (환각 여부).
- LLM-as-a-Judge: 강한 LLM이 출력을 루브릭으로 채점하는 평가 방식.
- Prompt Injection (프롬프트 인젝션): 입력·검색 문서에 숨긴 악성 지시가 시스템 프롬프트를 덮어쓰는 공격.
- Hallucination (환각): 그럴듯하지만 사실이 아닌 내용을 생성.
