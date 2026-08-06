FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# 의존성만 먼저 받아 캐시 계층으로 굳힌다. 소스만 바뀌면 이 계층은 재사용된다.
# 기본 제공되는 dependencies 리포트 태스크는 의존성 그래프(메타데이터)만 해석하고
# jar 를 내려받지 않아 캐시 효과가 거의 없다. 실제 파일을 받는 전용 태스크를 쓴다.
COPY gradlew ./
COPY gradle gradle
COPY settings.gradle build.gradle ./
RUN ./gradlew resolveDependencies --no-daemon

COPY src src
RUN ./gradlew bootJar --no-daemon

# 실행 가능 jar 를 계층별로 분해한다.
# 의존성(58MB)과 애플리케이션 코드(28KB)가 분리되어, 코드만 바뀐 배포에서는
# 작은 계층만 새로 push/pull 된다.
FROM eclipse-temurin:21-jdk AS extract
WORKDIR /workspace
COPY --from=build /workspace/build/libs/*.jar app.jar
RUN java -Djarmode=tools -jar app.jar extract --layers --launcher --destination extracted

FROM eclipse-temurin:21-jre
WORKDIR /app

RUN useradd --system --user-group --no-create-home spring

# 변경 빈도가 낮은 계층부터 복사해야 캐시가 유지된다.
COPY --from=extract /workspace/extracted/dependencies/ ./
COPY --from=extract /workspace/extracted/spring-boot-loader/ ./
COPY --from=extract /workspace/extracted/snapshot-dependencies/ ./
COPY --from=extract /workspace/extracted/application/ ./

USER spring

# 운영 프로필로 고정한다. API 문서 엔드포인트가 꺼지고, DB 접속 정보는
# 환경 변수로만 주입된다. 값이 없으면 기동 시점에 바로 실패한다.
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

# JVM 기본 최대 힙은 컨테이너 메모리의 1/4 이라 할당한 만큼 쓰지 못한다.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "org.springframework.boot.loader.launch.JarLauncher"]
