# server

Spring Boot 백엔드.

## 기술 스택

| 구분 | 선택 기술 |
| --- | --- |
| 개발 언어 | Java 21 LTS |
| 프레임워크 | Spring Boot 4.1 |
| 빌드 도구 | Gradle 9.2.1 (Wrapper) |
| 데이터베이스 | PostgreSQL 18 (운영: AWS RDS 예정) |
| 데이터 접근 | Spring Data JPA |
| 스키마 변경 관리 | Flyway |
| 테스트 DB | H2 (`test`), PostgreSQL (`integration`) |
| 단위 테스트 | JUnit 6, Mockito 5 |
| 통합 테스트 | Spring Boot Test |
| API 문서 | OpenAPI / springdoc 3.1 (Swagger UI) |
| API 타입 생성 | openapi-typescript |
| 코드 품질 | Spotless, Checkstyle (우아한테크코스 코드 스타일) |
| 자동 검증 | GitHub Actions |
| 배포 방식 | Docker 이미지 (CI 빌드 검증까지 구성) |

## 요구 사항

JDK 21 이상, Node.js 22, Docker.

## 실행

```bash
docker compose up -d
./gradlew bootRun
```

`dev` 프로필로 뜨고 `compose.yaml` 의 로컬 PostgreSQL 에 붙습니다. 접속 정보는 기본값이 들어 있어 따로 설정하지 않습니다.

포트를 바꿨거나 다른 로컬 DB 를 쓸 때만 `.env` 를 만듭니다.

```bash
cp .env.example .env
```

| 주소 | 용도 |
| --- | --- |
| `/swagger-ui.html` | API 문서 화면 |
| `/v3/api-docs` | OpenAPI 문서 (JSON) |
| `/actuator/health` | 헬스 체크 |

앞의 두 주소는 `prod` 프로필에서 꺼집니다.

## 데이터베이스 분리

접속 정보는 프로필별로 따로 정의합니다. `application.yml` 에는 두지 않습니다.

| 프로필 | 접속 대상 | 기본값 |
| --- | --- | --- |
| `dev` (기본) | `compose.yaml` 의 로컬 PostgreSQL | 있음 (localhost) |
| `prod` | 환경 변수로 주입한 운영 DB | 없음 — 비어 있으면 기동 실패 |

`dev` 는 `.env` 를 읽고 `prod` 는 읽지 않습니다. 운영 접속 정보는 배포 환경의 환경 변수로만 들어옵니다.

**운영 접속 정보를 `.env` 에 적지 마세요.** `dev` 프로필도 Flyway 로 마이그레이션을 실행하므로, 로컬에서 앱을 띄우는 것만으로 운영 스키마가 바뀝니다.

## 스키마 변경

엔티티를 추가하면 마이그레이션 SQL 도 같은 커밋에 넣습니다.

```
src/main/resources/db/migration/V1__create_member.sql
```

- 파일명은 `V{번호}__{설명}.sql` — 언더스코어 두 개
- 이미 적용된 파일은 수정하지 않습니다. 변경은 `V2__...sql` 로 추가
- 컬럼명은 snake_case

## API 타입 생성

컨트롤러나 DTO 를 바꾸면 `pre-push` 훅이 `openapi.json` 과 `common/api.d.ts` 를 갱신해 커밋합니다. 안내가 뜨면 `git push` 를 한 번 더 실행하면 됩니다.

DTO 필드에 `@NotNull` 을 붙이면 생성되는 TypeScript 타입에서 옵셔널(`?`)이 사라집니다.

## 테스트

```bash
./gradlew test
```

| 프로필 | DB | 스키마 | 쓰는 곳 |
| --- | --- | --- | --- |
| `test` (기본) | H2 인메모리 | 엔티티 기준 자동 생성 | 로컬 |
| `integration` | PostgreSQL | Flyway + JPA 검증 | CI |

마이그레이션 SQL 은 `integration` 에서만 검증됩니다.

```bash
DB_URL=... DB_USERNAME=... DB_PASSWORD=... ./gradlew -Dspring.profiles.active=integration test
```

## 배포

```bash
docker build -t poudy .
docker run -p 8080:8080 -e DB_URL=... -e DB_USERNAME=... -e DB_PASSWORD=... poudy
```
