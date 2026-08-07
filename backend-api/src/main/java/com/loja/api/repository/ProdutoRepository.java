package com.loja.api.repository;

import com.loja.api.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    Page<Produto> findByAtivoTrue(Pageable pageable);
    List<Produto> findByAtivoTrue();
    Optional<Produto> findByIdAndAtivoTrue(Long id);
    boolean existsByCategoriaIdAndAtivoTrue(Long categoriaId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Produto p where p.id = :id and p.ativo = true")
    Optional<Produto> findActiveByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Produto p where p.id = :id")
    Optional<Produto> findByIdForUpdate(@Param("id") Long id);

    @EntityGraph(attributePaths = "categoria")
    @Query("""
            select p from Produto p
            where p.ativo = true
              and (:q = '' or lower(p.nome) like lower(concat('%', :q, '%'))
                   or lower(coalesce(p.codigo, '')) like lower(concat('%', :q, '%')))
            """)
    Page<Produto> searchActive(@Param("q") String q, Pageable pageable);
}
