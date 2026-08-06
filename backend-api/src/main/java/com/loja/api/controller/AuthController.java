package com.loja.api.controller;

import com.loja.api.dto.AuthResponseDTO;
import com.loja.api.dto.LoginRequestDTO;
import com.loja.api.model.Usuario;
import com.loja.api.repository.UsuarioRepository;
import com.loja.api.security.LoginAttemptService;
import com.loja.api.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final LoginAttemptService loginAttemptService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO request, HttpServletRequest httpRequest) {
        String username = request.username().trim();
        String attemptKey = httpRequest.getRemoteAddr() + ":" + username.toLowerCase();

        if (loginAttemptService.isBlocked(attemptKey)) {
            return ResponseEntity.status(429)
                    .body(java.util.Map.of("message", "Muitas tentativas. Tente novamente mais tarde."));
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.senha()));
        } catch (AuthenticationException e) {
            loginAttemptService.loginFailed(attemptKey);
            return ResponseEntity.status(401)
                    .body(java.util.Map.of("message", "Usuário ou senha inválidos"));
        }

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow();
        loginAttemptService.loginSucceeded(attemptKey);
        String token = jwtService.generateToken(usuario);

        return ResponseEntity.ok(new AuthResponseDTO(token, usuario.getUsername(), usuario.getRole()));
    }
}
