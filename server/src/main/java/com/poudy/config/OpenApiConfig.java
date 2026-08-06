package com.poudy.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.servers.Server;

/**
 * 문서의 servers 항목을 상대 경로로 고정한다.
 * 고정하지 않으면 문서를 생성한 프로세스의 주소가 그대로 박혀,
 * 생성 전용 포트가 커밋된 문서에 남는다.
 */
@OpenAPIDefinition(servers = @Server(url = "/"))
public class OpenApiConfig {
}
