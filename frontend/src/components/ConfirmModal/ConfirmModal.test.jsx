import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal', () => {
    it('não renderiza quando está fechado', () => {
        render(<ConfirmModal isOpen={false} title="Cancelar venda" message="Confirma?" />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('confirma ou fecha a operação explicitamente', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        const onClose = vi.fn();
        render(
            <ConfirmModal
                isOpen
                title="Cancelar venda"
                message="O estoque será devolvido."
                confirmLabel="Confirmar cancelamento"
                onConfirm={onConfirm}
                onClose={onClose}
            />,
        );

        expect(screen.getByRole('dialog', { name: 'Cancelar venda' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));
        await user.click(screen.getByRole('button', { name: 'Cancelar' }));

        expect(onConfirm).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('exige o preenchimento do motivo quando solicitado', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        const onPromptChange = vi.fn();
        const { rerender } = render(
            <ConfirmModal
                isOpen
                title="Cancelar venda"
                message="Confirma?"
                promptLabel="Motivo"
                promptValue=""
                promptRequired
                onPromptChange={onPromptChange}
                onConfirm={onConfirm}
            />,
        );

        expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled();
        await user.type(screen.getByLabelText('Motivo *'), 'Cliente desistiu');
        expect(onPromptChange).toHaveBeenCalled();

        rerender(
            <ConfirmModal
                isOpen
                title="Cancelar venda"
                message="Confirma?"
                promptLabel="Motivo"
                promptValue="Cliente desistiu"
                promptRequired
                onPromptChange={onPromptChange}
                onConfirm={onConfirm}
            />,
        );
        await user.click(screen.getByRole('button', { name: 'Confirmar' }));
        expect(onConfirm).toHaveBeenCalledOnce();
    });
});
