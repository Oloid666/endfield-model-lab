import { defineConfig } from 'vite';
import {sharingMetaPlugin} from './scripts/sharing-meta.mjs';

export default defineConfig({ plugins:[sharingMetaPlugin()],define:{__BUILD_VERSION__:JSON.stringify((process.env.GITHUB_SHA||process.env.CF_PAGES_COMMIT_SHA)?.slice(0,7)||'local')}, base: process.env.VITE_BASE_PATH || './', build: { target: 'es2022', rollupOptions: { input: { main: 'index.html', racing: 'racing.html', indoor: 'indoor.html', feedbackAdmin: 'feedback-admin.html' } } } });
