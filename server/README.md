# server

Spring Boot 백엔드.

## 기술 스택

| 구분 | 선택 기술 |
| --- | --- |
| 개발 언어 | Java 21 LTS |
| 프레임워크 | Spring Boot 4.1 |
| 빌드 도구 | Gradle Wrapper |
| 데이터베이스 | PostgreSQL (AWS RDS) |
| 데이터 접근 | Spring Data JPA |
| 스키마 변경 관리 | Flyway |
| 단위 테스트 | JUnit 5, Mockito |
| 통합 테스트 | Spring Boot Test |
| API 문서 | OpenAPI (Swagger UI) |
| 자동 검증 | GitHub Actions |
| 배포 방식 | Docker 이미지 기반 배포 |

## 요구 사항

JDK 21 이상, Node.js 22.

## 실행

```bash
cp .env.example .env   # 클론 후 1회, 값을 채웁니다
./gradlew bootRun
```

`DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 는 기본값이 없습니다. 비어 있으면 기동 시점에 실패합니다.

환경 변수로 직접 넘겨도 됩니다. 실제 환경 변수가 `.env` 보다 우선합니다.

```bash
DB_URL=jdbc:postgresql://<host>:5432/poudy DB_USERNAME=<user> DB_PASSWORD=<password> ./gradlew bootRun
```

| 주소 | 용도 |
| --- | --- |
| `/swagger-ui.html` | API 문서 화면 |
| `/v3/api-docs` | OpenAPI 문서 (JSON) |
| `/actuator/health` | 헬스 체크 |

앞의 두 주소는 `prod` 프로필에서 꺼집니다.

## 스키마 변경

엔티티를 추가하면 마이그레이션 SQL 도 같은 커밋에 넣습니다.

```
src/main/resources/db/migration/V1__create_member.sql
```

- 파일명은 `V{번호}__{설명}.sql` — 언더스코어 두 개
- 이미 적용된 파일은 수정하지 않습니다. 변경은 `V2__...sql` 로 추가
- 컬럼명은 snake_case

## API 타입 생성

컨트롤러나 DTO 를 바꿨으면 실행하고 결과물도 함께 커밋합니다.

```bash
./gradlew generateApiTypes
git add openapi.json ../common/api.d.ts
```

잊으면 `pre-push` 훅과 `Server CI` 가 막습니다.

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
