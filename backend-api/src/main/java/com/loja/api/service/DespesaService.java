package com.loja.api.service;

import com.loja.api.dto.DespesaRequestDTO;
import com.loja.api.dto.DespesaResponseDTO;
import com.loja.api.exception.ResourceNotFoundException;
import com.loja.api.model.Despesa;
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

    @Transactional
    public DespesaResponseDTO create(DespesaRequestDTO dto) {
        Despesa despesa = new Despesa();
        despesa.setDescricao(dto.descricao());
        despesa.setValor(dto.valor());
        despesa.setDataPagamento(dto.dataPagamento());

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
}