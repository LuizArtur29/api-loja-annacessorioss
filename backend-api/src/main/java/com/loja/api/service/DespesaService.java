package com.loja.api.service;

import com.loja.api.dto.DespesaRequestDTO;
import com.loja.api.dto.DespesaResponseDTO;
import com.loja.api.exception.ResourceNotFoundException;
import com.loja.api.model.Despesa;
import com.loja.api.model.enums.StatusPagamento;
import com.loja.api.repository.DespesaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DespesaService {

    private final DespesaRepository repository;

    public DespesaService(DespesaRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<DespesaResponseDTO> getAll() {
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
    public DespesaResponseDTO create(DespesaRequestDTO dto) {
        Despesa despesa = new Despesa();
        mapDtoToEntity(dto, despesa);

        despesa = repository.save(despesa);
        return new DespesaResponseDTO(despesa);
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
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Despesa não encontrada com o ID: " + id);
        }
        repository.deleteById(id);
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