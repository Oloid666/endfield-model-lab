import { defineConfig } from 'vite';

export default defineConfig({ define:{__BUILD_VERSION__:JSON.stringify(process.env.GITHUB_SHA?.slice(0,7)||'local')}, base: process.env.VITE_BASE_PATH || './', build: { target: 'es2022', rollupOptions: { input: { main: 'index.html', racing: 'racing.html' } } } });
