package com.loja.api.controller;

import com.loja.api.dto.VendaRequestDTO;
import com.loja.api.dto.VendaResponseDTO;
import com.loja.api.service.VendaService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendas")
public class VendaController {

    private final VendaService service;

    public VendaController(VendaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<VendaResponseDTO>> listarTodas(
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(service.listarTodas(pageable));
    }

    @GetMapping("/all")
    public ResponseEntity<List<VendaResponseDTO>> listarTodasSemPaginacao() {
        return ResponseEntity.ok(service.listarTodasSemPaginacao());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendaResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<VendaResponseDTO> registrar(@Valid @RequestBody VendaRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrar(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
