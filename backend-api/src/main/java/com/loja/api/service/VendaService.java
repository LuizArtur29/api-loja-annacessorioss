package com.loja.api.service;

import com.loja.api.dto.*;
import com.loja.api.exception.ResourceNotFoundException;
import com.loja.api.model.*;
import com.loja.api.repository.ClienteRepository;
import com.loja.api.repository.ProdutoRepository;
import com.loja.api.repository.VendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VendaService {

        private final VendaRepository vendaRepository;
        private final ProdutoRepository produtoRepository;
        private final ClienteRepository clienteRepository;

        @Transactional(readOnly = true)
        public List<VendaResponseDTO> listarTodas() {
                return vendaRepository.findAll().stream()
                                .map(this::toResponseDTO)
                                .toList();
        }

        @Transactional(readOnly = true)
        public VendaResponseDTO buscarPorId(Long id) {
                Venda venda = vendaRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Venda não encontrada com id: " + id));
                return toResponseDTO(venda);
        }

        @Transactional
        public VendaResponseDTO registrar(VendaRequestDTO dto) {
                Venda venda = new Venda();

                // Associa cliente (opcional)
                if (dto.clienteId() != null) {
                        Cliente cliente = clienteRepository.findById(dto.clienteId())
                                        .orElseThrow(
                                                        () -> new ResourceNotFoundException(
                                                                        "Cliente não encontrado com id: "
                                                                                        + dto.clienteId()));
                        venda.setCliente(cliente);
                }

                BigDecimal valorTotal = BigDecimal.ZERO;

                for (ItemVendaRequestDTO itemDto : dto.itens()) {
                        Produto produto = produtoRepository.findById(itemDto.produtoId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Produto não encontrado com id: " + itemDto.produtoId()));

                        // Valida estoque disponível
                        if (produto.getQuantidadeEstoque() < itemDto.quantidade()) {
                                throw new IllegalArgumentException(
                                                "Estoque insuficiente para o produto '" + produto.getNome()
                                                                + "'. Disponível: " + produto.getQuantidadeEstoque()
                                                                + ", Solicitado: " + itemDto.quantidade());
                        }

                        // Congela o preço unitário no momento da venda
                        ItemVenda item = new ItemVenda();
                        item.setVenda(venda);
                        item.setProduto(produto);
                        item.setQuantidade(itemDto.quantidade());
                        item.setPrecoUnitario(produto.getPrecoVenda());

                        venda.getItens().add(item);

                        // Calcula subtotal e acumula no valor total
                        BigDecimal subtotal = produto.getPrecoVenda()
                                        .multiply(BigDecimal.valueOf(itemDto.quantidade()));
                        valorTotal = valorTotal.add(subtotal);

                        // Dá baixa no estoque
                        produto.setQuantidadeEstoque(produto.getQuantidadeEstoque() - itemDto.quantidade());
                        produtoRepository.save(produto);
                }

                venda.setValorTotal(valorTotal);
                venda.setFormaPagamento(dto.formaPagamento());
                venda = vendaRepository.save(venda);

                return toResponseDTO(venda);
        }

        private VendaResponseDTO toResponseDTO(Venda venda) {
                List<ItemVendaResponseDTO> itensDTO = venda.getItens().stream()
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
                                venda.getCliente() != null ? venda.getCliente().getId() : null,
                                venda.getCliente() != null ? venda.getCliente().getNome() : null,
                                venda.getFormaPagamento(),
                                itensDTO);
        }
}
