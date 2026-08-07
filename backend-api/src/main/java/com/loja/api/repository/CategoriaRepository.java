package com.loja.api.repository;

import com.loja.api.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    Page<Categoria> findByAtivoTrue(Pageable pageable);
    List<Categoria> findByAtivoTrue();
    Optional<Categoria> findByIdAndAtivoTrue(Long id);
    boolean existsByNomeIgnoreCaseAndAtivoTrue(String nome);

    @Query("""
            select c from Categoria c
            where c.ativo = true
              and (:q = '' or lower(c.nome) like lower(concat('%', :q, '%')))
            """)
    Page<Categoria> searchActive(@Param("q") String q, Pageable pageable);
}
