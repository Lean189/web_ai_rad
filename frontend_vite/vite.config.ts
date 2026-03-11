import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        nodePolyfills({
            include: ['fs', 'path', 'os', 'crypto', 'buffer', 'stream', 'util'],
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
        }),
        {
            name: 'configure-response-headers',
            configureServer: (server) => {
                server.middlewares.use((_req, res, next) => {
                    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                    next();
                });
            }
        }
    ],
    resolve: {
        alias: {
            // Some cornerstone decoders might need specific polyfills
        },
    },
    worker: {
        format: 'es',
    },
    optimizeDeps: {
        include: ['dicom-parser', '@cornerstonejs/dicom-image-loader'],
    },
    server: {
        port: 3000,
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
        },
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
                timeout: 600000, // 10 minutes
                proxyTimeout: 600000,
            },
            '/images': 'http://localhost:8000',
        }
    }
});
