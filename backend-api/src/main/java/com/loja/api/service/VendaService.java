package com.loja.api.service;

import com.loja.api.dto.ItemVendaResponseDTO;
import com.loja.api.dto.VendaRequestDTO;
import com.loja.api.dto.VendaResponseDTO;
import com.loja.api.exception.ResourceNotFoundException;
import com.loja.api.model.Cliente;
import com.loja.api.model.ItemVenda;
import com.loja.api.model.Produto;
import com.loja.api.model.Venda;
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

@Service
@RequiredArgsConstructor
public class VendaService {

        private final VendaRepository vendaRepository;
        private final ProdutoRepository produtoRepository;
        private final ClienteRepository clienteRepository;

        @Transactional(readOnly = true)
        public Page<VendaResponseDTO> listarTodas(Pageable pageable) {
                return vendaRepository.findAll(pageable)
                                .map(this::toResponseDTO);
        }

        @Transactional(readOnly = true)
        public List<VendaResponseDTO> listarTodasSemPaginacao() {
                return vendaRepository.findAll().stream()
                                .map(this::toResponseDTO)
                                .toList();
        }

        @Transactional
        public VendaResponseDTO registrar(VendaRequestDTO dto) {
                Venda venda = new Venda();

                if (dto.clienteId() != null) {
                        Cliente cliente = clienteRepository.findById(dto.clienteId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Cliente não encontrado com id: " + dto.clienteId()));
                        venda.setCliente(cliente);
                }

                venda.setFormaPagamento(dto.formaPagamento());

                BigDecimal valorTotal = BigDecimal.ZERO;

                for (var itemDto : dto.itens()) {
                        Produto produto = produtoRepository.findById(itemDto.produtoId())
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

                venda.setValorTotal(valorTotal);
                venda = vendaRepository.save(venda);

                return toResponseDTO(venda);
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
                                venda.getCliente() != null ? venda.getCliente().getId() : null,
                                venda.getCliente() != null ? venda.getCliente().getNome() : "Consumidor Final",
                                venda.getFormaPagamento(),
                                itens);
        }
}
