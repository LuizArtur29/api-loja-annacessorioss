package com.loja.api.controller;

import com.loja.api.dto.DashboardResponseDTO;
import com.loja.api.service.DashboardService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Validated
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardResponseDTO> obterResumo(
            @RequestParam @Min(2000) @Max(2100) int ano,
            @RequestParam @Min(1) @Max(12) int mes) {
        return ResponseEntity.ok(dashboardService.obterResumo(ano, mes));
    }
}
