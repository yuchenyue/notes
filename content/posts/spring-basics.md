---
date: '2026-04-24T10:00:00+08:00'
draft: false
title: 'Spring 基础'
cover: 'https://picsum.photos/seed/spring/600/500'
tags: ['spring', 'java', '后端']
---

## Spring 框架基础

Spring 是一个开源的 Java 平台，它为构建企业级应用提供了全面的基础设施支持。

### IoC 容器

Spring 的核心是控制反转（IoC）容器，它管理着应用中对象的生命周期和依赖关系。

```java
@Configuration
public class AppConfig {
    @Bean
    public MyService myService() {
        return new MyServiceImpl();
    }
}
```

### 依赖注入

Spring 支持构造器注入、Setter 注入和字段注入三种方式。

```java
@Service
public class UserService {
    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
```

### AOP 面向切面编程

Spring AOP 允许你将横切关注点（如日志、事务管理）从业务逻辑中分离出来。

```java
@Aspect
@Component
public class LoggingAspect {
    @Before("execution(* com.example.service.*.*(..))")
    public void logBefore(JoinPoint joinPoint) {
        System.out.println("Executing: " + joinPoint.getSignature());
    }
}
```