package com.loja.api.controller;

import com.loja.api.model.Usuario;
import com.loja.api.repository.UsuarioRepository;
import com.loja.api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String senha = request.get("senha");

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, senha));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Usuário ou senha inválidos"));
        }

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow();

        String token = jwtService.generateToken(usuario);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", usuario.getUsername(),
                "role", usuario.getRole()));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String senha = request.get("senha");

        if (username == null || username.isBlank() || senha == null || senha.length() < 4) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Username e senha (mín. 4 caracteres) são obrigatórios"));
        }

        if (usuarioRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Este nome de usuário já está em uso"));
        }

        Usuario usuario = Usuario.builder()
                .username(username)
                .senha(passwordEncoder.encode(senha))
                .role("ROLE_ADMIN")
                .build();

        usuarioRepository.save(usuario);

        String token = jwtService.generateToken(usuario);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", usuario.getUsername(),
                "role", usuario.getRole()));
    }
}
