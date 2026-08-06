import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: [
                'src/api/authService.js',
                'src/components/ConfirmModal/ConfirmModal.jsx',
                'src/components/PrivateRoute/PrivateRoute.jsx',
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                statements: 80,
                branches: 70,
            },
        },
    },
    server: {
        port: 5173,
    },
});
