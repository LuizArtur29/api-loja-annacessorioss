# Estágio 1: Compilação (Build) com Java 21
FROM maven:3.9.12-eclipse-temurin-21 AS build
WORKDIR /app

# Copia o pom.xml e baixa as dependências
COPY pom.xml .
RUN mvn dependency:go-offline

# Copia o código e gera o JAR
COPY src ./src
RUN mvn clean package -DskipTests

# Estágio 2: Execução (Runtime) com Java 21
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN groupadd --system app && useradd --system --gid app --home-dir /app app

# Copia o JAR do estágio anterior
COPY --from=build /app/target/*.jar app.jar

RUN chown app:app /app/app.jar

USER app

EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=60", "-XX:+ExitOnOutOfMemoryError", "-Duser.timezone=America/Recife", "-jar", "app.jar"]
