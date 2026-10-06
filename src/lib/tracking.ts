import type { RouteLocationNormalized, Router } from 'vue-router';
import { sendStats } from './stats';

interface CurrentView
{
	path: string;
	work: string;
	variant: string;
	task: string;
	startedAt: number;
}

function param (route: RouteLocationNormalized, key: string): string
{
	const value = route.params[key];

	return typeof value === 'string'
		? value
		: '';
}

/**
 * Сколько секунд человек провёл на каждой странице варианта/задания.
 * По сумме времени видно, какой вариант был его: чужие обычно только пролистывают.
 */
export function installTracking (router: Router, identity: () => { code: string; name: string }): void
{
	let current: CurrentView | null = null;

	const flush = (): void =>
	{
		if (!current) return;

		const seconds = Math.round((Date.now() - current.startedAt) / 1000);
		const { path, work, variant, task } = current;

		current = null;

		if (seconds < 1) return;

		sendStats({ type: 'view', ...identity(), work, variant, task, seconds, path });
	};

	const start = (route: RouteLocationNormalized): void =>
	{
		const variant = param(route, 'variant');

		if (!variant) return;

		current = { path: route.path, work: param(route, 'work'), variant, task: param(route, 'task'), startedAt: Date.now() };
	};

	router.afterEach((to, from) =>
	{
		if (to.path === from.path) return;

		flush();
		start(to);
	});

	document.addEventListener('visibilitychange', () =>
	{
		if (document.visibilityState === 'hidden') flush();
		else start(router.currentRoute.value);
	});

	window.addEventListener('pagehide', flush);
}
