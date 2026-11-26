# deploy 용어집 (study 모드 전용)

형식: `용어 (한국어 의미): 한 줄 설명 — 예시`. 처음 등장할 때 1회만 사용한다.

- Multi-stage Build (멀티스테이지 빌드): 빌드 환경과 실행 환경을 나눠 이미지를 줄이는 방식 — 빌드 2GB → 실행 200MB.
- Health Check (헬스체크): 서버가 정상인지 확인하는 엔드포인트·명령. 오케스트레이터가 자동 재시작 판단에 사용.
- non-root: root 권한 없이 컨테이너를 실행해, 침해 시 피해를 줄임.
- Serverless (서버리스): 서버를 직접 관리하지 않고 요청 시에만 실행·과금되는 방식 — Lambda.
- ECS (Elastic Container Service): AWS의 Docker 컨테이너 관리 서비스. Fargate는 서버 관리가 필요 없는 실행 모드.
- SageMaker: 데이터 처리→학습→배포를 묶은 AWS의 ML 플랫폼.
- Secrets Manager: 비밀정보를 안전하게 저장·주입하는 AWS 서비스.
- CI/CD (지속적 통합/배포): 코드 push → 자동 테스트 → 자동 배포 파이프라인.
- Rollback (롤백): 배포 실패 시 직전 정상 버전으로 되돌림.
- Cold Start (콜드스타트): 한동안 호출이 없던 Lambda가 처음 실행될 때 생기는 지연.
