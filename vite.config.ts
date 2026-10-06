/// <reference types="vitest/config" />
import { copyFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type Plugin } from 'vite';

/* GitHub Pages отдаёт 404.html на неизвестные пути — копия index.html даёт SPA-маршрутизацию. */
function spaFallback (): Plugin
{
	let outDir = 'dist';

	return {
		name: 'spa-fallback-404',
		apply: 'build',
		configResolved (config)
		{
			outDir = config.build.outDir;
		},
		async closeBundle ()
		{
			await copyFile(`${outDir}/index.html`, `${outDir}/404.html`);
		},
	};
}

export default defineConfig({
	base: '/cryptography/',
	plugins: [ vue(), tailwindcss(), spaFallback() ],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	test: {
		environment: 'node',
		include: [ 'src/**/__tests__/**/*.test.ts' ],
	},
});
