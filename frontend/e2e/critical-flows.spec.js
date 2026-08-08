import { expect, test } from '@playwright/test';

test('autentica e abre o dashboard protegido', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'e2e-token', username: 'ana', role: 'ADMIN' }),
    }));
    await page.route(/\/api\/dashboard(?:\?.*)?$/, (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
    }));

    await page.goto('/login');
    await page.getByLabel('Usuário').fill('ana');
    await page.getByLabel('Senha', { exact: true }).fill('senha-segura');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Painel Financeiro' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('anna_token'))).toBe('e2e-token');
});

test('exige motivo e envia cancelamento auditável', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('anna_token', 'e2e-token');
        localStorage.setItem('anna_user', JSON.stringify({ username: 'ana', role: 'ADMIN' }));
    });
    await page.route(/\/api\/vendas\?.*/, (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
            content: [{
                id: 42,
                status: 'ATIVA',
                dataVenda: '2026-08-06T10:00:00',
                clienteNome: 'Consumidor Final',
                desconto: 0,
                valorTotal: 100,
            }],
            number: 0,
            totalPages: 1,
            totalElements: 1,
            first: true,
            last: true,
        }),
    }));
    await page.route('**/api/vendas/42/cancelamento', async (route) => {
        expect(route.request().postDataJSON()).toEqual({ motivo: 'Cliente desistiu da compra' });
        await route.fulfill({ status: 204 });
    });

    await page.goto('/vendas');
    await page.getByRole('button', { name: 'Cancelar registro' }).click();

    const confirm = page.getByRole('button', { name: 'Confirmar cancelamento' });
    await expect(confirm).toBeDisabled();
    await page.getByLabel('Motivo do cancelamento *').fill('Cliente desistiu da compra');
    await expect(confirm).toBeEnabled();
    await confirm.click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
});
