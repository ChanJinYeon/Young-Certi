# Python 베이스 이미지 선택
FROM python:3.12-slim

# 컨테이너 기본 환경 설정
# 순서대로
# 1. 바이트코드 캐시 파일 만들지 않도록 하기 -> 불필요한 캐시 파일 생성 줄이기
# 2. print/log 출력이 버퍼에 쌓이지 않고 바로 Docker 로그로 보이게 하기
# 3. pip 설치 캐시를 이미지 안에 남기지 않게 해서 이미지 크기 줄이기
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# 컨테이너 안에서 앱을 실행할 기준 디렉터리
WORKDIR /workspace

# backend 패키지 설치에 필요한 디렉터리 복사
# Host(build context) -> Container
COPY backend ./backend
COPY specs/001-question-practice/contracts/openapi.yaml ./specs/001-question-practice/contracts/openapi.yaml

# /workspace/backend 안의 pyproject.toml을 읽어서 의존성 설치
# young_certi_api 패키지를 import 가능한 상태로 만듦
# FastAPI, uvicorn, boto3같은 런타임 의존성 포함
RUN pip install ./backend

# 포트 정보 문서화
EXPOSE 8000

# 컨테이너 내부 포트: 8000
# 호스트 포트: 18000
CMD ["uvicorn", "young_certi_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
