package com.loja.api.repository;

import com.loja.api.model.Despesa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

@Repository
public interface DespesaRepository extends JpaRepository<Despesa, Long>, JpaSpecificationExecutor<Despesa> {
    Page<Despesa> findByAtivoTrue(Pageable pageable);
    List<Despesa> findByAtivoTrue();
    Optional<Despesa> findByIdAndAtivoTrue(Long id);

    List<Despesa> findByAtivoTrueAndDataPagamentoBetween(LocalDate inicio, LocalDate fim);
}
