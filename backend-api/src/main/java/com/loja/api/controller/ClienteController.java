package com.loja.api.controller;

import com.loja.api.dto.ClienteRequestDTO;
import com.loja.api.dto.ClienteResponseDTO;
import com.loja.api.dto.PageResponse;
import com.loja.api.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService service;

    public ClienteController(ClienteService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ClienteResponseDTO>> listarTodos(
            @RequestParam(defaultValue = "") String q,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(PageResponse.from(service.listarTodos(q, pageable)));
    }

    @GetMapping("/all")
    public ResponseEntity<List<ClienteResponseDTO>> listarTodosSemPaginacao() {
        return ResponseEntity.ok(service.listarTodosSemPaginacao());
    }

    @GetMapping("/aniversariantes")
    public ResponseEntity<List<ClienteResponseDTO>> listarAniversariantes(
            @RequestParam(required = false) LocalDate data) {
        return ResponseEntity.ok(service.listarAniversariantes(data == null ? LocalDate.now() : data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<ClienteResponseDTO> criar(@Valid @RequestBody ClienteRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponseDTO> atualizar(@PathVariable Long id,
            @Valid @RequestBody ClienteRequestDTO dto) {
        return ResponseEntity.ok(service.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
