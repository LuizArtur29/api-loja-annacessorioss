package com.loja.api.controller;

import com.loja.api.dto.DespesaRequestDTO;
import com.loja.api.dto.DespesaResponseDTO;
import com.loja.api.dto.PageResponse;
import com.loja.api.service.DespesaService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/despesas")
@Validated
public class DespesaController {

    private final DespesaService service;

    public DespesaController(DespesaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<PageResponse<DespesaResponseDTO>> getAll(
            @RequestParam @Min(2000) @Max(2100) int ano,
            @RequestParam @Min(1) @Max(12) int mes,
            @RequestParam(defaultValue = "") String q,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(PageResponse.from(service.getAll(ano, mes, q, pageable)));
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
