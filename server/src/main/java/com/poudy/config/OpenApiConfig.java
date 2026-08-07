package com.poudy.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * 문서의 servers 항목을 상대 경로로 고정한다.
 * 고정하지 않으면 문서를 생성한 프로세스의 주소가 그대로 박혀,
 * 생성 전용 포트가 커밋된 문서에 남는다.
 *
 * <p>springdoc 은 이 애노테이션이 붙은 빈을 먼저 찾고, 없을 때만 클래스패스를
 * 스캔한다. 빈으로 등록해 두지 않으면 나중에 같은 애노테이션이 붙은 빈이
 * 생기는 순간 이 설정이 조용히 무시된다.
 */
@Configuration
@OpenAPIDefinition(info = @Info(title = "Poudy API", version = "v1"), servers = @Server(url = "/"))
public class OpenApiConfig {
}
