package com.loja.api.controller;

import com.loja.api.dto.VendaRequestDTO;
import com.loja.api.dto.VendaResponseDTO;
import com.loja.api.dto.VendaResumoDTO;
import com.loja.api.dto.PageResponse;
import com.loja.api.dto.CancelamentoVendaRequestDTO;
import com.loja.api.service.VendaService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/vendas")
@Slf4j
public class VendaController {

    private final VendaService service;

    public VendaController(VendaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<PageResponse<VendaResumoDTO>> listarTodas(
            @RequestParam(defaultValue = "") String q,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(PageResponse.from(service.listarTodas(q, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendaResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<VendaResponseDTO> registrar(@Valid @RequestBody VendaRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrar(dto));
    }

    @PostMapping("/{id}/cancelamento")
    public ResponseEntity<Void> cancelar(
            @PathVariable Long id, @Valid @RequestBody CancelamentoVendaRequestDTO dto) {
        service.cancelar(id, dto.motivo());
        return ResponseEntity.noContent().build();
    }

    /**
     * Compatibilidade temporária para clientes publicados antes do contrato de
     * cancelamento auditável. Remover somente após confirmar que não há clientes
     * antigos em uso.
     */
    @Deprecated
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelarContratoLegado(@PathVariable Long id) {
        log.warn("Cancelamento pelo contrato legado na venda {}. Atualize o frontend antes de remover a compatibilidade.", id);
        service.cancelar(id, "Cancelamento via cliente legado");
        return ResponseEntity.noContent()
                .header("Deprecation", "true")
                .build();
    }
}
