package com.loja.api.service;

import com.loja.api.dto.DespesaRequestDTO;
import com.loja.api.dto.DespesaResponseDTO;
import com.loja.api.exception.ResourceNotFoundException;
import com.loja.api.model.Despesa;
import com.loja.api.model.enums.StatusPagamento;
import com.loja.api.repository.DespesaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DespesaService {

    private final DespesaRepository repository;

    public DespesaService(DespesaRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Page<DespesaResponseDTO> getAll(Pageable pageable) {
        return repository.findAll(pageable)
                .map(DespesaResponseDTO::new);
    }

    @Transactional(readOnly = true)
    public List<DespesaResponseDTO> getAllSemPaginacao() {
        return repository.findAll().stream()
                .map(DespesaResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DespesaResponseDTO getById(Long id) {
        Despesa despesa = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Despesa não encontrada com o ID: " + id));
        return new DespesaResponseDTO(despesa);
    }

    @Transactional
    public List<DespesaResponseDTO> create(DespesaRequestDTO dto) {
        int totalParcelas = (dto.parcelas() != null && dto.parcelas() > 1) ? dto.parcelas() : 1;
        BigDecimal valorParcela = dto.valor().divide(BigDecimal.valueOf(totalParcelas), 2, RoundingMode.HALF_UP);

        List<Despesa> despesas = new ArrayList<>();

        for (int i = 1; i <= totalParcelas; i++) {
            Despesa despesa = new Despesa();
            despesa.setDescricao(totalParcelas > 1
                    ? dto.descricao() + " (" + i + "/" + totalParcelas + ")"
                    : dto.descricao());
            despesa.setValor(valorParcela);
            despesa.setDataPagamento(dto.dataPagamento().plusMonths(i - 1));
            despesa.setCategoria(dto.categoria());
            despesa.setStatus(dto.status() != null ? dto.status() : StatusPagamento.PENDENTE);
            despesa.setFormaPagamento(dto.formaPagamento());
            despesa.setObservacoes(dto.observacoes());
            despesa.setParcelas(totalParcelas);
            despesa.setParcelaAtual(i);

            despesas.add(despesa);
        }

        List<Despesa> saved = repository.saveAll(despesas);
        return saved.stream().map(DespesaResponseDTO::new).collect(Collectors.toList());
    }

    @Transactional
    public DespesaResponseDTO update(Long id, DespesaRequestDTO dto) {
        Despesa despesa = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Despesa não encontrada com o ID: " + id));
        mapDtoToEntity(dto, despesa);

        despesa = repository.save(despesa);
        return new DespesaResponseDTO(despesa);
    }

    @Transactional
    public void delete(Long id) {
        Despesa despesa = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Despesa não encontrada com o ID: " + id));
        repository.delete(despesa);
    }

    private void mapDtoToEntity(DespesaRequestDTO dto, Despesa despesa) {
        despesa.setDescricao(dto.descricao());
        despesa.setValor(dto.valor());
        despesa.setDataPagamento(dto.dataPagamento());
        despesa.setCategoria(dto.categoria());
        despesa.setStatus(dto.status() != null ? dto.status() : StatusPagamento.PENDENTE);
        despesa.setFormaPagamento(dto.formaPagamento());
        despesa.setObservacoes(dto.observacoes());
    }
}