package com.loja.api.repository;

import com.loja.api.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Page<Cliente> findByAtivoTrue(Pageable pageable);
    List<Cliente> findByAtivoTrue();
    Optional<Cliente> findByIdAndAtivoTrue(Long id);

    @Query("""
            select c from Cliente c
            where c.ativo = true
              and (:q = '' or lower(c.nome) like lower(concat('%', :q, '%'))
                   or lower(coalesce(c.telefone, '')) like lower(concat('%', :q, '%')))
            """)
    Page<Cliente> searchActive(@Param("q") String q, Pageable pageable);
}
