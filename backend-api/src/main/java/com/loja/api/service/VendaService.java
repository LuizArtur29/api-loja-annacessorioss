package com.loja.api.service;

import com.loja.api.dto.ItemVendaResponseDTO;
import com.loja.api.dto.VendaRequestDTO;
import com.loja.api.dto.VendaResponseDTO;
import com.loja.api.dto.VendaResumoDTO;
import com.loja.api.exception.ResourceNotFoundException;
import com.loja.api.model.Cliente;
import com.loja.api.model.ItemVenda;
import com.loja.api.model.Produto;
import com.loja.api.model.Venda;
import com.loja.api.model.enums.StatusVenda;
import com.loja.api.repository.ClienteRepository;
import com.loja.api.repository.ProdutoRepository;
import com.loja.api.repository.VendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDateTime;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class VendaService {

        private final VendaRepository vendaRepository;
        private final ProdutoRepository produtoRepository;
        private final ClienteRepository clienteRepository;

        @Transactional(readOnly = true)
        public Page<VendaResumoDTO> listarTodas(String q, Pageable pageable) {
                return vendaRepository.search(q == null ? "" : q.trim(), pageable)
                                .map(this::toResumoDTO);
        }

        @Transactional(readOnly = true)
        public VendaResponseDTO buscarPorId(Long id) {
                Venda venda = vendaRepository.findDetailedById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Venda não encontrada com id: " + id));
                return toResponseDTO(venda);
        }

        @Transactional
        public VendaResponseDTO registrar(VendaRequestDTO dto) {
                Venda venda = new Venda();

                if (dto.clienteId() != null) {
                        Cliente cliente = clienteRepository.findByIdAndAtivoTrue(dto.clienteId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Cliente não encontrado com id: " + dto.clienteId()));
                        venda.setCliente(cliente);
                }

                venda.setFormaPagamento(dto.formaPagamento());

                BigDecimal valorTotal = BigDecimal.ZERO;

                var produtosInformados = new HashSet<Long>();
                for (var itemDto : dto.itens()) {
                        if (!produtosInformados.add(itemDto.produtoId())) {
                                throw new IllegalArgumentException("Cada produto deve aparecer apenas uma vez na venda.");
                        }
                        Produto produto = produtoRepository.findActiveByIdForUpdate(itemDto.produtoId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Produto não encontrado com id: " + itemDto.produtoId()));

                        if (produto.getQuantidadeEstoque() < itemDto.quantidade()) {
                                throw new IllegalArgumentException(
                                                "Estoque insuficiente para o produto: " + produto.getNome() +
                                                                ". Disponível: " + produto.getQuantidadeEstoque());
                        }

                        ItemVenda item = new ItemVenda();
                        item.setVenda(venda);
                        item.setProduto(produto);
                        item.setQuantidade(itemDto.quantidade());
                        item.setPrecoUnitario(produto.getPrecoVenda());

                        venda.getItens().add(item);

                        valorTotal = valorTotal.add(
                                        produto.getPrecoVenda().multiply(BigDecimal.valueOf(itemDto.quantidade())));

                        produto.setQuantidadeEstoque(produto.getQuantidadeEstoque() - itemDto.quantidade());
                        produtoRepository.save(produto);
                }

                // Aplicar desconto
                BigDecimal desconto = dto.desconto() != null ? dto.desconto() : BigDecimal.ZERO;
                if (desconto.compareTo(valorTotal) > 0) {
                        throw new IllegalArgumentException("O desconto não pode ser maior que o valor total da venda.");
                }
                venda.setDesconto(desconto);
                venda.setValorTotal(valorTotal.subtract(desconto));

                venda.setStatus(StatusVenda.ATIVA);
                venda = vendaRepository.save(venda);

                return toResponseDTO(venda);
        }

        @Transactional
        public void cancelar(Long id) {
                Venda venda = vendaRepository.findByIdForUpdate(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Venda não encontrada com id: " + id));

                if (venda.getStatus() == StatusVenda.CANCELADA) {
                        return;
                }

                for (ItemVenda item : venda.getItens()) {
                        Produto produto = produtoRepository.findByIdForUpdate(item.getProduto().getId())
                                        .orElseThrow(() -> new IllegalStateException("Produto histórico da venda não encontrado"));
                        produto.setQuantidadeEstoque(produto.getQuantidadeEstoque() + item.getQuantidade());
                        produtoRepository.save(produto);
                }

                venda.setStatus(StatusVenda.CANCELADA);
                venda.setDataCancelamento(LocalDateTime.now());
                vendaRepository.save(venda);
        }

        private VendaResponseDTO toResponseDTO(Venda venda) {
                List<ItemVendaResponseDTO> itens = venda.getItens().stream()
                                .map(item -> new ItemVendaResponseDTO(
                                                item.getId(),
                                                item.getProduto().getId(),
                                                item.getProduto().getNome(),
                                                item.getQuantidade(),
                                                item.getPrecoUnitario(),
                                                item.getPrecoUnitario()
                                                                .multiply(BigDecimal.valueOf(item.getQuantidade()))))
                                .toList();

                return new VendaResponseDTO(
                                venda.getId(),
                                venda.getDataVenda(),
                                venda.getValorTotal(),
                                venda.getDesconto(),
                                venda.getCliente() != null ? venda.getCliente().getId() : null,
                                venda.getCliente() != null ? venda.getCliente().getNome() : "Consumidor Final",
                                venda.getFormaPagamento(),
                                venda.getStatus(),
                                venda.getDataCancelamento(),
                                itens);
        }

        private VendaResumoDTO toResumoDTO(Venda venda) {
                return new VendaResumoDTO(
                        venda.getId(),
                        venda.getDataVenda(),
                        venda.getValorTotal(),
                        venda.getDesconto(),
                        venda.getCliente() != null ? venda.getCliente().getId() : null,
                        venda.getCliente() != null ? venda.getCliente().getNome() : "Consumidor Final",
                        venda.getFormaPagamento(),
                        venda.getStatus(),
                        venda.getDataCancelamento()
                );
        }
}
