import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PrivateRoute from './PrivateRoute';

function renderRoute() {
    return render(
        <MemoryRouter initialEntries={['/privado']}>
            <Routes>
                <Route path="/login" element={<div>Tela de login</div>} />
                <Route
                    path="/privado"
                    element={<PrivateRoute><div>Conteúdo protegido</div></PrivateRoute>}
                />
            </Routes>
        </MemoryRouter>,
    );
}

describe('PrivateRoute', () => {
    it('redireciona uma sessão sem token', () => {
        renderRoute();
        expect(screen.getByText('Tela de login')).toBeInTheDocument();
    });

    it('permite uma sessão autenticada', () => {
        localStorage.setItem('anna_token', 'jwt-token');
        renderRoute();
        expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
    });
});
