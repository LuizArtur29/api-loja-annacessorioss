package com.loja.api.security;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LoginAttemptServiceTests {

    @Test
    void blocksAfterConfiguredNumberOfFailures() {
        var service = new LoginAttemptService(
                3,
                Duration.ofMinutes(15),
                Clock.fixed(Instant.parse("2026-08-05T12:00:00Z"), ZoneOffset.UTC));

        service.loginFailed("ip:user");
        service.loginFailed("ip:user");
        assertFalse(service.isBlocked("ip:user"));

        service.loginFailed("ip:user");
        assertTrue(service.isBlocked("ip:user"));

        service.loginSucceeded("ip:user");
        assertFalse(service.isBlocked("ip:user"));
    }
}
