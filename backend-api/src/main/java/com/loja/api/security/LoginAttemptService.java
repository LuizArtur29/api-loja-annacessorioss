package com.loja.api.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();
    private final int maxAttempts;
    private final Duration blockDuration;
    private final Clock clock;

    @Autowired
    public LoginAttemptService(
            @Value("${app.security.login.max-attempts:5}") int maxAttempts,
            @Value("${app.security.login.block-minutes:15}") long blockMinutes) {
        this(maxAttempts, Duration.ofMinutes(blockMinutes), Clock.systemUTC());
    }

    LoginAttemptService(int maxAttempts, Duration blockDuration, Clock clock) {
        this.maxAttempts = maxAttempts;
        this.blockDuration = blockDuration;
        this.clock = clock;
    }

    public boolean isBlocked(String key) {
        Attempt attempt = attempts.get(key);
        if (attempt == null || attempt.blockedUntil() == null) {
            return false;
        }
        if (Instant.now(clock).isAfter(attempt.blockedUntil())) {
            attempts.remove(key);
            return false;
        }
        return true;
    }

    public void loginFailed(String key) {
        attempts.compute(key, (ignored, current) -> {
            int failures = current == null ? 1 : current.failures() + 1;
            Instant blockedUntil = failures >= maxAttempts
                    ? Instant.now(clock).plus(blockDuration)
                    : null;
            return new Attempt(failures, blockedUntil);
        });
    }

    public void loginSucceeded(String key) {
        attempts.remove(key);
    }

    private record Attempt(int failures, Instant blockedUntil) {
    }
}
