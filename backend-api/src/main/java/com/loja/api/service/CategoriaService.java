package com.loja.api.service;

import com.loja.api.dto.CategoriaRequestDTO;
import com.loja.api.dto.CategoriaResponseDTO;
import com.loja.api.exception.ResourceNotFoundException;
import com.loja.api.model.Categoria;
import com.loja.api.repository.CategoriaRepository;
import com.loja.api.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final ProdutoRepository produtoRepository;

    @Transactional(readOnly = true)
    public Page<CategoriaResponseDTO> listarTodas(String q, Pageable pageable) {
        return categoriaRepository.searchActive(q == null ? "" : q.trim(), pageable)
                .map(this::toResponseDTO);
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponseDTO> listarTodasSemPaginacao() {
        return categoriaRepository.findByAtivoTrue().stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoriaResponseDTO buscarPorId(Long id) {
        Categoria categoria = categoriaRepository.findByIdAndAtivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada com id: " + id));
        return toResponseDTO(categoria);
    }

    @Transactional
    public CategoriaResponseDTO criar(CategoriaRequestDTO dto) {
        if (categoriaRepository.existsByNomeIgnoreCaseAndAtivoTrue(dto.nome().trim())) {
            throw new IllegalArgumentException("Já existe uma categoria ativa com este nome.");
        }
        Categoria categoria = new Categoria();
        categoria.setNome(dto.nome().trim());
        categoria = categoriaRepository.save(categoria);
        return toResponseDTO(categoria);
    }

    @Transactional
    public CategoriaResponseDTO atualizar(Long id, CategoriaRequestDTO dto) {
        Categoria categoria = categoriaRepository.findByIdAndAtivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada com id: " + id));
        if (categoriaRepository.existsByNomeIgnoreCaseAndAtivoTrue(dto.nome().trim())
                && !categoria.getNome().equalsIgnoreCase(dto.nome().trim())) {
            throw new IllegalArgumentException("Já existe uma categoria ativa com este nome.");
        }
        categoria.setNome(dto.nome().trim());
        categoria = categoriaRepository.save(categoria);
        return toResponseDTO(categoria);
    }

    @Transactional
    public void deletar(Long id) {
        Categoria categoria = categoriaRepository.findByIdAndAtivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada com id: " + id));
        if (produtoRepository.existsByCategoriaIdAndAtivoTrue(id)) {
            throw new IllegalArgumentException("Não é possível inativar uma categoria com produtos ativos.");
        }
        categoria.setAtivo(false);
        categoriaRepository.save(categoria);
    }

    private CategoriaResponseDTO toResponseDTO(Categoria categoria) {
        return new CategoriaResponseDTO(categoria.getId(), categoria.getNome());
    }
}
