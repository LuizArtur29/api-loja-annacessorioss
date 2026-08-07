package com.loja.api.repository;

import com.loja.api.model.Despesa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import com.loja.api.model.enums.StatusPagamento;
import com.loja.api.model.enums.FormaPagamento;

@Repository
public interface DespesaRepository extends JpaRepository<Despesa, Long> {
    Page<Despesa> findByAtivoTrue(Pageable pageable);
    List<Despesa> findByAtivoTrue();
    Optional<Despesa> findByIdAndAtivoTrue(Long id);

    @Query("""
            select d from Despesa d
            where d.ativo = true
              and d.dataPagamento between :inicio and :fim
              and (:q = '' or lower(d.descricao) like lower(concat('%', :q, '%')))
            """)
    Page<Despesa> searchActiveByPeriod(
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim,
            @Param("q") String q,
            Pageable pageable);

    @Query("""
            select d from Despesa d
            where d.ativo = true
              and d.dataPagamento between :inicio and :fim
              and (:q = '' or lower(d.descricao) like lower(concat('%', :q, '%')))
              and (:status is null or d.status = :status)
              and (:formaPagamento is null or d.formaPagamento = :formaPagamento)
            """)
    Page<Despesa> searchActive(
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim,
            @Param("q") String q,
            @Param("status") StatusPagamento status,
            @Param("formaPagamento") FormaPagamento formaPagamento,
            Pageable pageable);

    List<Despesa> findByAtivoTrueAndDataPagamentoBetween(LocalDate inicio, LocalDate fim);
}
