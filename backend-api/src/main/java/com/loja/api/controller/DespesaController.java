package com.loja.api.controller;

import com.loja.api.dto.DespesaRequestDTO;
import com.loja.api.dto.DespesaResponseDTO;
import com.loja.api.service.DespesaService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/despesas")
public class DespesaController {

    private final DespesaService service;

    public DespesaController(DespesaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<DespesaResponseDTO>> getAll(
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(service.getAll(pageable));
    }

    @GetMapping("/all")
    public ResponseEntity<List<DespesaResponseDTO>> getAllSemPaginacao() {
        return ResponseEntity.ok(service.getAllSemPaginacao());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DespesaResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<List<DespesaResponseDTO>> create(@Valid @RequestBody DespesaRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DespesaResponseDTO> update(@PathVariable Long id,
            @Valid @RequestBody DespesaRequestDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}