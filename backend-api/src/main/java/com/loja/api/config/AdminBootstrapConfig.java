package com.loja.api.config;

import com.loja.api.model.Usuario;
import com.loja.api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminBootstrapConfig implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin.username:}")
    private String username;

    @Value("${app.bootstrap.admin.password:}")
    private String password;

    @Override
    public void run(ApplicationArguments args) {
        if (usuarioRepository.count() > 0 || username.isBlank() || password.isBlank()) {
            return;
        }
        if (password.length() < 12) {
            throw new IllegalStateException("ADMIN_BOOTSTRAP_PASSWORD deve ter pelo menos 12 caracteres");
        }

        usuarioRepository.save(Usuario.builder()
                .username(username.trim())
                .senha(passwordEncoder.encode(password))
                .role("ROLE_ADMIN")
                .build());
    }
}
