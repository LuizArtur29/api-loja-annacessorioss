package com.loja.api.repository;

import com.loja.api.model.Venda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import com.loja.api.model.enums.StatusVenda;
import java.time.LocalDateTime;

public interface VendaRepository extends JpaRepository<Venda, Long>, JpaSpecificationExecutor<Venda> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Venda v where v.id = :id")
    Optional<Venda> findByIdForUpdate(@Param("id") Long id);

    @EntityGraph(attributePaths = {"itens", "itens.produto", "cliente"})
    @Query("select distinct v from Venda v where v.id = :id")
    Optional<Venda> findDetailedById(@Param("id") Long id);

    @EntityGraph(attributePaths = "cliente")
    Page<Venda> findAll(Specification<Venda> specification, Pageable pageable);

    List<Venda> findByDataVendaBetweenAndStatus(LocalDateTime inicio, LocalDateTime fim, StatusVenda status);
}
