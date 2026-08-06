import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./api', () => ({
    default: { post: vi.fn() },
}));

import api from './api';
import authService from './authService';

describe('authService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('persiste token e usuário depois do login', async () => {
        api.post.mockResolvedValue({
            data: { token: 'jwt-token', username: 'ana', role: 'ADMIN' },
        });

        await authService.login('ana', 'senha');

        expect(api.post).toHaveBeenCalledWith('/auth/login', { username: 'ana', senha: 'senha' });
        expect(authService.getToken()).toBe('jwt-token');
        expect(authService.getUser()).toEqual({ username: 'ana', role: 'ADMIN' });
        expect(authService.isAuthenticated()).toBe(true);
    });

    it('remove toda a sessão no logout', () => {
        localStorage.setItem('anna_token', 'jwt-token');
        localStorage.setItem('anna_user', '{"username":"ana"}');

        authService.logout();

        expect(authService.getToken()).toBeNull();
        expect(authService.getUser()).toBeNull();
        expect(authService.isAuthenticated()).toBe(false);
    });
});
