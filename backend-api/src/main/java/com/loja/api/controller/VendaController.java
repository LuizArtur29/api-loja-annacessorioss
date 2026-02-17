package com.loja.api.controller;

import com.loja.api.dto.VendaRequestDTO;
import com.loja.api.dto.VendaResponseDTO;
import com.loja.api.service.VendaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendas")
@RequiredArgsConstructor
public class VendaController {

    private final VendaService vendaService;

    @GetMapping
    public ResponseEntity<List<VendaResponseDTO>> listarTodas() {
        return ResponseEntity.ok(vendaService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendaResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(vendaService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<VendaResponseDTO> registrar(@Valid @RequestBody VendaRequestDTO dto) {
        VendaResponseDTO response = vendaService.registrar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
